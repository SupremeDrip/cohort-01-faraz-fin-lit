# Quick Start Guide - Historical Data Import

## 🚀 Steps to Import Your Stock Data

### 1. Prepare Your Files

Create a `data` folder in your project root and place your 5 CSV files there:

```bash
mkdir data
```

Then copy your files:
```
data/
├── merged_group_1.csv
├── merged_group_2.csv
├── merged_group_3.csv
├── merged_group_4.csv
└── merged_group_5.csv
```

### 2. Run the Import

```bash
node scripts/importHistoricalData.js
```

### 3. Monitor Progress

The script will show real-time progress:
- Stock initialization
- File processing (with row counts)
- Batch insertion progress
- Final summary statistics

Expected time: **15-20 minutes** for ~230,000 rows

### 4. Verify Success

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

---

**Need detailed documentation?** See `DATA_IMPORT_GUIDE.md` for comprehensive information.
