# Bybit Tools

A collection of independent tools for Bybit cryptocurrency exchange built with Next.js 15.

## Modules

The application consists of several independent modules:

1. **Funding Rates** - Monitor and analyze funding rates for Bybit perpetual contracts
2. **APY Calculation** - Calculate and forecast investment returns based on APY
3. **Trading Analyser** - Analyze your trading history and performance
4. **Permata** - Manage and categorize your financial transactions

Each module is designed to be independent and can be easily extracted into a separate repository if needed.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bybit-next.git
cd bybit-next
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Backend Setup

Some features require a backend server. The backend code is located in the `backend` directory.

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
```

The backend server will run on port 5500 by default.

## Project Structure

```
bybit-next/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── apy-calculation/  # APY Calculation module
│   │   ├── funding-rates/    # Funding Rates module
│   │   ├── permata/          # Permata module
│   │   ├── trading-analyser/ # Trading Analyser module
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # Shared components
│   │   ├── ui/               # UI components
│   │   ├── mode-toggle.tsx   # Theme toggle component
│   │   └── theme-provider.tsx # Theme provider
│   ├── contexts/             # Shared contexts
│   │   └── auth-context.tsx  # Authentication context
│   ├── lib/                  # Shared utilities
│   │   ├── constants.ts      # Constants
│   │   └── utils.ts          # Utility functions
│   └── services/             # API services
│       └── api.ts            # API client
└── ...
```

## Features

- **Dark Mode Support** - Toggle between light and dark themes
- **Responsive Design** - Works on desktop and mobile devices
- **Authentication** - Simple email-based authentication
- **Independent Modules** - Each module can be used independently

## License

This project is licensed under the MIT License - see the LICENSE file for details.
