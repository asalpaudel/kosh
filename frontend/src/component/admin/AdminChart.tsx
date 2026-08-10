import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

interface AdminChartData {
  savings?: number;
  fd?: number;
  credit?: number;
}

interface AdminChartProps {
  data?: AdminChartData;
}

function AdminChart({ data }: AdminChartProps) {

  const savingsVal = data?.savings || 0;
  const fdVal = data?.fd || 0;
  const creditVal = data?.credit || 0;

  const series = [savingsVal, fdVal, creditVal];
  const labels = ["Savings (Liquid)", "Fixed Deposit (Locked)", "Loans Granted (Credit)"];
  const colors = ["#3B82F6", "#6366F1", "#8B5CF6"];

  const formatMoney = (val: number | string): string => {
    const n = Number(val || 0);
    if (n >= 10000000) return (n / 10000000).toFixed(2) + "Cr";
    if (n >= 100000) return (n / 100000).toFixed(1) + "L";
    return n.toLocaleString("en-IN");
  };

  const netTotalPool = Math.max(0, savingsVal + fdVal - creditVal);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 340,
      width: "100%",
      fontFamily: "Inter, sans-serif",
    },
    labels,
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              color: "#6B7280",
              offsetY: -4,
            },
            value: {
              show: true,
              fontSize: "18px",
              fontFamily: "Inter, sans-serif",
              fontWeight: "700",
              color: "#111827",
              offsetY: 8,
              formatter: (val: string) => formatMoney(val),
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Pool (Net)",
              fontSize: "13px",
              fontWeight: "600",
              color: "#6B7280",
              formatter: () => "Rs. " + formatMoney(netTotalPool),
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number, opts?: { seriesIndex?: number }) => {
          const isLoans = opts?.seriesIndex === 2;
          return (isLoans ? "- Rs. " : "Rs. ") + val.toLocaleString("en-IN");
        },
      },
    },
  };

  return (
    <div className="flex w-full justify-center">
      <ReactApexChart options={options} series={series} type="donut" height={340} width="100%" />
    </div>
  );
}

export default AdminChart;
