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
