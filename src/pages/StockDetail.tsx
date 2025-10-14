// Stock detail page with price chart and trading functionality
// Shows historical data and provides buy/sell interfaces

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Stock, StockHistory, Holding } from '../lib/types';
import { fetchStockPrice, StockPrice } from '../lib/yahooFinance';
import { formatCurrency, formatNumber, formatDate, isMarketOpen, getNextMarketOpenTime } from '../lib/marketUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import BuySellModal from '../components/BuySellModal';

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stock, setStock] = useState<Stock | null>(null);
  const [priceData, setPriceData] = useState<StockPrice | null>(null);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [timeRange, setTimeRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());
  const [modalType, setModalType] = useState<'buy' | 'sell' | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }

    const interval = setInterval(() => {
      setMarketOpen(isMarketOpen());
      if (isMarketOpen() && symbol) {
        fetchLivePrice();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .maybeSingle();

      if (stockError) throw stockError;
      if (!stockData) {
        navigate('/stocks');
        return;
      }

      setStock(stockData);

      const price = await fetchStockPrice(symbol!);
      setPriceData(price);

      const { data: holdingData } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('stock_id', stockData.id)
        .maybeSingle();

      setHolding(holdingData);

      const { data: historyData } = await supabase
        .from('stock_history')
        .select('*')
        .eq('stock_id', stockData.id)
        .order('date', { ascending: true })
        .limit(365);

      setHistory(historyData || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrice = async () => {
    if (symbol) {
      const price = await fetchStockPrice(symbol);
      setPriceData(price);
    }
  };

  const getFilteredHistory = () => {
    if (history.length === 0) return [];

    const now = new Date();
    let daysBack = 30;

    switch (timeRange) {
      case '3M':
        daysBack = 90;
        break;
      case '6M':
        daysBack = 180;
        break;
      case '1Y':
        daysBack = 365;
        break;
      case 'ALL':
        return history;
    }

    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return history.filter((h) => new Date(h.date) >= cutoffDate);
  };

  const handleTradeComplete = () => {
    setModalType(null);
    fetchStockData();
  };

  const getAIInsight = (companyName: string, symbol: string) => {
    const insights: Record<string, string> = {
      'RELIANCE': 'Reliance Industries is India\'s largest conglomerate, operating in energy, petrochemicals, retail, and telecommunications. **For Beginners:** This is considered a relatively stable blue-chip stock due to its diversified business model. The company\'s Jio telecom division and retail expansion have been key growth drivers. However, like all stocks, it experiences price fluctuations based on oil prices, market conditions, and business performance.',
      'TCS': 'Tata Consultancy Services is one of the world\'s largest IT services companies, providing technology solutions globally. **For Beginners:** IT services stocks are generally considered good for long-term investment due to steady demand for technology. TCS has a strong track record of consistent revenue growth and dividend payments. The company benefits from digital transformation trends worldwide.',
      'HDFCBANK': 'HDFC Bank is one of India\'s premier private sector banks, known for strong fundamentals and customer service. **For Beginners:** Banking stocks can be volatile but HDFC Bank is known for prudent lending practices and stable growth. It\'s popular among long-term investors. Interest rate changes and economic conditions significantly impact banking stocks.',
      'INFY': 'Infosys is a global IT consulting and services company, competing with TCS in the technology sector. **For Beginners:** Similar to TCS, Infosys benefits from digital transformation and global IT spending. The company has strong corporate governance and consistent performance. Currency fluctuations (especially USD/INR) can affect its revenues as most income comes from overseas.',
      'DEFAULT': `${companyName} is part of the Nifty 50, which includes India\'s top 50 companies by market value. These are well-established businesses with proven track records.\n\n**For Beginners:** Before investing, research what the company does, check recent news, and understand their main products or services. Diversifying across different sectors is a smart strategy.\n\n**Remember:** Stock prices go up and down. Never invest money you can\'t afford to lose, and always do your own research before making decisions.`
    };

    return insights[symbol] || insights['DEFAULT'];
  };

  const handleGetInsight = () => {
    if (!stock) return;

    setInsightLoading(true);
    setTimeout(() => {
      setShowInsight(true);
      setInsightLoading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stock) {
    return null;
  }

  const currentPrice = priceData?.price || stock.current_price || 0;
  const change = priceData?.change || 0;
  const changePercent = priceData?.changePercent || 0;
  const isPositive = change >= 0;

  const chartData = getFilteredHistory().map((h) => ({
    date: formatDate(h.date),
    price: h.close,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/stocks')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Stocks</span>
        </button>

        {!marketOpen && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Market is currently closed</p>
              <p className="text-sm text-amber-700">
                Trading will resume on {getNextMarketOpenTime()} at 9:15 AM IST
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{stock.company_name}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                  {stock.symbol}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-gray-900">
                  {currentPrice > 0 ? formatCurrency(currentPrice) : 'Loading...'}
                </span>
                {currentPrice > 0 && (
                  <div className={`flex items-center space-x-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    <div className="text-xl font-semibold">
                      {isPositive ? '+' : ''}
                      {formatCurrency(Math.abs(change))} ({isPositive ? '+' : ''}
                      {formatNumber(changePercent)}%)
                    </div>
                  </div>
                )}
              </div>
              {priceData && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {Math.floor((Date.now() - priceData.lastUpdated) / 1000)} seconds ago
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setModalType('buy')}
                disabled={!marketOpen}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                BUY
              </button>
              <button
                onClick={() => setModalType('sell')}
                disabled={!marketOpen || !holding || holding.quantity === 0}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SELL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Cash</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(profile?.virtual_cash || 0)}
              </p>
            </div>
            {holding && holding.quantity > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">You Own</p>
                <p className="text-xl font-semibold text-gray-900">
                  {holding.quantity} shares at avg {formatCurrency(holding.average_buy_price)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">Price History</h2>
            <div className="flex space-x-2">
              {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              No historical data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI-Powered Analysis</h2>
              <p className="text-sm text-gray-600">Beginner-friendly insights to help you learn</p>
            </div>
          </div>

          {!showInsight ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Get educational insights about this stock</p>
              <button
                onClick={handleGetInsight}
                disabled={insightLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {insightLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>AI is thinking...</span>
                  </span>
                ) : (
                  'Get AI Recommendation'
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">Educational Insight</span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {getAIInsight(stock.company_name, stock.symbol)}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-amber-800">
                  This is educational content, not financial advice. Always do your own research before making investment decisions.
                </p>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowInsight(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Hide Insight
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalType && stock && priceData && (
        <BuySellModal
          type={modalType}
          stock={stock}
          currentPrice={priceData.price}
          holding={holding}
          onClose={() => setModalType(null)}
          onComplete={handleTradeComplete}
        />
      )}
    </div>
  );
}
