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

-- ------------------------------------------------------------
-- Client Management test data - Prajjwol
-- ------------------------------------------------------------

INSERT INTO tblclient
    (FullName, Email, Address, Postcode, DateRegistered, Active)
VALUES
    ('Aarav Sharma', 'aarav@example.com', 'Copenhagen', '2200', CURDATE(), 1),
    ('Emma Jensen', 'emma@example.com', 'Frederiksberg', '2000', CURDATE(), 1),
    ('Oliver Nielsen', 'oliver@example.com', 'Herlev', '2730', CURDATE(), 1)
ON DUPLICATE KEY UPDATE
    ClientNo = ClientNo;

-- ------------------------------------------------------------
-- Staff Management test data
-- ------------------------------------------------------------
INSERT IGNORE INTO tblStaff (FullName, Email, Phone, JobRole, StartDate, HourlyRate, IsManager, Active) VALUES
('Alex Jensen',    'alex@example.com',   '12345678', 'Cleaner',      '2026-02-10', 145.00, FALSE, TRUE),
('Sam Taylor',     'sam@example.com',    '22334455', 'Team Manager', '2025-11-03', 190.00, TRUE,  TRUE),
('Jamie Lee',      'jamie@example.com',  '33445566', 'Supervisor',   '2025-08-18', 170.00, FALSE, FALSE),
('Freja Hansen',   'freja@example.com',  '44556677', 'Cleaner',      '2026-05-04', 145.00, FALSE, TRUE),
('Mikkel Larsen',  'mikkel@example.com', '',         'Window Cleaner','2026-07-21', 155.50, FALSE, TRUE);

-- ------------------------------------------------------------
-- Staff login test data
-- every test staff member has the demo password  Staff2026!
-- (Jamie Lee is inactive, so Jamie cannot log in - useful for testing)
-- ------------------------------------------------------------
INSERT IGNORE INTO tblStaffAccount (StaffNo, PasswordHash)
SELECT StaffNo, '5f75a21591cf23ce68b4ccfba5caf0ef:81cff491ec9ba7994b665ef06c0c0f2f5706c883d793aabb496296cf2fb378c38e28767a2b8a5933fa793f106d01b0878f428629a62c43e47a363ec4b7f48d57'
FROM tblStaff
WHERE Email IN ('alex@example.com', 'sam@example.com', 'jamie@example.com', 'freja@example.com', 'mikkel@example.com');
