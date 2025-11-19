import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchIcon, PlusCircleIcon, CheckIcon, DocumentIcon, Logo, CalendarIcon } from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";
import AddTransactionForm from "../../component/admin/AddTransactionForm.jsx";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';

const API_BASE = "http://localhost:8080/api";

const TransactionVoucher = ({ transaction, onClose, onStatusUpdate }) => {
  const voucherRef = useRef(null);
  if (!transaction) return null;

  const isFrozen = transaction.status === "Frozen" || transaction.status === "Disputed";

  const mockHistory = [
    { action: "Created", by: "Admin", time: new Date(transaction.date).toLocaleTimeString() },
    ...(isFrozen ? [{ action: "Frozen (Dispute)", by: "Superadmin", time: new Date().toLocaleTimeString() }] : [])
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

  return (
    <div className="flex flex-col gap-6">
      <div ref={voucherRef} id="printable-voucher" className="bg-white p-8 border border-gray-200 shadow-sm rounded-lg text-gray-800 flex flex-col gap-6 relative overflow-hidden">
        
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
            <p className="font-medium text-lg">{transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}</p>
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
              <p className="font-bold text-gray-900 text-lg">{transaction.userName || transaction.user}</p>
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
                      <span className="font-medium font-mono">{transaction.details.chequeNo || '-'}</span>
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
          <span className={`text-3xl font-bold ${
             (transaction.type?.includes('Credit') || transaction.type === 'Deposit') ? 'text-green-600' : 'text-red-600'
          }`}>
             {(transaction.amount || transaction.amountValue || 0).toLocaleString()}
          </span>
        </div>

        <div>
           <p className="text-gray-500 text-xs uppercase font-bold mb-1">Narration / Remarks</p>
           <p className="text-gray-700 italic bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
             {transaction.narration || "No additional remarks provided."}
           </p>
        </div>

        <div>
           <p className="text-gray-500 text-xs uppercase font-bold mb-2">Status History</p>
           <div className="text-xs space-y-1 border-l-2 border-gray-200 pl-3">
              {mockHistory.map((h, i) => (
                <div key={i} className="text-gray-600">
                   <span className="font-semibold text-gray-900">{h.action}</span> by {h.by} at {h.time}
                </div>
              ))}
           </div>
        </div>

        <div className="flex justify-between items-end mt-4 pt-4">
           <div>
             <p className="text-gray-500 text-xs uppercase font-bold mb-1">Current Status</p>
             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                transaction.status === 'Success' ? 'bg-green-100 text-green-700 border-green-200' :
                isFrozen ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {transaction.status}
              </span>
           </div>
           <div className="text-center">
             <div className="h-10 border-b border-gray-400 w-32 mb-1"></div>
             <p className="text-xs text-gray-400 uppercase">Authorized Signature</p>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
           {isFrozen ? (
             <button 
               onClick={() => onStatusUpdate(transaction.id, "Success")}
               className="flex items-center gap-2 text-green-600 hover:text-green-800 text-sm font-bold"
             >
               <CheckIcon className="w-4 h-4" /> Unfreeze / Resolve
             </button>
           ) : (
             <button 
               onClick={() => onStatusUpdate(transaction.id, "Frozen")}
               className="flex items-center gap-2 text-orange-600 hover:text-orange-800 text-sm font-bold"
             >
               <span className="w-2 h-2 rounded-full bg-orange-500"></span> Freeze Transaction
             </button>
           )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">Close</button>
          <button onClick={handleExportVoucher} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-all shadow-lg">
            <DocumentIcon className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

    </div>
  );
};


function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const location = useLocation();

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transactions`); 
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      const enrichedData = (Array.isArray(data) ? data : []).map(t => ({ ...t, status: t.status || "Success" }));
      setTransactions(enrichedData);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (location.state) {
        if (location.state.openTransactionId && transactions.length > 0) {
            const targetTxn = transactions.find(t => t.id == location.state.openTransactionId);
            if (targetTxn) {
                setSelectedTransaction(targetTxn);
                window.history.replaceState({}, document.title);
            }
        }
        
        if (location.state.action === 'openAddTxn') {
            setIsAddModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }
  }, [location, transactions]);

  const handleFilterClick = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setFromDate("");
      setToDate("");
    }
  };

  const handleDateChange = (type, val) => {
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
    setDateFilter('custom');
  };

  const filteredTransactions = useMemo(() => {
    let data = transactions;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilter === "today") {
       data = data.filter(t => t.date && t.date.startsWith(todayStr));
    } else if (dateFilter === "week") {
       const oneWeekAgo = new Date(new Date().setDate(today.getDate() - 7));
       data = data.filter(t => new Date(t.date) >= oneWeekAgo);
    } else if (dateFilter === "month") {
       const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
       data = data.filter(t => new Date(t.date) >= oneMonthAgo);
    } else if (dateFilter === "custom" && fromDate && toDate) {
       data = data.filter(t => {
         if (!t.date) return false;
         const tDate = t.date.split('T')[0];
         return tDate >= fromDate && tDate <= toDate;
       });
    }

    const query = searchQuery.toLowerCase();
    if (query) {
       data = data.filter(log => 
        log.user?.toLowerCase().includes(query) ||
        log.userName?.toLowerCase().includes(query) ||
        log.type?.toLowerCase().includes(query) ||
        log.amount?.toString().includes(query) ||
        log.voucherId?.toLowerCase().includes(query) ||
        log.transactionId?.toLowerCase().includes(query)
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
    if(dateFilter === 'custom') filterText += ` (${fromDate} to ${toDate})`;
    if(searchQuery) filterText += ` | Search: "${searchQuery}"`;
    doc.text(filterText, 14, 30);

    const tableColumn = ["Date", "Voucher", "User / Head", "Type", "Method", "Amount", "Status"];
    
    const tableRows = filteredTransactions.map(t => [
      t.date ? new Date(t.date).toLocaleDateString() : '-',
      t.voucherId || '-',
      t.userName || t.user || '-',
      t.type || '-',
      t.details?.paymentMethod || 'Cash',
      `Rs. ${(t.amount || t.amountValue || 0).toLocaleString()}`,
      t.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });

    doc.save(`Transactions_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleTransactionAdded = () => {
    setIsAddModalOpen(false);
    loadTransactions(); 
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if(!window.confirm(`Are you sure you want to update status?`)) return;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)]"> 
      
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
        
        <div className="relative flex-grow-0 w-full xl:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search Txn ID, Voucher, User..." 
            className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-11 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
          
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full overflow-x-auto">
            {['all', 'today', 'week', 'month'].map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${
                  dateFilter === filter 
                  ? "bg-teal-500 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          
          <div className={`flex items-center gap-2 bg-gray-100 p-1.5 rounded-full transition-all ${dateFilter === 'custom' ? 'ring-2 ring-teal-500 bg-teal-50' : ''}`}>
             <div className="flex items-center px-3 gap-2 border-r border-gray-300 relative">
               <span className="text-xs font-bold text-gray-500 uppercase">From</span>
               <div className="relative">
                 <input 
                   type="date" 
                   value={fromDate} 
                   onChange={(e) => handleDateChange('from', e.target.value)}
                   className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-32 z-10 relative cursor-pointer"
                 />
                 <CalendarIcon className="w-4 h-4 text-teal-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
             </div>
             <div className="flex items-center px-3 gap-2 relative">
               <span className="text-xs font-bold text-gray-500 uppercase">To</span>
               <div className="relative">
                 <input 
                   type="date" 
                   value={toDate} 
                   onChange={(e) => handleDateChange('to', e.target.value)}
                   className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-32 z-10 relative cursor-pointer"
                 />
                 <CalendarIcon className="w-4 h-4 text-teal-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
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
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">S.N</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">Txn ID</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">Voucher</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">Date</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">User / Head</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">Type</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="7" className="py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.slice().reverse().map((log, index) => {
                const isFrozen = log.status === "Frozen" || log.status === "Disputed";
                
                return (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedTransaction(log)} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isFrozen ? 'bg-red-50 border-l-4 border-red-400' : ''}`}
                  >
                    <td className="py-4 px-4 text-gray-600 text-sm font-medium">{index + 1}</td>
                    <td className="py-4 px-4 text-gray-500 text-xs font-mono">{log.transactionId || log.id || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-700 text-sm font-mono font-bold">{log.voucherId || <span className="text-gray-400 italic">N/A</span>}</td>
                    <td className="py-4 px-4 text-gray-600 text-sm">{log.date ? new Date(log.date).toLocaleDateString() : '-'}</td>
                    <td className="py-4 px-4 text-gray-900 font-semibold text-sm">
                      {log.userName || log.user}
                      {log.details?.internalHead && <span className="text-xs text-gray-500 block">({log.details.internalHead})</span>}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                         {log.type}
                         {isFrozen && <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-bold">FROZEN</span>}
                      </div>
                    </td>
                    <td className={`py-4 px-4 font-bold text-right text-sm ${(log.type?.includes('Credit') || log.type === 'Deposit') ? 'text-green-600' : 'text-red-600'}`}>
                        {(log.amount || log.amountValue || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7" className="py-12 text-center text-gray-400">No transactions found in selected range.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        <button title="New Transaction" onClick={() => setIsAddModalOpen(true)} className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all">
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="2xl" title="">
        <AddTransactionForm onAdded={handleTransactionAdded} onClose={() => setIsAddModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} size="2xl" title="">
        <TransactionVoucher transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onStatusUpdate={handleUpdateStatus} />
      </Modal>

    </div>
  );
}

export default AdminTransactions;