/*
  # Add RLS Policies for Stock Data Import

  ## Overview
  Adds RLS policies to allow the import script to insert stock data into the stocks and stock_history tables.
  These policies allow authenticated users (including service accounts) to insert and update stock data.

  ## Changes Made

  1. **stocks table policies**:
     - Allow INSERT for authenticated users (for initial stock creation)
     - Allow UPDATE for authenticated users (for price updates)

  2. **stock_history table policies**:
     - Allow INSERT for authenticated users (for historical data import)
     - Allow UPDATE for authenticated users (for data corrections)

  ## Security Notes
  - These policies use authenticated role which includes the anon key when used with valid JWT
  - For the import script, this allows data insertion
  - Regular authenticated users can also insert/update (consider restricting in production)
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert stocks" ON stocks;
DROP POLICY IF EXISTS "Service role can update stocks" ON stocks;
DROP POLICY IF EXISTS "Service role can insert stock history" ON stock_history;
DROP POLICY IF EXISTS "Service role can update stock history" ON stock_history;

-- Stocks table: Allow authenticated users to insert and update
CREATE POLICY "Authenticated users can insert stocks"
  ON stocks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stocks"
  ON stocks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stock history table: Allow authenticated users to insert and update
CREATE POLICY "Authenticated users can insert stock history"
  ON stock_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock history"
  ON stock_history
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comments explaining the policies
COMMENT ON TABLE stocks IS 'Stock information table. RLS enabled: authenticated users can read, insert, and update.';
COMMENT ON TABLE stock_history IS 'Historical stock price data. RLS enabled: authenticated users can read, insert, and update.';
