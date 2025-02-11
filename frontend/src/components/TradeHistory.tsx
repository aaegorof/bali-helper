import React, { useState, useEffect, useMemo } from "react";
import { Card} from "@/components/ui/card";
import { InputLabel } from "./ui/input";
import {
  AveragePrice,
  calculateAverages,
  calculateProfitLoss,
} from "@/pages/apy-calc/helpers";
import { useDataContext } from "../context/DataContext";
import { TableFull } from "./ui/table";

export interface Trade {
  symbol: string;
  side: string;
  price: number;
  qty: number;
  timestamp: number;
  orderId: string;
}

const TradeHistory = () => {
  const { dataFiles, walletBalances } = useDataContext();
  const [averages, setAverages] = useState<{ [key: string]: AveragePrice }>({});
  const [spotTrades, setSpotTrades] = useState<Trade[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/data-files");
      const data = await response.json();
    } catch (err) {
      console.error("Ошибка при загрузке списка файлов:", err);
    }
  };

  const symbol = useMemo(() => {
    return selectedFile.split("_").at(0);
  }, [selectedFile]);

  const currentBalance = useMemo(() => {
    return walletBalances.find((balance) => symbol.includes(balance.coin));
  }, [symbol, walletBalances]);

  console.log(walletBalances, currentBalance, symbol);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = e.target.value;
    setSelectedFile(filename);

    if (filename) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/data-file/${filename}`
        );
        const data = await response.json();
        setSpotTrades(data);
        const averagesBySymbol = calculateAverages(data);
        setAverages(averagesBySymbol);
      } catch (err) {
        setError("Ошибка при загрузке данных из файла");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDataFiles();
  }, [averages]);

  return (
    <Card>
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
      {isLoading && "Loading..."}
      {error && error}
      <div className="mt-4">
        {Object.entries(averages).map(([symbol, average], index) => {
          const {
            profitLoss,
            profitLossPercentage,
            currentValue,
            unrealisedProfit,
            unrealisedProfitPercentage,
            tradePercentage,
            potentialProfit
          } = calculateProfitLoss(average, currentBalance);

          const totalSpent = average.totalBuyVolume * average.buyAvg;
          const totalEarned = average.totalSellVolume * average.sellAvg;

          return (
            <div key={`${symbol}-${index}`} className="space-y-4 py-4 border-b">
              <div className="font-medium text-lg">{symbol}</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-green-600">Средняя цена покупки:</div>
                  <div>{average.buyAvg.toFixed(2)} USDT</div>
                  <div className="text-sm text-gray-600">
                    Объем: {average.totalBuyVolume.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Общая сумма покупки: {totalSpent.toFixed(2)} USDT
                  </div>
                </div>
                <div>
                  <div className="text-red-600">Средняя цена продажи:</div>
                  <div>{average.sellAvg.toFixed(2)} USDT</div>
                  <div className="text-sm text-gray-600">
                    Объем продаж: {average.totalSellVolume.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Общая сумма продаж: {totalEarned.toFixed(2)} USDT
                  </div>
                </div>
                <div className="text-gray-600">
                  <div>Эффективности торговли:</div>
                  <div
                    className={`text-${
                      tradePercentage > 0 ? "green" : "red"
                    }-600 text-lg font-medium`}
                  >
                    {tradePercentage.toFixed(2)}%
                  </div>
                
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Анализ торговли</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Реализованная П/У:</span>
                    <span
                      className={`text-${
                        profitLoss >= 0 ? "green" : "red"
                      }-600`}
                    >
                      {profitLoss.toFixed(2)} USDT (
                      {profitLossPercentage.toFixed(2)}%)
                    </span>
                  </div>

                  {currentBalance && (
                    <>
                      <div className="flex justify-between text-gray-700">
                        <span>Текущий баланс:</span>
                        <span>
                          {currentBalance.total.toFixed(6)} {symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Текущая цена:</span>
                        <span>
                          {currentBalance.current_price?.toFixed(6)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Текущая стоимость:</span>
                        <span>{currentValue.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Нереализованная П/У:</span>
                        <span
                          className={`text-${
                            unrealisedProfit >= 0 ? "green" : "red"
                          }-600`}
                        >
                          {unrealisedProfit.toFixed(2)} USDT (
                          {unrealisedProfitPercentage.toFixed(2)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          История сделок {spotTrades?.at(0)?.symbol}
        </h3>
        <TableFull
          data={spotTrades}
          columns={[
            {
              header: "Тип",
              accessorKey: "side",
              render: (value) => (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    value.toUpperCase() === "BUY"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {value.toUpperCase()}
                </span>
              ),
            },
            {
              header: "Дата",
              accessorKey: "timestamp",
              render: (value) => new Date(value).toLocaleString(),
            },
            {
              header: "Цена",
              accessorKey: "price",
              className: "text-right",
              render: (value) => value.toFixed(6),
            },
            {
              header: "Объем",
              accessorKey: "qty",
              className: "text-right",
              render: (value) => value.toFixed(8),
            },
            {
              header: "Сумма USD",
              accessorKey: "price",
              className: "text-right",
              render: (value, row) => (value * row.qty).toFixed(2),
            },
          ]}
        />
      </div>
    </Card>
  );
};

export default TradeHistory;
