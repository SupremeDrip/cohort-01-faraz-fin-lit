# FinSim - Functional Requirements Document

## Objective

FinSim is a paper trading simulator designed to provide Indian teenagers with hands-on experience in stock market investing using virtual currency. The platform enables students to practice trading Nifty 50 stocks with real-time prices in a risk-free environment, while parents can monitor their child's learning progress and trading activity.

## Target Audience

**Primary Users**: Indian teenagers (students aged 13-19) who want to learn stock market fundamentals and investment strategies through practical experience.

**Secondary Users**: Parents and guardians who wish to supervise and monitor their child's trading activity and financial learning journey.

## Design Principles

**Minimalistic Design**: Clean, uncluttered interface with ample white space that focuses user attention on essential information and actions. Typography hierarchy and intentional spacing reduce cognitive load and improve readability.

**Color Palette**:
- Primary: Blue (#2563eb, #1d4ed8) - Trust, stability, professionalism
- Success/Positive: Green (#16a34a, #15803d) - Profit, growth
- Warning/Negative: Red (#dc2626, #b91c1c) - Loss, caution
- Neutral: Gray scale (#f9fafb to #111827) - Background, text, borders
- Accent: Orange (#ea580c) for highlights

**Premium Look and Feel**: Sophisticated visual presentation with subtle shadows, smooth transitions, rounded corners, and high-quality iconography. Attention to micro-interactions and hover states creates an engaging, modern experience that demonstrates professional web development capabilities.

**Responsive Design**: Fully responsive layout optimized for mobile, tablet, and desktop viewports with appropriate breakpoints. Mobile-first approach ensures optimal viewing experience across all device sizes with touch-friendly interface elements.

**User Experience**: Intuitive navigation, clear visual hierarchy, consistent layouts, and progressive disclosure of complex information. Real-time feedback for user actions, loading states for async operations, and helpful empty states guide users through their journey.

## High-Level Functional Requirements

### Authentication & Onboarding

- **User** should be able to register with email and password so that they can create a secure account
- **User** should be able to log in with their credentials so that they can access their account
- **User** should be able to choose between Student or Parent role during onboarding so that the platform provides appropriate functionality
- **Student** should be able to create a unique username so that they can be identified in the platform
- **Student** should be able to receive a unique 8-character parent code so that they can share it with their parent for account linking
- **Parent** should be able to enter their child's parent code so that they can link and monitor their child's account

### Student Portfolio Management

- **Student** should be able to view their total portfolio value so that they understand their overall investment worth
- **Student** should be able to see their available cash balance so that they know how much they can invest
- **Student** should be able to view total amount invested so that they can track their capital deployment
- **Student** should be able to see overall profit/loss with percentage so that they can measure their trading performance
- **Student** should be able to view all current holdings in a detailed table so that they can monitor individual stock positions
- **Student** should be able to see real-time prices for their holdings so that they can make informed decisions
- **Student** should be able to view profit/loss for each holding so that they can identify winning and losing positions
- **Student** should be able to search and filter holdings so that they can quickly find specific stocks
- **Student** should be able to sort holdings by different metrics so that they can analyze their portfolio from various perspectives

### Stock Discovery & Analysis

- **Student** should be able to browse all Nifty 50 stocks so that they can discover investment opportunities
- **Student** should be able to search stocks by symbol or company name so that they can quickly find specific stocks
- **Student** should be able to view real-time stock prices with change indicators so that they can track market movements
- **Student** should be able to see market status (open/closed) so that they know when trading is available
- **Student** should be able to manually refresh prices so that they can get the latest market data
- **Student** should be able to view detailed stock information including historical charts so that they can analyze price trends
- **Student** should be able to switch between multiple timeframes (1M, 3M, 6M, 1Y, All) so that they can analyze different time periods
- **Student** should be able to access AI-powered educational insights about stocks so that they can learn about companies and investment concepts

### Trading Execution

- **Student** should be able to buy stocks during market hours so that they can build their portfolio
- **Student** should be able to specify quantity when buying so that they can control position size
- **Student** should be able to see total cost and remaining cash before confirming purchase so that they can validate affordability
- **Student** should be able to sell owned stocks during market hours so that they can realize profits or cut losses
- **Student** should be able to see profit/loss before confirming sale so that they understand the transaction outcome
- **Student** should be able to view updated portfolio immediately after transactions so that they can see the impact of their trades
- **Student** should not be able to trade outside market hours (Mon-Fri, 9:15 AM - 3:30 PM IST) so that trading simulates real market conditions
- **Student** should not be able to buy if they have insufficient funds so that the simulation remains realistic
- **Student** should not be able to sell more shares than owned so that the platform maintains data integrity

### Transaction History

- **Student** should be able to view complete transaction history so that they can track all trading activity
- **Student** should be able to filter transactions by type (Buy/Sell) so that they can analyze specific trading patterns
- **Student** should be able to see transaction details including date, stock, quantity, price, and total amount so that they have complete trade records

### Social Community

- **Student** should be able to create text posts so that they can share trading insights and thoughts
- **Student** should be able to like posts so that they can show appreciation for community content
- **Student** should be able to comment on posts so that they can engage in discussions
- **Student** should be able to view community feed with real-time updates so that they can stay connected with other traders
- **Student** should be able to see post author, timestamp, like count, and comment count so that they can gauge post popularity and recency

### Parent Monitoring

- **Parent** should be able to view their child's portfolio overview so that they can monitor investment activity
- **Parent** should be able to see child's available cash and portfolio value so that they can track overall financial position
- **Parent** should be able to view child's current holdings so that they can see what stocks are owned
- **Parent** should be able to see child's transaction history so that they can review trading activity
- **Parent** should be able to see child's profit/loss metrics so that they can assess learning progress
- **Parent** should not be able to execute trades so that the child maintains control of their learning experience
- **Parent** should not be able to access social feed so that student privacy is maintained in community interactions

### System Behavior

- **System** should update stock prices automatically every 30 seconds during market hours so that users see current market data
- **System** should validate all transactions before execution so that data integrity is maintained
- **System** should calculate average buy price when adding to existing positions so that portfolio metrics remain accurate
- **System** should update cash balance atomically with transactions so that no money is lost or created incorrectly
- **System** should enforce Row Level Security policies so that users can only access their authorized data
- **System** should provide clear error messages when operations fail so that users understand what went wrong
- **System** should show loading states during async operations so that users know the system is processing their request

## Business Logic

### Initial Account Setup
- Every new student account starts with ₹100,000 in virtual cash
- Parent code is automatically generated as a unique 8-character alphanumeric string (excluding confusing characters like O, 0, I, 1)
- Usernames must be unique across the platform and can only contain letters, numbers, and underscores

### Trading Rules
- Trading is only permitted Monday through Friday between 9:15 AM and 3:30 PM IST (Indian market hours)
- Users can only trade in whole share quantities (no fractional shares)
- Buy transactions are blocked if total cost exceeds available cash
- Sell transactions are blocked if quantity exceeds owned shares
- All prices are fetched in real-time before transaction execution to ensure accuracy

### Portfolio Calculations
- **Average Buy Price**: When buying additional shares of an owned stock, the new average is calculated as: `(previous_quantity × previous_avg_price + new_quantity × new_price) / total_quantity`
- **Profit/Loss (Per Holding)**: `(current_price - average_buy_price) × quantity`
- **Total Invested**: Sum of `average_buy_price × quantity` across all holdings
- **Portfolio Value**: Sum of `current_price × quantity` across all holdings
- **Total Portfolio Value**: `available_cash + portfolio_value`
- **Overall P&L**: `total_portfolio_value - 100000` (initial starting balance)

### Data Management
- Holdings with quantity of 0 are automatically deleted from the database
- Transaction records are permanent and cannot be deleted or modified
- Stock prices are cached for 30 seconds to reduce API calls
- Historical price data is maintained for chart visualization

### Parent-Child Linking
- One parent can link to only one child account
- One child can have only one linked parent
- Linking is established when parent enters correct parent code during onboarding
- Once linked, the relationship cannot be unlinked or changed
- Parents can only view data for their linked child, not other students

### Security & Access Control
- Students can only view and modify their own portfolio data
- Parents can only view (read-only) their linked child's data
- Stock and stock history data is read-only for all users
- Social feed posts are visible to all authenticated students
- Users can only delete their own posts and comments
- Real-time subscriptions are scoped to user permissions

### Market Data
- Stock prices are fetched from Yahoo Finance API for all Nifty 50 stocks
- Prices display with two decimal precision
- Change values show both absolute (₹) and percentage (%) changes
- Price updates occur automatically every 30 seconds during market hours
- Outside market hours, last known prices are displayed with timestamp
