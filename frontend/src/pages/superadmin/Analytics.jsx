import React, { useEffect, useState } from "react";
import AnalyticsChart, {
  generateSummary,
} from "../../component/superadmin/AnalyticsChart";

const API_BASE = "http://localhost:8080/api";

/* ----------------------------- UI Primitives ----------------------------- */

const Kicker = ({ children }) => (
  <p className="text-[11px] uppercase tracking-widest text-gray-400">
    {children}
  </p>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-medium text-gray-900">{children}</h2>
);

const Divider = () => <div className="border-t border-gray-200 my-10" />;

const Stat = ({ label, value, hint }) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

/* ----------------------------- Sections ----------------------------- */

const RevenueOverview = ({ totals }) => {
  const total =
    (totals.basic || 0) + (totals.premium || 0) + (totals.custom || 0);

  const percent = (v) => (total ? `${Math.round((v / total) * 100)}%` : "—");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Kicker>Financial Performance</Kicker>
        <SectionTitle>Revenue Overview</SectionTitle>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Stat
          label="Total Revenue"
          value={`Rs. ${total.toLocaleString()}`}
          hint="All plans"
        />
        <Stat
          label="Basic"
          value={`Rs. ${(totals.basic || 0).toLocaleString()}`}
          hint={percent(totals.basic || 0)}
        />
        <Stat
          label="Premium"
          value={`Rs. ${(totals.premium || 0).toLocaleString()}`}
          hint={percent(totals.premium || 0)}
        />
        <Stat
          label="Custom"
          value={`Rs. ${(totals.custom || 0).toLocaleString()}`}
          hint={percent(totals.custom || 0)}
        />
      </div>
    </section>
  );
};

const NetworkSnapshot = () => (
  <section className="space-y-6">
    <div className="space-y-1">
      <Kicker>Platform Health</Kicker>
      <SectionTitle>Network Snapshot</SectionTitle>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <Stat label="Networks" value="130" />
      <Stat label="Admins" value="150" />
      <Stat label="Staff" value="1,150" />
      <Stat label="Users" value="30,000" />
    </div>
  </section>
);

const NarrativeSummary = ({ loading, monthlyRevenueData, totals }) => (
  <section className="space-y-4 max-w-3xl">
    <div className="space-y-1">
      <Kicker>Interpretation</Kicker>
      <SectionTitle>Executive Summary</SectionTitle>
    </div>

    {loading ? (
      <p className="text-sm text-gray-500">Generating report narrative…</p>
    ) : (
      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
        {generateSummary(monthlyRevenueData, totals)}
      </p>
    )}
  </section>
);

/* ----------------------------- Main Page ----------------------------- */

export default function Analytics() {
  const [totals, setTotals] = useState({
    basic: 0,
    premium: 0,
    custom: 0,
  });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);

        const totalRes = await fetch(`${API_BASE}/analytics/total-revenue`, {
          credentials: "include",
        });
        setTotals(await totalRes.json());

        const monthlyRes = await fetch(
          `${API_BASE}/analytics/monthly-revenue`,
          { credentials: "include" }
        );
        if (monthlyRes.ok) {
          setMonthlyRevenueData(await monthlyRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    const total = (totals.basic || 0) + (totals.premium || 0) + (totals.custom || 0);
    const percent = (v) => (total ? `${Math.round((v / total) * 100)}%` : "—");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Analytics Report - ${new Date().toLocaleDateString()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              background: white;
              color: #1f2937;
              line-height: 1.6;
            }
            
            .header {
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .header h1 {
              font-size: 28px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .header .date {
              color: #6b7280;
              font-size: 14px;
            }
            
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            
            .kicker {
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 1.5px;
              color: #9ca3af;
              margin-bottom: 4px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 500;
              margin-bottom: 20px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 24px;
              margin-bottom: 20px;
            }
            
            .stat {
              padding: 16px;
              background: #f9fafb;
              border-radius: 8px;
            }
            
            .stat-label {
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            
            .stat-value {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            
            .stat-hint {
              font-size: 11px;
              color: #9ca3af;
            }
            
            .chart-placeholder {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 24px;
              background: #f9fafb;
              text-align: center;
              color: #6b7280;
            }
            
            .summary {
              max-width: 800px;
              line-height: 1.8;
              color: #374151;
              font-size: 14px;
            }
            
            .divider {
              height: 1px;
              background: #e5e7eb;
              margin: 32px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            
            th, td {
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            th {
              background: #f9fafb;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
            }
            
            td {
              font-size: 14px;
            }
            
            @media print {
              body {
                padding: 20px;
              }
              
              .section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <p class="date">Generated on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
          </div>
          
          <div class="section">
            <div class="kicker">Financial Performance</div>
            <h2 class="section-title">Revenue Overview</h2>
            <div class="stats-grid">
              <div class="stat">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">Rs. ${total.toLocaleString()}</div>
                <div class="stat-hint">All plans</div>
              </div>
              <div class="stat">
                <div class="stat-label">Basic</div>
                <div class="stat-value">Rs. ${(totals.basic || 0).toLocaleString()}</div>
                <div class="stat-hint">${percent(totals.basic || 0)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Premium</div>
                <div class="stat-value">Rs. ${(totals.premium || 0).toLocaleString()}</div>
                <div class="stat-hint">${percent(totals.premium || 0)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Custom</div>
                <div class="stat-value">Rs. ${(totals.custom || 0).toLocaleString()}</div>
                <div class="stat-hint">${percent(totals.custom || 0)}</div>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="kicker">Trends</div>
            <h2 class="section-title">Monthly Revenue</h2>
            ${monthlyRevenueData && monthlyRevenueData.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Basic</th>
                    <th>Premium</th>
                    <th>Custom</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyRevenueData.map(item => `
                    <tr>
                      <td>${item.month || item.name}</td>
                      <td>Rs. ${(item.basic || 0).toLocaleString()}</td>
                      <td>Rs. ${(item.premium || 0).toLocaleString()}</td>
                      <td>Rs. ${(item.custom || 0).toLocaleString()}</td>
                      <td><strong>Rs. ${(item.total || 0).toLocaleString()}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="chart-placeholder">No monthly data available</div>'}
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="kicker">Platform Health</div>
            <h2 class="section-title">Network Snapshot</h2>
            <div class="stats-grid">
              <div class="stat">
                <div class="stat-label">Networks</div>
                <div class="stat-value">130</div>
              </div>
              <div class="stat">
                <div class="stat-label">Admins</div>
                <div class="stat-value">150</div>
              </div>
              <div class="stat">
                <div class="stat-label">Staff</div>
                <div class="stat-value">1,150</div>
              </div>
              <div class="stat">
                <div class="stat-label">Users</div>
                <div class="stat-value">30,000</div>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="kicker">Interpretation</div>
            <h2 class="section-title">Executive Summary</h2>
            <div class="summary">
              ${generateSummary(monthlyRevenueData, totals).replace(/\n/g, '<br><br>')}
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Floating PDF Button */}
      <button
        onClick={downloadPDF}
        className="fixed bottom-20 right-6 md:bottom-6 md:right-6 h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition print:hidden"
        title="Download PDF"
      >
        ↓
      </button>

      {/* Content */}
      <div className="px-3 md:px-10 py-6 md:py-10 space-y-8 md:space-y-12 max-w-[1200px] mx-auto">
        <RevenueOverview totals={totals} />

        <Divider />

        {/* Chart */}
        <section className="space-y-4">
          <div className="space-y-1">
            <Kicker>Trends</Kicker>
            <SectionTitle>Monthly Revenue</SectionTitle>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <AnalyticsChart monthlyData={monthlyRevenueData} />
          </div>
        </section>

        <Divider />

        <NetworkSnapshot />

        <Divider />

        <NarrativeSummary
          loading={loading}
          monthlyRevenueData={monthlyRevenueData}
          totals={totals}
        />
      </div>
    </div>
  );
}