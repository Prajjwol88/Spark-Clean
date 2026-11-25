-- SparkClean Ltd - Staff Management component
-- Run this file once on an existing sparkclean database (after 01 to 04).
-- It is safe to run again: the table and test data are only created if missing,
-- and the stored procedures are dropped and recreated.
-- (SETUP_ALL.sql already includes everything in this file.)
USE sparkclean;

-- ------------------------------------------------------------
-- tblStaff (Staff Management component)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tblStaff (
    StaffNo     INT           NOT NULL AUTO_INCREMENT,  -- primary key
    FullName    VARCHAR(100)  NOT NULL,                 -- string
    Email       VARCHAR(150)  NOT NULL UNIQUE,          -- string, no two staff share an email
    Phone       VARCHAR(20)   NOT NULL DEFAULT '',      -- string, optional (blank = none)
    JobRole     VARCHAR(50)   NOT NULL,                 -- string
    StartDate   DATE          NOT NULL,                 -- date
    HourlyRate  DECIMAL(6,2)  NOT NULL,                 -- numeric, DKK
    IsManager   BOOLEAN       NOT NULL DEFAULT FALSE,   -- boolean
    Active      BOOLEAN       NOT NULL DEFAULT TRUE,    -- boolean, inactive staff are kept for records
    PRIMARY KEY (StaffNo)
) AUTO_INCREMENT = 1001;

-- ------------------------------------------------------------
-- Staff Management test data
-- ------------------------------------------------------------
INSERT IGNORE INTO tblStaff (FullName, Email, Phone, JobRole, StartDate, HourlyRate, IsManager, Active) VALUES
('Alex Jensen',    'alex@example.com',   '12345678', 'Cleaner',      '2026-02-10', 145.00, FALSE, TRUE),
('Sam Taylor',     'sam@example.com',    '22334455', 'Team Manager', '2025-11-03', 190.00, TRUE,  TRUE),
('Jamie Lee',      'jamie@example.com',  '33445566', 'Supervisor',   '2025-08-18', 170.00, FALSE, FALSE),
('Freja Hansen',   'freja@example.com',  '44556677', 'Cleaner',      '2026-05-04', 145.00, FALSE, TRUE),
('Mikkel Larsen',  'mikkel@example.com', '',         'Window Cleaner','2026-07-21', 155.50, FALSE, TRUE);

-- ------------------------------------------------------------
-- Staff Management stored procedures
-- All database access from clsStaff / clsStaffCollection goes through these.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sproc_tblStaff_SelectAll;
DROP PROCEDURE IF EXISTS sproc_tblStaff_FilterByStaffNo;
DROP PROCEDURE IF EXISTS sproc_tblStaff_FilterByNameOrEmail;
DROP PROCEDURE IF EXISTS sproc_tblStaff_EmailInUse;
DROP PROCEDURE IF EXISTS sproc_tblStaff_Insert;
DROP PROCEDURE IF EXISTS sproc_tblStaff_Update;
DROP PROCEDURE IF EXISTS sproc_tblStaff_SetActive;
DROP PROCEDURE IF EXISTS sproc_tblStaff_Delete;

DELIMITER $$

-- list every staff member
CREATE PROCEDURE sproc_tblStaff_SelectAll()
BEGIN
    SELECT * FROM tblStaff ORDER BY FullName;
END$$

-- find one staff member by their primary key
CREATE PROCEDURE sproc_tblStaff_FilterByStaffNo(IN p_StaffNo INT)
BEGIN
    SELECT * FROM tblStaff WHERE StaffNo = p_StaffNo;
END$$

-- search by name or email, and filter by status ('all', 'active' or 'inactive')
CREATE PROCEDURE sproc_tblStaff_FilterByNameOrEmail(
    IN p_Filter VARCHAR(150),
    IN p_Status VARCHAR(10))
BEGIN
    SELECT * FROM tblStaff
    WHERE (FullName LIKE CONCAT('%', p_Filter, '%')
           OR Email LIKE CONCAT('%', p_Filter, '%'))
      AND (p_Status = 'all'
           OR (p_Status = 'active' AND Active = TRUE)
           OR (p_Status = 'inactive' AND Active = FALSE))
    ORDER BY FullName;
END$$

-- 1 if another staff member already uses this email (p_StaffNo = 0 when adding)
CREATE PROCEDURE sproc_tblStaff_EmailInUse(
    IN p_Email   VARCHAR(150),
    IN p_StaffNo INT)
BEGIN
    SELECT EXISTS(SELECT 1 FROM tblStaff WHERE Email = p_Email AND StaffNo <> p_StaffNo) AS InUse;
END$$

-- add a new staff member (always active) and return their new staff number
CREATE PROCEDURE sproc_tblStaff_Insert(
    IN p_FullName   VARCHAR(100),
    IN p_Email      VARCHAR(150),
    IN p_Phone      VARCHAR(20),
    IN p_JobRole    VARCHAR(50),
    IN p_StartDate  DATE,
    IN p_HourlyRate DECIMAL(6,2),
    IN p_IsManager  BOOLEAN)
BEGIN
    INSERT INTO tblStaff (FullName, Email, Phone, JobRole, StartDate, HourlyRate, IsManager, Active)
    VALUES (p_FullName, p_Email, p_Phone, p_JobRole, p_StartDate, p_HourlyRate, p_IsManager, TRUE);
    SELECT LAST_INSERT_ID() AS StaffNo;
END$$

-- update an existing staff member's details (their status is changed with SetActive)
CREATE PROCEDURE sproc_tblStaff_Update(
    IN p_StaffNo    INT,
    IN p_FullName   VARCHAR(100),
    IN p_Email      VARCHAR(150),
    IN p_Phone      VARCHAR(20),
    IN p_JobRole    VARCHAR(50),
    IN p_StartDate  DATE,
    IN p_HourlyRate DECIMAL(6,2),
    IN p_IsManager  BOOLEAN)
BEGIN
    UPDATE tblStaff
    SET FullName = p_FullName,
        Email = p_Email,
        Phone = p_Phone,
        JobRole = p_JobRole,
        StartDate = p_StartDate,
        HourlyRate = p_HourlyRate,
        IsManager = p_IsManager
    WHERE StaffNo = p_StaffNo;
    SELECT EXISTS(SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo) AS Found;
END$$

-- activate or deactivate a staff member
CREATE PROCEDURE sproc_tblStaff_SetActive(
    IN p_StaffNo INT,
    IN p_Active  BOOLEAN)
BEGIN
    UPDATE tblStaff SET Active = p_Active WHERE StaffNo = p_StaffNo;
    SELECT EXISTS(SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo) AS Found;
END$$

-- delete a staff member
-- business rule: an active staff member is never deleted,
-- they must be deactivated first so nobody is removed by mistake
CREATE PROCEDURE sproc_tblStaff_Delete(IN p_StaffNo INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo) THEN
        SELECT 'NotFound' AS Result;
    ELSEIF EXISTS (SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo AND Active = TRUE) THEN
        SELECT 'StillActive' AS Result;
    ELSE
        DELETE FROM tblStaff WHERE StaffNo = p_StaffNo;
        SELECT 'Deleted' AS Result;
    END IF;
END$$

DELIMITER ;
