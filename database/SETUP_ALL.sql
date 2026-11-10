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
-- login used by the website (db.config.js)
CREATE USER IF NOT EXISTS 'sparkclean'@'localhost' IDENTIFIED BY 'sparkclean';
GRANT ALL PRIVILEGES ON sparkclean.* TO 'sparkclean'@'localhost';
FLUSH PRIVILEGES;
