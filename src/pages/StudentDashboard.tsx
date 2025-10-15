// Enhanced student dashboard with complete portfolio overview
// Displays metrics, holdings table, and recent transactions

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Holding, Stock, Transaction, StockPrice } from '../lib/types';
import { formatCurrency, formatNumber, formatDateTime } from '../lib/marketUtils';
import { fetchMultipleStockPrices } from '../lib/stockPrices';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import BuySellModal from '../components/BuySellModal';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [holdings, setHoldings] = useState<(Holding & { stock: Stock })[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { stock: Stock })[]>([]);
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<{ stock: Stock; holding: Holding | null } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      if (holdings.length > 0) {
        fetchPrices();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: holdingsData, error } = await supabase
        .from('holdings')
        .select('*, stock:stocks(*)')
        .eq('user_id', profile?.id)
        .gt('quantity', 0);

      if (error) throw error;

      const typedHoldings = holdingsData as (Holding & { stock: Stock })[];
      setHoldings(typedHoldings);

      if (typedHoldings.length > 0) {
        const symbols = typedHoldings.map((h) => h.stock.symbol);
        const prices = await fetchMultipleStockPrices(symbols);
        setStockPrices(prices);
      }

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*, stock:stocks(*)')
        .eq('user_id', profile?.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (txError) throw txError;
      setRecentTransactions(txData as (Transaction & { stock: Stock })[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    if (holdings.length > 0) {
      const symbols = holdings.map((h) => h.stock.symbol);
      const prices = await fetchMultipleStockPrices(symbols);
      setStockPrices(prices);
    }
  };

  const calculatePortfolioValue = () => {
    let total = 0;
    holdings.forEach((holding) => {
      const price = stockPrices.get(holding.stock.symbol);
      const currentPrice = price?.price || holding.average_buy_price;
      total += holding.quantity * currentPrice;
    });
    return total;
  };

  const calculateTotalInvested = () => {
    let total = 0;
    holdings.forEach((holding) => {
      total += holding.quantity * holding.average_buy_price;
    });
    return total;
  };

  const portfolioValue = calculatePortfolioValue();
  const totalInvested = calculateTotalInvested();
  const totalValue = (profile?.virtual_cash || 0) + portfolioValue;
  const overallPnL = totalValue - 100000;
  const overallPnLPercent = ((totalValue - 100000) / 100000) * 100;

  const handleSellClick = (holding: Holding & { stock: Stock }) => {
    const price = stockPrices.get(holding.stock.symbol);
    if (price) {
      setSelectedStock({ stock: holding.stock, holding });
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.username}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Portfolio Value</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Assets</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Available Cash</span>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profile?.virtual_cash || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Ready to Invest</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Invested</span>
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</p>
            <p className="text-xs text-gray-500 mt-1">Amount Invested</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Overall P&L</span>
              {overallPnL >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${overallPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallPnL >= 0 ? '+' : ''}{formatCurrency(overallPnL)}
            </p>
            <p className={`text-xs mt-1 ${overallPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallPnL >= 0 ? '+' : ''}{formatNumber(overallPnLPercent)}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Portfolio</h2>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Trading to Build Your Portfolio</h3>
              <p className="text-gray-600 mb-6">Explore Nifty 50 stocks and make your first investment</p>
              <Link
                to="/stocks"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Browse Stocks
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Buy Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invested
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holdings.map((holding) => {
                      const price = stockPrices.get(holding.stock.symbol);
                      const currentPrice = price?.price || holding.average_buy_price;
                      const invested = holding.average_buy_price * holding.quantity;
                      const currentValue = currentPrice * holding.quantity;
                      const pnl = currentValue - invested;
                      const pnlPercent = (pnl / invested) * 100;

                      return (
                        <tr key={holding.stock_id} className={`hover:bg-gray-50 ${pnl >= 0 ? 'bg-green-50 bg-opacity-30' : 'bg-red-50 bg-opacity-30'}`}>
                          <td className="px-6 py-4">
                            <Link to={`/stock/${holding.stock.symbol}`} className="font-medium text-blue-600 hover:text-blue-800">
                              {holding.stock.symbol}
                            </Link>
                            <p className="text-sm text-gray-500">{holding.stock.company_name}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">{holding.quantity}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(holding.average_buy_price)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(currentPrice)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(invested)}</td>
                          <td className="px-6 py-4 text-right font-semibold">{formatCurrency(currentValue)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                              <div className="text-sm">
                                ({pnl >= 0 ? '+' : ''}{formatNumber(pnlPercent)}%)
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Link
                                to={`/stock/${holding.stock.symbol}`}
                                className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleSellClick(holding)}
                                className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                              >
                                Sell
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-6 py-4 font-bold text-gray-900" colSpan={4}>
                        Total
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(totalInvested)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(portfolioValue)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold" colSpan={2}>
                        <span className={portfolioValue - totalInvested >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {portfolioValue - totalInvested >= 0 ? '+' : ''}
                          {formatCurrency(portfolioValue - totalInvested)}
                          <span className="text-sm ml-1">
                            ({portfolioValue - totalInvested >= 0 ? '+' : ''}
                            {formatNumber(totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0)}%)
                          </span>
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {recentTransactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View All
              </Link>
            </div>

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
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(tx.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.type === 'BUY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{tx.stock.symbol}</p>
                        <p className="text-sm text-gray-500">{tx.stock.company_name}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(tx.price_per_share)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${tx.type === 'BUY' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}
                          {formatCurrency(tx.total_amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedStock && (
        <BuySellModal
          type="sell"
          stock={selectedStock.stock}
          currentPrice={stockPrices.get(selectedStock.stock.symbol)?.price || selectedStock.stock.current_price}
          holding={selectedStock.holding}
          onClose={() => setSelectedStock(null)}
          onComplete={() => {
            setSelectedStock(null);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
