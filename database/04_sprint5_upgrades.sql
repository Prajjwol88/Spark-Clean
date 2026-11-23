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
