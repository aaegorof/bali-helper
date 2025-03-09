import { Input } from "@/components/ui/input";
import { useTransactionsContext } from "./transactions-context";
import { useSession } from "next-auth/react";
import XLSX from "xlsx";
import { Transaction } from "@/services/api";
import { TransactionDb } from "@/services/api";
import { saveTransactions } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const parseCSV = (csvText: string): Transaction[] => {
    const lines = csvText.split("\n");
    const headers = lines[2].split(",").map((header: string) => header.trim());
    const data: Transaction[] = [];
  
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
const TransactionUploader = () => {
    const { data: session } = useSession();
    const currentUser = session?.user;

    const { setTransactions } = useTransactionsContext();


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        let allParsedData: Transaction[] = [];
    
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
    
        const res = await saveTransactionsToDatabase(allParsedData, Number(currentUser.id));
        setTransactions(res.transactions);
      };
    
  return (
    <Card>
    <CardHeader>
    <CardTitle>Import Transactions</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
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
          <Input
            type="file"
            accept=".csv, .xlsx, .xls"
            multiple
            className="cursor-pointer bg-accent"
            onChange={handleFileUpload}
            />
    </CardContent>
    </Card>
  );
};

export default TransactionUploader;
