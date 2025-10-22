/*
  # FinSim Paper Trading Simulator - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for FinSim, a paper trading simulator
  for Indian teenagers to learn stock market investing with virtual currency.

  ## Tables Created

  1. **profiles** - User profiles with role-based access (student/parent)
     - id: UUID primary key linked to auth.users
     - username: Unique username (max 50 chars)
     - role: Either 'student' or 'parent'
     - parent_code: Unique 8-character code for students to share with parents
     - linked_parent_id: Foreign key to parent's profile (for students)
     - virtual_cash: Trading balance (default ₹100,000 for students)
     - created_at: Account creation timestamp

  2. **stocks** - Nifty 50 stock information
     - id: Serial primary key
     - symbol: Unique stock symbol (e.g., 'RELIANCE')
     - company_name: Full company name
     - current_price: Latest market price
     - last_updated: Last price update timestamp

  3. **stock_history** - Historical price data for charts and analysis
     - stock_id: Foreign key to stocks
     - date: Trading date
     - prev_close: Previous day's closing price
     - open, high, low, close: Daily OHLC data
     - last: Last traded price
     - vwap: Volume Weighted Average Price
     - volume: Total trading volume
     - turnover: Total turnover value
     - trades: Number of trades executed
     - deliverable_volume: Volume of deliverable shares (nullable)
     - deliverable_percent: Percentage of deliverable volume (nullable)
     - Composite primary key (stock_id, date)

  4. **holdings** - User's current stock portfolio
     - user_id: Foreign key to profiles
     - stock_id: Foreign key to stocks
     - quantity: Number of shares owned
     - average_buy_price: Weighted average purchase price
     - Composite primary key (user_id, stock_id)

  5. **transactions** - Complete trading history
     - id: Serial primary key
     - user_id: Foreign key to profiles
     - stock_id: Foreign key to stocks
     - type: 'BUY' or 'SELL'
     - quantity: Number of shares traded
     - price_per_share: Execution price
     - total_amount: Total transaction value
     - timestamp: Transaction time

  6. **posts** - Social feed posts
     - id: Serial primary key
     - user_id: Foreign key to profiles (post author)
     - content: Post text content
     - created_at: Post creation timestamp

  7. **comments** - Comments on posts
     - id: Serial primary key
     - post_id: Foreign key to posts (cascades on delete)
     - user_id: Foreign key to profiles (commenter)
     - content: Comment text
     - created_at: Comment timestamp

  8. **likes** - Post likes/reactions
     - post_id: Foreign key to posts (cascades on delete)
     - user_id: Foreign key to profiles
     - created_at: Like timestamp
     - Composite primary key (post_id, user_id)

  ## Security - Row Level Security (RLS)

  ### RLS ENABLED on:
  - profiles: Students can only access their own data, parents can view linked child's profile
  - holdings: Students manage own holdings, parents can view child's holdings
  - transactions: Students view own transactions, parents can view child's transactions
  - posts, comments, likes: All authenticated students can view, users manage own content

  ### RLS DISABLED on:
  - stocks: Open for data import and updates via import script
  - stock_history: Open for data import via CSV import script

  Note: After historical data import is complete, RLS can be re-enabled on stocks and
  stock_history tables with appropriate read-only policies for authenticated users.

  ## Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Composite indexes for optimized queries (role, parent_code, timestamp, date)

  ## Import Process
  After this migration runs successfully:
  1. Run: node scripts/importHistoricalData.js
  2. Script will populate stocks table with Nifty 50 stocks
  3. Script will import ~230,000 rows of historical data from CSV files
  4. After import, consider re-enabling RLS on stocks/stock_history tables
*/

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username varchar(50) UNIQUE NOT NULL,
  role varchar(10) NOT NULL CHECK (role IN ('student', 'parent')),
  parent_code varchar(8) UNIQUE,
  linked_parent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  virtual_cash numeric(12,2) DEFAULT 100000.00,
  created_at timestamptz DEFAULT now()
);

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id serial PRIMARY KEY,
  symbol varchar(20) UNIQUE NOT NULL,
  company_name varchar(100) NOT NULL,
  current_price numeric(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create stock_history table with comprehensive NSE data fields
CREATE TABLE IF NOT EXISTS stock_history (
  stock_id integer REFERENCES stocks(id) ON DELETE CASCADE,
  date date NOT NULL,
  prev_close numeric(12,2),
  open numeric(10,2) NOT NULL,
  high numeric(10,2) NOT NULL,
  low numeric(10,2) NOT NULL,
  last numeric(12,2),
  close numeric(10,2) NOT NULL,
  vwap numeric(12,2),
  volume bigint DEFAULT 0,
  turnover numeric(20,2) DEFAULT 0,
  trades integer DEFAULT 0,
  deliverable_volume bigint,
  deliverable_percent numeric(5,2),
  PRIMARY KEY (stock_id, date)
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stock_id integer REFERENCES stocks(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  average_buy_price numeric(12,4),
  PRIMARY KEY (user_id, stock_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stock_id integer REFERENCES stocks(id) ON DELETE CASCADE,
  type varchar(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_share numeric(10,2) NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  post_id integer REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  post_id integer REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_code ON profiles(parent_code);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_parent ON profiles(linked_parent_id);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ============================================================================

-- Enable RLS on user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Disable RLS on stock data tables (for CSV import process)
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PROFILES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can view linked child profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    linked_parent_id = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES FOR HOLDINGS
-- ============================================================================

CREATE POLICY "Users can view own holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own holdings"
  ON holdings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own holdings"
  ON holdings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own holdings"
  ON holdings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view child holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = holdings.user_id
      AND profiles.linked_parent_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR TRANSACTIONS
-- ============================================================================

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Parents can view child transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = transactions.user_id
      AND profiles.linked_parent_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR SOCIAL FEATURES (POSTS, COMMENTS, LIKES)
-- ============================================================================

-- Posts policies
CREATE POLICY "Authenticated users can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Likes policies
CREATE POLICY "Authenticated users can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control (student/parent)';
COMMENT ON TABLE stocks IS 'Nifty 50 stock information - RLS DISABLED for data import';
COMMENT ON TABLE stock_history IS 'Historical NSE trading data - RLS DISABLED for CSV import';
COMMENT ON TABLE holdings IS 'User stock portfolio holdings with RLS enabled';
COMMENT ON TABLE transactions IS 'Complete trading transaction history with RLS enabled';
COMMENT ON TABLE posts IS 'Social feed posts for student community';
COMMENT ON TABLE comments IS 'Comments on social feed posts';
COMMENT ON TABLE likes IS 'User likes on social feed posts';