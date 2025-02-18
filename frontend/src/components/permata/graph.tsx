import { TransactionDb  } from "@/pages/permata";
import React, { useEffect, useState } from "react";
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
import { formatNumberToKMil } from "@/lib/utils";


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );


type Props = {
  data: TransactionDb[];
};

const GraphPermata = ({ data }: Props) => {
  const [monthlyData, setMonthlyData] = useState(null);

  useEffect(() => {
    // Prepare Data for Chart
    const monthly = {};

    data.forEach((transaction) => {
      const date = new Date(transaction.posted_date);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`; // YYYY-MM

      if (!monthly[monthYear]) {
        monthly[monthYear] = { debit: 0, credit: 0 };
      }

      const amount = transaction.amount;
      if (transaction.credit_debit === "Debit") {
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
  }, [data]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "Monthly Debit and Credit",
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumberToKMil(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
  };
  return (
    <div>
      {monthlyData && (
        <div className="mb-4">
          <Bar options={chartOptions} data={monthlyData} />
        </div>
      )}
    </div>
  );
};

export default GraphPermata