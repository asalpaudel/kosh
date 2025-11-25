import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

export const generateSummary = (monthlyData, revenueTotals) => {
  if (!monthlyData || monthlyData.length === 0) {
    return "No analytics data available.";
  }



  const safeTotals = revenueTotals || { basic: 0, premium: 0, custom: 0 };
  const totalRevenue = safeTotals.basic + safeTotals.premium + safeTotals.custom;

  const entries = Object.entries(safeTotals);
  const highestCategory = entries.length > 0 ? entries.sort((a, b) => b[1] - a[1])[0] : ["None", 0];
  const highestCategoryName = highestCategory[0];

  const last = monthlyData[monthlyData.length - 1];
  const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const lastTotal = last ? (last.basic || 0) + (last.premium || 0) + (last.custom || 0) : 0;
  const prevTotal = previous ? (previous.basic || 0) + (previous.premium || 0) + (previous.custom || 0) : 0;
  console.log("Comparing:", last?.month, lastTotal, "vs", previous?.month, prevTotal);


  const growthRate = prevTotal !== 0 ? (((lastTotal - prevTotal) / prevTotal) * 100).toFixed(1) : 0;

  let bestMonth = "";
  let bestMonthValue = 0;
  monthlyData.forEach((m) => {
    const mTotal = (m.basic || 0) + (m.premium || 0) + (m.custom || 0);
    if (mTotal > bestMonthValue) {
      bestMonthValue = mTotal;
      bestMonth = m.month;
    }
  });

  const trend =
    growthRate > 5
      ? "strong upward growth"
      : growthRate > 0
      ? "slight positive improvement"
      : growthRate < 0
      ? "a decline in performance"
      : "stable performance";

  return `Overall revenue collection stands at Rs. ${totalRevenue.toLocaleString()}. 
  The highest contributing plan is ${highestCategoryName.toUpperCase()}. 
  The latest month (${last?.month || 'N/A'}) recorded a total of Rs. ${lastTotal.toLocaleString()}, showing ${trend} (${growthRate}% compared to the previous month). 
  The best performing month so far is ${bestMonth}, with a peak revenue of Rs. ${bestMonthValue.toLocaleString()}.`;
};

const AnalyticsChart = ({ monthlyData }) => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (monthlyData && monthlyData.length > 0) {
      const months = monthlyData.map(d => d.month);
      setCategories(months);

      setSeries([
        { name: 'Basic', data: monthlyData.map(d => d.basic || 0) },
        { name: 'Premium', data: monthlyData.map(d => d.premium || 0) },
        { name: 'Custom', data: monthlyData.map(d => d.custom || 0) }
      ]);
    } else {
       setCategories([]);
       setSeries([]);
    }
  }, [monthlyData]);

  const options = {
    chart: {
      height: 350,
      type: 'area',
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      type: 'category', 
      categories: categories
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "Rs. " + val.toLocaleString();
        }
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
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
      {monthlyData && monthlyData.length > 0 ? (
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