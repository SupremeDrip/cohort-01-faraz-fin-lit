// Stock price utilities for fetching historical and current prices
// Uses historical data for initial load, then fetches live prices from Alpha Vantage

import { supabase } from './supabase';
import { StockPrice } from './types';
import { fetchStockPrice, fetchMultipleStockPrices as fetchMultipleFromAPI } from './yahooFinance';

const FALLBACK_PRICES: Record<string, number> = {
  'RELIANCE': 2456.50,
  'TCS': 3678.25,
  'HDFCBANK': 1632.75,
  'INFY': 1456.80,
  'ICICIBANK': 945.30,
  'HINDUNILVR': 2587.60,
  'ITC': 456.75,
  'SBIN': 612.40,
  'BHARTIARTL': 1234.80,
  'KOTAKBANK': 1789.50,
  'LT': 3456.20,
  'AXISBANK': 1045.60,
  'ASIANPAINT': 3201.40,
  'MARUTI': 11234.50,
  'SUNPHARMA': 1456.30,
  'TITAN': 3456.70,
  'ULTRACEMCO': 9876.40,
  'BAJFINANCE': 6543.20,
  'NESTLEIND': 23456.80,
  'HCLTECH': 1234.50,
  'WIPRO': 456.80,
  'POWERGRID': 234.60,
  'NTPC': 345.20,
  'ONGC': 234.50,
  'COALINDIA': 345.60,
  'TATAMOTORS': 876.40,
  'TATASTEEL': 134.50,
  'JSWSTEEL': 876.30,
  'INDUSINDBK': 1345.60,
  'ADANIPORTS': 1234.50,
  'TECHM': 1234.50,
  'BAJAJFINSV': 1567.80,
  'DRREDDY': 5678.40,
  'CIPLA': 1234.50,
  'EICHERMOT': 4567.30,
  'HEROMOTOCO': 4321.50,
  'GRASIM': 2345.60,
  'BRITANNIA': 4876.50,
  'BAJAJ-AUTO': 8765.30,
  'HINDALCO': 567.40,
  'BPCL': 567.80,
};

export async function getLatestHistoricalPrice(stockId: number, symbol: string): Promise<StockPrice | null> {
  try {
    const { data, error } = await supabase
      .from('stock_history')
      .select('date, close, open, high, low')
      .eq('stock_id', stockId)
      .order('date', { ascending: false })
      .limit(2);

    if (error) {
      console.error(`Error fetching historical price for ${symbol}:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const latest = data[0];
    const previous = data.length > 1 ? data[1] : latest;

    const price = latest.close;
    const previousClose = previous.close;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error(`Error in getLatestHistoricalPrice for ${symbol}:`, error);
    return null;
  }
}

export function getFallbackPrice(symbol: string): StockPrice {
  const basePrice = FALLBACK_PRICES[symbol] || 1000;
  const variation = (Math.random() - 0.5) * 0.02;
  const price = basePrice * (1 + variation);
  const previousClose = basePrice;
  const change = price - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    previousClose: parseFloat(previousClose.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    lastUpdated: Date.now(),
  };
}

export async function getInitialStockPrices(stocks: Array<{ id: number; symbol: string }>): Promise<Map<string, StockPrice>> {
  const priceMap = new Map<string, StockPrice>();

  const pricePromises = stocks.map(async (stock) => {
    let price = await getLatestHistoricalPrice(stock.id, stock.symbol);

    if (!price) {
      price = getFallbackPrice(stock.symbol);
    }

    priceMap.set(stock.symbol, price);
  });

  await Promise.all(pricePromises);
  return priceMap;
}

export async function updatePricesInBackground(
  stocks: Array<{ id: number; symbol: string }>,
  onPriceUpdate: (symbol: string, price: StockPrice) => void
): Promise<void> {
  // Fetch live prices from Alpha Vantage in the background
  const symbols = stocks.map(s => s.symbol);

  for (const symbol of symbols) {
    try {
      const price = await fetchStockPrice(symbol);
      if (price) {
        onPriceUpdate(symbol, price);
      }
    } catch (error) {
      console.error(`Error fetching live price for ${symbol}:`, error);
    }
  }
}

export async function fetchMultipleStockPrices(symbolsOrStocks: string[] | Array<{ id: number; symbol: string }>): Promise<Map<string, StockPrice>> {
  // Handle both symbol arrays and stock objects
  const stocks = Array.isArray(symbolsOrStocks) && typeof symbolsOrStocks[0] === 'string'
    ? (symbolsOrStocks as string[]).map(symbol => ({ symbol, id: 0 }))
    : symbolsOrStocks as Array<{ id: number; symbol: string }>;

  const symbols = stocks.map(s => s.symbol);

  // Try to fetch from Alpha Vantage API first
  try {
    const prices = await fetchMultipleFromAPI(symbols);
    return prices;
  } catch (error) {
    console.error('Error fetching from API, using database/fallback:', error);

    // Fallback to database historical prices
    const priceMap = new Map<string, StockPrice>();
    for (const stock of stocks) {
      if (stock.id) {
        const price = await getLatestHistoricalPrice(stock.id, stock.symbol) || getFallbackPrice(stock.symbol);
        priceMap.set(stock.symbol, price);
      } else {
        priceMap.set(stock.symbol, getFallbackPrice(stock.symbol));
      }
    }
    return priceMap;
  }
}
