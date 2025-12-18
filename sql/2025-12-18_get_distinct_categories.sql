-- Create RPC function to get distinct categories
CREATE OR REPLACE FUNCTION get_external_part_categories()
RETURNS TABLE (category text)
LANGUAGE sql
AS $$
  SELECT DISTINCT category
  FROM external_parts
  WHERE category IS NOT NULL
  ORDER BY category;
$$;
