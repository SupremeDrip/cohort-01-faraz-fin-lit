// Stocks list page displaying all Nifty 50 stocks with live prices
// Includes search, filtering, and real-time price updates

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Stock, StockPrice } from '../lib/types';
import { fetchStockPrice } from '../lib/yahooFinance';
import { getInitialStockPrices, updatePricesInBackground } from '../lib/stockPrices';
import { formatCurrency, formatNumber, isMarketOpen } from '../lib/marketUtils';
import { Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

export default function StocksList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(() => {
      setMarketOpen(isMarketOpen());
      if (isMarketOpen()) {
        fetchPrices();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase.from('stocks').select('*').order('symbol');

      if (error) throw error;
      setStocks(data);

      const initialPrices = await getInitialStockPrices(data);
      setStockPrices(initialPrices);

      setLoading(false);

      updatePricesInBackground(data, (symbol, price) => {
        setStockPrices(prev => {
          const updated = new Map(prev);
          updated.set(symbol, price);
          return updated;
        });
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    updatePricesInBackground(stocks, (symbol, price) => {
      setStockPrices(prev => {
        const updated = new Map(prev);
        updated.set(symbol, price);
        return updated;
      });
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nifty 50 Stocks</h1>
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  marketOpen
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {marketOpen ? 'Market Open' : 'Market Closed'}
              </div>
              <p className="text-sm text-gray-500">Prices may be delayed by up to 15 minutes</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Prices</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock) => {
                  const priceData = stockPrices.get(stock.symbol);
                  const price = priceData?.price || 0;
                  const change = priceData?.change || 0;
                  const changePercent = priceData?.changePercent || 0;
                  const isPositive = change >= 0;

                  return (
                    <tr
                      key={stock.id}
                      className={`hover:bg-gray-50 ${
                        isPositive ? 'bg-green-50 bg-opacity-30' : 'bg-red-50 bg-opacity-30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{stock.symbol}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{stock.company_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {price > 0 ? (
                          <span className="font-semibold text-gray-900">{formatCurrency(price)}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Loading...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {price > 0 ? (
                          <div className={`flex items-center justify-end space-x-1 ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {formatCurrency(Math.abs(change))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {price > 0 ? (
                          <span
                            className={`font-semibold ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatNumber(changePercent)}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/stock/${stock.symbol}`}
                          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No stocks found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
