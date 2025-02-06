import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InputLabel } from "./ui/input"
import { AveragePrice, calculateAverages } from '@/pages/apy-calc/helpers';
import { useDataContext } from '../context/DataContext';


interface Trade {
    symbol: string;
    side: string;
    price: number;
    qty: number;
    timestamp: number;
    orderId: string;
}

type Props = {
 symbol: string
}

export const TradeHistory = () => {
    const { dataFiles, refreshDataFiles } = useDataContext();
    const [averages, setAverages] = useState<{[key: string]: AveragePrice}>({});
    const [spotTrades, setSpotTrades] = useState<Trade[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const fetchDataFiles = async () => {
        try {
            const response = await fetch('http://localhost:8000/data-files');
            const data = await response.json();
        } catch (err) {
            console.error('Ошибка при загрузке списка файлов:', err);
        }
    };



    const handleFileSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const filename = e.target.value;
        setSelectedFile(filename);
        
        if (filename) {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/data-file/${filename}`);
                const data = await response.json();
                setSpotTrades(data);
                const averagesBySymbol = calculateAverages(data);
                setAverages(averagesBySymbol);
            } catch (err) {
                setError('Ошибка при загрузке данных из файла');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleHistoricalTrades = async () => {
        await refreshDataFiles();
    };

    useEffect(() => {
        fetchDataFiles();
    }, [averages]);

return <Card>
    <div className="mt-8">
<InputLabel label="Загруженные данные">
    <select
        value={selectedFile}
        onChange={handleFileSelect}
        className="w-full p-2 border rounded"
    >
        <option value="">Выберите файл</option>
        {dataFiles.map((file) => (
            <option key={file} value={file}>
                {file}
            </option>
        ))}
    </select>
</InputLabel>
</div>

<div className="mt-4">
{Object.entries(averages).map(([symbol, average]) => {
    const totalSpent = average.totalBuyVolume * average.buyAvg;
    const totalEarned = average.totalSellVolume * average.sellAvg;
    const profitLoss = totalEarned - totalSpent;
    const profitLossPercentage = totalSpent > 0 ? (profitLoss / totalSpent) * 100 : 0;

    return (
        <div key={symbol} className="space-y-2 py-4 border-b">
            <div className="font-medium text-lg">{symbol}</div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-green-600">Средняя цена покупки:</div>
                    <div>{average.buyAvg.toFixed(2)} USDT</div>
                    <div className="text-sm text-gray-600">
                        Объем: {average.totalBuyVolume.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600">
                        Общая сумма затрат: {totalSpent.toFixed(2)} USDT
                    </div>
                </div>
                <div>
                    <div className="text-red-600">Средняя цена продажи:</div>
                    <div>{average.sellAvg.toFixed(2)} USDT</div>
                    <div className="text-sm text-gray-600">
                        Объем: {average.totalSellVolume.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600">
                        Общая сумма дохода: {totalEarned.toFixed(2)} USDT
                    </div>
                </div>
            </div>
            <div className="text-sm text-gray-600">
                Прибыль/Убыток: {profitLoss.toFixed(2)} USDT ({profitLossPercentage.toFixed(2)}%)
            </div>
        </div>
    );
})}
</div>

<div className="mt-8">
<h3 className="text-lg font-semibold mb-4">История сделок</h3>
<div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                </th>
                <th className="text-right px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                </th>
                <th className="text-right px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Объем
                </th>
                <th className="text-right px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма USD
                </th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
            {spotTrades.map((trade) => (
                <tr key={`${trade.orderId}-${trade.timestamp}`}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trade.side.toUpperCase() === 'BUY' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                            {trade.side.toUpperCase()}
                        </span>
                    </td>
                    <td className="text-right px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {trade.price.toFixed(2)}
                    </td>
                    <td className="text-right px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {trade.qty.toFixed(2)}
                    </td>
                    <td className="text-right px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {(trade.price * trade.qty).toFixed(2)}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
</div>
</Card>
}