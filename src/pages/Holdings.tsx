// Enhanced holdings page with filters and detailed portfolio view
// Shows complete holding information with sorting and filtering capabilities

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Holding, Stock, StockPrice } from '../lib/types';
import { fetchMultipleStockPrices } from '../lib/stockPrices';
import { formatCurrency, formatNumber } from '../lib/marketUtils';
import { TrendingUp, TrendingDown, PieChart, Search, Filter } from 'lucide-react';
import BuySellModal from '../components/BuySellModal';

export default function Holdings() {
  const { profile } = useAuth();
  const [holdings, setHoldings] = useState<(Holding & { stock: Stock })[]>([]);
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'pnl_percent' | 'value' | 'quantity'>('pnl_percent');
  const [selectedStock, setSelectedStock] = useState<{ stock: Stock; holding: Holding } | null>(null);

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*, stock:stocks(*)')
        .eq('user_id', profile?.id)
        .gt('quantity', 0);

      if (error) throw error;

      const typedHoldings = data as (Holding & { stock: Stock })[];
      setHoldings(typedHoldings);

      if (typedHoldings.length > 0) {
        const symbols = typedHoldings.map((h) => h.stock.symbol);
        const prices = await fetchMultipleStockPrices(symbols);
        setStockPrices(prices);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let numStocks = holdings.length;

    holdings.forEach((holding) => {
      totalInvested += holding.average_buy_price * holding.quantity;

      const price = stockPrices.get(holding.stock.symbol);
      const currentPrice = price?.price || holding.average_buy_price;
      totalCurrent += currentPrice * holding.quantity;
    });

    return { totalInvested, totalCurrent, totalPnL: totalCurrent - totalInvested, numStocks };
  };

  const getFilteredAndSortedHoldings = () => {
    let filtered = holdings.filter((holding) => {
      const matchesSearch =
        holding.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holding.stock.company_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const price = stockPrices.get(holding.stock.symbol);
      const currentPrice = price?.price || holding.average_buy_price;
      const pnl = (currentPrice - holding.average_buy_price) * holding.quantity;

      if (filter === 'profitable') return pnl > 0;
      if (filter === 'loss') return pnl < 0;
      return true;
    });

    filtered.sort((a, b) => {
      const priceA = stockPrices.get(a.stock.symbol);
      const priceB = stockPrices.get(b.stock.symbol);
      const currentPriceA = priceA?.price || a.average_buy_price;
      const currentPriceB = priceB?.price || b.average_buy_price;

      if (sortBy === 'pnl_percent') {
        const pnlPercentA = ((currentPriceA - a.average_buy_price) / a.average_buy_price) * 100;
        const pnlPercentB = ((currentPriceB - b.average_buy_price) / b.average_buy_price) * 100;
        return pnlPercentB - pnlPercentA;
      } else if (sortBy === 'value') {
        const valueA = currentPriceA * a.quantity;
        const valueB = currentPriceB * b.quantity;
        return valueB - valueA;
      } else {
        return b.quantity - a.quantity;
      }
    });

    return filtered;
  };

  const filteredHoldings = getFilteredAndSortedHoldings();
  const { totalInvested, totalCurrent, totalPnL, numStocks } = calculateTotals();

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Holdings</h1>
          <p className="text-gray-600">Detailed view of your investment portfolio</p>
        </div>

        {holdings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Holdings Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCurrent)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Number of Stocks Held</p>
              <p className="text-2xl font-bold text-gray-900">{numStocks}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Overall Unrealized P&L</p>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}
                {formatCurrency(totalPnL)}
                <span className="text-base ml-2">
                  ({totalInvested > 0 ? formatNumber((totalPnL / totalInvested) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {holdings.length === 0 ? (
            <div className="p-12 text-center">
              <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You Haven't Invested Yet!</h3>
              <p className="text-gray-600 mb-6">Start by exploring Nifty 50 stocks</p>
              <Link
                to="/stocks"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Browse Stocks
              </Link>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-200 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by symbol or company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                          filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('profitable')}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                          filter === 'profitable'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Profitable
                      </button>
                      <button
                        onClick={() => setFilter('loss')}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                          filter === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Loss
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    >
                      <option value="pnl_percent">P&L %</option>
                      <option value="value">Current Value</option>
                      <option value="quantity">Quantity</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredHoldings.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">No holdings match your filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
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
                      {filteredHoldings.map((holding) => {
                        const price = stockPrices.get(holding.stock.symbol);
                        const currentPrice = price?.price || holding.average_buy_price;
                        const invested = holding.average_buy_price * holding.quantity;
                        const currentValue = currentPrice * holding.quantity;
                        const pnl = currentValue - invested;
                        const pnlPercent = (pnl / invested) * 100;

                        return (
                          <tr key={holding.stock_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">{holding.stock.symbol}</p>
                                <p className="text-sm text-gray-500">{holding.stock.company_name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">{holding.quantity}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(holding.average_buy_price)}</td>
                            <td className="px-6 py-4 text-right font-medium">{formatCurrency(currentPrice)}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(invested)}</td>
                            <td className="px-6 py-4 text-right font-semibold">{formatCurrency(currentValue)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className={`flex items-center justify-end space-x-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {pnl >= 0 ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                                <div className="font-semibold">
                                  {pnl >= 0 ? '+' : ''}
                                  {formatCurrency(pnl)}
                                  <div className="text-sm">
                                    ({pnl >= 0 ? '+' : ''}
                                    {formatNumber(pnlPercent)}%)
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Link
                                  to={`/stock/${holding.stock.symbol}`}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                  View Stock
                                </Link>
                                <button
                                  onClick={() => setSelectedStock({ stock: holding.stock, holding })}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                                >
                                  Sell
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
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
            fetchHoldings();
          }}
        />
      )}
    </div>
  );
}
