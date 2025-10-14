# FinSim - Paper Trading Simulator for Indian Teenagers

FinSim is a comprehensive web-based paper trading platform designed to help Indian teenagers learn stock market investing in a safe, simulated environment using virtual currency. The platform enables students to trade Nifty 50 stocks with real-time prices while parents can monitor their child's trading activity and portfolio performance.

## Overview

FinSim provides a complete paper trading experience with virtual cash of ₹100,000 for each student account. Students can explore the Indian stock market (Nifty 50), execute trades, track their portfolio, and engage with a social community of fellow traders. Parents receive read-only access to monitor their child's investments and learning progress.

## Key Features

### For Students

- **Virtual Trading Account**: Start with ₹100,000 in virtual cash to practice trading
- **Real-Time Stock Data**: Access live prices for all Nifty 50 stocks with periodic updates
- **Complete Portfolio Management**:
  - View detailed holdings with profit/loss calculations
  - Track total portfolio value and performance metrics
  - Monitor individual stock performance
- **Trading Capabilities**:
  - Buy and sell stocks during market hours (9:15 AM - 3:30 PM IST)
  - Real-time validation of transactions
  - Automatic portfolio and cash balance updates
- **Comprehensive Transaction History**: View all past trades with detailed information
- **Interactive Stock Charts**: Visualize historical price data (1M, 3M, 6M, 1Y, All)
- **AI-Powered Insights**: Educational content about stocks to aid learning
- **Social Feed**: Share trading thoughts, like posts, and comment on community updates

### For Parents

- **Child Portfolio Monitoring**: Read-only access to view child's portfolio and holdings
- **Transaction History**: Track all trading activity of linked child account
- **Performance Metrics**: View profit/loss, portfolio value, and available cash
- **Parent-Child Linking**: Secure linking using unique parent codes

### Technical Features

- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Real-Time Updates**: Live price updates during market hours (every 30 seconds)
- **Market Status Indicators**: Clear display of market open/closed status
- **Authentication System**: Secure email/password authentication with Supabase
- **Role-Based Access Control**: Separate interfaces for students and parents
- **Data Security**: Row-Level Security (RLS) policies protect user data

## Technology Stack

### Frontend
- **React 18.3** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization for stock charts
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security

### External APIs
- **Yahoo Finance API** - Real-time stock price data for Nifty 50 stocks

## Database Schema

### Tables

1. **profiles** - User profiles and account information
2. **stocks** - Nifty 50 stock information
3. **stock_history** - Historical price data for charts
4. **holdings** - User's current stock portfolio
5. **transactions** - Complete trading history
6. **posts** - Social feed posts
7. **comments** - Comments on posts
8. **likes** - Post likes/reactions

See `supabase/migrations/` for detailed schema definitions and RLS policies.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Apply database migrations:
   Database migrations are located in `supabase/migrations/`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── BuySellModal.tsx    # Trading modal
│   ├── Navbar.tsx          # Navigation bar
│   └── PostComments.tsx    # Social feed comments
├── contexts/          # React contexts
│   └── AuthContext.tsx     # Authentication state
├── lib/              # Utility libraries
│   ├── marketUtils.ts      # Market calculations and formatting
│   ├── supabase.ts        # Supabase client configuration
│   ├── types.ts           # TypeScript type definitions
│   └── yahooFinance.ts    # Stock price API integration
├── pages/            # Main application pages
│   ├── Login.tsx           # User login
│   ├── SignUp.tsx          # User registration
│   ├── Onboarding.tsx      # Role selection and setup
│   ├── StudentDashboard.tsx # Student overview
│   ├── ParentDashboard.tsx  # Parent monitoring view
│   ├── StocksList.tsx       # Browse all stocks
│   ├── StockDetail.tsx      # Individual stock view
│   ├── Holdings.tsx         # Portfolio holdings
│   ├── Transactions.tsx     # Transaction history
│   └── SocialFeed.tsx       # Community feed
├── App.tsx           # Main app component with routing
└── main.tsx          # Application entry point
```

## User Flows

### Student Onboarding
1. Sign up with email and password
2. Choose "Student" role
3. Create username
4. Receive parent code (8-character code)
5. Start trading with ₹100,000 virtual cash

### Parent Onboarding
1. Sign up with email and password
2. Choose "Parent" role
3. Create username
4. Enter child's parent code to link accounts
5. View child's portfolio and activity

### Trading Flow
1. Browse Nifty 50 stocks
2. View stock details and historical charts
3. Click Buy or Sell button
4. Enter quantity and confirm transaction
5. View updated portfolio and cash balance

## Features in Detail

### Portfolio Dashboard
- Total portfolio value (cash + investments)
- Available cash balance
- Total amount invested
- Overall profit/loss with percentage
- Detailed holdings table with live prices
- Recent transaction history

### Stock Detail Page
- Real-time current price with change indicators
- Historical price chart with multiple timeframes
- Market status (open/closed)
- Available cash and current holdings display
- AI-powered educational insights
- Buy/Sell action buttons

### Holdings Page
- Search and filter capabilities (All, Profitable, Loss)
- Sort by P&L%, Current Value, or Quantity
- Detailed metrics for each holding
- Quick access to sell functionality

### Social Feed
- Create text posts
- Like posts
- Comment on posts
- Real-time updates using Supabase subscriptions
- Community engagement features

## Security Features

- Email/password authentication
- Row Level Security (RLS) on all database tables
- Students can only access their own data
- Parents can only view their linked child's data
- Stock price data is read-only for authenticated users
- Protected API routes and database operations

## Market Hours

Trading is restricted to Indian stock market hours:
- **Market Open**: Monday-Friday, 9:15 AM - 3:30 PM IST
- **Market Closed**: Weekends and outside trading hours
- Real-time price updates only during market hours

## Documentation

- **README.md** - This file, project overview and setup
- **FUNCTIONAL_REQUIREMENTS.md** - Complete functional requirements document with detailed specifications

## Future Enhancements

Potential features for future development:
- Watchlist functionality
- Advanced charting with technical indicators
- Portfolio performance analytics
- Educational modules and tutorials
- Leaderboards and achievements
- Options and futures trading simulation
- Multi-exchange support (BSE, NYSE, NASDAQ)

## Contributing

This is a learning platform designed for educational purposes. The virtual trading environment uses simulated currency and is not connected to real financial markets.

## License

This project is built for educational purposes.

## Support

For issues or questions, please refer to the documentation or contact the development team.

---

**Disclaimer**: This is a paper trading simulator for educational purposes only. No real money is involved, and the platform does not provide financial advice. Always consult with qualified financial advisors before making real investment decisions.
