-- SparkClean Ltd - RUN THIS ONE FILE to set up everything (tables, test data, stored procedures, app login)

-- SparkClean Ltd - database tables
-- Run this file first, then 02_test_data.sql, then 03_stored_procedures.sql

CREATE DATABASE IF NOT EXISTS sparkclean;
USE sparkclean;

-- ------------------------------------------------------------
-- tblStock (Stock Management component - Bibek)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS tblOrderLine;
DROP TABLE IF EXISTS tblStock;

CREATE TABLE tblStock (
    ProductNo       INT            NOT NULL AUTO_INCREMENT,  -- primary key
    ProductName     VARCHAR(50)    NOT NULL,                 -- string
    Category        VARCHAR(30)    NOT NULL,                 -- string
    Price           DECIMAL(8,2)   NOT NULL,                 -- numeric
    QuantityInStock INT            NOT NULL,                 -- integer
    DateAdded       DATE           NOT NULL,                 -- date
    Available       BOOLEAN        NOT NULL DEFAULT TRUE,    -- boolean
    PRIMARY KEY (ProductNo)
);

-- ------------------------------------------------------------
-- tblOrderLine (shared team table, see the team ERD)
-- Only the columns the stock component needs are created here,
-- so the delete rule (keep products that are on an order) works.
-- The team version of this table replaces it.
-- ------------------------------------------------------------
CREATE TABLE tblOrderLine (
    OrderLineNo INT NOT NULL AUTO_INCREMENT,
    OrderNo     INT NOT NULL,
    ProductNo   INT NOT NULL,
    Quantity    INT NOT NULL,
    PRIMARY KEY (OrderLineNo),
    FOREIGN KEY (ProductNo) REFERENCES tblStock (ProductNo)
);

-- SparkClean Ltd - test data for tblStock
USE sparkclean;

INSERT INTO tblStock (ProductName, Category, Price, QuantityInStock, DateAdded, Available) VALUES
('Multi-Surface Spray 750ml', 'Sprays',     2.49,  40, '2026-10-01', TRUE),
('Glass Cleaner 500ml',       'Sprays',     1.99,  25, '2026-10-01', TRUE),
('Floor Cleaner 1L',          'Floor Care', 3.75,  18, '2026-10-05', TRUE),
('Washing Up Liquid 900ml',   'Kitchen',    1.50,  60, '2026-10-05', TRUE),
('Laundry Detergent 2L',      'Laundry',    6.99,  12, '2026-10-10', TRUE),
('Microfibre Cloths (5 pack)','Cloths',     4.25,   4, '2026-10-12', TRUE),
('Spin Mop and Bucket',       'Floor Care',19.99,   3, '2026-10-15', TRUE),
('Toilet Cleaner Gel 750ml',  'Bathroom',   1.89,  35, '2026-10-18', TRUE),
('Oven Cleaner 500ml',        'Kitchen',    4.49,   0, '2026-10-20', TRUE),
('Bleach 1L (old stock)',     'Bathroom',   0.99,  10, '2026-09-01', FALSE);

-- one order line so the delete rule can be tested (product 1 has been ordered)
INSERT INTO tblOrderLine (OrderNo, ProductNo, Quantity) VALUES (1, 1, 2);

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

DELIMITER ;
-- SparkClean Ltd - Sprint 5 upgrade features (Stock Management - Bibek)
-- Run this ONCE after 01_tables.sql, 02_test_data.sql and 03_stored_procedures.sql.
-- It keeps all existing products and adds:
--   1. Hazard warnings: a HazardWarning column on tblStock (ethics risk R9 - hazardous cleaning chemicals)
--   2. Change log: tblStockLog records every add, edit and delete made by the Stock Manager
USE sparkclean;

-- ------------------------------------------------------------
-- 1. Hazard warnings
-- ------------------------------------------------------------
ALTER TABLE tblStock
    ADD COLUMN HazardWarning VARCHAR(100) NOT NULL DEFAULT '';   -- string, blank = no warning

-- safety warnings for the hazardous products in the test data
UPDATE tblStock SET HazardWarning = 'Corrosive - keep out of reach of children. Do not mix with other cleaners.'
    WHERE ProductName LIKE 'Bleach%';
UPDATE tblStock SET HazardWarning = 'Corrosive - wear gloves and keep out of reach of children.'
    WHERE ProductName LIKE 'Oven Cleaner%';
UPDATE tblStock SET HazardWarning = 'Irritant - keep out of reach of children. Do not mix with bleach.'
    WHERE ProductName LIKE 'Toilet Cleaner%';

-- ------------------------------------------------------------
-- 2. Change log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tblStockLog (
    LogNo       INT          NOT NULL AUTO_INCREMENT,               -- primary key
    ProductNo   INT          NOT NULL,                              -- product that was changed (no foreign key, so deleted products stay in the log)
    Action      VARCHAR(20)  NOT NULL,                              -- Added, Updated, Deleted or MarkedUnavailable
    ProductName VARCHAR(50)  NOT NULL,                              -- name at the time of the change
    ChangedBy   VARCHAR(50)  NOT NULL,                              -- who made the change
    ChangedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- when the change was made
    PRIMARY KEY (LogNo)
);


-- ------------------------------------------------------------
-- 3. Stored procedures for the upgrades
-- The original sproc_tblStock_Insert and sproc_tblStock_Update are kept as they are;
-- the hazard warning is saved straight after them with sproc_tblStock_UpdateHazard.
-- ------------------------------------------------------------
USE sparkclean;

DROP PROCEDURE IF EXISTS sproc_tblStock_UpdateHazard;
DROP PROCEDURE IF EXISTS sproc_tblStockLog_Insert;
DROP PROCEDURE IF EXISTS sproc_tblStockLog_SelectAll;

DELIMITER $$

-- save the hazard warning for one product (blank = no warning)
CREATE PROCEDURE sproc_tblStock_UpdateHazard(
    IN p_ProductNo     INT,
    IN p_HazardWarning VARCHAR(100))
BEGIN
    UPDATE tblStock SET HazardWarning = p_HazardWarning WHERE ProductNo = p_ProductNo;
END$$

-- record one change in the change log and return its new log number
CREATE PROCEDURE sproc_tblStockLog_Insert(
    IN p_ProductNo   INT,
    IN p_Action      VARCHAR(20),
    IN p_ProductName VARCHAR(50),
    IN p_ChangedBy   VARCHAR(50))
BEGIN
    INSERT INTO tblStockLog (ProductNo, Action, ProductName, ChangedBy)
    VALUES (p_ProductNo, p_Action, p_ProductName, p_ChangedBy);
    SELECT LAST_INSERT_ID() AS LogNo;
END$$

-- list the change log, newest change first
CREATE PROCEDURE sproc_tblStockLog_SelectAll()
BEGIN
    SELECT LogNo, ProductNo, Action, ProductName, ChangedBy,
           DATE_FORMAT(ChangedAt, '%Y-%m-%d %H:%i') AS ChangedAt
    FROM tblStockLog
    ORDER BY LogNo DESC;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sproc_tblStockLog_DeleteTestEntries;

DELIMITER $$

-- removes ONLY the entries written by the automated tests (ChangedBy = 'Automated test'),
-- so real changes made by the Stock Manager can never be deleted from the log
CREATE PROCEDURE sproc_tblStockLog_DeleteTestEntries()
BEGIN
    DELETE FROM tblStockLog WHERE ChangedBy = 'Automated test';
END$$

DELIMITER ;

-- login used by the website (db.config.js)
CREATE USER IF NOT EXISTS 'sparkclean'@'localhost' IDENTIFIED BY 'sparkclean';
GRANT ALL PRIVILEGES ON sparkclean.* TO 'sparkclean'@'localhost';
FLUSH PRIVILEGES;

-- tblclient (Client Management component - Prajjwol)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tblclient (
    ClientNo       INT NOT NULL AUTO_INCREMENT,
    FullName       VARCHAR(100) NOT NULL,
    Email          VARCHAR(250) NOT NULL UNIQUE,
    Address        VARCHAR(500) NOT NULL,
    Postcode       VARCHAR(20) NOT NULL,
    DateRegistered DATE NOT NULL,
    Active         TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (ClientNo)
);
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
