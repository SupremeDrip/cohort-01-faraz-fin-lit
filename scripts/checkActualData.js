// Actually check what's in the database - no assumptions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkActualData() {
  console.log('🔍 CHECKING ACTUAL DATABASE DATA\n');
  console.log('='.repeat(60));

  // 1. Check stocks table - get actual IDs
  console.log('\n1️⃣ STOCKS TABLE:');
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, symbol')
    .order('id', { ascending: true });

  if (stocksError) {
    console.error('Error:', stocksError);
    return;
  }

  console.log(`   Total stocks: ${stocks.length}`);
  console.log(`   ID Range: ${stocks[0]?.id} to ${stocks[stocks.length - 1]?.id}`);
  console.log(`   First 10 stocks:`);
  stocks.slice(0, 10).forEach(s => {
    console.log(`      ID ${s.id}: ${s.symbol}`);
  });

  // Check ADANIENT specifically
  const adanient = stocks.find(s => s.symbol === 'ADANIENT');
  console.log(`\n   ADANIENT Stock ID: ${adanient?.id}`);

  // 2. Check stock_history table - get actual stock_ids being referenced
  console.log('\n2️⃣ STOCK_HISTORY TABLE:');

  const { count } = await supabase
    .from('stock_history')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total records: ${count}`);

  // Get a sample to see what stock_ids are actually in there
  const { data: historySample } = await supabase
    .from('stock_history')
    .select('stock_id, date')
    .order('stock_id', { ascending: true })
    .limit(100);

  const uniqueStockIds = [...new Set(historySample.map(h => h.stock_id))];
  console.log(`   Stock IDs found (sample of 100 records): ${uniqueStockIds.join(', ')}`);

  // 3. Check for ADANIENT history with the ID from stocks table
  console.log(`\n3️⃣ CHECKING ADANIENT HISTORY (using stock_id ${adanient?.id}):`);

  const { data: adanientHistory, error: histError } = await supabase
    .from('stock_history')
    .select('date, close')
    .eq('stock_id', adanient?.id)
    .order('date', { ascending: false })
    .limit(5);

  if (histError) {
    console.error('   Error:', histError);
  } else {
    console.log(`   Records found: ${adanientHistory.length}`);
    if (adanientHistory.length > 0) {
      console.log(`   Latest entries:`);
      adanientHistory.forEach(h => {
        console.log(`      ${h.date}: ₹${h.close}`);
      });
    } else {
      console.log('   ❌ NO RECORDS FOUND');
    }
  }

  // 4. Try to find what stock_id DOES have data
  console.log('\n4️⃣ CHECKING WHAT DATA EXISTS:');

  // Pick the first stock_id from history
  const firstHistoryStockId = uniqueStockIds[0];
  console.log(`   Checking stock_id ${firstHistoryStockId} from history...`);

  const { data: sampleData } = await supabase
    .from('stock_history')
    .select('date, close')
    .eq('stock_id', firstHistoryStockId)
    .order('date', { ascending: false })
    .limit(5);

  console.log(`   Records found: ${sampleData.length}`);
  if (sampleData.length > 0) {
    console.log(`   Sample data:`);
    sampleData.forEach(h => {
      console.log(`      ${h.date}: ₹${h.close}`);
    });
  }

  // 5. What stock does this ID belong to?
  const stockMatch = stocks.find(s => s.id === firstHistoryStockId);
  console.log(`   Stock_id ${firstHistoryStockId} in stocks table: ${stockMatch ? stockMatch.symbol : 'NOT FOUND'}`);

  // 6. The problem
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DIAGNOSIS:');
  console.log('='.repeat(60));

  const stockIds = stocks.map(s => s.id);
  const historyHasTheseStockIds = uniqueStockIds.every(id => stockIds.includes(id));

  if (historyHasTheseStockIds) {
    console.log('✅ Stock IDs MATCH - History references valid stock IDs');
    console.log('   Problem might be elsewhere (query logic, date range, etc.)');
  } else {
    console.log('❌ MISMATCH CONFIRMED');
    console.log(`   Stocks table has IDs: ${stocks[0]?.id}-${stocks[stocks.length - 1]?.id}`);
    console.log(`   History references IDs: ${Math.min(...uniqueStockIds)}-${Math.max(...uniqueStockIds)}`);
    const missing = uniqueStockIds.filter(id => !stockIds.includes(id));
    console.log(`   Missing stock IDs: ${missing.slice(0, 10).join(', ')}...`);
  }
}

checkActualData();
