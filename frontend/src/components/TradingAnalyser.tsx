import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const TradingAnalyser = () => {
    const [spotTrades, setSpotTrades] = useState<any[]>([]);
    const [averages, setAverages] = useState<{[key: string]: number}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpotTrades = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/spot-trades'); // Предполагается, что у вас есть бэкенд эндпоинт
                const data = await response.json();
                
                setSpotTrades(data);
                
                // Расчет средних значений по символам
                const symbolAverages: {[key: string]: {totalPrice: number, count: number}} = {};
                data.forEach((trade: any) => {
                    if (!symbolAverages[trade.symbol]) {
                        symbolAverages[trade.symbol] = {
                            totalPrice: 0,
                            count: 0
                        };
                    }
                    symbolAverages[trade.symbol].totalPrice += Number(trade.price);
                    symbolAverages[trade.symbol].count += 1;
                });

                // Вычисление среднего для каждого символа
                const averagesBySymbol: {[key: string]: number} = {};
                Object.keys(symbolAverages).forEach(symbol => {
                    averagesBySymbol[symbol] = symbolAverages[symbol].totalPrice / symbolAverages[symbol].count;
                });

                setAverages(averagesBySymbol);
                
            } catch (err) {
                setError('Ошибка при загрузке данных');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpotTrades();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Анализатор Торговли</h1>
            {isLoading && <div>Загрузка...</div>}
            {error && <div className="text-red-500">{error}</div>}
            
            <Card>
                <CardHeader>
                    <CardTitle>Средние цены покупок на споте</CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.entries(averages).map(([symbol, average]) => (
                        <div key={symbol} className="flex justify-between py-2 border-b">
                            <span className="font-medium">{symbol}:</span>
                            <span>{average.toFixed(8)} USDT</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default TradingAnalyser; 