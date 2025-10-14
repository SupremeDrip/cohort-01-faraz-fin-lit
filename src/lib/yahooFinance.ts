// Yahoo Finance API integration
// Fetches live stock prices from Yahoo Finance API with caching
// Mock Data


import { StockPrice } from './types';

const priceCache = new Map<string, { data: StockPrice; timestamp: number }>();
const CACHE_DURATION = 30000;

// Mock prices for testing (replace with real API later)
const MOCK_PRICES: Record<string, number> = {
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
  'M&M': 1876.40,
  'TECHM': 1234.50,
  'BAJAJFINSV': 1567.80,
  'DRREDDY': 5678.40,
  'DIVISLAB': 3456.20,
  'CIPLA': 1234.50,
  'EICHERMOT': 4567.30,
  'HEROMOTOCO': 4321.50,
  'GRASIM': 2345.60,
  'BRITANNIA': 4876.50,
  'SBILIFE': 1456.30,
  'SHRIRAMFIN': 2345.60,
  'APOLLOHOSP': 5678.40,
  'BAJAJ-AUTO': 8765.30,
  'HINDALCO': 567.40,
  'ADANIENT': 2345.60,
  'TATACONSUM': 1045.30,
  'BPCL': 567.80,
  'HDFCLIFE': 678.90,
  'LTIM': 5432.10,
};

export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Use mock data for now
    const basePrice = MOCK_PRICES[symbol] || 1000;
    
    // Add random variation (-2% to +2%) to simulate live prices
    const variation = (Math.random() - 0.5) * 0.04; // -2% to +2%
    const price = basePrice * (1 + variation);
    const previousClose = basePrice;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    const stockPrice: StockPrice = {
      symbol,
      price: parseFloat(price.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: Date.now(),
    };

    priceCache.set(symbol, { data: stockPrice, timestamp: Date.now() });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return stockPrice;
    
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
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