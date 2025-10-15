// Quick diagnostic script to check database state
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database state...\n');

  // Check stocks table
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, symbol, company_name')
    .limit(5);

  if (stocksError) {
    console.error('❌ Error fetching stocks:', stocksError);
  } else {
    console.log(`✅ Stocks table: ${stocks.length} stocks found`);
    console.log('Sample stocks:', stocks);
  }

  // Check stock_history table
  const { count, error: countError } = await supabase
    .from('stock_history')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting stock_history:', countError);
  } else {
    console.log(`\n✅ Stock History table: ${count} records found`);
  }

  // Check RELIANCE specifically
  const { data: relianceStock } = await supabase
    .from('stocks')
    .select('id, symbol')
    .eq('symbol', 'RELIANCE')
    .single();

  if (relianceStock) {
    console.log(`\n📊 RELIANCE stock found with ID: ${relianceStock.id}`);

    const { data: relianceHistory, error: historyError } = await supabase
      .from('stock_history')
      .select('date, close')
      .eq('stock_id', relianceStock.id)
      .order('date', { ascending: false })
      .limit(3);

    if (historyError) {
      console.error('❌ Error fetching RELIANCE history:', historyError);
    } else {
      console.log(`✅ RELIANCE has ${relianceHistory?.length || 0} history records`);
      console.log('Latest 3 records:', relianceHistory);
    }
  } else {
    console.log('\n❌ RELIANCE stock not found in database');
  }
}

checkDatabase();
