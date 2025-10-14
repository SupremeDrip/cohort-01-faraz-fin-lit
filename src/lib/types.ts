// TypeScript type definitions for FinSim application
// Defines all database models and component prop types

export interface Profile {
  id: string;
  username: string;
  role: 'student' | 'parent';
  parent_code: string | null;
  linked_parent_id: string | null;
  virtual_cash: number;
  created_at: string;
}

export interface Stock {
  id: number;
  symbol: string;
  company_name: string;
  current_price: number;
  last_updated: string;
}

export interface StockHistory {
  stock_id: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Holding {
  user_id: string;
  stock_id: number;
  quantity: number;
  average_buy_price: number;
  stock?: Stock;
}

export interface Transaction {
  id: number;
  user_id: string;
  stock_id: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  total_amount: number;
  timestamp: string;
  stock?: Stock;
}

export interface Post {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Like {
  post_id: number;
  user_id: string;
  created_at: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastUpdated: number;
}
