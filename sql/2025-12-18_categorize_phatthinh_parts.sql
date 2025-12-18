-- Categorize Phat Thinh parts based on their names
-- This moves parts from 'Phụ tùng PhatThinh' to specific categories

UPDATE external_parts
SET category = CASE
    -- Priority matches (Longer/Specific names first)
    WHEN name ILIKE '%SH MODE%' THEN 'Phụ tùng SH Mode'
    WHEN name ILIKE '%SH 125%' OR name ILIKE '%SH 150%' OR name ILIKE '%SH Ý%' OR name ILIKE '%SH VN%' THEN 'Phụ tùng SH'
    WHEN name ILIKE '%VARIO%' OR name ILIKE '%CLICK%' THEN 'Phụ tùng Vario'
    WHEN name ILIKE '%VISION%' THEN 'Phụ tùng Vision'
    WHEN name ILIKE '%LEAD%' OR name ILIKE '%SCR%' THEN 'Phụ tùng Lead'
    WHEN name ILIKE '%AIR BLADE%' OR name ILIKE '% AB %' OR name ILIKE '%AB125%' OR name ILIKE '%AB110%' THEN 'Phụ tùng Air Blade'
    WHEN name ILIKE '%WAVE%' OR name ILIKE '%BLADE 110%' THEN 'Phụ tùng Wave'
    WHEN name ILIKE '%FUTURE%' OR name ILIKE '%FU NEO%' OR name ILIKE '%FU X%' OR name ILIKE '%FU 125%' THEN 'Phụ tùng Future'
    WHEN name ILIKE '%DREAM%' OR name ILIKE '%SUPER DREAM%' THEN 'Phụ tùng Dream'
    WHEN name ILIKE '%SIRIUS%' THEN 'Phụ tùng Sirius'
    WHEN name ILIKE '%EXCITER%' OR name ILIKE '%EX135%' OR name ILIKE '%EX150%' THEN 'Phụ tùng Exciter'
    WHEN name ILIKE '%WINNER%' THEN 'Phụ tùng Winner'
    WHEN name ILIKE '%PCX%' THEN 'Phụ tùng PCX'
    WHEN name ILIKE '%JUPITER%' THEN 'Phụ tùng Jupiter'
    WHEN name ILIKE '%GRANDE%' OR name ILIKE '%NOZZA%' THEN 'Phụ tùng Grande'
    WHEN name ILIKE '%NVX%' THEN 'Phụ tùng NVX'
    WHEN name ILIKE '%RAIDER%' OR name ILIKE '%SATRIA%' THEN 'Phụ tùng Raider'
    WHEN name ILIKE '%SONIC%' THEN 'Phụ tùng Sonic'
    
    -- Generic/Fallback (Keep original if no match, or move to 'Phụ tùng Khác' if you prefer)
    ELSE 'Phụ tùng Khác' 
END
WHERE category = 'Phụ tùng PhatThinh';
