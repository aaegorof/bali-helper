import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDataContext } from '@/context/DataContext';

export interface Balance {
    coin: string;
    total: number;
    free: number;
    locked: number;
    current_price: number;
    usd_value: number;
}

const WalletBalance = () => {
    const {walletBalances, setWalletBalances } = useDataContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalUsdValue, setTotalUsdValue] = useState(0);

    const fetchBalance = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/wallet/balance');
            const data = await response.json();
            // Сортируем по убыванию USD value
            const sortedData = data.sort((a: Balance, b: Balance) => b.usd_value - a.usd_value);
        
            setWalletBalances(sortedData)
            // Подсчитываем общую стоимость в USD
            const total = sortedData.reduce((sum: number, balance: Balance) => sum + balance.usd_value, 0);
            setTotalUsdValue(total);
        } catch (err) {
            setError('Ошибка при загрузке баланса');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Wallet balance</span>
                    <div className="flex items-center gap-4">
                        <span className="text-lg">
                            Total Value: ${totalUsdValue.toFixed(2)}
                        </span>
                        <button 
                            onClick={fetchBalance}
                            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                            Update
                        </button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <div className="text-center">Загрузка...</div>}
                {error && <div className="text-red-500">{error}</div>}
                
                <div className="grid gap-2">
                    {walletBalances.map((balance) => (
                        <div key={balance.coin} className="flex justify-between gap-4 items-center px-4 py-2 hover:bg-gray-50 rounded border">
                            <div className="flex-1">
                                <div className="font-medium text-lg">{balance.coin}</div>
                                <div className="text-sm text-gray-600">
                                    Доступно: {balance.free.toFixed(8)}
                                    {balance.locked > 0 && (
                                        <span className="ml-4 text-yellow-600">
                                            Заблокировано: {balance.locked.toFixed(8)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-bold">
                                    {balance.total.toFixed(8)} {balance.coin}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Цена: ${balance.current_price.toFixed(6)}
                                </div>
                            </div>
                            <div className="text-lg text-blue-600">
                                    ${balance.usd_value.toFixed(2)}
                                </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default WalletBalance; 