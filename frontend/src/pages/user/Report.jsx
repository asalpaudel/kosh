import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FinancialChart from '../../component/user/FinancialChart';
import PortfolioSummary from '../../component/user/PortfolioSummary';

const apiBase = "http://localhost:8080/api";

// Helper to parse amounts safely
const parseAmount = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.-]/g, ''));
};

// Helper to generate dynamic text
const generateSummary = (data, filter) => {
  if (!data || data.length < 2) {
    return "Not enough data available to generate a summary for this period. Start making transactions to see your financial analysis here.";
  }

  const start = data[0].y;
  const end = data[data.length - 1].y;
  const change = end - start;
  const percentChange = start !== 0 ? ((change / start) * 100).toFixed(1) : 0;
  
  // Find peak
  const peak = data.reduce((max, p) => p.y > max.y ? p : max, data[0]);
  const peakDate = new Date(peak.x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const trend = change >= 0 ? "consistent upward" : "downward";
  const direction = change >= 0 ? "increasing" : "decreasing";
  const timeframe = filter === 'ALL' ? "your total history" : `the last ${filter}`;

  return `Based on your financial activity over ${timeframe}, your savings have shown a ${trend} trend, ${direction} by ${Math.abs(percentChange)}% overall. ` +
    `There was a notable peak of Rs. ${peak.y.toLocaleString()} around ${peakDate}. ` +
    `The current balance stands at Rs. ${end.toLocaleString()}. ` +
    (change > 0 
      ? "We recommend continuing your current savings plan and exploring investment options to further grow your portfolio." 
      : "We recommend reviewing your recent expenses to stabilize your financial growth.");
};

function Report() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chart & Data State
  const [fullHistory, setFullHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('1Y'); // Default to 1 Year

  // 1. Session Check
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, { method: "GET", credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (data.error || (!data.sahakariId && data.userRole !== "superadmin")) {
            navigate('/');
            return;
          }
          setSessionData(data);
        } else {
          navigate('/');
        }
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [navigate]);

  // 2. Fetch Transactions & Calculate Full History
  useEffect(() => {
    if (!sessionData?.userEmail) return;

    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${apiBase}/transactions`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();

        const userId = localStorage.getItem("userId");
        
        // Filter and Sort
        const myTxns = data
          .filter(t => String(t.userId) === String(userId))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate Running Balance
        let currentBalance = 0;
        const history = myTxns.map(t => {
          const amount = parseAmount(t.amount || t.amountValue);
          if (t.type === 'Withdrawal' || (t.type && t.type.includes('Debit'))) {
            currentBalance -= amount;
          } else {
            currentBalance += amount;
          }
          return { x: new Date(t.date).getTime(), y: currentBalance };
        });

        // Ensure we have at least a 'today' point if history is empty, or extend it
        if (history.length === 0) {
          history.push({ x: Date.now(), y: 0 });
        }

        setFullHistory(history);
      } catch (err) {
        console.error("Failed to load report data", err);
      }
    };

    fetchTransactions();
  }, [sessionData]);

  // 3. Filter Data based on activeFilter
  useEffect(() => {
    if (fullHistory.length === 0) return;

    const today = new Date();
    let startDate;

    switch (activeFilter) {
      case '1W': startDate = new Date(today.setDate(today.getDate() - 7)); break;
      case '1M': startDate = new Date(today.setMonth(today.getMonth() - 1)); break;
      case '1Y': startDate = new Date(today.setFullYear(today.getFullYear() - 1)); break;
      case 'ALL': default: startDate = new Date(fullHistory[0].x); break;
    }

    const startTime = startDate.getTime();

    // Calculate Opening Balance for the period
    let openingBalance = 0;
    const priorData = fullHistory.filter(d => d.x < startTime);
    if (priorData.length > 0) {
      openingBalance = priorData[priorData.length - 1].y;
    }

    // Slice data
    const filtered = fullHistory.filter(d => d.x >= startTime);

    // Construct Final Chart Data (Start point + Data + End point)
    const finalData = [
      { x: startTime, y: openingBalance },
      ...filtered,
      { x: Date.now(), y: filtered.length > 0 ? filtered[filtered.length - 1].y : openingBalance }
    ];

    setChartData(finalData);
  }, [activeFilter, fullHistory]);

  if (loading) return (
    <div className="bg-white p-4 flex items-center justify-center min-h-[calc(100vh-8.5rem)]">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  if (!sessionData?.userEmail) return null;

  const summaryText = generateSummary(chartData, activeFilter);

  return (
    <div className="bg-white p-4"> 
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Chart Section */}
            <div>
              <FinancialChart 
                data={chartData} 
                filter={activeFilter} 
                onFilterChange={setActiveFilter} 
              />
            </div>
            
            {/* Dynamic Summary Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Summary</h2>
              <p className="text-gray-600 leading-relaxed">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <PortfolioSummary /> 
          </div>

        </div>
      </div>
    </div>
  );
}

export default Report;