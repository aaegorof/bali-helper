import React, { useState } from "react";
import { Input } from "./ui/input";
import { InputLabel } from "./ui/input";
import { useDataContext } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const UpdateDataForm = () => {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [limit, setLimit] = useState(100);
  const [startTime, setStartTime] = useState("2023-09-01T00:00");
  const [endTime, setEndTime] = useState("2025-02-05T00:00");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const { refreshDataFiles } = useDataContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popularTickers = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "NEARUSDT", "BCHUSDT", "LINKUSDT", "DOTUSDT", "ADAUSDT", "MNTUSDT"];

  const fetchSpotTrades = async (
    symbol: string,
    limit: number,
    startTime: string,
    endTime: string
  ) => {
    setIsLoading(true);
    try {
      const startTimestamp = startTime
        ? new Date(startTime).toISOString().split(".")[0]
        : undefined;
      const endTimestamp = endTime
        ? new Date(endTime).toISOString().split(".")[0]
        : undefined;

      const url = new URL(`http://localhost:8000/historical-trades/${symbol}`);
      url.searchParams.append("limit", limit.toString());
      if (startTimestamp) url.searchParams.append("start_date", startTimestamp);
      if (endTimestamp) url.searchParams.append("end_date", endTimestamp);
      const response = await fetch(url.toString());
      if (response.ok) {
        refreshDataFiles();
      }
    } catch (err) {
      setError("Ошибка при загрузке данных");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(e.target.value));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSpotTrades(symbol, limit, startTime, endTime);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get data from Bybit API</CardTitle>
      <p className="text-xs text-gray-500">Use it to fetch data from the Bybit API by entering time range for historical trade data. This will parse all trades and creates the files that you can use later, you dont need to do it every time</p>
      </CardHeader>
      <CardContent>
        <div>
          {/* <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="mb-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            {isFormVisible ? "Скрыть форму" : "Показать форму"}
          </button> */}
          {isLoading && <div>Загрузка...</div>}
          {error && <div className="text-red-500">{error}</div>}

          {isFormVisible && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputLabel label="Symbol">
                <Input
                  type="text"
                  value={symbol}
                  onChange={handleSymbolChange}
                  placeholder="Enter symbol"
                />
                <div className="flex gap-2 flex-wrap">
                  {popularTickers.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => setSymbol(ticker)}
                      className=" bg-gray-200 text-xs text-gray-800 p-1 rounded hover:bg-gray-300 transition-colors"
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdateDataForm;
