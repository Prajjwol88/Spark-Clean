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
