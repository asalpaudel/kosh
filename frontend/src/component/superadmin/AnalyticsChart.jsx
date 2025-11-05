import React, { useEffect, useRef, useState } from 'react';

function AnalyticsChart() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Data from the screenshot
  const series = [
    {
      name: 'Net Profit',
      data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
    },
    {
      name: 'Revenue',
      data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
    },
    {
      name: 'Free Cash Flow',
      data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
    }
  ];

  const options = {
    series: series,
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
          customIcons: [{
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
            index: 0,
            title: 'Menu',
            class: 'custom-icon',
            click: () => {} // No action, just for show
          }]
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
          fontWeight: 500,
        }
      }
    },
    yaxis: {
      title: {
        text: '$ (thousands)',
        style: {
          color: '#6B7280',
          fontWeight: 500,
        }
      }
    },
    fill: {
      opacity: 1
    },
    colors: ['#008FFB', '#00E396', '#FEB019'], // Blue, Green, Yellow
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: 10,
      markers: {
        radius: 12,
      },
    },
    grid: {
      borderColor: '#f1f1f1',
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$ " + val + " thousands"
        }
      }
    }
  };

  // 1. Load the ApexCharts script from CDN
  useEffect(() => {
    if (window.ApexCharts) {
      setIsScriptLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load ApexCharts script');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 2. Render the chart once the script is loaded
  useEffect(() => {
    if (isScriptLoaded && chartRef.current && !chartInstanceRef.current && window.ApexCharts) {
      const chart = new window.ApexCharts(chartRef.current, options);
      chart.render();
      chartInstanceRef.current = chart;
    }

    // 3. Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isScriptLoaded, options]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <div ref={chartRef} style={{ width: '100%' }} />
    </div>
  );
}

export default AnalyticsChart;