import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming you have this component from shadcnUI
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  [key: string]: string; // Allow any string key
  "Posted Date (mm/dd/yyyy)": string;
  Description: string;
  "Credit/Debit": string;
  Amount: string;
}

const removeDots = (data: Transaction[]) =>
  data.map((i) => ({ ...i, Amount: i.Amount?.split(".")?.at(0) }));

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

  return removeDots(data);
};

const formatNumberToKMil = (value: string | number): string => {
  // Преобразуем входное значение в число
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  // Проверяем корректность числа
  if (isNaN(num)) return "0";

  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(2)} Mil`;
  } else if (absNum >= 1000) {
    return `${(num / 1000).toFixed(0)} K`;
  }

  return num.toString();
};

const TransactionAnalyzer = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeDebit, setIncludeDebit] = useState(true);
  const [includeCredit, setIncludeCredit] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [monthlyData, setMonthlyData] = useState(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortTransactions = (key: string) => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      const aValue = parseFloat(a[key]);
      const bValue = parseFloat(b[key]);
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
    setFilteredTransactions(sorted);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc"); // Переключение направления сортировки
  };

  useEffect(() => {
    applyFilters();
  }, [
    transactions,
    searchTerm,
    includeCredit,
    includeDebit,
    startDate,
    endDate,
  ]);

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

    setTransactions(allParsedData);
  };

  const applyFilters = useCallback(() => {
    let results = [...transactions];

    if (searchTerm) {
      results = results.filter((transaction) =>
        transaction.Description?.toLowerCase().includes(
          searchTerm.toLowerCase()
        )
      );
    }

    results = results.filter((transaction) => {
      if (transaction["Credit/Debit"] === "Debit" && !includeDebit)
        return false;
      if (transaction["Credit/Debit"] === "Credit" && !includeCredit)
        return false;
      return true;
    });

    if (startDate) {
      results = results.filter(
        (transaction) =>
          new Date(transaction["Posted Date (mm/dd/yyyy)"]) >=
          new Date(startDate)
      );
    }

    if (endDate) {
      results = results.filter(
        (transaction) =>
          new Date(transaction["Posted Date (mm/dd/yyyy)"]) <= new Date(endDate)
      );
    }

    setFilteredTransactions(results);
  }, [
    transactions,
    searchTerm,
    includeDebit,
    includeCredit,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    // Calculate Totals
    let debit = 0;
    let credit = 0;

    filteredTransactions.forEach((transaction) => {
      const amount = parseFloat(transaction.Amount);

      if (transaction["Credit/Debit"] === "Debit") {
        debit += amount;
      } else if (transaction["Credit/Debit"] === "Credit") {
        credit += amount;
      }
    });

    setTotalDebit(debit);
    setTotalCredit(credit);
  }, [filteredTransactions]);

  useEffect(() => {
    // Prepare Data for Chart
    const monthly = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction["Posted Date (mm/dd/yyyy)"]);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`; // YYYY-MM

      if (!monthly[monthYear]) {
        monthly[monthYear] = { debit: 0, credit: 0 };
      }

      const amount = parseFloat(transaction.Amount);
      if (transaction["Credit/Debit"] === "Debit") {
        monthly[monthYear].debit += amount;
      } else {
        monthly[monthYear].credit += amount;
      }
    });

    const labels = Object.keys(monthly).sort();
    const debitData = labels.map((month) => monthly[month].debit);
    const creditData = labels.map((month) => monthly[month].credit);

    setMonthlyData({
      labels,
      datasets: [
        {
          label: "Debit",
          data: debitData,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
          label: "Credit",
          data: creditData,
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
      ],
    });
  }, [filteredTransactions]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly Debit and Credit",
      },
    },
  };

  const onSetStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  const onSetEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const clearAll = () => {
    setStartDate(null);
    setEndDate(null);
    setIncludeCredit(true);
    setIncludeDebit(true);
    setSearchTerm("");
  };

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
<div>
    <h2 className="mb-2">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-auto md:grid-flow-col md:items-center gap-4 mb-4">
        <div>
          <Input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* <div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Description">Description</SelectItem>
              <SelectItem value="Posted Date (mm/dd/yyyy)">Date</SelectItem>
              
            </SelectContent>
          </Select>
        </div> */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDebit"
              checked={includeDebit}
              onCheckedChange={setIncludeDebit}
            />
            <label
              htmlFor="includeDebit"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Debit
            </label>
            <Checkbox
              id="includeCredit"
              checked={includeCredit}
              onCheckedChange={setIncludeCredit}
            />
            <label
              htmlFor="includeCredit"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Credit
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="datetime-local"
            value={startDate}
            onChange={onSetStartDate}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="datetime-local"
            value={endDate}
            onChange={onSetEndDate}
          />
          {/* <DatePicker
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            placeholderText="End Date"
            className="w-full"
          /> */}
          {/* <CalendarIcon className="w-4 h-4 opacity-50" /> */}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={clearAll} variant="outline">
            Clear Filters
          </Button>
        </div>
      </div></div>


      <div className="grid grid-cols-[1fr_2fr] gap-4">
        {monthlyData && (
          <div className="mb-4">
            <Bar options={chartOptions} data={monthlyData} />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of your recent transactions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead onClick={() => sortTransactions("Description")}>
                  Description
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead
                  className="text-right"
                  onClick={() => sortTransactions("Amount")}
                >
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {new Date(
                      transaction["Posted Date (mm/dd/yyyy)"]
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.Description}</TableCell>
                  <TableCell>{transaction["Credit/Debit"]}</TableCell>
                  <TableCell className="text-right text-nowrap">
                    {transaction.Amount.toString().replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      " "
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TransactionAnalyzer;
