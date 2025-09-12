import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

const generateDailyData = (startDate, numDays) => {
  const data = [];
  let value = 50; 
  for (let i = 0; i < numDays; i++) {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + i);
    const fluctuation = (Math.random() - 0.5) * 5;
    value += fluctuation;
    data.push({
      x: newDate.getTime(), 
      y: Math.round(value * 100) / 100, 
    });
  }
  return data;
};

const FinancialChart = () => {
  const [allData, setAllData] = useState([]);
  const [displaySeries, setDisplaySeries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('1W'); 

  useEffect(() => {
    const today = new Date();
    const startDate = new Date(new Date().setFullYear(today.getFullYear() - 2));
    const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const data = generateDailyData(startDate, totalDays);
    setAllData(data);
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;

    const today = new Date();
    let startDate;

    switch (activeFilter) {
      case '1W':
        startDate = new Date(new Date().setDate(today.getDate() - 7));
        break;
      case '1M':
        startDate = new Date(new Date().setMonth(today.getMonth() - 1));
        break;
      case '1Y':
        startDate = new Date(new Date().setFullYear(today.getFullYear() - 1));
        break;
      case 'ALL':
      default:
        startDate = new Date(allData[0].x);
        break;
    }

    const filteredData = allData.filter(item => item.x >= startDate.getTime());

    setDisplaySeries([
      {
        name: 'Savings',
        data: filteredData,
      },
    ]);
  }, [activeFilter, allData]);

  const chartOptions = {
    chart: {
      type: 'line',
      height: 350,
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: 4,
      curve: 'smooth',
    },
    xaxis: {
      type: 'datetime',
      tickAmount: 6,
    },
    yaxis: {
      title: {
        text: 'Amount (Rs)',
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: ['#3AC249'], 
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    colors: ['#000000'],
  };

  const timeRanges = ['1W', '1M', '1Y', 'ALL'];

  return (
    <div className="bg-white rounded-lg p-4 shadow-md col-span-2 flex flex-col">
      <div id="chart">
        <ReactApexChart
          options={chartOptions}
          series={displaySeries}
          type="line"
          height={300}
        />
      </div>

      <div className="flex justify-center space-x-2 mt-4">
        {timeRanges.map(range => (
          <button
            key={range}
            onClick={() => setActiveFilter(range)}
            className={`px-4 py-2 text-sm rounded-full font-semibold transition-colors ${
              activeFilter === range
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FinancialChart;