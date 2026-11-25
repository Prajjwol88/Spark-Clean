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
