// Parent dashboard to monitor child's portfolio
// Provides read-only view of child's trading activity and performance

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile, Holding, Transaction, Stock } from '../lib/types';
import { fetchMultipleStockPrices, StockPrice } from '../lib/yahooFinance';
import { formatCurrency, formatDateTime } from '../lib/marketUtils';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Users } from 'lucide-react';

export default function ParentDashboard() {
  const { profile } = useAuth();
  const [childProfile, setChildProfile] = useState<Profile | null>(null);
  const [holdings, setHoldings] = useState<(Holding & { stock: Stock })[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { stock: Stock })[]>([]);
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildData();
  }, []);

  const fetchChildData = async () => {
    setLoading(true);
    try {
      const { data: child, error: childError } = await supabase
        .from('profiles')
        .select('*')
        .eq('linked_parent_id', profile?.id)
        .maybeSingle();

      if (childError) throw childError;

      if (!child) {
        setLoading(false);
        return;
      }

      setChildProfile(child);

      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select('*, stock:stocks(*)')
        .eq('user_id', child.id)
        .gt('quantity', 0);

      if (holdingsError) throw holdingsError;

      const typedHoldings = holdingsData as (Holding & { stock: Stock })[];
      setHoldings(typedHoldings);

      if (typedHoldings.length > 0) {
        const symbols = typedHoldings.map((h) => h.stock.symbol);
        const prices = await fetchMultipleStockPrices(symbols);
        setStockPrices(prices);
      }

      const { data: transactionsData, error: txError } = await supabase
        .from('transactions')
        .select('*, stock:stocks(*)')
        .eq('user_id', child.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (txError) throw txError;

      setRecentTransactions(transactionsData as (Transaction & { stock: Stock })[]);
    } catch (error) {
      console.error('Error fetching child data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!childProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Linked Child Account</h2>
          <p className="text-gray-600">Ask your child to share their parent code with you</p>
        </div>
      </div>
    );
  }

  const calculatePortfolioValue = () => {
    let total = 0;
    holdings.forEach((holding) => {
      const price = stockPrices.get(holding.stock.symbol);
      if (price) {
        total += holding.quantity * price.price;
      } else {
        total += holding.quantity * holding.average_buy_price;
      }
    });
    return total;
  };

  const calculateTotalPnL = () => {
    let totalPnL = 0;
    holdings.forEach((holding) => {
      const price = stockPrices.get(holding.stock.symbol);
      if (price) {
        const pnl = (price.price - holding.average_buy_price) * holding.quantity;
        totalPnL += pnl;
      }
    });
    return totalPnL;
  };

  const portfolioValue = calculatePortfolioValue();
  const totalPnL = calculateTotalPnL();
  const totalValue = childProfile.virtual_cash + portfolioValue;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {childProfile.username}'s Portfolio
          </h1>
          <p className="text-gray-600">Monitor your child's trading activity and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Available Cash</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(childProfile.virtual_cash)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioValue)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Value</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total P&L</span>
              {totalPnL >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Current Holdings</h2>
            </div>

            {holdings.length === 0 ? (
              <div className="p-12 text-center">
                <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No holdings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {holdings.map((holding) => {
                      const price = stockPrices.get(holding.stock.symbol);
                      const currentPrice = price?.price || holding.average_buy_price;
                      const value = currentPrice * holding.quantity;

                      return (
                        <tr key={holding.stock_id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{holding.stock.symbol}</p>
                            <p className="text-xs text-gray-500">{holding.stock.company_name}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{holding.quantity}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                              tx.type === 'BUY'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-sm">{tx.stock.symbol}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(tx.timestamp)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
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
    </div>
  );
}
