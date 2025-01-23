import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

const FundingRateDisplay = () => {
  const [fundingRates, setFundingRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFundingRates = async () => {
      try {
        const response = await fetch('http://localhost:8000/funding-rates');
        const data = await response.json();
        setFundingRates(data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка при загрузке данных');
        setLoading(false);
      }
    };

    fetchFundingRates();
    const interval = setInterval(fetchFundingRates, 60000); // Обновление каждую минуту

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-xl mx-auto mt-4">
        <CardContent className="p-6">
          <div className="text-center">Загрузка данных...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-xl mx-auto mt-4">
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Funding Rates Bybit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fundingRates.map((rate) => (
            <div 
              key={rate.symbol}
              className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{rate.symbol}</span>
                <div className="flex items-center space-x-2">
                  {rate.fundingRate > 0 ? (
                    <ArrowUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    rate.fundingRate > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {rate.fundingRate.toFixed(4)}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Обновлено: {formatTimestamp(rate.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FundingRateDisplay;
