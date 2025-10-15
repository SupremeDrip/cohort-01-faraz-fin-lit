// Check for duplicate stocks and ID issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function findIssues() {
  console.log('🔍 Checking for duplicate stocks...\n');

  const { data: allStocks } = await supabase
    .from('stocks')
    .select('id, symbol, company_name')
    .order('id', { ascending: true });

  console.log(`Total stocks in table: ${allStocks.length}\n`);

  // Group by symbol
  const bySymbol = {};
  allStocks.forEach(stock => {
    if (!bySymbol[stock.symbol]) {
      bySymbol[stock.symbol] = [];
    }
    bySymbol[stock.symbol].push(stock);
  });

  // Find duplicates
  const duplicates = Object.entries(bySymbol).filter(([symbol, stocks]) => stocks.length > 1);

  if (duplicates.length > 0) {
    console.log(`❌ Found ${duplicates.length} duplicate symbols:\n`);
    duplicates.forEach(([symbol, stocks]) => {
      console.log(`   ${symbol}: IDs = ${stocks.map(s => s.id).join(', ')}`);
    });
  } else {
    console.log('✅ No duplicate symbols found\n');
  }

  // Check ADANIENT specifically
  console.log('📌 ADANIENT records:');
  const adanient = allStocks.filter(s => s.symbol === 'ADANIENT');
  adanient.forEach(s => {
    console.log(`   ID ${s.id}: ${s.company_name}`);
  });

  // Check what IDs have history data
  console.log('\n📊 Checking stock_history...');
  const { data: sample } = await supabase
    .from('stock_history')
    .select('stock_id')
    .limit(100);

  const historyStockIds = [...new Set(sample.map(h => h.stock_id))].sort((a, b) => a - b);
  console.log(`   Sample stock_ids in history: ${historyStockIds.join(', ')}`);

  // Check if any current stock IDs match history
  const currentIds = allStocks.map(s => s.id);
  const matching = historyStockIds.filter(id => currentIds.includes(id));
  console.log(`   Matching IDs: ${matching.length} out of ${historyStockIds.length} sampled`);
}

findIssues();
