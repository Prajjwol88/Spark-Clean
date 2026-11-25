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

-- ------------------------------------------------------------
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
