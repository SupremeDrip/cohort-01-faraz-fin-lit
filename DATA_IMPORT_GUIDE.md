# Historical Stock Data Import Guide

This guide explains how to import historical NSE stock market data from CSV files into the Supabase database.

## Overview

The import script processes 5 merged CSV files containing historical stock trading data from the National Stock Exchange (NSE) of India. The data spans from 2008 onwards and includes approximately **229,886 total rows** across all files.

## Prerequisites

1. **CSV Files**: Place your 5 CSV files in a `data/` directory in the project root:
   ```
   project-root/
   ├── data/
   │   ├── merged_group_1.csv
   │   ├── merged_group_2.csv
   │   ├── merged_group_3.csv
   │   ├── merged_group_4.csv
   │   └── merged_group_5.csv
   ├── scripts/
   │   └── importHistoricalData.js
   └── ...
   ```

2. **Dependencies**: Already installed (csv-parse, dotenv, @supabase/supabase-js)

3. **Environment Variables**: Your `.env` file must contain:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## CSV File Format

Each CSV file contains the following columns:

| Column | Description | Type |
|--------|-------------|------|
| Date | Trading date (DD-MMM-YYYY format) | Date |
| Symbol | Stock ticker symbol | String |
| Series | Trading series (usually "EQ") | String |
| Prev Close | Previous day's closing price | Number |
| Open | Opening price | Number |
| High | Highest price of the day | Number |
| Low | Lowest price of the day | Number |
| Last | Last traded price | Number |
| Close | Closing price | Number |
| VWAP | Volume Weighted Average Price | Number |
| Volume | Total trading volume | Number |
| Turnover | Total turnover value | Number |
| Trades | Number of trades | Number |
| Deliverable Volume | Deliverable volume (nullable) | Number |
| %Deliverble | Deliverable percentage (nullable) | Number |

## Database Schema

The script uses two main tables:

### `stocks` table
Stores basic information about each Nifty 50 stock:
- `id` (primary key)
- `symbol` (unique)
- `company_name`
- `current_price`
- `last_updated`

### `stock_history` table
Stores historical trading data:
- `stock_id` (foreign key to stocks)
- `date` (trading date)
- `prev_close`, `open`, `high`, `low`, `last`, `close` (price data)
- `vwap` (Volume Weighted Average Price)
- `volume`, `turnover`, `trades` (trading metrics)
- `deliverable_volume`, `deliverable_percent` (delivery data)

**Composite Primary Key**: (`stock_id`, `date`) - ensures one record per stock per day

## How to Run the Import

### Step 1: Create the data directory

```bash
mkdir -p data
```

### Step 2: Place your CSV files

Copy all 5 merged CSV files into the `data/` directory.

### Step 3: Run the import script

```bash
node scripts/importHistoricalData.js
```

## Import Process

The script performs the following steps:

1. **Stock Initialization**: Ensures all 50 Nifty stocks exist in the `stocks` table
2. **Symbol Cache Building**: Creates an in-memory cache for fast stock ID lookups
3. **CSV Processing**: Reads each CSV file sequentially
4. **Data Validation**: Validates dates, prices, and handles missing values
5. **Batch Insertion**: Inserts data in batches of 1,000 rows for efficiency
6. **Upsert Strategy**: Updates existing records if they exist (based on stock_id + date)

## Expected Output

```
🚀 Starting Historical Stock Data Import

============================================================

📊 Ensuring all Nifty 50 stocks exist in database...
✅ Stock cache built with 50 stocks

📂 Processing: merged_group_1.csv
📊 Found 46,263 rows to process
   ... processed 5000 / 46263 rows
   ... processed 10000 / 46263 rows
   ...
📦 Inserting 47 batches into database...
   ✅ Batch 10/47 completed
   ✅ Batch 20/47 completed
   ...
✅ merged_group_1.csv complete: 46,000 inserted, 0 failed, 263 skipped

[... repeats for other files ...]

============================================================
📊 IMPORT SUMMARY
============================================================
✅ Successfully imported: 220,145 rows
❌ Failed: 0 rows
⏭️  Skipped: 9,741 rows
⏱️  Total time: 1,234.56 seconds
============================================================

✨ Import complete!
```

## Handling Issues

### Skipped Rows
Rows may be skipped for the following reasons:
- Stock symbol not in Nifty 50 list
- Invalid date format
- Missing required price data (open, high, low, close)

### Failed Rows
Rows may fail if:
- Database connection issues
- Data type mismatches
- Constraint violations

### Duplicate Records
The script uses `upsert` with `onConflict: 'stock_id,date'`, which means:
- If a record exists for the same stock and date, it will be **updated**
- If it doesn't exist, it will be **inserted**
- This makes the script **idempotent** (safe to run multiple times)

## Performance Considerations

- **Batch Size**: 1,000 rows per batch (adjustable in code)
- **Expected Duration**: ~15-20 minutes for all 229,886 rows
- **Memory Usage**: Moderate (processes one file at a time)
- **Network**: Depends on Supabase connection speed

## Post-Import Verification

After import, you can verify the data:

```javascript
// Check total records
const { count } = await supabase
  .from('stock_history')
  .select('*', { count: 'exact', head: true });

console.log(`Total records: ${count}`);

// Check date range
const { data } = await supabase
  .from('stock_history')
  .select('date')
  .order('date', { ascending: true })
  .limit(1);

console.log(`Earliest date: ${data[0].date}`);
```

## Updating the Import Script

If you need to modify the import logic:

1. **Edit Symbol Mapping**: Update `NIFTY_50_STOCKS` object in the script
2. **Adjust Batch Size**: Change `batchSize` variable (default: 1000)
3. **Modify Date Parsing**: Update `parseDate()` function
4. **Handle New Columns**: Add fields to the `historyRow` object

## Troubleshooting

### "File not found" Error
- Ensure CSV files are in the `data/` directory
- Check file names match exactly (case-sensitive)

### "Supabase credentials not found"
- Verify `.env` file exists in project root
- Check environment variable names are correct

### "Stock not found" warnings
- The script only imports data for stocks in the `NIFTY_50_STOCKS` list
- Other symbols are automatically skipped

### Slow import speed
- Check your internet connection
- Verify Supabase project location (latency)
- Consider increasing batch size (but watch for timeout errors)

## Next Steps

After successful import:

1. **Verify Data**: Query the database to ensure data integrity
2. **Update Current Prices**: Run a script to fetch latest prices via Alpha Vantage
3. **Test Charts**: Verify historical charts display correctly in the UI
4. **Monitor Performance**: Check query speeds for chart rendering

## Support

For issues or questions:
- Check Supabase dashboard for error logs
- Review console output for specific error messages
- Verify CSV file formats match expected structure
