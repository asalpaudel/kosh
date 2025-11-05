import React, { useEffect, useRef, useState } from 'react';

function NetworkDonutChart() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Sample data
  const series = [44000, 55000, 41000]; // Using Rs values
  const labels = ['Basic', 'Premium', 'Custom'];
  
  // Calculate the total
  const totalValue = series.reduce((a, b) => a + b, 0);

  const options = {
    series: series,
    chart: {
      type: 'donut',
      height: 350,
      width: '100%',
    },
    labels: labels,
    colors: ['#00E396', '#008FFB', '#FEB019'], // Green, Blue, Yellow
    
    // --- MODIFICATIONS START ---
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true, // Show labels in the center
            name: {
              show: true,
              fontSize: '16px',
              color: '#6E8192',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#111827',
              offsetY: 10,
              formatter: function (val) {
                // Format the value as Indian Rupees
                return "Rs. " + parseFloat(val).toLocaleString('en-IN');
              }
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 'medium',
              color: '#6E8192',
              formatter: function (w) {
                // Calculate total from all series
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return "Rs. " + total.toLocaleString('en-IN');
              }
            }
          }
        },
        // Add a subtle drop shadow for depth
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 3,
          opacity: 0.15
        }
      }
    },
    
    // Show the legend at the bottom
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      markers: {
        radius: 12,
      },
      itemMargin: {
        horizontal: 10,
      },
    },
    
    // Remove the white border between slices
    stroke: {
      width: 0,
    },
    // --- MODIFICATIONS END ---
    
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "Rs. " + val.toLocaleString("en-IN");
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
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
      // Clean up script tag if component unmounts before load
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
  }, [isScriptLoaded, options]); // Re-run if options change

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex items-center justify-center">
      {/* This div is where the chart will be rendered */}
      <div ref={chartRef} style={{ width: '100%' }} />
    </div>
  );
}

export default NetworkDonutChart;