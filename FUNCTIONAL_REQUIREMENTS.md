# FinSim - Functional Requirements Document

## Document Information

**Project Name**: FinSim - Paper Trading Simulator
**Target Audience**: Indian teenagers (students) and their parents
**Platform**: Web Application
**Document Version**: 1.0
**Last Updated**: October 2025

## 1. Executive Summary

FinSim is a comprehensive paper trading platform designed to provide Indian teenagers with hands-on experience in stock market investing using virtual currency. The platform simulates real-world trading with Nifty 50 stocks, enabling students to learn investment strategies risk-free while parents monitor their child's learning progress.

## 2. Product Overview

### 2.1 Vision
To create a safe, educational environment where teenagers can learn stock market fundamentals through practical experience without financial risk.

### 2.2 Target Users
- **Primary Users**: Students (teenagers aged 13-19)
- **Secondary Users**: Parents/guardians monitoring student activity

### 2.3 Core Value Propositions
- Risk-free learning with virtual currency (₹100,000 initial balance)
- Real-time market data from Nifty 50 stocks
- Parent monitoring capabilities for supervision
- Social learning through community features
- Educational AI-powered insights

## 3. User Roles and Permissions

### 3.1 Student Role
**Capabilities**:
- Create and manage personal trading account
- Execute buy/sell transactions
- View and manage portfolio
- Access transaction history
- View real-time stock data and charts
- Participate in social feed (post, like, comment)
- Generate and share parent code
- Access AI-powered educational insights

**Restrictions**:
- Cannot trade outside market hours
- Cannot exceed available virtual cash balance
- Cannot sell more shares than owned
- Cannot access other students' portfolio data

### 3.2 Parent Role
**Capabilities**:
- Link to child's account using parent code
- View child's portfolio holdings (read-only)
- Monitor child's transaction history
- Track child's profit/loss and performance metrics

**Restrictions**:
- Cannot execute trades
- Cannot modify child's portfolio
- Cannot access social feed
- Cannot view other children's data (only linked child)

## 4. Functional Requirements

### 4.1 Authentication & User Management

#### 4.1.1 User Registration
**FR-AUTH-001**: System shall provide email/password registration
**FR-AUTH-002**: System shall validate email format and password strength
**FR-AUTH-003**: System shall send email confirmation (disabled by default)

#### 4.1.2 User Login
**FR-AUTH-004**: System shall authenticate users via email and password
**FR-AUTH-005**: System shall maintain user session across page refreshes
**FR-AUTH-006**: System shall provide logout functionality

#### 4.1.3 Onboarding Process
**FR-AUTH-007**: System shall present role selection (Student/Parent) after registration
**FR-AUTH-008**: System shall require username creation (3-50 characters, alphanumeric + underscore)
**FR-AUTH-009**: System shall validate username uniqueness
**FR-AUTH-010**: System shall generate unique 8-character parent code for students
**FR-AUTH-011**: System shall allow parents to link to child using parent code
**FR-AUTH-012**: System shall validate parent code before linking accounts

### 4.2 Student Dashboard

#### 4.2.1 Portfolio Overview
**FR-DASH-001**: System shall display total portfolio value (cash + investments)
**FR-DASH-002**: System shall show available cash balance
**FR-DASH-003**: System shall calculate and display total invested amount
**FR-DASH-004**: System shall calculate overall profit/loss with percentage
**FR-DASH-005**: System shall display all four metrics prominently with icons

#### 4.2.2 Holdings Display
**FR-DASH-006**: System shall display current holdings in tabular format
**FR-DASH-007**: For each holding, system shall show:
- Stock symbol and company name
- Quantity owned
- Average buy price
- Current market price
- Total invested amount
- Current value
- Profit/loss (absolute and percentage)
**FR-DASH-008**: System shall update prices automatically every 30 seconds during market hours
**FR-DASH-009**: System shall provide "View" and "Sell" actions for each holding
**FR-DASH-010**: System shall display empty state with call-to-action when no holdings exist

#### 4.2.3 Recent Transactions
**FR-DASH-011**: System shall display last 5 transactions on dashboard
**FR-DASH-012**: System shall show transaction type (BUY/SELL), stock, quantity, price, and timestamp
**FR-DASH-013**: System shall provide link to view complete transaction history

### 4.3 Stock Browsing & Discovery

#### 4.3.1 Stock List Page
**FR-STOCK-001**: System shall display all Nifty 50 stocks in a table
**FR-STOCK-002**: For each stock, system shall show:
- Symbol
- Company name
- Current price
- Price change (absolute and percentage)
- Change direction indicators (up/down arrows)
**FR-STOCK-003**: System shall provide search functionality (symbol or company name)
**FR-STOCK-004**: System shall indicate market status (Open/Closed)
**FR-STOCK-005**: System shall provide manual refresh button for price updates
**FR-STOCK-006**: System shall auto-refresh prices every 30 seconds during market hours
**FR-STOCK-007**: System shall color-code rows based on positive/negative performance

#### 4.3.2 Stock Detail Page
**FR-STOCK-008**: System shall display comprehensive stock information:
- Company name and symbol
- Current price
- Price change indicators
- Last updated timestamp
**FR-STOCK-009**: System shall display historical price chart with multiple timeframes (1M, 3M, 6M, 1Y, All)
**FR-STOCK-010**: System shall show available cash balance
**FR-STOCK-011**: System shall show user's current holdings of the stock (if any)
**FR-STOCK-012**: System shall provide Buy and Sell buttons
**FR-STOCK-013**: System shall disable trading buttons outside market hours
**FR-STOCK-014**: System shall disable Sell button if user owns no shares
**FR-STOCK-015**: System shall display market closed notification with next open time

#### 4.3.3 AI-Powered Insights
**FR-STOCK-016**: System shall provide "Get AI Recommendation" feature
**FR-STOCK-017**: System shall display educational insights about the stock
**FR-STOCK-018**: System shall include beginner-friendly explanations
**FR-STOCK-019**: System shall show disclaimer that insights are educational, not financial advice
**FR-STOCK-020**: System shall allow users to show/hide insights

### 4.4 Trading Functionality

#### 4.4.1 Buy Transaction
**FR-TRADE-001**: System shall open modal when Buy button clicked
**FR-TRADE-002**: System shall fetch latest stock price before transaction
**FR-TRADE-003**: System shall allow user to specify quantity (minimum 1)
**FR-TRADE-004**: System shall calculate total cost dynamically
**FR-TRADE-005**: System shall display available cash and remaining cash after purchase
**FR-TRADE-006**: System shall validate sufficient funds before allowing purchase
**FR-TRADE-007**: System shall disable confirmation if insufficient funds
**FR-TRADE-008**: Upon confirmation, system shall:
- Create transaction record
- Deduct cash from user balance
- Update or create holding record
- Calculate new average buy price if adding to existing position
**FR-TRADE-009**: System shall show error if transaction fails
**FR-TRADE-010**: System shall refresh portfolio after successful transaction

#### 4.4.2 Sell Transaction
**FR-TRADE-011**: System shall open modal when Sell button clicked
**FR-TRADE-012**: System shall fetch latest stock price before transaction
**FR-TRADE-013**: System shall display current holdings (quantity and average price)
**FR-TRADE-014**: System shall allow user to specify quantity (max = owned quantity)
**FR-TRADE-015**: System shall calculate total proceeds dynamically
**FR-TRADE-016**: System shall calculate and display profit/loss for the transaction
**FR-TRADE-017**: System shall validate user owns sufficient shares
**FR-TRADE-018**: Upon confirmation, system shall:
- Create transaction record
- Add cash to user balance
- Update or delete holding record (delete if quantity becomes 0)
**FR-TRADE-019**: System shall refresh portfolio after successful transaction

#### 4.4.3 Market Hours Validation
**FR-TRADE-020**: System shall enforce trading only during market hours (Mon-Fri, 9:15 AM - 3:30 PM IST)
**FR-TRADE-021**: System shall disable trading outside market hours
**FR-TRADE-022**: System shall display market status prominently

### 4.5 Portfolio Management

#### 4.5.1 Holdings Page
**FR-PORT-001**: System shall display all holdings with quantity > 0
**FR-PORT-002**: System shall show summary cards:
- Total holdings value
- Number of stocks held
- Overall unrealized P&L
**FR-PORT-003**: System shall provide search functionality (symbol/company name)
**FR-PORT-004**: System shall provide filters: All, Profitable, Loss
**FR-PORT-005**: System shall provide sort options: P&L%, Current Value, Quantity
**FR-PORT-006**: System shall display detailed table with all holding metrics
**FR-PORT-007**: System shall provide quick access to "View Stock" and "Sell" actions
**FR-PORT-008**: System shall show empty state with call-to-action when no holdings

#### 4.5.2 Transaction History
**FR-PORT-009**: System shall display all user transactions ordered by date (newest first)
**FR-PORT-010**: System shall show up to 100 most recent transactions
**FR-PORT-011**: System shall provide filter: All, Buy, Sell
**FR-PORT-012**: For each transaction, system shall display:
- Date and time
- Transaction type (BUY/SELL) with badge
- Stock symbol and company name
- Quantity
- Price per share
- Total amount with color coding (red for buy, green for sell)
**FR-PORT-013**: System shall show empty state when no transactions exist

### 4.6 Parent Dashboard

#### 4.6.1 Child Monitoring
**FR-PARENT-001**: System shall display child's username in page title
**FR-PARENT-002**: System shall show child's portfolio metrics:
- Available cash
- Portfolio value
- Total value
- Total P&L
**FR-PARENT-003**: System shall display child's current holdings in table format
**FR-PARENT-004**: System shall display child's recent transactions (last 10)
**FR-PARENT-005**: System shall show empty state if no child is linked
**FR-PARENT-006**: System shall provide instructions for linking (via parent code)

#### 4.6.2 Read-Only Access
**FR-PARENT-007**: System shall prevent parents from executing any trades
**FR-PARENT-008**: System shall prevent parents from modifying child's portfolio
**FR-PARENT-009**: System shall only show data for linked child

### 4.7 Social Feed

#### 4.7.1 Post Creation
**FR-SOCIAL-001**: System shall allow students to create text posts
**FR-SOCIAL-002**: System shall validate post content is not empty
**FR-SOCIAL-003**: System shall support multi-line text content
**FR-SOCIAL-004**: System shall display post author's username and timestamp

#### 4.7.2 Post Interactions
**FR-SOCIAL-005**: System shall allow users to like posts
**FR-SOCIAL-006**: System shall allow users to unlike posts
**FR-SOCIAL-007**: System shall display like count for each post
**FR-SOCIAL-008**: System shall indicate if current user has liked a post
**FR-SOCIAL-009**: System shall allow users to view comments on posts
**FR-SOCIAL-010**: System shall allow users to add comments to posts
**FR-SOCIAL-011**: System shall display comment count for each post

#### 4.7.3 Real-Time Updates
**FR-SOCIAL-012**: System shall subscribe to real-time post changes
**FR-SOCIAL-013**: System shall update feed when new posts are created
**FR-SOCIAL-014**: System shall update like counts in real-time
**FR-SOCIAL-015**: System shall update comment counts in real-time

#### 4.7.4 Comments
**FR-SOCIAL-016**: System shall display comments modal when comment button clicked
**FR-SOCIAL-017**: System shall show all comments for a post
**FR-SOCIAL-018**: System shall display commenter's username and timestamp
**FR-SOCIAL-019**: System shall allow users to add new comments
**FR-SOCIAL-020**: System shall allow users to delete their own comments

### 4.8 Navigation & UI

#### 4.8.1 Navigation Bar
**FR-NAV-001**: System shall display navigation bar on all authenticated pages
**FR-NAV-002**: For students, system shall show links to:
- Dashboard
- Stocks
- Holdings
- Transactions
- Social
**FR-NAV-003**: For parents, system shall show link to:
- Dashboard (child activity)
**FR-NAV-004**: System shall display username in navigation
**FR-NAV-005**: System shall provide logout button
**FR-NAV-006**: System shall highlight active page in navigation

#### 4.8.2 Responsive Design
**FR-NAV-007**: System shall be fully responsive for mobile, tablet, and desktop
**FR-NAV-008**: System shall provide mobile-optimized navigation menu
**FR-NAV-009**: System shall maintain readability across all screen sizes

### 4.9 Data Management

#### 4.9.1 Price Updates
**FR-DATA-001**: System shall fetch real-time prices from Yahoo Finance API
**FR-DATA-002**: System shall cache prices to minimize API calls
**FR-DATA-003**: System shall update prices every 30 seconds during market hours
**FR-DATA-004**: System shall handle API failures gracefully
**FR-DATA-005**: System shall show loading state during price fetch

#### 4.9.2 Historical Data
**FR-DATA-006**: System shall store historical stock prices in stock_history table
**FR-DATA-007**: System shall support querying historical data for charts
**FR-DATA-008**: System shall maintain at least 1 year of historical data

### 4.10 Security & Data Protection

#### 4.10.1 Authentication Security
**FR-SEC-001**: System shall hash passwords before storage
**FR-SEC-002**: System shall use Supabase JWT tokens for session management
**FR-SEC-003**: System shall validate user session on each protected route

#### 4.10.2 Data Access Control
**FR-SEC-004**: System shall implement Row Level Security (RLS) on all tables
**FR-SEC-005**: Students shall only access their own data
**FR-SEC-006**: Parents shall only access linked child's data
**FR-SEC-007**: Stock data shall be read-only for all authenticated users
**FR-SEC-008**: System shall prevent unauthorized data modification

#### 4.10.3 Input Validation
**FR-SEC-009**: System shall validate all user inputs on client and server side
**FR-SEC-010**: System shall sanitize inputs to prevent XSS attacks
**FR-SEC-011**: System shall enforce data type and format constraints

## 5. Non-Functional Requirements

### 5.1 Performance
**NFR-PERF-001**: Page load time shall not exceed 3 seconds on standard connection
**NFR-PERF-002**: Price updates shall complete within 2 seconds
**NFR-PERF-003**: Transaction execution shall complete within 3 seconds
**NFR-PERF-004**: System shall handle multiple concurrent users efficiently

### 5.2 Usability
**NFR-USE-001**: Interface shall be intuitive for teenage users
**NFR-USE-002**: Trading process shall require maximum 3 clicks
**NFR-USE-003**: Error messages shall be clear and actionable
**NFR-USE-004**: System shall provide loading indicators for async operations

### 5.3 Reliability
**NFR-REL-001**: System uptime shall be 99.5% or higher
**NFR-REL-002**: System shall handle API failures without data loss
**NFR-REL-003**: Transactions shall be atomic (all-or-nothing)

### 5.4 Scalability
**NFR-SCALE-001**: System shall support up to 10,000 concurrent users
**NFR-SCALE-002**: Database shall handle growing transaction history
**NFR-SCALE-003**: System shall maintain performance with increasing data volume

## 6. Data Models

### 6.1 Core Entities

#### Profile
- id (UUID, primary key)
- username (string, unique)
- role (student/parent)
- parent_code (string, unique, for students)
- linked_parent_id (UUID, foreign key)
- virtual_cash (decimal, default 100000)
- created_at (timestamp)

#### Stock
- id (integer, primary key)
- symbol (string, unique)
- company_name (string)
- current_price (decimal)
- last_updated (timestamp)

#### Holding
- user_id (UUID, foreign key)
- stock_id (integer, foreign key)
- quantity (integer)
- average_buy_price (decimal)

#### Transaction
- id (integer, primary key)
- user_id (UUID, foreign key)
- stock_id (integer, foreign key)
- type (BUY/SELL)
- quantity (integer)
- price_per_share (decimal)
- total_amount (decimal)
- timestamp (timestamp)

#### Post
- id (integer, primary key)
- user_id (UUID, foreign key)
- content (text)
- created_at (timestamp)

#### Comment
- id (integer, primary key)
- post_id (integer, foreign key)
- user_id (UUID, foreign key)
- content (text)
- created_at (timestamp)

#### Like
- post_id (integer, foreign key)
- user_id (UUID, foreign key)
- created_at (timestamp)

## 7. Business Rules

### 7.1 Trading Rules
1. Students start with ₹100,000 virtual cash
2. Trading only allowed during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
3. Cannot buy if insufficient funds
4. Cannot sell if insufficient shares
5. Cannot trade fractional shares (integer quantities only)
6. Average buy price recalculates when adding to existing position

### 7.2 Portfolio Rules
1. Holding record deleted when quantity reaches 0
2. Cash balance updated atomically with each transaction
3. Profit/loss calculated as: (current_price - avg_buy_price) * quantity
4. Portfolio value = cash + sum(holdings value)

### 7.3 Social Feed Rules
1. Users can only delete their own posts and comments
2. Users can like/unlike any post
3. Posts display in reverse chronological order
4. Comments require authentication

### 7.4 Parent-Child Linking Rules
1. Parent code is unique per student
2. One parent can link to one child
3. One child can have one linked parent
4. Linking cannot be reversed (no unlinking functionality)

## 8. Integration Points

### 8.1 External APIs
- **Yahoo Finance API**: Real-time stock price data
  - Endpoint: `/v8/finance/quote`
  - Rate limit: Managed by client-side caching
  - Fallback: Use last known price if API fails

### 8.2 Supabase Services
- **Authentication**: User signup, signin, session management
- **Database**: PostgreSQL with RLS policies
- **Real-time**: WebSocket subscriptions for social feed

## 9. User Acceptance Criteria

### 9.1 Student Experience
- ✅ Can register and complete onboarding in under 2 minutes
- ✅ Can view all Nifty 50 stocks with live prices
- ✅ Can execute buy transaction successfully
- ✅ Can execute sell transaction successfully
- ✅ Can view updated portfolio after transactions
- ✅ Can see transaction history
- ✅ Can participate in social feed
- ✅ Can view AI-powered stock insights

### 9.2 Parent Experience
- ✅ Can register and link to child using parent code
- ✅ Can view child's portfolio and holdings
- ✅ Can track child's transaction history
- ✅ Cannot execute any trades

### 9.3 System Behavior
- ✅ Prices update during market hours
- ✅ Trading disabled outside market hours
- ✅ All transactions complete successfully or fail gracefully
- ✅ Data persists across sessions
- ✅ Real-time updates work in social feed

## 10. Success Metrics

### 10.1 Engagement Metrics
- Daily active users
- Average session duration
- Number of trades per user
- Social feed engagement rate

### 10.2 Educational Metrics
- Portfolio diversity (number of different stocks held)
- Average holding period
- Profit/loss distribution

### 10.3 Technical Metrics
- System uptime
- Average response time
- Error rate
- API success rate

## 11. Future Enhancements (Out of Scope for v1.0)

1. **Watchlist Feature**: Save stocks for quick access
2. **Advanced Charts**: Technical indicators, candlestick charts
3. **Portfolio Analytics**: Detailed performance breakdown, sector allocation
4. **Educational Modules**: Interactive tutorials, quizzes
5. **Achievements System**: Badges for milestones
6. **Leaderboards**: Compare performance with peers
7. **Options Trading**: Simulate options and derivatives
8. **Multi-Exchange Support**: BSE, NYSE, NASDAQ stocks
9. **News Integration**: Real-time market news
10. **Mobile Apps**: Native iOS and Android applications
11. **Notifications**: Price alerts, trade confirmations
12. **Export Reports**: Download portfolio and transaction reports

## 12. Constraints & Assumptions

### 12.1 Constraints
- Limited to Nifty 50 stocks only
- Dependent on Yahoo Finance API availability
- Trading hours match actual Indian market hours
- Virtual currency only (no real money)

### 12.2 Assumptions
- Users have stable internet connection
- Users have modern web browsers (Chrome, Firefox, Safari, Edge)
- Yahoo Finance API provides accurate, timely data
- Users understand this is educational, not real trading

## 13. Glossary

- **Paper Trading**: Simulated trading with virtual currency
- **Nifty 50**: India's 50 largest publicly traded companies
- **Portfolio**: Collection of stocks owned by a user
- **Holdings**: Current stock positions
- **P&L**: Profit and Loss
- **Average Buy Price**: Weighted average price of all purchases
- **Market Hours**: Time when stock exchanges are open for trading
- **RLS**: Row Level Security (database access control)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 2025 | Product Team | Initial comprehensive requirements document |

**Approval**

This functional requirements document represents the complete implementation of FinSim v1.0 as built. All features described have been implemented and are functional in the current codebase.
