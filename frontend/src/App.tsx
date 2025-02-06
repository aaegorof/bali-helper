import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FundingRateDisplay from './bybit-api-tests';
import APYCalculation from './pages/APYCalculation';
import TradingAnalyser from './components/TradingAnalyser';
import { DataProvider } from './context/DataContext';

const App = () => {
    return (
        <DataProvider>
            <Router>
                <div>
                    <nav className="bg-gray-800 p-4 mb-4">
                        <div className="container mx-auto flex justify-center space-x-4">
                            <Link to="/" className="text-white hover:text-gray-300">
                                Funding Rates
                            </Link>
                            <Link to="/apy" className="text-white hover:text-gray-300">
                                APY Calculation
                            </Link>
                            <Link to="/trading-analyser" className="text-white hover:text-gray-300">
                                Trading Analyser
                            </Link>
                            <Link to="/settings" className="text-white hover:text-gray-300">
                                Settings
                            </Link>
                        </div>
                    </nav>

                    <Routes>
                        <Route path="/" element={<FundingRateDisplay />} />
                        <Route path="/apy" element={<APYCalculation />} />
                        <Route path="/trading-analyser" element={<TradingAnalyser />} />
                        <Route path="/settings" element={<div>Settings Page</div>} />
                    </Routes>
                </div>
            </Router>
        </DataProvider>
    );
}

export default App;