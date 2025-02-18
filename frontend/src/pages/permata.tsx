import React, { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import GraphPermata from "@/components/permata/graph";
import TransactionsPermata from "@/components/permata/transactions";
import { formatNumberToKMil } from "@/lib/utils";


export interface TransactionDb {
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount?: number;
  category?: string;
  time?: string;
}

export interface Transaction {
  [key: string]: string; // Allow any string key
  "Posted Date (mm/dd/yyyy)": string;
  Description: string;
  "Credit/Debit": string;
  Amount: string;
}

const parseCSV = (csvText) => {
  const lines = csvText.split("\n");
  const headers = lines[2].split(",").map((header) => header.trim());
  const data = [];

  for (let i = 3; i < lines.length; i++) {
    const values = lines[i].split(",").map((value) => value.trim());
    if (values.length !== headers.length) continue; // Skip incomplete lines

    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = values[j];
    }
    data.push(entry);
  }

  return data;
};


const saveTransactionsToDatabase = async (transactions: Transaction[]) => {
  try {
    const response = await fetch("http://localhost:5500/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        transactions.map((tr) => ({
          posted_date: tr["Posted Date (mm/dd/yyyy)"],
          description: tr.Description,
          credit_debit: tr["Credit/Debit"],
          amount: parseFloat(
            tr.Amount.replace(/[^0-9.-]+/g, "")
              ?.split(".")
              ?.at(0)
          ),
        }))
      ),
    });

    if (!response.ok) {
      throw new Error("Ошибка при сохранении транзакций");
    }

    console.log("Транзакции успешно сохранены");
    return response.json();
  } catch (error) {
    console.error("Ошибка:", error);
  }
};

const TransactionAnalyzer = () => {
  const [transactions, setTransactions] = useState<TransactionDb[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDb[]>([]);

  const [totalDebit, totalCredit] = useMemo(() => {
    let totalD = 0;
    let totalC = 0;
    filteredTransactions.forEach((trs) => {
      if (trs.credit_debit === "Credit") {
        totalC += Number(trs.amount);
      }
      if (trs.credit_debit === "Debit") {
        totalD += Number(trs.amount);
      }
    });
    return [totalD, totalC];
  }, [filteredTransactions]);

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    let allParsedData = [];

    for (const file of files) {
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension === "csv") {
        const text = await file.text();
        const parsedData = parseCSV(text);
        allParsedData = allParsedData.concat(parsedData);
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Take the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        allParsedData = allParsedData.concat(jsonData);
      }
    }

    const res = await saveTransactionsToDatabase(allParsedData);
    console.log(res);
    setTransactions(res.transactions);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      const response = await fetch(`http://localhost:5500/api/transactions`);
      const data: TransactionDb[] = await response.json();
      setTransactions(data);
    };
    fetchTransactions();
  }, [setTransactions]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Analyzer</h1>

      <Card className="mb-4">
        <div className="flex gap-4 p-4">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            multiple
            onChange={handleFileUpload}
          />
          <div className="mb-4">
            <p>
              Total Debit:{" "}
              <span className="font-bold">
                {formatNumberToKMil(totalDebit)}
              </span>
            </p>
            <p>
              Total Credit:{" "}
              <span className="font-bold">
                {formatNumberToKMil(totalCredit)}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[1fr_2fr] gap-4">
        <GraphPermata data={filteredTransactions} />
        <TransactionsPermata 
          data={transactions} 
          onFilterChange={setFilteredTransactions}
          // allTransactions={transactions}
        />
      </div>
    </div>
  );
};

export default TransactionAnalyzer;
