/*
  # Enhanced Stock History Schema for CSV Import

  ## Overview
  Extends the stock_history table to store comprehensive NSE trading data from historical CSV files.
  This migration adds columns for volume metrics, VWAP, and delivery data to support detailed
  historical analysis.

  ## Changes Made

  1. **New Columns Added to stock_history**:
     - prev_close: Previous day's closing price
     - last: Last traded price
     - vwap: Volume Weighted Average Price
     - volume: Total trading volume
     - turnover: Total turnover value (large numbers)
     - trades: Number of trades executed
     - deliverable_volume: Volume of deliverable shares
     - deliverable_percent: Percentage of deliverable volume

  2. **Indexes Created**:
     - idx_stock_history_symbol_date: Composite index for efficient symbol+date queries
     - idx_stock_history_date: Index on date column for time-based queries

  ## Data Types
  - All price fields use numeric(12,2) for precision
  - Volume fields use bigint to handle large numbers
  - Percentages use numeric(5,2) for values like 99.99%

  ## Notes
  - Deliverable volume and percent can be NULL (some records don't have this data)
  - Turnover uses numeric(20,2) to handle very large values
  - All existing data is preserved, new columns default to NULL
*/

-- Add new columns to stock_history table
DO $$
BEGIN
  -- Previous close price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'prev_close'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN prev_close numeric(12,2);
  END IF;

  -- Last traded price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'last'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN last numeric(12,2);
  END IF;

  -- Volume Weighted Average Price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'vwap'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN vwap numeric(12,2);
  END IF;

  -- Trading volume
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'volume'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN volume bigint DEFAULT 0;
  END IF;

  -- Turnover (can be very large)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'turnover'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN turnover numeric(20,2) DEFAULT 0;
  END IF;

  -- Number of trades
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'trades'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN trades integer DEFAULT 0;
  END IF;

  -- Deliverable volume (can be NULL)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'deliverable_volume'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN deliverable_volume bigint;
  END IF;

  -- Deliverable percentage (can be NULL)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_history' AND column_name = 'deliverable_percent'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN deliverable_percent numeric(5,2);
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(date DESC);

-- Create a helper table to map symbols to stock IDs for faster imports
CREATE TABLE IF NOT EXISTS stock_symbol_cache (
  symbol varchar(20) PRIMARY KEY,
  stock_id integer NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create index on stocks symbol for faster lookups during import
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);

-- Add comment to stock_history table
COMMENT ON TABLE stock_history IS 'Historical stock trading data from NSE including OHLC, volume, and delivery metrics';
