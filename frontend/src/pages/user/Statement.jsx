import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SearchIcon, 
  DocumentIcon, 
  Logo, 
  XIcon 
} from '../../component/icons';
import Modal from '../../component/superadmin/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';

const API_BASE = "http://localhost:8080/api";

// Helper to parse string to number ONLY for internal Balance calculation
const parseAmountToNumber = (raw) => {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return raw;

  const cleaned = String(raw).replace(/[^\d.-]/g, '').trim(); 
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Helper to format the Calculated Balance (since that is a number)
const formatBalance = (num) => {
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const UserTransactionVoucher = ({ transaction, onClose }) => {
  const voucherRef = useRef(null);
  if (!transaction) return null;

  // Use the raw string directly as requested
  const totalDisplay = transaction.amount || transaction.amountValue || "0";

  const mockHistory = [
    { action: "Created", by: "System", time: new Date(transaction.date).toLocaleTimeString() },
    { action: "Processed", by: "Core Banking", time: new Date(transaction.date).toLocaleTimeString() }
  ];

  const handleExportVoucher = async () => {
    if (!voucherRef.current) return;

    try {
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
      pdf.save(`Voucher-${transaction.voucherId || 'txn'}.pdf`);
    } catch (err) {
      console.error("Voucher export failed:", err);
      alert("Failed to generate voucher PDF.");
    }
  };

  const handleReportIssue = () => {
    const reason = window.prompt("Please describe the issue with this transaction:");
    if (reason) {
      alert("Issue reported successfully! Our support team will review it shortly.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={voucherRef}
        className="bg-white p-8 border border-gray-200 shadow-sm rounded-lg text-gray-800 flex flex-col gap-6 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Logo className="w-64 h-64 text-gray-900" />
        </div>

        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 text-teal-600" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide">Sahakari Name</h2>
              <p className="text-xs text-gray-500">Kathmandu, Nepal | Pan No: 123456789</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-gray-700">TRANSACTION VOUCHER</h3>
            <p className="text-sm font-mono text-gray-500">#{transaction.voucherId || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Transaction Date</p>
            <p className="font-medium text-lg">
              {transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs uppercase font-bold">System Txn ID</p>
            <p className="font-mono">{transaction.id || transaction.transactionId}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Account / User</p>
              <p className="font-bold text-gray-900 text-lg">
                {transaction.userName || transaction.user}
              </p>
              {transaction.details?.internalHead && (
                <p className="text-sm text-gray-500">Head: {transaction.details.internalHead}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Transaction Type</p>
              <p className="font-semibold text-gray-700">{transaction.type}</p>
            </div>
          </div>

          {transaction.details?.paymentMethod && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-xs text-gray-500 uppercase font-bold">Method</span>
                <span className="font-medium">{transaction.details.paymentMethod}</span>
              </div>
              {transaction.details.paymentMethod !== 'Cash' && (
                <>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold">Cheque No</span>
                    <span className="font-medium font-mono">
                      {transaction.details.chequeNo || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold">Bank</span>
                    <span className="font-medium">{transaction.details.bankName || '-'}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center py-4 border-t border-b border-gray-100">
          <span className="text-gray-600 font-medium">Total Amount</span>
          <span
            className={`text-3xl font-bold ${
              transaction.isCredit ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {totalDisplay}
          </span>
        </div>

        <div>
          <p className="text-gray-500 text-xs uppercase font-bold mb-1">Narration / Remarks</p>
          <p className="text-gray-700 italic bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
            {transaction.narration || 'No additional remarks provided.'}
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-xs uppercase font-bold mb-2">Status History</p>
          <div className="text-xs space-y-1 border-l-2 border-gray-200 pl-3">
            {mockHistory.map((h, i) => (
              <div key={i} className="text-gray-600">
                <span className="font-semibold text-gray-900">{h.action}</span> by {h.by} at{' '}
                {h.time}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-end mt-4 pt-4">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Current Status</p>
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-700 border-green-200">
              {transaction.status || 'Success'}
            </span>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-gray-400 w-32 mb-1"></div>
            <p className="text-xs text-gray-400 uppercase">Authorized Signature</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4">
        <button
          onClick={handleReportIssue}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-bold border border-red-200 bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition-colors"
        >
          <XIcon className="w-4 h-4" /> Report an Issue
        </button>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleExportVoucher}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-all shadow-lg"
          >
            <DocumentIcon className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};


function Statement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          navigate('/');
          return;
        }

        const txRes = await fetch(`${API_BASE}/transactions`, {
          credentials: 'include',
        });

        if (!txRes.ok) throw new Error('Failed to load transactions');

        const allTx = await txRes.json();

        const myTx = allTx
          .filter((t) => String(t.userId) === String(userId))
          .sort((a, b) => new Date(a.date) - new Date(b.date)); 

        let runningBalance = 0;

        const processedTx = myTx.map((t) => {
          // We only parse for Math to calculate the running balance
          const numericVal = parseAmountToNumber(t.amount ?? t.amountValue ?? 0);
          // We keep the original string for display
          const displayAmount = t.amount || t.amountValue || "0";

          let isCredit = true;
          if (t.type === 'Withdrawal' || t.type?.includes('Debit')) {
            isCredit = false;
            runningBalance -= numericVal;
          } else {
            runningBalance += numericVal;
          }

          return {
            ...t,
            displayAmount, // Use this raw string in UI
            isCredit,
            runningBalance, 
          };
        });

        setTransactions(processedTx.reverse());
      } catch (error) {
        console.error('Error loading statement:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleFilterClick = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleDateChange = (type, val) => {
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
    setDateFilter('custom');
  };

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      data = data.filter((t) => t.date && t.date.startsWith(todayStr));
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date(new Date().setDate(today.getDate() - 7));
      data = data.filter((t) => new Date(t.date) >= oneWeekAgo);
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
      data = data.filter((t) => new Date(t.date) >= oneMonthAgo);
    } else if (dateFilter === 'custom' && fromDate && toDate) {
      data = data.filter((t) => {
        if (!t.date) return false;
        const tDate = t.date.split('T')[0];
        return tDate >= fromDate && tDate <= toDate;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) => {
        return (
          t.type?.toLowerCase().includes(q) ||
          (t.date && t.date.toLowerCase().includes(q)) ||
          (t.voucherId && t.voucherId.toLowerCase().includes(q)) ||
          (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
          (t.displayAmount && String(t.displayAmount).toLowerCase().includes(q))
        );
      });
    }

    return data;
  }, [transactions, searchQuery, dateFilter, fromDate, toDate]);

  const handleExportList = () => {
    const doc = new jsPDF();
    doc.text('Account Statement', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

    const tableColumn = ['Date', 'Voucher', 'Description', 'Amount', 'Balance'];
    const tableRows = filteredTransactions.map((item) => [
      item.date,
      item.voucherId || '-',
      item.type,
      `${item.isCredit ? '+' : '-'} ${item.displayAmount}`, 
      formatBalance(item.runningBalance),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
    });

    doc.save('my-statement.pdf');
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-center min-h-[calc(100vh-8.5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your statement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)]">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
        <div className="relative flex-grow-0 w-full xl:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-11 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full overflow-x-auto">
            {['all', 'today', 'week', 'month'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${
                  dateFilter === filter
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center gap-2 bg-gray-100 p-1.5 rounded-full transition-all ${
              dateFilter === 'custom' ? 'ring-2 ring-teal-500 bg-teal-50' : ''
            }`}
          >
            <div className="flex items-center px-3 gap-2 border-r border-gray-300 relative">
              <span className="text-xs font-bold text-gray-500 uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-28 cursor-pointer"
              />
            </div>
            <div className="flex items-center px-3 gap-2 relative">
              <span className="text-xs font-bold text-gray-500 uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-28 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleExportList}
            className="bg-teal-500 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-600 transition-all text-base whitespace-nowrap shadow-md flex items-center gap-2"
          >
            <DocumentIcon className="w-5 h-5" /> Export List
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-left">S.N</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-left">Date</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-left">Voucher</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-left">
                Type / Description
              </th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedTransaction(t)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4 text-gray-600 text-sm font-medium text-left">
                    {index + 1}
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap text-left">
                    {t.date}
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-xs font-mono font-bold text-left">
                    {t.voucherId || '-'}
                  </td>
                  <td className="py-4 px-4 text-gray-800 font-semibold text-sm text-left">
                    {t.type}
                    <span className="block text-xs text-gray-400 font-normal font-mono mt-0.5">
                      ID: {t.transactionId ? t.transactionId.substring(0, 8) : 'N/A'}
                    </span>
                  </td>
                  <td
                    className={`py-4 px-4 font-bold text-right text-sm ${
                      t.isCredit ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.isCredit ? '+' : '-'} {t.displayAmount}
                  </td>
                  <td className="py-4 px-4 font-bold text-right text-sm text-gray-900">
                    {formatBalance(t.runningBalance)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">No transactions found.</p>
                  <p className="text-sm mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        size="2xl"
        title=""
      >
        <UserTransactionVoucher
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </Modal>
    </div>
  );
}

export default Statement;