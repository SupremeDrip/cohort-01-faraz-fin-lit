// Fix ID mismatch by removing duplicate stocks
// Keeps only stocks that have corresponding historical data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMismatch() {
  console.log('🔧 Fixing stock ID mismatch...\n');

  // Get all stocks
  const { data: allStocks } = await supabase
    .from('stocks')
    .select('id, symbol, company_name')
    .order('id', { ascending: true });

  console.log(`Found ${allStocks.length} stocks in database\n`);

  // Get all unique stock_ids from stock_history
  console.log('📊 Checking which stocks have historical data...');
  const { data: historyRefs } = await supabase
    .from('stock_history')
    .select('stock_id');

  const stockIdsWithHistory = [...new Set(historyRefs.map(h => h.stock_id))];
  console.log(`Found ${stockIdsWithHistory.length} unique stock IDs in stock_history\n`);

  // Find stocks that have NO history data (these are likely duplicates)
  const stocksWithHistory = allStocks.filter(s => stockIdsWithHistory.includes(s.id));
  const stocksWithoutHistory = allStocks.filter(s => !stockIdsWithHistory.includes(s.id));

  console.log(`✅ Stocks WITH history data: ${stocksWithHistory.length}`);
  console.log(`❌ Stocks WITHOUT history data: ${stocksWithoutHistory.length}`);

  if (stocksWithoutHistory.length > 0) {
    console.log('\n🗑️  Stocks to be removed (no historical data):');
    stocksWithoutHistory.forEach(s => {
      console.log(`   ID ${s.id}: ${s.symbol} - ${s.company_name}`);
    });

    console.log('\n⚠️  WARNING: This will delete the above stocks!');
    console.log('⚠️  Make sure no users have holdings or transactions with these stocks!');
    console.log('\nTo proceed, uncomment the deletion code in this script.');

    // UNCOMMENT TO EXECUTE:
    // const idsToDelete = stocksWithoutHistory.map(s => s.id);
    // const { error } = await supabase
    //   .from('stocks')
    //   .delete()
    //   .in('id', idsToDelete);
    //
    // if (error) {
    //   console.error('❌ Error deleting stocks:', error);
    // } else {
    //   console.log(`✅ Successfully deleted ${idsToDelete.length} duplicate stocks`);
    // }
  } else {
    console.log('\n✅ No duplicates found! All stocks have historical data.');
  }

  // Check for symbol duplicates
  console.log('\n📋 Checking for duplicate symbols...');
  const symbolCounts = {};
  allStocks.forEach(s => {
    symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
  });

  const duplicateSymbols = Object.entries(symbolCounts).filter(([sym, count]) => count > 1);
  if (duplicateSymbols.length > 0) {
    console.log(`❌ Found ${duplicateSymbols.length} symbols with duplicates:`);
    duplicateSymbols.forEach(([symbol, count]) => {
      const dupes = allStocks.filter(s => s.symbol === symbol);
      console.log(`   ${symbol}: ${dupes.map(d => `ID ${d.id}`).join(', ')}`);

      // Keep the one with history, delete others
      const withHistory = dupes.filter(d => stockIdsWithHistory.includes(d.id));
      const withoutHistory = dupes.filter(d => !stockIdsWithHistory.includes(d.id));

      if (withHistory.length > 0 && withoutHistory.length > 0) {
        console.log(`      → Keep ID ${withHistory.map(s => s.id).join(', ')} (has history)`);
        console.log(`      → Delete ID ${withoutHistory.map(s => s.id).join(', ')} (no history)`);
      }
    });
  } else {
    console.log('✅ No duplicate symbols found');
  }
}

fixMismatch();
