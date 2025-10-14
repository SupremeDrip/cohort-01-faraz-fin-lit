/*
  # Disable RLS on Stock Tables for Data Import

  ## Overview
  Completely disables Row Level Security on stocks and stock_history tables
  to allow unrestricted data import.

  ## Changes Made
  - Disable RLS on stocks table
  - Disable RLS on stock_history table
  - Drop all existing RLS policies

  ## Security Notes
  - RLS is completely disabled - all operations allowed
  - Can be re-enabled after data import if needed
*/

-- Disable RLS on both tables
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to be thorough
DROP POLICY IF EXISTS "Authenticated users can view stocks" ON stocks;
DROP POLICY IF EXISTS "Authenticated users can insert stocks" ON stocks;
DROP POLICY IF EXISTS "Authenticated users can update stocks" ON stocks;
DROP POLICY IF EXISTS "Anon can insert stocks" ON stocks;
DROP POLICY IF EXISTS "Anon can update stocks" ON stocks;

DROP POLICY IF EXISTS "Authenticated users can view stock history" ON stock_history;
DROP POLICY IF EXISTS "Authenticated users can insert stock history" ON stock_history;
DROP POLICY IF EXISTS "Authenticated users can update stock history" ON stock_history;
DROP POLICY IF EXISTS "Anon can insert stock history" ON stock_history;
DROP POLICY IF EXISTS "Anon can update stock history" ON stock_history;
