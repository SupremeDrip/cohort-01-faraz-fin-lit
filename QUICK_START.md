# Quick Start Guide - Historical Data Import

## 🚀 Steps to Import Your Stock Data (After Bolt.new Setup)

### ✅ Prerequisites - Automatic Setup via Bolt.new

When you import this repository into Bolt.new, the following happens automatically:

1. ✅ Supabase database is provisioned
2. ✅ Migration file `20251015000000_initial_finsim_schema.sql` is executed
3. ✅ All 8 database tables are created (profiles, stocks, stock_history, holdings, transactions, posts, comments, likes)
4. ✅ Row Level Security (RLS) policies are configured
5. ✅ Environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are set in `.env`

**Note:** The `stocks` and `stock_history` tables have RLS **disabled** to allow the import script to insert data smoothly.

### 1. Verify Your Data Files

The `data` folder with 5 CSV files should already be present in your project:

```
data/
├── merged_group_1.csv  (~46,000 rows)
├── merged_group_2.csv  (~46,000 rows)
├── merged_group_3.csv  (~46,000 rows)
├── merged_group_4.csv  (~46,000 rows)
└── merged_group_5.csv  (~46,000 rows)
```

**Total:** ~230,000 historical stock records from NSE (2008-present)

### 2. Verify Environment Variables

Check that your `.env` file contains Supabase credentials (Bolt auto-populates these):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run the Import Script

Open the Bolt.new terminal and execute:

```bash
node scripts/importHistoricalData.js
```

### 4. Monitor Progress

The script will show real-time progress:
- Stock initialization
- File processing (with row counts)
- Batch insertion progress
- Final summary statistics

Expected time: **15-20 minutes** for ~230,000 rows

### 5. Verify Success

After completion, you'll see:
```
============================================================
📊 IMPORT SUMMARY
============================================================
✅ Successfully imported: XXX,XXX rows
❌ Failed: 0 rows
⏭️  Skipped: X,XXX rows
⏱️  Total time: XXX.XX seconds
============================================================
```

**Expected Results:**
- ✅ ~220,000+ rows successfully imported
- ⏭️ ~9,000-10,000 rows skipped (stocks not in Nifty 50 or invalid data)
- ❌ 0 failed rows (if any failures, check error messages)

## 📊 What Gets Imported

- **All 50 Nifty stocks** (automatically created in stocks table)
- **Historical price data** from 2008 onwards:
  - Open, High, Low, Close prices
  - Volume, Turnover, Trades
  - VWAP (Volume Weighted Average Price)
  - Deliverable volume and percentages

## 🔍 What Happens Under the Hood

1. **Stocks Table**: All 50 Nifty stocks are ensured to exist
2. **Data Validation**: Dates and prices are validated
3. **Duplicate Handling**: If data already exists for a stock+date, it's updated
4. **Batch Processing**: Data is inserted in batches of 1,000 rows for speed
5. **Error Handling**: Invalid rows are skipped and counted

## ⚠️ Common Issues

**File not found?**
- Make sure files are in the `data/` directory
- Check file names match exactly

**Slow import?**
- Normal! Large datasets take time
- Coffee break recommended ☕

**Some rows skipped?**
- Expected! Rows with missing critical data (prices, dates) are automatically skipped
- Check the summary to see skip count

## 📈 After Import

Your app will now display:
- ✅ Real historical price charts
- ✅ 15+ years of data per stock
- ✅ All trading metrics for analysis

The charts on stock detail pages will automatically use this data!

## 🎯 Next Steps

Once import is complete:
1. Open your app and view any stock
2. Switch between different time ranges (1M, 3M, 6M, 1Y, ALL)
3. See beautiful historical charts powered by your real data!

## 💡 Pro Tips

- **Re-running is safe**: The script uses upsert, so running it multiple times won't create duplicates
- **Add more data**: Drop new CSV files in the `data/` folder and run again
- **Check logs**: The script shows detailed progress for debugging

## 🔒 Security Note - Re-enabling RLS (Optional)

Currently, the `stocks` and `stock_history` tables have Row Level Security (RLS) **disabled** to allow the import script to work smoothly.

**After successful data import**, you may want to re-enable RLS for production security:

1. This prevents unauthorized modifications to stock data
2. However, price update scripts will need service role key access
3. Consult with the developer to apply the appropriate RLS policies

**For now, you can proceed with RLS disabled as the data is read-only in the application interface.**

---

**Need detailed documentation?** See `DATA_IMPORT_GUIDE.md` for comprehensive information.
