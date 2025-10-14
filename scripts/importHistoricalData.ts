// Historical Stock Data Import Script
// Imports NSE stock market data from CSV files into Supabase database
// Handles all 5 merged CSV files with comprehensive error handling and progress tracking

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface CSVRow {
  Date: string;
  Symbol: string;
  Series: string;
  'Prev Close': string;
  Open: string;
  High: string;
  Low: string;
  Last: string;
  Close: string;
  VWAP: string;
  Volume: string;
  Turnover: string;
  Trades: string;
  'Deliverable Volume': string;
  '%Deliverble': string;
}

interface StockHistoryRow {
  stock_id: number;
  date: string;
  prev_close: number | null;
  open: number;
  high: number;
  low: number;
  last: number | null;
  close: number;
  vwap: number | null;
  volume: number;
  turnover: number;
  trades: number;
  deliverable_volume: number | null;
  deliverable_percent: number | null;
}

// Nifty 50 stock symbols with company names
const NIFTY_50_STOCKS: Record<string, string> = {
  ADANIENT: 'Adani Enterprises Ltd.',
  ADANIPORTS: 'Adani Ports and Special Economic Zone Ltd.',
  APOLLOHOSP: 'Apollo Hospitals Enterprise Ltd.',
  ASIANPAINT: 'Asian Paints Ltd.',
  AXISBANK: 'Axis Bank Ltd.',
  BAJAJ_AUTO: 'Bajaj Auto Ltd.',
  'BAJAJ-AUTO': 'Bajaj Auto Ltd.',
  BAJAJFINSV: 'Bajaj Finserv Ltd.',
  BAJFINANCE: 'Bajaj Finance Ltd.',
  BHARTIARTL: 'Bharti Airtel Ltd.',
  BPCL: 'Bharat Petroleum Corporation Ltd.',
  BRITANNIA: 'Britannia Industries Ltd.',
  CIPLA: 'Cipla Ltd.',
  COALINDIA: 'Coal India Ltd.',
  DIVISLAB: "Divi's Laboratories Ltd.",
  DRREDDY: "Dr. Reddy's Laboratories Ltd.",
  EICHERMOT: 'Eicher Motors Ltd.',
  GRASIM: 'Grasim Industries Ltd.',
  HCLTECH: 'HCL Technologies Ltd.',
  HDFC: 'Housing Development Finance Corporation Ltd.',
  HDFCBANK: 'HDFC Bank Ltd.',
  HDFCLIFE: 'HDFC Life Insurance Company Ltd.',
  HEROMOTOCO: 'Hero MotoCorp Ltd.',
  HINDALCO: 'Hindalco Industries Ltd.',
  HINDUNILVR: 'Hindustan Unilever Ltd.',
  ICICIBANK: 'ICICI Bank Ltd.',
  INDUSINDBK: 'IndusInd Bank Ltd.',
  INFY: 'Infosys Ltd.',
  ITC: 'ITC Ltd.',
  JSWSTEEL: 'JSW Steel Ltd.',
  KOTAKBANK: 'Kotak Mahindra Bank Ltd.',
  LT: 'Larsen & Toubro Ltd.',
  LTIM: 'LTIMindtree Ltd.',
  M_M: 'Mahindra & Mahindra Ltd.',
  'M&M': 'Mahindra & Mahindra Ltd.',
  MARUTI: 'Maruti Suzuki India Ltd.',
  NESTLEIND: 'Nestle India Ltd.',
  NTPC: 'NTPC Ltd.',
  ONGC: 'Oil and Natural Gas Corporation Ltd.',
  POWERGRID: 'Power Grid Corporation of India Ltd.',
  RELIANCE: 'Reliance Industries Ltd.',
  SBIN: 'State Bank of India',
  SBILIFE: 'SBI Life Insurance Company Ltd.',
  SHRIRAMFIN: 'Shriram Finance Ltd.',
  SUNPHARMA: 'Sun Pharmaceutical Industries Ltd.',
  TATACONSUM: 'Tata Consumer Products Ltd.',
  TATAMOTORS: 'Tata Motors Ltd.',
  TATASTEEL: 'Tata Steel Ltd.',
  TCS: 'Tata Consultancy Services Ltd.',
  TECHM: 'Tech Mahindra Ltd.',
  TITAN: 'Titan Company Ltd.',
  ULTRACEMCO: 'UltraTech Cement Ltd.',
  WIPRO: 'Wipro Ltd.',
};

const stockIdCache = new Map<string, number>();

function parseNumber(value: string): number | null {
  if (!value || value === '' || value === '-' || value === 'null') {
    return null;
  }
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(dateStr: string): string | null {
  try {
    // Expected format: DD-MMM-YYYY (e.g., 01-Jan-2008)
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const monthMap: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };
    const month = monthMap[parts[1]];
    const year = parts[2];

    if (!month) return null;

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return null;
  }
}

async function ensureStocksExist() {
  console.log('\n📊 Ensuring all Nifty 50 stocks exist in database...');

  for (const [symbol, companyName] of Object.entries(NIFTY_50_STOCKS)) {
    const { data, error } = await supabase
      .from('stocks')
      .select('id')
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      console.error(`❌ Error checking stock ${symbol}:`, error);
      continue;
    }

    if (!data) {
      // Insert the stock
      const { data: newStock, error: insertError } = await supabase
        .from('stocks')
        .insert({ symbol, company_name: companyName, current_price: 0 })
        .select('id')
        .single();

      if (insertError) {
        console.error(`❌ Error inserting stock ${symbol}:`, insertError);
      } else {
        console.log(`✅ Created stock: ${symbol} - ${companyName}`);
        stockIdCache.set(symbol, newStock.id);
      }
    } else {
      stockIdCache.set(symbol, data.id);
    }
  }

  console.log(`✅ Stock cache built with ${stockIdCache.size} stocks\n`);
}

async function getStockId(symbol: string): Promise<number | null> {
  // Normalize symbol (handle variations like M&M vs M_M)
  const normalizedSymbol = symbol.replace('_', '&');

  if (stockIdCache.has(normalizedSymbol)) {
    return stockIdCache.get(normalizedSymbol)!;
  }

  // Try to fetch from database
  const { data, error } = await supabase
    .from('stocks')
    .select('id')
    .eq('symbol', normalizedSymbol)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  stockIdCache.set(normalizedSymbol, data.id);
  return data.id;
}

function normalizeSymbol(symbol: string): string {
  // Convert symbols like M_M to M&M
  return symbol.replace('_', '&');
}

async function importCSVFile(filePath: string): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  const fileName = path.basename(filePath);
  console.log(`\n📂 Processing: ${fileName}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return { success: 0, failed: 0, skipped: 0 };
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  let records: CSVRow[];
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    console.error(`❌ Error parsing CSV:`, error);
    return { success: 0, failed: 0, skipped: 0 };
  }

  console.log(`📊 Found ${records.length} rows to process`);

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const batchSize = 1000;
  const batches: StockHistoryRow[][] = [];
  let currentBatch: StockHistoryRow[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    // Progress indicator
    if ((i + 1) % 5000 === 0) {
      console.log(`   ... processed ${i + 1} / ${records.length} rows`);
    }

    const symbol = normalizeSymbol(row.Symbol);
    const stockId = await getStockId(symbol);

    if (!stockId) {
      skippedCount++;
      continue;
    }

    const date = parseDate(row.Date);
    if (!date) {
      skippedCount++;
      continue;
    }

    const open = parseNumber(row.Open);
    const high = parseNumber(row.High);
    const low = parseNumber(row.Low);
    const close = parseNumber(row.Close);

    if (open === null || high === null || low === null || close === null) {
      skippedCount++;
      continue;
    }

    const historyRow: StockHistoryRow = {
      stock_id: stockId,
      date,
      prev_close: parseNumber(row['Prev Close']),
      open,
      high,
      low,
      last: parseNumber(row.Last),
      close,
      vwap: parseNumber(row.VWAP),
      volume: parseNumber(row.Volume) || 0,
      turnover: parseNumber(row.Turnover) || 0,
      trades: parseNumber(row.Trades) || 0,
      deliverable_volume: parseNumber(row['Deliverable Volume']),
      deliverable_percent: parseNumber(row['%Deliverble']),
    };

    currentBatch.push(historyRow);

    if (currentBatch.length >= batchSize) {
      batches.push([...currentBatch]);
      currentBatch = [];
    }
  }

  // Add remaining rows
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`📦 Inserting ${batches.length} batches into database...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    try {
      const { error } = await supabase.from('stock_history').upsert(batch, {
        onConflict: 'stock_id,date',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.message);
        failedCount += batch.length;
      } else {
        successCount += batch.length;
        if ((i + 1) % 10 === 0 || i === batches.length - 1) {
          console.log(`   ✅ Batch ${i + 1}/${batches.length} completed`);
        }
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} exception:`, error);
      failedCount += batch.length;
    }
  }

  console.log(`✅ ${fileName} complete: ${successCount} inserted, ${failedCount} failed, ${skippedCount} skipped`);

  return { success: successCount, failed: failedCount, skipped: skippedCount };
}

async function main() {
  console.log('🚀 Starting Historical Stock Data Import\n');
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Ensure all stocks exist first
  await ensureStocksExist();

  const csvFiles = [
    'merged_group_1.csv',
    'merged_group_2.csv',
    'merged_group_3.csv',
    'merged_group_4.csv',
    'merged_group_5.csv',
  ];

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const fileName of csvFiles) {
    const filePath = path.join(process.cwd(), 'data', fileName);
    const result = await importCSVFile(filePath);
    totalSuccess += result.success;
    totalFailed += result.failed;
    totalSkipped += result.skipped;
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${totalSuccess.toLocaleString()} rows`);
  console.log(`❌ Failed: ${totalFailed.toLocaleString()} rows`);
  console.log(`⏭️  Skipped: ${totalSkipped.toLocaleString()} rows`);
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log('='.repeat(60));
  console.log('\n✨ Import complete!\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
