from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pybit.unified_trading import HTTP
import json
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Загружаем переменные окружения
load_dotenv()

# Models
class FundingRate(BaseModel):
    symbol: str
    fundingRate: float
    timestamp: int

class Trade(BaseModel):
    symbol: str
    side: str
    price: float
    qty: float
    timestamp: int
    orderId: str

class WalletBalance(BaseModel):
    coin: str
    total: float
    free: float
    locked: float = 0.0
    current_price: float = 0.0
    usd_value: float = 0.0

# Service class for Bybit API
class BybitService:
    def __init__(self):
        self.api_key = os.getenv("BYBIT_API_KEY")
        self.api_secret = os.getenv("BYBIT_API_SECRET")
        self.session = HTTP(
            testnet=False,
            api_key=self.api_key,
            api_secret=self.api_secret
        )

    async def get_funding_rates(self, symbols: List[str]) -> List[FundingRate]:
        results = []
        for symbol in symbols:
            try:
                response = self.session.get_funding_rate_history(
                    category="linear",
                    symbol=symbol,
                    limit=1
                )

                if response["retCode"] == 0 and response["result"]["list"]:
                    latest = response["result"]["list"][0]
                    results.append(
                        FundingRate(
                            symbol=symbol,
                            fundingRate=float(latest["fundingRate"]) * 100,
                            timestamp=int(latest["fundingRateTimestamp"])
                        )
                    )
            except Exception as e:
                print(f"Error fetching funding rate for {symbol}: {str(e)}")

        return results

    async def get_user_trades(self, symbol: str, limit: int = 50) -> List[Trade]:
        try:
            response = self.session.get_executions(
                category="spot",
                symbol=symbol,
                limit=limit
            )

            if response["retCode"] != 0:
                print(f"Ошибка API Bybit: {response}")
                raise HTTPException(status_code=400, detail=response["retMsg"])
            
            print(f"Полный ответ от API: {response}")

            # Проверяем наличие данных
            if not response.get("result", {}).get("list"):
                print("API вернул пустой список сделок")
                return []

            trades = []
            for trade in response["result"]["list"]:
                trades.append(
                    Trade(
                        symbol=trade["symbol"],
                        side=trade["side"],
                        price=float(trade["execPrice"]),  # было "price", стало "execPrice"
                        qty=float(trade["execQty"]),      # было "qty", стало "execQty"
                        timestamp=int(trade["execTime"]),
                        orderId=trade["orderId"]
                    )
                )
            
            print(f"Обработанные сделки: {trades}")
            return trades

        except Exception as e:
            print(f"Исключение в get_user_trades: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_wallet_balance(self) -> List[WalletBalance]:
        try:
            # Получаем список файлов и извлекаем символы
            data_dir = 'data'
            symbols = set()
            for filename in os.listdir(data_dir):
                if filename.endswith('.json'):
                    symbol = filename.split('_')[0]
                    base_symbol = symbol.replace('USDT', '')  # Убираем USDT из названия
                    symbols.add(base_symbol)

            # Преобразуем в список и ограничиваем до 10 символов за раз
            symbols = list(symbols)
            balances = []

            # Обрабатываем символы по 10 за раз
            for i in range(0, len(symbols), 10):
                current_symbols = symbols[i:i + 10]
                print(f"Обрабатываем символы: {current_symbols}")

                # Получаем текущие цены для всех символов
                prices = {}
                for symbol in current_symbols:
                    try:
                        price_response = self.session.get_tickers(
                            category="spot",
                            symbol=f"{symbol}USDT"
                        )
                        if price_response["retCode"] == 0 and price_response["result"]["list"]:
                            prices[symbol] = float(price_response["result"]["list"][0]["lastPrice"])
                    except Exception as e:
                        print(f"Ошибка при получении цены для {symbol}: {str(e)}")
                        prices[symbol] = 0

                # Получаем баланс
                response = self.session.get_coins_balance(
                    accountType="UNIFIED",
                    coin=",".join(current_symbols)  # Объединяем символы через запятую
                )

                if response["retCode"] != 0:
                    raise HTTPException(status_code=400, detail=response["retMsg"])

                # Создаем записи для всех символов, даже с нулевым балансом
                for symbol in current_symbols:
                    current_price = prices.get(symbol, 0)
                    coin_data = next((coin for coin in response["result"]["balance"] if coin["coin"] == symbol), None)
                    
                    if coin_data and float(coin_data["walletBalance"]) > 0:
                        balances.append(
                            WalletBalance(
                                coin=symbol,
                                total=float(coin_data["walletBalance"]),
                                free=float(coin_data["transferBalance"]),
                                locked=float(coin_data["locked"]) if "locked" in coin_data else 0.0,
                                current_price=current_price,
                                usd_value=float(coin_data["walletBalance"]) * current_price
                            )
                        )
                    else:
                        balances.append(
                            WalletBalance(
                                coin=symbol,
                                total=0.0,
                                free=0.0,
                                locked=0.0,
                                current_price=current_price,
                                usd_value=0.0
                            )
                        )
            return balances
        except Exception as e:
            print(f"Ошибка при получении баланса: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Dependency
def get_bybit_service():
    return BybitService()

# Routes
@app.get("/funding-rates", response_model=List[FundingRate])
async def get_funding_rates(
        bybit: BybitService = Depends(get_bybit_service)
):
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    return await bybit.get_funding_rates(symbols)



@app.get("/user/trades/{symbol}", response_model=List[Trade])
async def get_user_trades(
        symbol: str = "ETHUSDT",
        limit: int = 50,
        bybit: BybitService = Depends(get_bybit_service)
):
    try:
        trades = await bybit.get_user_trades(symbol, limit)
        print(f"Получен ответ от Bybit API: {trades}")
        if not trades:
            print("Trades пустой!")
            return []
        return trades
    except Exception as e:
        print(f"Произошла ошибка: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении сделок: {str(e)}"
        )


@app.get("/wallet/balance", response_model=List[WalletBalance])
async def get_wallet_balance(
    bybit: BybitService = Depends(get_bybit_service)
):
    return await bybit.get_wallet_balance()

async def collect_historical_trades(
    symbol: str,
    start_date: datetime,
    end_date: datetime,
    bybit: BybitService,
    limit: int = 100
) -> List[Dict]:
    """
    Собирает исторические данные по торгам за указанный период
    и сохраняет их в JSON файл
    """
    all_trades = []
    current_date = start_date
    
    # Создаем директорию data, если её нет
    os.makedirs('data', exist_ok=True)
    
    filename = f"data/{symbol}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.json"
    
    # Если файл существует, загружаем существующие данные
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            all_trades = json.load(f)
        print(f"Загружено {len(all_trades)} существующих записей из {filename}")
    
    try:
        while current_date < end_date:
            next_date = min(current_date + timedelta(days=7), end_date)
            
            print(f"Запрашиваем данные с {current_date} по {next_date}")
            
            response = bybit.session.get_executions(
                category="spot",
                symbol=symbol,
                limit=limit,
                startTime=int(current_date.timestamp() * 1000),
                endTime=int(next_date.timestamp() * 1000),
                orderStatus="Filled"
            )
            
            if response["retCode"] != 0:
                print(f"Ошибка API Bybit: {response}")
                raise HTTPException(status_code=400, detail=response["retMsg"])
            
            trades = response["result"]["list"]
            
            if trades:
                # Преобразуем данные в формат Trade
                formatted_trades = [
                    {
                        "symbol": trade["symbol"],
                        "side": trade["side"],
                        "price": float(trade["execPrice"]),
                        "qty": float(trade["execQty"]),
                        "timestamp": int(trade["execTime"]),
                        "orderId": trade["orderId"]
                    }
                    for trade in trades
                ]
                
                all_trades.extend(formatted_trades)
                print(f"Получено {len(formatted_trades)} сделок")
                all_trades.sort(key=lambda x: x["timestamp"], reverse=True)
                
                # Сохраняем промежуточные результаты
                with open(filename, 'w') as f:
                    json.dump(all_trades, f, indent=2)
                
                print(f"Данные сохранены в {filename}")
            
            # Задержка между запросами чтобы не превысить лимиты API
            await asyncio.sleep(0.5)
            
            current_date = next_date
        
        return all_trades
    
    except Exception as e:
        print(f"Ошибка при сборе данных: {str(e)}")
        # Сохраняем то, что успели собрать
        if all_trades:
            with open(filename, 'w') as f:
                json.dump(all_trades, f, indent=2)
        raise e

# Добавляем новый эндпоинт для сбора исторических данных
@app.get("/historical-trades/{symbol}")
async def get_historical_trades(
    symbol: str,
    start_date: str,
    end_date: str,
    bybit: BybitService = Depends(get_bybit_service)
):
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        trades = await collect_historical_trades(
            symbol=symbol,
            start_date=start,
            end_date=end,
            bybit=bybit
        )
        
        return {
            "symbol": symbol,
            "start_date": start_date,
            "end_date": end_date,
            "total_trades": len(trades),
            "trades": trades
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-files")
async def get_data_files():
    try:
        data_dir = 'data'
        files = []
        for filename in os.listdir(data_dir):
            if filename.endswith('.json'):
                files.append(filename)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-file/{filename}")
async def get_file_data(filename: str):
    try:
        with open(f"data/{filename}", 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Файл не найден")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    uvicorn.run(app, host="0.0.0.0", port=8000)
