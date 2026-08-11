import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { API_BASE, ApiError, apiFetch } from "../../lib/apiClient";
import { parseTransactions, type TransactionRecord } from "../../lib/transactions";
import { isRecord } from "../../lib/validation";
import {
  SearchIcon,
  DocumentIcon,
  Logo,
} from '../../component/icons';
import Modal from '../../component/superadmin/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import BsDatePicker from '../../component/BsDatePicker';
import { formatDualDate, todayInNepal } from '../../lib/nepaliDate';


const formatBalance = (num: number) => {
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

interface ProcessedTransaction extends TransactionRecord {
  displayAmount: string;
  isCredit: boolean;
  runningBalance: number;
}

interface VoucherProps {
  transaction: ProcessedTransaction;
  onClose: () => void;
}

interface CooperativeInfo {
  name: string;
  address: string;
  panNumber: string;
  logoUrl: string;
}

const UserTransactionVoucher = ({ transaction, onClose }: VoucherProps) => {
  const voucherRef = useRef<HTMLDivElement | null>(null);

  const [sahakariInfo, setSahakariInfo] = useState<CooperativeInfo>({
    name: "",
    address: "",
    panNumber: "",
    logoUrl: "",
  });
  useEffect(() => {
    const fetchSahakari = async () => {
      try {
        const sessionRes = await apiFetch(`${API_BASE}/session`);
        const sessionData: unknown = await sessionRes.json();
        if (!isRecord(sessionData)) return;
        const rawId = sessionData.sahakariId;
        if (typeof rawId !== "number" && typeof rawId !== "string") {
          setSahakariInfo(prev => ({ ...prev, name: typeof sessionData.sahakari === "string" ? sessionData.sahakari : "" }));
          return;
        }
        const sahakariId = encodeURIComponent(String(rawId));

        const networkRes = await apiFetch(`${API_BASE}/networks/${sahakariId}`);
        const network: unknown = await networkRes.json();
        if (!isRecord(network)) return;
        let logoUrl = "";

        if (network.hasLogo === true) {
          try {
            const logoRes = await apiFetch(`${API_BASE}/networks/${sahakariId}/logo/base64`);
            const logoJson: unknown = await logoRes.json();
            if (isRecord(logoJson) && typeof logoJson.data === "string" && typeof logoJson.type === "string" && logoJson.data.length > 0) {
              logoUrl = `data:${logoJson.type};base64,${logoJson.data}`;
            }
          } catch { /* Voucher export works without a logo. */ }
        }

        setSahakariInfo({
          name: typeof network.name === "string" ? network.name : "",
          address: typeof network.address === "string" ? network.address : "",
          panNumber: typeof network.panNumber === "string" ? network.panNumber : "",
          logoUrl,
        });
      } catch { /* Session-scoped transaction details still render. */ }
    };
    void fetchSahakari();
  }, []);

  const totalDisplay = transaction.displayAmount;

  const handleExportVoucher = async () => {
    if (!voucherRef.current) return;
    try {
      const canvas = await html2canvas(voucherRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
      pdf.save(`Voucher-${transaction.voucherId || 'txn'}.pdf`);
    } catch { window.alert("Failed to generate voucher PDF."); }
  };

  return (
    <div className="flex flex-col gap-5 pr-2">
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
              {sahakariInfo.logoUrl ? (
                <img
                  src={sahakariInfo.logoUrl}
                  alt={sahakariInfo.name || "Sahakari Logo"}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Logo className="w-12 h-12 text-teal-600" />
              )}
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  {sahakariInfo.name || "Sahakari Name"}
                </h2>
                <p className="text-xs text-gray-500">
                  {sahakariInfo.address || "Kathmandu, Nepal"}
                  {sahakariInfo.panNumber ? ` | Pan No: ${sahakariInfo.panNumber}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-700">TRANSACTION VOUCHER</h3>
              <p className="text-sm font-mono text-gray-500">#{transaction.voucherId || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Transaction Date</p>
              <p className="font-medium text-lg">
                {transaction.date ? formatDualDate(transaction.date) : '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-bold">System Txn ID</p>
              <p className="font-mono">{transaction.id}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Account / User</p>
                <p className="font-bold text-gray-900 text-lg">
                  {transaction.userName || "Member"}
                </p>
                {transaction.accountHead && (
                  <p className="text-sm text-gray-500">Head: {transaction.accountHead}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Transaction Type</p>
                <p className="font-semibold text-gray-700">{transaction.type}</p>
              </div>
            </div>

            {transaction.paymentMethod && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-bold">Method</span>
                  <span className="font-medium">{transaction.paymentMethod}</span>
                </div>
                {transaction.paymentMethod !== 'Cash' && (
                  <>
                    <div>
                      <span className="block text-xs text-gray-500 uppercase font-bold">Cheque No</span>
                      <span className="font-medium font-mono">
                        {transaction.chequeNo || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 uppercase font-bold">Bank</span>
                      <span className="font-medium">{transaction.bankName || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-4 border-t border-b border-gray-100">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span
              className={`text-3xl font-bold ${transaction.isCredit ? 'text-green-600' : 'text-red-600'
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

          <div className="flex justify-between items-end mt-4 pt-4">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Current Status</p>
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-700 border-green-200">
                {transaction.status || 'Success'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4">
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => { void handleExportVoucher(); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-all shadow-lg"
            >
              <DocumentIcon className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


function Statement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<ProcessedTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const txRes = await apiFetch(`${API_BASE}/transactions`);
        const allTx = parseTransactions(await txRes.json());

        // 1. Filter for User & Sort Oldest to Newest for Calculation
        const myTx = allTx.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

        let runningBalance = 0;

        const processedTx = myTx.map((t) => {
          const numericVal = t.amount;

          // ⭐ FIX: Robust Logic to determine Credit vs Debit (Aligned with Admin Side)
          const direction = t.direction;
          const type = t.type;
          let finalIsCredit = false;

          if (direction === 'Credit' || type.includes('Deposit') || type.includes('Opening')) {
            finalIsCredit = true;
          } else if (direction === 'Debit' || type.includes('Withdraw')) {
            finalIsCredit = false;
          } else {
            // Fallback based on type strings if direction is missing
            finalIsCredit = !type.toLowerCase().includes('withdraw') && !type.toLowerCase().includes('debit');
          }

          if (finalIsCredit) {
            runningBalance += numericVal;
          } else {
            runningBalance -= numericVal;
          }

          return {
            ...t,
            displayAmount: `Rs. ${numericVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            isCredit: finalIsCredit,
            runningBalance,
          };
        });

        // 2. Reverse for Display (Newest First)
        setTransactions(processedTx.reverse());
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) void navigate("/");
        else setError(caught instanceof Error ? caught.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [navigate]);

  const handleFilterClick = (filter: "all" | "today" | "week" | "month") => {
    setDateFilter(filter);
    setFromDate('');
    setToDate('');
  };

  const handleDateChange = (type: "from" | "to", val: string) => {
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
    setDateFilter('custom');
  };

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    const today = todayInNepal();

    if (dateFilter === 'today') {
      data = data.filter((t) => t.date.startsWith(today));
    } else if (dateFilter === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      data = data.filter((t) => new Date(t.date) >= d);
    } else if (dateFilter === 'month') {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      data = data.filter((t) => new Date(t.date) >= d);
    } else if (dateFilter === 'custom' && fromDate && toDate) {
      data = data.filter((t) => {
        const day = t.date.split('T')[0] ?? "";
        return day >= fromDate && day <= toDate;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) =>
        t.type.toLowerCase().includes(q) ||
        t.date.toLowerCase().includes(q) ||
        t.voucherId.toLowerCase().includes(q)
      );
    }
    return data;
  }, [transactions, searchQuery, dateFilter, fromDate, toDate]);

  const handleExportList = () => {
    const doc = new jsPDF();
    doc.text('Account Statement', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDualDate(todayInNepal())}`, 14, 26);

    const tableColumn = ['Date', 'Voucher', 'Description', 'Amount', 'Balance'];

    // ⭐ FIX: Add (Cr)/(Dr) signs to PDF
    const tableRows = filteredTransactions.map((item) => [
      item.date ? formatDualDate(item.date) : '-',
      item.voucherId || '-',
      item.type,
      `${item.isCredit ? '(Cr) +' : '(Dr) -'} ${item.displayAmount}`,
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

  if (loading) return <div className="p-6 text-center">Loading statement...</div>;

  return (
    <div className="bg-white p-4 md:p-6 min-h-[calc(100vh-8.5rem)]">
      {/* Controls Section — stacks on mobile */}
      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-8">
        {/* Search - Left Side */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-2.5 md:py-3 pl-11 pr-4 text-sm md:text-base focus:outline-none focus:bg-white focus:border-gray-300"
          />
        </div>

        {/* Filters & Actions - Right Side */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full md:w-auto">
          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 md:p-1.5 rounded-full overflow-x-auto">
            {(["all", "today", "week", "month"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => { handleFilterClick(filter); }}
                className={`px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-bold rounded-full transition-all whitespace-nowrap ${dateFilter === filter
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-100 p-1 md:p-1.5 rounded-xl sm:rounded-full transition-all ${dateFilter === 'custom' ? 'ring-2 ring-teal-500 bg-teal-50' : ''
              }`}
          >
            <div className="flex items-center px-2 md:px-3 gap-2 sm:border-r border-gray-300 relative">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">From</span>
              <BsDatePicker value={fromDate} onChange={(value) => { handleDateChange('from', value); }} className="w-36" ariaLabel="Statement start date in Bikram Sambat" />
            </div>
            <div className="flex items-center px-2 md:px-3 gap-2 relative">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">To</span>
              <BsDatePicker value={toDate} onChange={(value) => { handleDateChange('to', value); }} className="w-36" ariaLabel="Statement end date in Bikram Sambat" />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportList}
            className="bg-teal-500 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-full hover:bg-teal-600 transition-all text-xs md:text-base whitespace-nowrap shadow-md flex items-center gap-1.5 md:gap-2"
          >
            <DocumentIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Export List</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-left">S.N</th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-left">Date</th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-left hidden md:table-cell">Voucher</th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-left">
                Type
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-right">
                Amount
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-right hidden md:table-cell">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, index) => (
                <tr
                  key={index}
                  onClick={() => { setSelectedTransaction(t); }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-3 md:py-4 px-2 md:px-4 text-gray-600 text-xs md:text-sm font-medium text-left">
                    {index + 1}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-gray-600 text-xs md:text-sm whitespace-nowrap text-left">
                    {t.date}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-gray-500 text-xs font-mono font-bold text-left hidden md:table-cell">
                    {t.voucherId || '-'}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-gray-800 font-semibold text-xs md:text-sm text-left">
                    {t.type}
                    <span className="block text-[10px] md:text-xs text-gray-400 font-normal font-mono mt-0.5 hidden md:block">
                      ID: {t.id.slice(0, 8)}
                    </span>
                  </td>
                  <td
                    className={`py-3 md:py-4 px-2 md:px-4 font-bold text-right text-xs md:text-sm ${t.isCredit ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {t.displayAmount}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 font-bold text-right text-xs md:text-sm text-gray-900 hidden md:table-cell">
                    {formatBalance(t.runningBalance)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">No transactions found.</p>
                  <p className="text-sm mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="mb-4 text-red-600" role="alert">{error}</p>}
      <Modal isOpen={selectedTransaction !== null} onClose={() => { setSelectedTransaction(null); }} title="Transaction voucher" size="2xl">
        {selectedTransaction && <UserTransactionVoucher transaction={selectedTransaction} onClose={() => { setSelectedTransaction(null); }} />}
      </Modal>
    </div>
  );
}

export default Statement;
