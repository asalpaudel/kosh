import { API_BASE, apiFetch } from "../../lib/apiClient";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isRecord } from "../../lib/validation";
import {
  SearchIcon,
  PlusCircleIcon,
  DocumentIcon,
  Logo,
  CalendarIcon,
} from "../../component/icons";
import Modal from "../../component/superadmin/Modal";
import AddTransactionForm from "../../component/admin/AddTransactionForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";


interface TransactionDetails {
  internalHead: string;
  direction: string;
  paymentMethod: string;
  chequeNo: string;
  bankName: string;
}

interface AdminTransaction {
  id: string;
  transactionId: string;
  voucherId: string;
  userName: string;
  user: string;
  narration: string;
  status: string;
  amount: number;
  amountValue: number;
  date: string;
  type: string;
  details: TransactionDetails;
}

interface TransactionVoucherProps {
  transaction: AdminTransaction | null;
  onClose: () => void;
}

type DateFilter = "all" | "today" | "week" | "month" | "custom";

const textValue = (value: unknown): string => typeof value === "string" ? value : "";
const numericValue = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseAdminTransactions = (value: unknown): AdminTransaction[] => {
  if (!Array.isArray(value)) throw new Error("Invalid transaction response");
  return value.filter(isRecord).map((item, index) => {
    const details = isRecord(item.details) ? item.details : {};
    const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : `transaction-${String(index)}`;
    return {
      id,
      transactionId: typeof item.transactionId === "string" ? item.transactionId : id,
      voucherId: textValue(item.voucherId),
      userName: textValue(item.userName),
      user: textValue(item.user),
      narration: textValue(item.narration),
      status: textValue(item.status) || "Success",
      amount: numericValue(item.amount ?? item.amountValue),
      amountValue: numericValue(item.amountValue ?? item.amount),
      date: textValue(item.date),
      type: textValue(item.type) || "Transaction",
      details: {
        internalHead: textValue(details.internalHead),
        direction: textValue(details.direction),
        paymentMethod: textValue(details.paymentMethod),
        chequeNo: textValue(details.chequeNo),
        bankName: textValue(details.bankName),
      },
    };
  });
};

const TransactionVoucher = ({ transaction, onClose }: TransactionVoucherProps) => {
  const voucherRef = useRef<HTMLDivElement | null>(null);

  const [sahakariInfo, setSahakariInfo] = useState({
    name: "",
    address: "",
    panNumber: "",
    logoUrl: "",
  });
  useEffect(() => {
    const fetchSahakari = async () => {
      try {
        // 1. Get Session
        const sessionRes = await apiFetch(`${API_BASE}/session`);
        const sessionData: unknown = await sessionRes.json();
        if (!isRecord(sessionData)) throw new Error("Invalid session response");
        const sahakariId = Number(sessionData.sahakariId);

        if (!sahakariId) {
          setSahakariInfo(prev => ({ ...prev, name: textValue(sessionData.sahakari) }));
          return;
        }

        // 2. Get Network Info
        const networkRes = await apiFetch(`${API_BASE}/networks/${encodeURIComponent(String(sahakariId))}`);
        const network: unknown = await networkRes.json();
        if (!isRecord(network)) throw new Error("Invalid network response");

        let logoUrl = "";

        // 3. Get Logo
        if (network.hasLogo) {
          try {
            const logoRes = await apiFetch(`${API_BASE}/networks/${encodeURIComponent(String(sahakariId))}/logo/base64`);
            if (logoRes.ok) {
              const logoJson: unknown = await logoRes.json();

              if (isRecord(logoJson) && typeof logoJson.data === "string" && logoJson.data.length > 0 &&
                (logoJson.type === "image/png" || logoJson.type === "image/jpeg" || logoJson.type === "image/webp")) {
                logoUrl = `data:${logoJson.type};base64,${logoJson.data}`;
              }
            }
          } catch {
            logoUrl = "";
          }
        }

        setSahakariInfo({
          name: textValue(network.name),
          address: textValue(network.address),
          panNumber: textValue(network.panNumber),
          logoUrl: logoUrl,
        });

      } catch {
        setSahakariInfo({ name: "", address: "", panNumber: "", logoUrl: "" });
      } finally {
        // Loading state is intentionally local to the voucher fetch lifecycle.
      }
    };

    void fetchSahakari();
  }, []);

  if (!transaction) return null;

  const rawAmount = transaction.amount || transaction.amountValue || 0;

  // Determine if Credit or Debit for color coding in Voucher
  const isCredit = transaction.details.direction === "Credit" ||
    (transaction.type && transaction.type.toLowerCase().includes("credit"));

  const isFrozen =
    transaction.status === "Frozen" || transaction.status === "Disputed";

  const handleExportVoucher = async () => {
    if (!voucherRef.current) return;

    try {
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, pdfHeight);
      pdf.save(`Voucher-${transaction.voucherId || "txn"}.pdf`);
    } catch {
      return;
    }
  };

  return (
    <div className="flex flex-col gap-5 pr-2">
      <div className="flex flex-col gap-6">
        <div
          ref={voucherRef}
          id="printable-voucher"
          className="bg-white p-4 md:p-8 border border-gray-200 shadow-sm rounded-lg text-gray-800 flex flex-col gap-6 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
            <Logo className="w-64 h-64 text-gray-900" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start border-b-2 border-gray-800 pb-4 gap-3">
            <div className="flex items-center gap-3">
              {sahakariInfo.logoUrl ? (
                <img
                  src={sahakariInfo.logoUrl}
                  alt={sahakariInfo.name || "Sahakari Logo"}
                  className="w-12 h-12"
                />
              ) : (
                <Logo className="w-12 h-12 text-teal-600" />
              )}
              <div>
                <h2 className="text-base sm:text-xl font-bold uppercase tracking-wide">
                  {sahakariInfo.name || "Sahakari Name"}
                </h2>
                <p className="text-xs text-gray-500">
                  {sahakariInfo.address || "Kathmandu, Nepal"}
                  {sahakariInfo.panNumber
                    ? ` | Pan No: ${sahakariInfo.panNumber}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-700">
                TRANSACTION VOUCHER
              </h3>
              <p className="text-sm font-mono text-gray-500">
                #{transaction.voucherId || "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">
                Transaction Date
              </p>
              <p className="font-medium text-lg">
                {transaction.date
                  ? new Date(transaction.date).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-bold">
                System Txn ID
              </p>
              <p className="font-mono">
                {transaction.id || transaction.transactionId}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Account / User
                </p>
                <p className="font-bold text-gray-900 text-lg">
                  {transaction.userName || transaction.user}
                </p>
                {transaction.details.internalHead && (
                  <p className="text-sm text-gray-500">
                    Head: {transaction.details.internalHead}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Transaction Type
                </p>
                <p className="font-semibold text-gray-700">{transaction.type}</p>
              </div>
            </div>

            {transaction.details.paymentMethod && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-bold">
                    Method
                  </span>
                  <span className="font-medium">
                    {transaction.details.paymentMethod}
                  </span>
                </div>
                {transaction.details.paymentMethod !== "Cash" && (
                  <>
                    <div>
                      <span className="block text-xs text-gray-500 uppercase font-bold">
                        Cheque No
                      </span>
                      <span className="font-medium font-mono">
                        {transaction.details.chequeNo || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 uppercase font-bold">
                        Bank
                      </span>
                      <span className="font-medium">
                        {transaction.details.bankName || "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-4 border-t border-b border-gray-100">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span
              className={`text-3xl font-bold ${isCredit ? "text-green-600" : "text-red-600"
                }`}
            >
              Rs. {Math.abs(rawAmount).toLocaleString()}
            </span>
          </div>

          <div>
            <p className="text-gray-500 text-xs uppercase font-bold mb-1">
              Narration / Remarks
            </p>
            <p className="text-gray-700 italic bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
              {transaction.narration || "No additional remarks provided."}
            </p>
          </div>

          <div className="flex justify-between items-end mt-4 pt-4">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                Current Status
              </p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${transaction.status === "Success"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : isFrozen
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex gap-3">
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

function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const location = useLocation();

  const loadTransactions = async () => {
    setLoading(true);
    try {
      setError("");
      const res = await apiFetch(`${API_BASE}/transactions/sahakari`);

      if (!res.ok) throw new Error(`Failed to fetch: ${String(res.status)}`);

      setTransactions(parseAdminTransactions(await res.json()));
    } catch {
      setError("Unable to load transactions.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  useEffect(() => {
    if (isRecord(location.state)) {
      if ((typeof location.state.openTransactionId === "string" || typeof location.state.openTransactionId === "number") && transactions.length > 0) {
        const requestedTransactionId = String(location.state.openTransactionId);
        const targetTxn = transactions.find(
          (t) => t.id === requestedTransactionId
        );
        if (targetTxn) {
          setSelectedTransaction(targetTxn);
          window.history.replaceState({}, document.title);
        }
      }

      if (location.state.action === "openAddTxn") {
        setIsAddModalOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, transactions]);

  const handleFilterClick = (filter: DateFilter) => {
    setDateFilter(filter);
    if (filter !== "custom") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleDateChange = (type: "from" | "to", val: string) => {
    if (type === "from") setFromDate(val);
    if (type === "to") setToDate(val);
    setDateFilter("custom");
  };

  const filteredTransactions = useMemo(() => {
    let data = transactions;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0] ?? "";

    if (dateFilter === "today") {
      data = data.filter((t) => t.date && t.date.startsWith(todayStr));
    } else if (dateFilter === "week") {
      const oneWeekAgo = new Date(new Date().setDate(today.getDate() - 7));
      data = data.filter((t) => new Date(t.date) >= oneWeekAgo);
    } else if (dateFilter === "month") {
      const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
      data = data.filter((t) => new Date(t.date) >= oneMonthAgo);
    } else if (dateFilter === "custom" && fromDate && toDate) {
      data = data.filter((t) => {
        if (!t.date) return false;
        const tDate = t.date.split("T")[0] ?? "";
        return tDate >= fromDate && tDate <= toDate;
      });
    }

    const query = searchQuery.toLowerCase();
    if (query) {
      data = data.filter(
        (log) =>
          log.user.toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query) ||
          log.type.toLowerCase().includes(query) ||
          log.amount.toString().includes(query) ||
          log.voucherId.toLowerCase().includes(query) ||
          log.transactionId.toLowerCase().includes(query)
      );
    }

    return data;
  }, [transactions, searchQuery, dateFilter, fromDate, toDate]);

  const handleExportList = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    let filterText = `Filter: ${dateFilter.toUpperCase()}`;
    if (dateFilter === "custom") filterText += ` (${fromDate} to ${toDate})`;
    if (searchQuery) filterText += ` | Search: "${searchQuery}"`;
    doc.text(filterText, 14, 30);

    const tableColumn = [
      "Date",
      "Voucher",
      "User / Head",
      "Type",
      "Method",
      "Amount",
      "Status",
    ];

    const tableRows = filteredTransactions.map((t) => [
      t.date ? new Date(t.date).toLocaleDateString() : "-",
      t.voucherId || "-",
      t.userName || t.user || "-",
      t.type || "-",
      t.details.paymentMethod || "Cash",
      `Rs. ${(t.amount || t.amountValue || 0).toLocaleString()}`,
      t.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });

    doc.save(
      `Transactions_Report_${new Date().toISOString().split("T")[0] ?? "export"}.pdf`
    );
  };

  const handleTransactionAdded = () => {
    setIsAddModalOpen(false);
    void loadTransactions();
  };

  return (
    <div className="bg-white p-3 md:p-6 min-h-[calc(100vh-8.5rem)]">
      {error && <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {/* Controls Section — stacks on mobile */}
      {/* Controls Section — stacks on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        {/* Row 1: Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search Txn ID, Voucher, User..."
            className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-2.5 md:py-3 pl-11 pr-4 text-sm md:text-base focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
          />
        </div>

        {/* Row 2: Filters + Date Pickers + Export */}
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 md:p-1.5 rounded-full overflow-x-auto">
            {(["all", "today", "week", "month"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => { handleFilterClick(filter); }}
                className={`px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-bold rounded-full transition-all whitespace-nowrap ${dateFilter === filter
                  ? "bg-teal-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-100 p-1 md:p-1.5 rounded-xl sm:rounded-full transition-all ${dateFilter === "custom" ? "ring-2 ring-teal-500 bg-teal-50" : ""
              }`}
          >
            <div className="flex items-center px-2 md:px-3 gap-2 sm:border-r border-gray-300 relative">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">
                From
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { handleDateChange("from", e.target.value); }}
                  className="bg-transparent text-xs md:text-sm font-semibold text-gray-700 outline-none w-28 md:w-32 z-10 relative cursor-pointer"
                />
                <CalendarIcon className="w-4 h-4 text-teal-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center px-2 md:px-3 gap-2 relative">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">
                To
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { handleDateChange("to", e.target.value); }}
                  className="bg-transparent text-xs md:text-sm font-semibold text-gray-700 outline-none w-28 md:w-32 z-10 relative cursor-pointer"
                />
                <CalendarIcon className="w-4 h-4 text-teal-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

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
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                S.N
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider hidden lg:table-cell">
                Txn ID
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider hidden md:table-cell">
                Voucher
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                User / Head
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                Type
              </th>
              <th className="py-3 md:py-4 px-2 md:px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions
                .slice()
                .reverse()
                .map((log, index) => {
                  const isFrozen =
                    log.status === "Frozen" || log.status === "Disputed";
                  const rawAmount = log.amount || log.amountValue || 0;

                  // NEW: Determine Credit vs Debit based on direction or type
                  const isCredit = log.details.direction === "Credit" ||
                    (log.type && log.type.toLowerCase().includes("credit"));

                  return (
                    <tr
                      key={log.id}
                      onClick={() => { setSelectedTransaction(log); }}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isFrozen ? "bg-red-50 border-l-4 border-red-400" : ""
                        }`}
                    >
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-600 text-sm font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-500 text-xs font-mono hidden lg:table-cell">
                        {log.transactionId || log.id || "N/A"}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-700 text-xs md:text-sm font-mono font-bold hidden md:table-cell">
                        {log.voucherId || (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-600 text-xs md:text-sm">
                        {log.date
                          ? new Date(log.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-900 font-semibold text-xs md:text-sm">
                        {log.userName || log.user}
                        {log.details.internalHead && (
                          <span className="text-[10px] md:text-xs text-gray-500 block">
                            ({log.details.internalHead})
                          </span>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center gap-1 md:gap-2">
                          {log.type}
                          {isFrozen && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-bold">
                              FROZEN
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`py-3 md:py-4 px-2 md:px-4 font-bold text-right text-xs md:text-sm ${isCredit ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        Rs. {Math.abs(rawAmount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  No transactions found in selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="group fixed z-20 bottom-20 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-3">
        <button
          title="New Transaction"
          onClick={() => { setIsAddModalOpen(true); }}
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); }}
        size="2xl"
        title=""
      >
        <AddTransactionForm
          onAdded={handleTransactionAdded}
        />
      </Modal>

      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => { setSelectedTransaction(null); }}
        size="2xl"
        title=""
      >
        <TransactionVoucher
          transaction={selectedTransaction}
          onClose={() => { setSelectedTransaction(null); }}
        />
      </Modal>
    </div>
  );
}

export default AdminTransactions;
