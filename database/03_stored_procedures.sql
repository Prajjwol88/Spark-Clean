-- SparkClean Ltd - stored procedures for tblStock
-- All database access from clsDataConnection goes through these procedures.
USE sparkclean;

DROP PROCEDURE IF EXISTS sproc_tblStock_SelectAll;
DROP PROCEDURE IF EXISTS sproc_tblStock_FilterByProductNo;
DROP PROCEDURE IF EXISTS sproc_tblStock_FilterByNameOrCategory;
DROP PROCEDURE IF EXISTS sproc_tblStock_SelectAvailable;
DROP PROCEDURE IF EXISTS sproc_tblStock_LowStock;
DROP PROCEDURE IF EXISTS sproc_tblStock_Insert;
DROP PROCEDURE IF EXISTS sproc_tblStock_Update;
DROP PROCEDURE IF EXISTS sproc_tblStock_Delete;

DELIMITER $$

-- list every product (staff list page)
CREATE PROCEDURE sproc_tblStock_SelectAll()
BEGIN
    SELECT * FROM tblStock ORDER BY ProductName;
END$$

-- find one product by its primary key
CREATE PROCEDURE sproc_tblStock_FilterByProductNo(IN p_ProductNo INT)
BEGIN
    SELECT * FROM tblStock WHERE ProductNo = p_ProductNo;
END$$

-- filter products whose name or category contains the filter text
CREATE PROCEDURE sproc_tblStock_FilterByNameOrCategory(IN p_Filter VARCHAR(50))
BEGIN
    SELECT * FROM tblStock
    WHERE ProductName LIKE CONCAT('%', p_Filter, '%')
       OR Category    LIKE CONCAT('%', p_Filter, '%')
    ORDER BY ProductName;
END$$

-- products a client can see on the website (available and in stock)
CREATE PROCEDURE sproc_tblStock_SelectAvailable(IN p_Filter VARCHAR(50))
BEGIN
    SELECT * FROM tblStock
    WHERE Available = TRUE
      AND QuantityInStock > 0
      AND (ProductName LIKE CONCAT('%', p_Filter, '%')
           OR Category LIKE CONCAT('%', p_Filter, '%'))
    ORDER BY ProductName;
END$$

-- low stock report: products at or below the given level
CREATE PROCEDURE sproc_tblStock_LowStock(IN p_Level INT)
BEGIN
    SELECT * FROM tblStock
    WHERE QuantityInStock <= p_Level
    ORDER BY QuantityInStock, ProductName;
END$$

-- add a new product and return its new primary key
CREATE PROCEDURE sproc_tblStock_Insert(
    IN p_ProductName     VARCHAR(50),
    IN p_Category        VARCHAR(30),
    IN p_Price           DECIMAL(8,2),
    IN p_QuantityInStock INT,
    IN p_DateAdded       DATE,
    IN p_Available       BOOLEAN)
BEGIN
    INSERT INTO tblStock (ProductName, Category, Price, QuantityInStock, DateAdded, Available)
    VALUES (p_ProductName, p_Category, p_Price, p_QuantityInStock, p_DateAdded, p_Available);
    SELECT LAST_INSERT_ID() AS ProductNo;
END$$

-- update an existing product
CREATE PROCEDURE sproc_tblStock_Update(
    IN p_ProductNo       INT,
    IN p_ProductName     VARCHAR(50),
    IN p_Category        VARCHAR(30),
    IN p_Price           DECIMAL(8,2),
    IN p_QuantityInStock INT,
    IN p_DateAdded       DATE,
    IN p_Available       BOOLEAN)
BEGIN
    UPDATE tblStock
    SET ProductName = p_ProductName,
        Category = p_Category,
        Price = p_Price,
        QuantityInStock = p_QuantityInStock,
        DateAdded = p_DateAdded,
        Available = p_Available
    WHERE ProductNo = p_ProductNo;
END$$

-- delete a product
-- business rule: a product that appears on an order is never deleted,
-- it is marked as unavailable instead so order history stays correct
CREATE PROCEDURE sproc_tblStock_Delete(IN p_ProductNo INT)
BEGIN
    IF EXISTS (SELECT 1 FROM tblOrderLine WHERE ProductNo = p_ProductNo) THEN
        UPDATE tblStock SET Available = FALSE WHERE ProductNo = p_ProductNo;
        SELECT 'MarkedUnavailable' AS Result;
    ELSE
        DELETE FROM tblStock WHERE ProductNo = p_ProductNo;
        SELECT 'Deleted' AS Result;
    END IF;
END$$

DELIMITER ;

-- Client Management - Prajjwol

DROP PROCEDURE IF EXISTS sproc_tblClient_FilterByClientNo;

DELIMITER $$

CREATE PROCEDURE sproc_tblClient_FilterByClientNo(
    IN p_ClientNo INT
)
BEGIN
    SELECT *
    FROM tblclient
    WHERE ClientNo = p_ClientNo;
END$$

DELIMITER ;
-- List all clients (Client Management - Prajjwol)

DROP PROCEDURE IF EXISTS sproc_tblClient_SelectAll;

DELIMITER $$

CREATE PROCEDURE sproc_tblClient_SelectAll()
BEGIN
    SELECT *
    FROM tblclient
    ORDER BY FullName;
END$$

DELIMITER ;

-- Search clients by name (Client Management - Prajjwol)

DROP PROCEDURE IF EXISTS sproc_tblClient_FilterByName;
DELIMITER $$

CREATE Procedure sproc_tblClient_FilterByName(
IN p_Name VARCHAR(100)
)
BEGIN 
SELECT *
FROM tblclient
 WHERE FullName LIKE CONCAT('%', p_Name, '%')
    ORDER BY FullName;
END$$
DELIMITER ;
-- Client writes preserve the registration date and status when editing details.
DROP PROCEDURE IF EXISTS sproc_tblClient_Insert;
DROP PROCEDURE IF EXISTS sproc_tblClient_Update;
DROP PROCEDURE IF EXISTS sproc_tblClient_SetActive;
DELIMITER $

CREATE PROCEDURE sproc_tblClient_Insert(
    IN p_FullName VARCHAR(100), IN p_Email VARCHAR(250),
    IN p_Address VARCHAR(500), IN p_Postcode VARCHAR(20)
)
BEGIN
    INSERT INTO tblclient (FullName, Email, Address, Postcode, DateRegistered)
    VALUES (p_FullName, p_Email, p_Address, p_Postcode, CURRENT_DATE());
    SELECT LAST_INSERT_ID() AS ClientNo;
END$

CREATE PROCEDURE sproc_tblClient_Update(
    IN p_ClientNo INT, IN p_FullName VARCHAR(100), IN p_Email VARCHAR(250),
    IN p_Address VARCHAR(500), IN p_Postcode VARCHAR(20)
)
BEGIN
    UPDATE tblclient
    SET FullName = p_FullName, Email = p_Email, Address = p_Address, Postcode = p_Postcode
    WHERE ClientNo = p_ClientNo;
    SELECT EXISTS(SELECT 1 FROM tblclient WHERE ClientNo = p_ClientNo) AS Found;
END$

CREATE PROCEDURE sproc_tblClient_SetActive(IN p_ClientNo INT, IN p_Active TINYINT)
BEGIN
    UPDATE tblclient SET Active = p_Active WHERE ClientNo = p_ClientNo;
    SELECT EXISTS(SELECT 1 FROM tblclient WHERE ClientNo = p_ClientNo) AS Found;
END$

DELIMITER ;

-- Permanently delete a client by its unique number.
DROP PROCEDURE IF EXISTS sproc_tblClient_Delete;
DELIMITER $$
CREATE PROCEDURE sproc_tblClient_Delete(IN p_ClientNo INT)
BEGIN
    DELETE FROM tblclient WHERE ClientNo = p_ClientNo;
    SELECT ROW_COUNT() AS Deleted;
END$$
DELIMITER ;

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
