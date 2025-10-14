// Transactions history page
// Displays complete trading history with filters

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Transaction, Stock } from '../lib/types';
import { formatCurrency, formatDateTime } from '../lib/marketUtils';
import { Filter, TrendingUp, TrendingDown, History } from 'lucide-react';

export default function Transactions() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<(Transaction & { stock: Stock })[]>([]);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, stock:stocks(*)')
        .eq('user_id', profile?.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const typedTransactions = data as (Transaction & { stock: Stock })[];
      setTransactions(typedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View all your trading activity</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by type:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('BUY')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'BUY'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setFilter('SELL')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No Transactions Yet' : `No ${filter} Transactions`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Start trading to see your transaction history'
                  : `You haven't made any ${filter.toLowerCase()} transactions yet`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Per Share
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(tx.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            tx.type === 'BUY'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.type === 'BUY' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{tx.stock.symbol}</p>
                          <p className="text-sm text-gray-500">{tx.stock.company_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(tx.price_per_share)}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            tx.type === 'BUY' ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {tx.type === 'BUY' ? '-' : '+'}
                          {formatCurrency(tx.total_amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
