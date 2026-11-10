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
