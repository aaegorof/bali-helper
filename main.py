import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FundingRate(BaseModel):
    symbol: str
    fundingRate: float
    timestamp: int

@app.get("/funding-rates", response_model=List[FundingRate])
async def get_funding_rates():
    url = "https://api.bybit.com/v5/market/funding/history"
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    results = []

    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        for symbol in symbols:
            params = {
                "category": "linear",
                "symbol": symbol,
                "limit": 1
            }

            response = requests.get(url, params=params, headers=headers, verify=False)
            response.raise_for_status()  # Проверяем статус ответа

            try:
                data = response.json()
                if data.get("retCode") == 0 and data.get("result", {}).get("list"):
                    latest = data["result"]["list"][0]
                    results.append(
                        FundingRate(
                            symbol=symbol,
                            fundingRate=float(latest["fundingRate"]) * 100,
                            timestamp=int(latest["fundingRateTimestamp"])
                        )
                    )
            except ValueError as e:
                print(f"Error parsing JSON for {symbol}: {str(e)}")
                print(f"Response content: {response.content}")
                continue

            time.sleep(0.1)

        if not results:
            raise HTTPException(status_code=500, detail="No data received from Bybit API")

        return results

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import urllib3
    import uvicorn
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    uvicorn.run(app, host="0.0.0.0", port=8000)
