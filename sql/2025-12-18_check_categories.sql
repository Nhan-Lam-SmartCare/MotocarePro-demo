-- Check distinct categories and their counts
SELECT category, COUNT(*) 
FROM external_parts 
GROUP BY category 
ORDER BY category;
