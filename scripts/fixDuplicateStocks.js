// Simple fix: Remove duplicate stocks that have no historical data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fix() {
  console.log('🔧 Fixing duplicate stocks...\n');

  // Step 1: Find stock IDs that have history
  const { data: historyIds } = await supabase
    .from('stock_history')
    .select('stock_id');

  const validStockIds = [...new Set(historyIds.map(h => h.stock_id))];
  console.log(`✅ Found ${validStockIds.length} stocks with historical data`);
  console.log(`   Stock IDs: ${Math.min(...validStockIds)} to ${Math.max(...validStockIds)}\n`);

  // Step 2: Get all stocks
  const { data: allStocks } = await supabase
    .from('stocks')
    .select('id, symbol');

  console.log(`📊 Total stocks in table: ${allStocks.length}\n`);

  // Step 3: Find stocks to delete (ones without history)
  const stocksToDelete = allStocks.filter(s => !validStockIds.includes(s.id));

  if (stocksToDelete.length === 0) {
    console.log('✅ No duplicate stocks found! Everything is correct.');
    return;
  }

  console.log(`🗑️  Found ${stocksToDelete.length} duplicate stocks to remove:`);
  stocksToDelete.slice(0, 10).forEach(s => {
    console.log(`   ID ${s.id}: ${s.symbol}`);
  });
  if (stocksToDelete.length > 10) {
    console.log(`   ... and ${stocksToDelete.length - 10} more`);
  }

  // Step 4: Delete them
  console.log('\n🔄 Deleting duplicate stocks...');

  const deleteIds = stocksToDelete.map(s => s.id);
  const { error } = await supabase
    .from('stocks')
    .delete()
    .in('id', deleteIds);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Successfully deleted ${deleteIds.length} duplicate stocks!\n`);

    // Verify
    const { data: remaining } = await supabase
      .from('stocks')
      .select('id, symbol');

    console.log(`📊 Remaining stocks: ${remaining.length}`);
    console.log(`   ID range: ${Math.min(...remaining.map(s => s.id))} to ${Math.max(...remaining.map(s => s.id))}`);
    console.log('\n✅ Fix complete! Historical data should now display correctly.');
  }
}

fix();
