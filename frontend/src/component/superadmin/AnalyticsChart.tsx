import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { type MonthlyRevenue } from "./analyticsRevenue";

interface AnalyticsChartProps {
  monthlyData?: MonthlyRevenue[];
}

interface RevenueSeries {
  name: string;
  data: number[];
}

const AnalyticsChart = ({ monthlyData = [] }: AnalyticsChartProps) => {
  const categories = useMemo(() => monthlyData.map((datum) => datum.month), [monthlyData]);
  const series = useMemo<RevenueSeries[]>(
    () => [
      { name: "Basic", data: monthlyData.map((datum) => datum.basic ?? 0) },
      { name: "Premium", data: monthlyData.map((datum) => datum.premium ?? 0) },
      { name: "Custom", data: monthlyData.map((datum) => datum.custom ?? 0) },
    ],
    [monthlyData],
  );

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "area",
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      type: "category",
      categories,
    },
    tooltip: {
      y: {
        formatter(val: number) {
          return "Rs. " + val.toLocaleString();
        }
      }
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-gray-700">Revenue Trends</h3>
      {monthlyData.length > 0 ? (
        <div id="chart">
          <ReactApexChart options={options} series={series} type="area" height={350} />
        </div>
      ) : (
        <div className="h-[350px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          No data available for chart
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
