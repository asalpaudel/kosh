import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions } from "../../lib/transactions";


interface ChartPoint {
  x: number;
  y: number;
}

interface ChartSeries {
  name: string;
  data: ChartPoint[];
}

type TimeRange = "1W" | "1M" | "1Y" | "ALL";

const FinancialChart = () => {
  const [allData, setAllData] = useState<ChartPoint[]>([]);
  const [displaySeries, setDisplaySeries] = useState<ChartSeries[]>([]);
  const [activeFilter, setActiveFilter] = useState<TimeRange>("ALL");

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/transactions`);
        const transactions = parseTransactions(await response.json());
        transactions.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

        let currentBalance = 0;
        const seriesData = transactions.map((transaction) => {
          const { amount, direction, type } = transaction;

          const isCredit = 
            direction === "Credit" || 
            type.includes("Deposit") || 
            type.includes("Credit") ||
            type.includes("Repayment"); // Repayment is a credit to the network, but usually debit to user wallet. 
            // Wait, standard banking:
            // Credit = Money In (Deposit)
            // Debit = Money Out (Withdrawal)
            
          const isDebit = 
            direction === "Debit" || 
            type.includes("Withdraw") || 
            type.includes("Debit") ||
            type.includes("Disbursement");

          // Apply to Balance
          if (isCredit) {
            currentBalance += amount;
          } else if (isDebit) {
            currentBalance -= amount;
          }
          // If neither (e.g., internal transfer not affecting wallet), balance stays same.

          return {
            x: Date.parse(transaction.date),
            y: currentBalance
          };
        });

        // If no data, add a zero point for today
        if (seriesData.length === 0) {
          seriesData.push({ x: Date.now(), y: 0 });
        }

        setAllData(seriesData);
      } catch (error) {
        console.error("Failed to load financial data:", error);
      }
    };

    void fetchChartData();
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;

    const today = new Date();
    let startDate: Date;

    switch (activeFilter) {
      case "1W": startDate = new Date(today.setDate(today.getDate() - 7)); break;
      case "1M": startDate = new Date(today.setMonth(today.getMonth() - 1)); break;
      case "1Y": startDate = new Date(today.setFullYear(today.getFullYear() - 1)); break;
      case "ALL": startDate = new Date(allData[0]?.x ?? Date.now()); break;
    }

    const startTime = startDate.getTime();

    // 1. Calculate Opening Balance
    let openingBalance = 0;
    const priorData = allData.filter(d => d.x < startTime);
    if (priorData.length > 0) {
      openingBalance = priorData.at(-1)?.y ?? 0;
    }

    // 2. Get Data Points within range
    const filteredData = allData.filter(item => item.x >= startTime);

    // 3. Construct Chart Data
    const chartData = [
      { x: startTime, y: openingBalance },
      ...filteredData
    ];

    // Add final point for 'now'
    chartData.push({ x: Date.now(), y: chartData.at(-1)?.y ?? openingBalance });

    setDisplaySeries([{ name: 'Wallet Balance', data: chartData }]);
  }, [activeFilter, allData]);

  const chartOptions: ApexOptions = {
    chart: { type: 'line', height: 350, zoom: { enabled: false }, toolbar: { show: false }, animations: { enabled: true } },
    stroke: { width: 4, curve: 'smooth' },
    xaxis: { type: 'datetime', tooltip: { enabled: false } },
    yaxis: { title: { text: "Amount (Rs)" }, labels: { formatter: (val: number) => val.toLocaleString("en-IN") } },
    fill: {
      type: 'gradient',
      gradient: { shade: 'dark', gradientToColors: ['#000000'], shadeIntensity: 1, type: 'horizontal', opacityFrom: 1, opacityTo: 1, stops: [0, 100] },
    },
    colors: ['#3AC249'], 
    dataLabels: { enabled: false },
    tooltip: { x: { format: "dd MMM yyyy" }, y: { formatter: (val: number) => `Rs. ${val.toLocaleString("en-IN")}` } },
  };

  const timeRanges: TimeRange[] = ["1W", "1M", "1Y", "ALL"];

  return (
    <div className="bg-white rounded-lg p-4 shadow-md col-span-2 flex flex-col">
      <div id="chart" className="flex-1">
        <ReactApexChart options={chartOptions} series={displaySeries} type="line" height={300} />
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {timeRanges.map(range => (
          <button
            key={range}
            onClick={() => {
              setActiveFilter(range);
            }}
            className={`px-4 py-2 text-sm rounded-full font-semibold transition-colors ${activeFilter === range ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FinancialChart;
