-- Fix missing employee_name in employee_advances table
-- Run this SQL in Supabase SQL Editor to update old records

-- Update employee_name from employees table where it's missing or empty
UPDATE employee_advances
SET employee_name = employees.name
FROM employees
WHERE employee_advances.employee_id = employees.id::text
  AND (employee_advances.employee_name IS NULL OR employee_advances.employee_name = '');

-- Verify the update
SELECT 
  id,
  employee_id,
  employee_name,
  advance_amount,
  status
FROM employee_advances
ORDER BY advance_date DESC;

-- Count records with missing names (should be 0 after update)
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN employee_name IS NULL OR employee_name = '' THEN 1 END) as missing_names
FROM employee_advances;
