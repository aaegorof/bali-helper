import React, { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import GraphPermata from "@/components/permata/graph";
import TransactionsPermata from "@/components/permata/transactions";
import { formatNumberToKMil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TRANSACTION_COLORS } from "@/lib/constants";
import { useTransactions } from "@/components/permata/hooks";
import { getUserTransactions, saveTransactions } from "@/services/api";
import { useAuth } from '@/contexts/auth-context';

export interface TransactionDb {
  id?: number;
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount?: number;
  category?: string;
  time?: string;
  transaction_hash?: string;
  user_id?: number;
  created_at?: string;
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

const saveTransactionsToDatabase = async (transactions: Transaction[], userId: number) => {
  try {
    const transactionsToSave: TransactionDb[] = transactions.map((tr) => ({
      posted_date: tr["Posted Date (mm/dd/yyyy)"],
      description: tr.Description,
      credit_debit: tr["Credit/Debit"],
      amount: parseFloat(
        tr.Amount.replace(/[^0-9.-]+/g, "")
          ?.split(".")
          ?.at(0)
      ),
    }));
    const response = await saveTransactions(transactionsToSave, userId);
    return response;
  } catch (error) {
    console.error("Ошибка при сохранении транзакций:", error);
    throw error;
  }
};


const TransactionAnalyzer = () => {
  const { currentUser } = useAuth();
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionDb[]
  >([]);
  
  const { transactions, setTransactions, fetchTransactions } = useTransactions();

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

    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

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

    const res = await saveTransactionsToDatabase(allParsedData, currentUser.id);
    setTransactions(res.transactions);
  };

  useEffect(() => {
    const loadTransactions = async () => {
      if (currentUser) {
        try {
          const data = await getUserTransactions(currentUser.id);
          setTransactions(data);
        } catch (error) {
          console.error('Failed to load transactions:', error);
        }
      }
    };
    
    loadTransactions();
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Analyzer</h1>

      <Card className="mb-4 grid grid-cols-[1fr_2fr_1fr] gap-4">
        <div className="p-4 grid place-content-start gap-8">
          <div className="text-xs">
            <p>
              You can upload a file from Permata Bank export, it will
              automatically save these transactions to the database.
            </p>
            <p>
              After uploading, you will see ulpoaded transactions. If you want
              to see all transactions, you can click on the "All Transactions"
              button.
            </p>
            <p>
              Transactions will be unique by hash, so if you upload the same
              file multiple times, it will not add the same transactions again.
            </p>
          </div>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            multiple
            onChange={handleFileUpload}
          />
          <div className="grid gap-2">
            <h3>Show:</h3>
            <Button
              onClick={async () => {
                if (!currentUser) return;
                const data = await getUserTransactions(currentUser.id);
                setTransactions(data);
              }}
              variant="outline"
            >
              All Transactions
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTransactions(transactions.filter((tr) => !tr.category));
              }}
            >
              Uncategorized transactions
            </Button>
          </div>
        </div>
        <GraphPermata data={filteredTransactions} className="max-h-[400px]" />
        <div className="p-4">
          <p className="text-xs">
            Calculated from{" "}
            {filteredTransactions.length !== transactions.length && (
              <span>
                <span className="font-bold">{filteredTransactions.length}</span>{" "}
                filtered transactions out of
              </span>
            )}{" "}
            <span className="font-bold">{transactions.length}</span> total
            transactions.
          </p>
          <p>
            Total Debit:{" "}
            <span
              className="font-bold"
              style={{ color: TRANSACTION_COLORS.debit.text }}
            >
              {formatNumberToKMil(totalDebit)}
            </span>
          </p>
          <p>
            Total Credit:{" "}
            <span
              className="font-bold"
              style={{ color: TRANSACTION_COLORS.credit.text }}
            >
              {formatNumberToKMil(totalCredit)}
            </span>
          </p>
        </div>
      </Card>

      <div className="grid gap-4">
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
