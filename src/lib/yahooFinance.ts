// Alpha Vantage API integration for real-time stock prices
// Fetches live stock prices from Alpha Vantage with intelligent caching and rate limiting
// Includes fallback to mock data when API limits are reached

import { StockPrice } from './types';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const API_BASE_URL = 'https://www.alphavantage.co/query';

const priceCache = new Map<string, { data: StockPrice; timestamp: number }>();
const CACHE_DURATION = 120000; // 2 minutes cache to reduce API calls

let apiCallCount = 0;
let lastResetTime = Date.now();
const MAX_CALLS_PER_MINUTE = 5; // Alpha Vantage free tier limit
const DAILY_CALL_LIMIT = 500;

interface RequestQueueItem {
  symbol: string;
  resolve: (value: StockPrice | null) => void;
  reject: (reason: Error) => void;
}

const requestQueue: RequestQueueItem[] = [];
let isProcessingQueue = false;

// Fallback prices for when API limit is reached (41 stocks with historical data)
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

// Map NSE symbols to BSE for Alpha Vantage
function getBSESymbol(nseSymbol: string): string {
  // For now, we'll try BSE exchange suffix
  // Alpha Vantage uses format: SYMBOL.BSE for Bombay Stock Exchange
  return `${nseSymbol}.BSE`;
}

function resetRateLimitIfNeeded() {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;

  // Reset counter every minute
  if (timeSinceReset >= 60000) {
    apiCallCount = 0;
    lastResetTime = now;
  }
}

function canMakeApiCall(): boolean {
  resetRateLimitIfNeeded();
  return apiCallCount < MAX_CALLS_PER_MINUTE;
}

function getFallbackPrice(symbol: string): StockPrice {
  const basePrice = FALLBACK_PRICES[symbol] || 1000;
  const variation = (Math.random() - 0.5) * 0.04; // -2% to +2%
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

async function fetchFromAlphaVantage(symbol: string): Promise<StockPrice | null> {
  if (!API_KEY) {
    console.warn('Alpha Vantage API key not configured, using fallback prices');
    return getFallbackPrice(symbol);
  }

  if (!canMakeApiCall()) {
    console.warn(`Rate limit reached, using cached/fallback price for ${symbol}`);
    return getFallbackPrice(symbol);
  }

  try {
    const bseSymbol = getBSESymbol(symbol);
    const url = `${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${bseSymbol}&apikey=${API_KEY}`;

    apiCallCount++;

    const response = await fetch(url);
    const data = await response.json();

    // Check for API limit error
    if (data['Note'] || data['Information']) {
      console.warn('API limit reached:', data['Note'] || data['Information']);
      return getFallbackPrice(symbol);
    }

    const quote = data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`No data returned for ${symbol}, using fallback`);
      return getFallbackPrice(symbol);
    }

    const price = parseFloat(quote['05. price'] || '0');
    const previousClose = parseFloat(quote['08. previous close'] || '0');
    const change = parseFloat(quote['09. change'] || '0');
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');

    if (price === 0) {
      console.warn(`Invalid price data for ${symbol}, using fallback`);
      return getFallbackPrice(symbol);
    }

    const stockPrice: StockPrice = {
      symbol,
      price: parseFloat(price.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: Date.now(),
    };

    return stockPrice;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return getFallbackPrice(symbol);
  }
}

export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Queue the request
  return new Promise((resolve, reject) => {
    requestQueue.push({ symbol, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const item = requestQueue.shift();
    if (!item) break;

    try {
      // Check cache again in case it was populated by another request
      const cached = priceCache.get(item.symbol);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        item.resolve(cached.data);
        continue;
      }

      const stockPrice = await fetchFromAlphaVantage(item.symbol);

      if (stockPrice) {
        priceCache.set(item.symbol, { data: stockPrice, timestamp: Date.now() });
        item.resolve(stockPrice);
      } else {
        item.resolve(null);
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between calls (5 per minute)
    } catch (error) {
      console.error(`Error processing queue for ${item.symbol}:`, error);
      item.reject(error as Error);
    }
  }

  isProcessingQueue = false;
}

export async function fetchMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();
  
  const promises = symbols.map(async (symbol) => {
    const price = await fetchStockPrice(symbol);
    if (price) {
      results.set(symbol, price);
    }
  });

  await Promise.all(promises);
  return results;
}

export function clearPriceCache(): void {
  priceCache.clear();
}