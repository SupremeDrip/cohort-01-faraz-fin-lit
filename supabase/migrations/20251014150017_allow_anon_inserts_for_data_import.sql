/*
  # Allow Anonymous Role to Insert Stock Data

  ## Overview
  The import script uses the anon key and needs permission to insert data.
  This migration adds permissive RLS policies for the anon role.

  ## Changes Made

  1. **stocks table**:
     - Allow anon role to INSERT stocks
     - Allow anon role to UPDATE stocks

  2. **stock_history table**:
     - Allow anon role to INSERT stock history
     - Allow anon role to UPDATE stock history

  ## Security Notes
  - This is permissive to allow data import
  - Consider removing these policies after import is complete if needed
*/

-- Stocks table: Allow anon role to insert and update
CREATE POLICY "Anon can insert stocks"
  ON stocks
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update stocks"
  ON stocks
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Stock history table: Allow anon role to insert and update
CREATE POLICY "Anon can insert stock history"
  ON stock_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update stock history"
  ON stock_history
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
