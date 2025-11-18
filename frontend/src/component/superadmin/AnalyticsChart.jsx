import React, { useEffect, useRef, useState } from "react";

function AnalyticsChart() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/analytics/monthly-revenue", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!window.ApexCharts || data.length === 0) return;

    const series = [
      {
        name: "Basic",
        data: data.map((d) => d.basic),
      },
      {
        name: "Premium",
        data: data.map((d) => d.premium),
      },
      {
        name: "Custom",
        data: data.map((d) => d.custom),
      },
    ];

    const options = {
      chart: { type: "bar", height: 350 },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "55%", endingShape: "rounded" },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: { categories: data.map((d) => d.month) },
      yaxis: { title: { text: "Revenue" } },
      fill: { opacity: 1 },
      colors: ["#008FFB", "#00E396", "#FEB019"],
      legend: { position: "bottom", horizontalAlign: "center" },
      tooltip: {
        y: { formatter: (val) => `$ ${val}` },
      },
      series: series,
    };

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    chartInstanceRef.current = new window.ApexCharts(chartRef.current, options);
    chartInstanceRef.current.render();
  }, [data]);

  useEffect(() => {
    if (!window.ApexCharts) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/apexcharts";
      script.onload = () => {
        if (!chartInstanceRef.current) setData([...data]);
      };
      document.head.appendChild(script);
    }
  }, []);

  return <div ref={chartRef} style={{ width: "100%" }} />;
}

export default AnalyticsChart;
