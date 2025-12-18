-- Allow anon access to external_parts for import script
CREATE POLICY "Enable insert for anon" ON external_parts
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Enable select for anon" ON external_parts
    FOR SELECT
    TO anon
    USING (true);
