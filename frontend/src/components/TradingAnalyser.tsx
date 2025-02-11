import React, { useEffect } from "react";
import WalletBalance from "./WalletBalance";
import TradeHistory from "./TradeHistory";
import UpdateDataForm from "./UpdateDataForm";

const TradingAnalyser = () => {
  return (
    <div className="container mx-auto p-4 grid gap-4">
      <h1 className="text-2xl font-bold mb-4">Анализатор Торговли</h1>
      <WalletBalance />
      <div className="grid gap-4 grid-cols-[1fr_2fr]">
        <UpdateDataForm />

        <TradeHistory />
      </div>
    </div>
  );
};

export default TradingAnalyser;
