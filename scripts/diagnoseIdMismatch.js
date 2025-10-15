// Diagnostic script to find ID mismatch between stocks and stock_history
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnose() {
  console.log('🔍 Diagnosing ID Mismatch...\n');

  // Check stocks table
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, symbol')
    .order('id', { ascending: true });

  if (stocksError) {
    console.error('❌ Error fetching stocks:', stocksError);
    return;
  }

  console.log(`📊 Stocks table has ${stocks.length} records`);
  console.log(`   ID range: ${stocks[0]?.id} to ${stocks[stocks.length - 1]?.id}`);
  console.log(`   Sample: ${stocks.slice(0, 5).map(s => `${s.symbol}(${s.id})`).join(', ')}\n`);

  // Check stock_history for unique stock_ids
  const { data: historyIds, error: historyError } = await supabase
    .from('stock_history')
    .select('stock_id')
    .limit(1000);

  if (historyError) {
    console.error('❌ Error fetching stock_history:', historyError);
    return;
  }

  const uniqueHistoryIds = [...new Set(historyIds.map(h => h.stock_id))].sort((a, b) => a - b);
  console.log(`📊 Stock_history references ${uniqueHistoryIds.length} unique stock IDs`);
  console.log(`   ID range: ${uniqueHistoryIds[0]} to ${uniqueHistoryIds[uniqueHistoryIds.length - 1]}`);
  console.log(`   Sample IDs: ${uniqueHistoryIds.slice(0, 10).join(', ')}\n`);

  // Check for ADANIENT specifically
  const adanientStock = stocks.find(s => s.symbol === 'ADANIENT');
  console.log(`📌 ADANIENT in stocks table: ID = ${adanientStock?.id}`);

  const { count: adanientHistoryCount } = await supabase
    .from('stock_history')
    .select('*', { count: 'exact', head: true })
    .in('stock_id', uniqueHistoryIds.slice(0, 10));

  console.log(`📌 Records in stock_history for stock_ids ${uniqueHistoryIds.slice(0, 10).join(',')}: ${adanientHistoryCount}\n`);

  // Check if there's overlap
  const stockIds = stocks.map(s => s.id);
  const overlap = uniqueHistoryIds.filter(id => stockIds.includes(id));

  console.log(`❗ ID Overlap: ${overlap.length} stock IDs exist in both tables`);
  console.log(`❗ Mismatch: ${uniqueHistoryIds.length - overlap.length} stock_history IDs don't match any stock`);

  if (overlap.length === 0) {
    console.log('\n🚨 CRITICAL: NO OVERLAP - Complete ID mismatch!');
    console.log('   Stock_history was imported with different stock IDs than current stocks table');
  }
}

diagnose();
