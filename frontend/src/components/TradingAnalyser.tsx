import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from './ui/input';
import { InputLabel } from './ui/input';
import WalletBalance from './WalletBalance';
import { TradeHistory } from './TradeHistory';
import { useDataContext } from '@/context/DataContext';

interface Trade {
    symbol: string;
    side: string;
    price: number;
    qty: number;
    timestamp: number;
    orderId: string;
}

const TradingAnalyser = () => {
    const {refreshDataFiles} = useDataContext()
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [symbol, setSymbol] = useState('ETHUSDT');
    const [limit, setLimit] = useState(100);
    const [startTime, setStartTime] = useState('2023-09-01T00:00');
    const [endTime, setEndTime] = useState('2025-02-05T00:00');

    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSymbol(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLimit(Number(e.target.value));
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value)
        setStartTime(e.target.value);
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndTime(e.target.value);
    };

    const fetchSpotTrades = async () => {
        setIsLoading(true);
        try {
            const startTimestamp = startTime ? new Date(startTime).toISOString().split('.')[0] : undefined;
            const endTimestamp = endTime ? new Date(endTime).toISOString().split('.')[0] : undefined;
            
            const url = new URL(`http://localhost:8000/historical-trades/${symbol}`);
            url.searchParams.append('limit', limit.toString());
            if (startTimestamp) url.searchParams.append('start_date', startTimestamp);
            if (endTimestamp) url.searchParams.append('end_date', endTimestamp);
            
            const response = await fetch(url.toString());
            const data = await response.json();
            refreshDataFiles()
        } catch (err) {
            setError('Ошибка при загрузке данных');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSpotTrades();
    };

    useEffect(() => {
        const walletBalance = async () => {
            const response = await fetch(`http://localhost:8000/wallet/balance`);
            const data = await response.json();
            console.log(data);
        };
        walletBalance();
    }, []);

    return (
        <div className="container mx-auto p-4 grid gap-4">
            <h1 className="text-2xl font-bold mb-4">Анализатор Торговли</h1>
            <WalletBalance />
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div className="text-red-500">{error}</div>}
            
            <Card>
                <CardHeader>
                    <CardTitle>Обновить данные через API</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputLabel label="Symbol">
                            <Input
                                type="text"
                                value={symbol}
                                onChange={handleSymbolChange}
                                placeholder="Enter symbol"
                            />
                        </InputLabel>
                        
                        <InputLabel label="Limit">
                            <Input
                                type="number"
                                value={limit}
                                onChange={handleLimitChange}
                                placeholder="Enter limit"
                                min={1}
                            />
                        </InputLabel>

                        <InputLabel label="Start Time">
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={handleStartTimeChange}
                            />
                        </InputLabel>

                        <InputLabel label="End Time">
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={handleEndTimeChange}
                            />
                        </InputLabel>

                        <button 
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                        >
                            Получить данные
                        </button>
                    </form>
                </CardContent>
            </Card>

            <TradeHistory  />
        </div>
    );
};

export default TradingAnalyser; 