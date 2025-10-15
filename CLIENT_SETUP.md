# Client Setup Guide for FinSim

## 📋 Overview

This guide will help you set up the FinSim paper trading application in your Bolt.new account after receiving the GitHub repository.

## 🚀 Setup Process

### Step 1: Import Repository into Bolt.new

1. Log into your Bolt.new account
2. Click **"Import from GitHub"**
3. Enter the GitHub repository URL provided to you
4. Click **"Import"**

**What happens automatically:**
- ✅ Project files are cloned to your Bolt workspace
- ✅ Supabase database is provisioned
- ✅ Database migration runs automatically (`supabase/migrations/20251015000000_initial_finsim_schema.sql`)
- ✅ All 8 database tables are created
- ✅ Row Level Security policies are configured
- ✅ Environment variables are set

### Step 2: Wait for Database Setup

Bolt.new will show you progress indicators. Wait for:
- ✅ "Database migrated successfully" message
- ✅ All environment variables populated in `.env`

**Note:** This typically takes 1-2 minutes.

### Step 3: Import Historical Stock Data

The project includes ~230,000 historical stock records in 5 CSV files. You need to import this data:

1. Open the **Terminal** in Bolt.new
2. Run the following command:

```bash
node scripts/importHistoricalData.js
```

3. Wait for the import to complete (15-20 minutes)
4. You'll see progress updates and a final summary

**Expected output:**
```
============================================================
📊 IMPORT SUMMARY
============================================================
✅ Successfully imported: ~220,000 rows
❌ Failed: 0 rows
⏭️  Skipped: ~10,000 rows
⏱️  Total time: ~900 seconds
============================================================
```

### Step 4: Verify Application

After data import completes:

1. Click **"Preview"** in Bolt.new to open your application
2. Sign up for a new student account
3. Browse stocks and view historical charts
4. Test buy/sell functionality with virtual cash (₹100,000)

## 📁 Project Structure

```
FinSim/
├── data/                          # CSV files with historical data (5 files)
├── src/                           # React application source code
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # Authentication context
│   ├── lib/                      # Utilities and types
│   └── pages/                    # Application pages
├── supabase/migrations/          # Database migration (1 file)
├── scripts/                      # Data import script
├── .env                          # Environment variables (auto-generated)
├── CLIENT_SETUP.md              # This file
├── QUICK_START.md               # Data import guide
├── README.md                    # Project documentation
└── FUNCTIONAL_REQUIREMENTS.md   # Complete feature specifications
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Application loads successfully in preview
- [ ] Sign up flow works (student and parent roles)
- [ ] Stock list displays all Nifty 50 stocks
- [ ] Stock detail pages show historical charts (1M, 3M, 6M, 1Y, All)
- [ ] Buy/Sell functionality works
- [ ] Portfolio dashboard shows holdings
- [ ] Transaction history displays correctly
- [ ] Social feed allows posting and commenting

## 🆘 Troubleshooting

### Import Script Fails

**Error: "Supabase credentials not found"**
- Check that `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart Bolt.new if credentials are missing

**Error: "File not found"**
- Verify `data/` folder exists with all 5 CSV files
- Check file names match exactly: `merged_group_1.csv` through `merged_group_5.csv`

**Error: "Permission denied"**
- Database RLS should be disabled on stocks/stock_history tables (this is default)
- Contact developer if RLS is blocking inserts

### Application Issues

**Stocks don't show prices**
- Historical data may not be imported yet
- Run the import script: `node scripts/importHistoricalData.js`

**Charts show "No data available"**
- Historical data import is incomplete
- Check import script completed successfully

**Login/Signup doesn't work**
- Check Supabase is connected (green indicator in Bolt)
- Verify `.env` has correct credentials

## 📞 Support

If you encounter issues:

1. Check the error messages in Bolt.new console
2. Review `QUICK_START.md` for detailed import instructions
3. Contact the developer with:
   - Screenshot of error message
   - Console logs from browser (F12 → Console)
   - Terminal output from import script

## 🔒 Security Note

**Row Level Security (RLS):**
- Currently **disabled** on `stocks` and `stock_history` tables for easy data import
- All user tables (profiles, holdings, transactions, posts, comments, likes) have RLS **enabled**
- After verifying everything works, contact developer to re-enable RLS on stock tables if needed

## 📚 Additional Documentation

- **README.md** - Complete project overview and features
- **QUICK_START.md** - Detailed data import guide
- **DATA_IMPORT_GUIDE.md** - Technical import documentation
- **FUNCTIONAL_REQUIREMENTS.md** - Complete feature specifications

---

**Welcome to FinSim!** 🎉 Your paper trading platform is ready for students to learn stock market investing.
