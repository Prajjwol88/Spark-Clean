-- SparkClean Ltd - Staff Management upgrade: staff login (Sushil)
-- Run this file once AFTER 05_staff_management.sql. It is safe to run again.
-- (SETUP_ALL.sql already includes everything in this file.)
--
-- Every staff member can now log in with their own email address and password:
--   * managers (IsManager = TRUE) can use Staff Management
--   * ordinary staff can only see their own details and change their phone number and password
-- Passwords are never stored as plain text - only a salted scrypt hash (same method as clsStaffLogin).
USE sparkclean;

-- ------------------------------------------------------------
-- tblStaffAccount (one login account per staff member)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tblStaffAccount (
    StaffNo       INT           NOT NULL,            -- primary key and foreign key to tblStaff
    PasswordHash  VARCHAR(200)  NOT NULL,            -- "salt:hash", never the real password
    LastLogin     DATETIME      NULL,                -- when this staff member last logged in
    PRIMARY KEY (StaffNo),
    CONSTRAINT fk_StaffAccount_Staff FOREIGN KEY (StaffNo)
        REFERENCES tblStaff (StaffNo) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Staff login test data
-- every test staff member has the demo password  Staff2026!
-- (Jamie Lee is inactive, so Jamie cannot log in - useful for testing)
-- ------------------------------------------------------------
INSERT IGNORE INTO tblStaffAccount (StaffNo, PasswordHash)
SELECT StaffNo, '5f75a21591cf23ce68b4ccfba5caf0ef:81cff491ec9ba7994b665ef06c0c0f2f5706c883d793aabb496296cf2fb378c38e28767a2b8a5933fa793f106d01b0878f428629a62c43e47a363ec4b7f48d57'
FROM tblStaff
WHERE Email IN ('alex@example.com', 'sam@example.com', 'jamie@example.com', 'freja@example.com', 'mikkel@example.com');

-- ------------------------------------------------------------
-- Staff login stored procedures
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sproc_tblStaffAccount_FilterByEmail;
DROP PROCEDURE IF EXISTS sproc_tblStaffAccount_SetPassword;
DROP PROCEDURE IF EXISTS sproc_tblStaffAccount_RecordLogin;
DROP PROCEDURE IF EXISTS sproc_tblStaff_UpdatePhone;

DELIMITER $$

-- the login details for one email address (the staff member plus their password hash)
CREATE PROCEDURE sproc_tblStaffAccount_FilterByEmail(IN p_Email VARCHAR(150))
BEGIN
    SELECT s.StaffNo, s.FullName, s.Email, s.IsManager, s.Active, a.PasswordHash, a.LastLogin
    FROM tblStaff s
    JOIN tblStaffAccount a ON a.StaffNo = s.StaffNo
    WHERE s.Email = p_Email;
END$$

-- creates or changes the password of a staff member; returns 1 if the staff member exists
CREATE PROCEDURE sproc_tblStaffAccount_SetPassword(
    IN p_StaffNo      INT,
    IN p_PasswordHash VARCHAR(200))
BEGIN
    IF EXISTS (SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo) THEN
        INSERT INTO tblStaffAccount (StaffNo, PasswordHash) VALUES (p_StaffNo, p_PasswordHash)
        ON DUPLICATE KEY UPDATE PasswordHash = p_PasswordHash;
        SELECT 1 AS Found;
    ELSE
        SELECT 0 AS Found;
    END IF;
END$$

-- saves the time of a successful login
CREATE PROCEDURE sproc_tblStaffAccount_RecordLogin(IN p_StaffNo INT)
BEGIN
    UPDATE tblStaffAccount SET LastLogin = NOW() WHERE StaffNo = p_StaffNo;
END$$

-- a staff member changes their own phone number (the only detail ordinary staff may change)
CREATE PROCEDURE sproc_tblStaff_UpdatePhone(
    IN p_StaffNo INT,
    IN p_Phone   VARCHAR(20))
BEGIN
    UPDATE tblStaff SET Phone = p_Phone WHERE StaffNo = p_StaffNo;
    SELECT EXISTS(SELECT 1 FROM tblStaff WHERE StaffNo = p_StaffNo) AS Found;
END$$

DELIMITER ;
