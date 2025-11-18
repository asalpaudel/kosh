import React, { useState, useEffect, useRef } from "react";
import { 
  BanknotesIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  BuildingIcon,
  CalendarIcon // Assuming this is exported from your icons file
} from "../icons";

const apiBase = "http://localhost:8080/api";

// --- 📅 Helper: Custom Calendar Component with Year Select ---
const CustomCalendar = ({ selectedDate, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Generate Year Options (1950 - 2030)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 50 + i);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handleMonthChange = (e) => {
     setCurrentMonth(new Date(year, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e) => {
     setCurrentMonth(new Date(parseInt(e.target.value), month, 1));
  };

  const handleDayClick = (day) => {
    const newDate = new Date(year, month, day);
    // Fix timezone offset for YYYY-MM-DD string
    const offset = newDate.getTimezoneOffset();
    const localDate = new Date(newDate.getTime() - (offset*60*1000));
    onChange(localDate.toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 z-50 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 select-none">
      {/* Header with Dropdowns */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-600">←</button>
        
        <div className="flex gap-2">
          {/* Month Select */}
          <select 
            value={month} 
            onChange={handleMonthChange}
            className="bg-gray-100 rounded px-2 py-1 text-sm font-bold outline-none cursor-pointer hover:bg-gray-200 text-gray-700"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          {/* Year Select */}
          <select 
            value={year} 
            onChange={handleYearChange}
            className="bg-gray-100 rounded px-2 py-1 text-sm font-bold outline-none cursor-pointer hover:bg-gray-200 text-gray-700"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-600">→</button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {days.map((d, i) => (
          <span key={d} className={`text-xs font-bold ${i === 6 ? 'text-red-500' : 'text-gray-500'}`}>
            {d}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dateStr = new Date(year, month, day).toISOString().split('T')[0];
          const isSelected = selectedDate === dateStr;
          const isSat = new Date(year, month, day).getDay() === 6;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`
                h-9 w-9 rounded-full text-sm flex items-center justify-center transition-colors
                ${isSelected ? 'bg-teal-600 text-white font-bold shadow-md' : 'hover:bg-teal-50'}
                ${isSat && !isSelected ? 'text-red-600 font-medium' : 'text-gray-700'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};


function AddTransactionForm({ onAdded, onClose }) {
  const [mode, setMode] = useState("member");
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const [formData, setFormData] = useState({
    voucherId: `V-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString().split('T')[0],
    fyType: "Current FY",
    
    userId: null,
    userName: "",
    userProduct: "Savings", 
    internalHead: "", 
    headCategory: "Expense",
    networkLedger: "Cash", 
    transactionType: "Credit", 
    amountValue: "",
    paymentMethod: "Cash",
    chequeNo: "",
    bankName: "",
    receivedBy: "", 
    narration: "",
  });

  const [balances, setBalances] = useState({ current: 0, projected: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [showUserResults, setShowUserResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Balance Calc (Mock)
  useEffect(() => {
    if (mode === "member" && formData.userId) {
      const mockCurrentBalance = 45000; 
      const amount = parseFloat(formData.amountValue) || 0;
      let newBal = mockCurrentBalance;
      if (formData.transactionType === "Credit") {
        newBal += amount;
      } else {
        newBal -= amount;
      }
      setBalances({ current: mockCurrentBalance, projected: newBal });
    }
  }, [formData.userId, formData.userProduct, formData.amountValue, formData.transactionType, mode]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧠 Manual Date Input Handler
  const handleDateInput = (e) => {
    setFormData((prev) => ({ ...prev, date: e.target.value }));
  };

  const handleUserSearchChange = (e) => {
    const query = e.target.value;
    setUserSearch(query);
    if (query === "") setFormData((prev) => ({ ...prev, userId: null, userName: "" }));
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.length < 2) {
      setUserResults([]);
      setShowUserResults(false);
      return;
    }
    setShowUserResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBase}/users?search=${query}`);
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUserResults(data);
      } catch (err) {
        console.error("User search error:", err);
        setUserResults([]);
      }
    }, 300);
  };

  const handleUserSelect = (user) => {
    setFormData((prev) => ({ ...prev, userId: user.id, userName: user.name }));
    setUserSearch(user.name);
    setShowUserResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "member" && !formData.userId) {
      setError("Please select a User.");
      setLoading(false);
      return;
    }
    if (!formData.amountValue) {
      setError("Please enter an Amount.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        voucherId: mode === "member" ? formData.voucherId : null,
        date: formData.date,
        status: "Success",
        userId: mode === "member" ? formData.userId : null,
        userName: mode === "member" ? formData.userName : "Sahakari Network",
        details: {
          mode,
          fyType: formData.fyType,
          accountHead: mode === "member" ? formData.userProduct : `${formData.headCategory}: ${formData.internalHead}`,
          networkLedger: formData.networkLedger,
          direction: formData.transactionType,
          paymentMethod: formData.paymentMethod,
          chequeNo: formData.chequeNo,
          bankName: formData.bankName,
          receivedBy: formData.receivedBy,
        },
        type: mode === "member" 
          ? `${formData.userProduct} (${formData.transactionType})` 
          : `${formData.headCategory} (${formData.transactionType})`,
        amountValue: parseFloat(formData.amountValue),
        narration: formData.narration,
      };

      const response = await fetch(`${apiBase}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-gray-800 pb-4">
      
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-full text-teal-600">
            <BanknotesIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Transaction Entry</h3>
            <p className="text-xs text-gray-500">Double-entry ledger</p>
          </div>
        </div>
        
        <div className="relative bg-gray-200 p-1 rounded-full flex items-center w-48 h-10 cursor-pointer shadow-inner" onClick={() => setMode(mode === 'member' ? 'network' : 'member')}>
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-teal-500 rounded-full shadow-md transition-all duration-300 ease-in-out z-0 ${mode === 'member' ? 'left-1' : 'left-[50%]'}`} />
          <button type="button" onClick={(e) => { e.stopPropagation(); setMode("member"); }} className={`relative z-10 w-1/2 flex items-center justify-center gap-2 text-sm font-bold transition-colors duration-300 ${mode === 'member' ? 'text-white' : 'text-gray-600'}`}><UsersIcon className="w-4 h-4" /> User</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setMode("network"); }} className={`relative z-10 w-1/2 flex items-center justify-center gap-2 text-sm font-bold transition-colors duration-300 ${mode === 'network' ? 'text-white' : 'text-gray-600'}`}><BuildingIcon className="w-4 h-4" /> Network</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded">{error}</div>}

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className={mode === 'network' ? 'opacity-40 pointer-events-none grayscale' : ''}>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Voucher ID</label>
          <input name="voucherId" value={mode === 'network' ? 'N/A' : formData.voucherId} onChange={handleChange} disabled={mode === 'network'} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-black disabled:bg-gray-100" />
        </div>
        
        {/* 📅 Date Input with Manual Entry + Popup */}
        <div className="relative" ref={calendarRef}>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
          <div className="relative w-full">
            <input 
              type="text" 
              value={formData.date} 
              onChange={handleDateInput}
              placeholder="YYYY-MM-DD"
              onFocus={() => setShowCalendar(true)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black font-mono z-10 relative"
            />
            <span 
               className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-20"
               onClick={() => setShowCalendar(!showCalendar)}
            >
               {/* 📅 Teal Calendar Icon */}
               <CalendarIcon className="w-4 h-4 text-teal-600" />
            </span>
          </div>
          
          {showCalendar && (
            <CustomCalendar 
              selectedDate={formData.date} 
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Period</label>
          <select name="fyType" value={formData.fyType} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black">
            <option value="Current FY">Current FY</option>
            <option value="Opening Balance">Opening Balance</option>
          </select>
        </div>
      </div>

      {/* MIDDLE SECTION: Mapping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Side */}
        <div className={`flex flex-col gap-3 p-4 rounded-xl border-l-4 ${mode === 'member' ? 'bg-teal-50 border-teal-500' : 'bg-orange-50 border-orange-500'}`}>
          <label className={`text-sm font-bold flex items-center gap-2 ${mode === 'member' ? 'text-teal-700' : 'text-orange-700'}`}>{mode === 'member' ? 'User / Member Side' : 'Internal / Network Side'}</label>
          
          {mode === "member" ? (
            <>
              <div className="relative" ref={searchBoxRef}>
                <input type="text" value={userSearch} onChange={handleUserSearchChange} onFocus={() => userSearch.length > 1 && setShowUserResults(true)} placeholder="Search Member..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                {showUserResults && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {userResults.map((u) => (
                      <div key={u.id} onClick={() => handleUserSelect(u)} className="p-2 hover:bg-teal-50 cursor-pointer text-sm border-b last:border-0">
                        <div className="font-semibold">{u.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select name="userProduct" value={formData.userProduct} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500">
                <option value="Savings">Savings Account (Sv)</option>
                <option value="Fixed Deposit">Fixed Deposit (FD)</option>
                <option value="Recurring Deposit">Recurring Deposit (RD)</option>
                <option value="Loan">Loan Account (Lg)</option>
              </select>
            </>
          ) : (
            <>
              <select name="headCategory" value={formData.headCategory} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500">
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
              <input type="text" name="internalHead" value={formData.internalHead} onChange={handleChange} placeholder="e.g., Office Rent" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500" />
            </>
          )}
        </div>

        {/* Network Side */}
        <div className="flex flex-col gap-3 p-4 rounded-xl border-l-4 border-blue-500 bg-blue-50">
          <label className="text-sm font-bold text-blue-700 flex items-center gap-2">Sahakari Ledger</label>
          <select name="networkLedger" value={formData.networkLedger} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
            <option value="Cash">Cash Account</option>
            <option value="Bank">Bank Account (Global IME)</option>
          </select>
          <div className="flex gap-2">
             <button type="button" onClick={() => setFormData(prev => ({...prev, transactionType: "Credit"}))} className={`flex-1 py-2 text-sm font-semibold rounded-lg border ${formData.transactionType === "Credit" ? "bg-green-100 border-green-500 text-green-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Deposit (+)</button>
             <button type="button" onClick={() => setFormData(prev => ({...prev, transactionType: "Debit"}))} className={`flex-1 py-2 text-sm font-semibold rounded-lg border ${formData.transactionType === "Debit" ? "bg-red-100 border-red-500 text-red-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Withdraw (-)</button>
          </div>
        </div>
      </div>

      {/* Running Balance */}
      {mode === 'member' && formData.userId && (
        <div className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
          <div className="text-sm text-gray-600">Current: <span className="font-bold text-black">Rs. {balances.current.toLocaleString()}</span></div>
          <div className="text-gray-400">→</div>
          <div className="text-sm text-gray-600">Projected: <span className={`font-bold ${balances.projected < 0 ? 'text-red-600' : 'text-green-600'}`}>Rs. {balances.projected.toLocaleString()}</span></div>
        </div>
      )}

      {/* New Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
          <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black">
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        {formData.paymentMethod !== "Cash" && (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cheque / Ref No.</label>
              <input type="text" name="chequeNo" value={formData.chequeNo} onChange={handleChange} placeholder="XXXXXX" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g., NIC Asia" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </>
        )}

        {formData.paymentMethod === "Cash" && (
           <div className="md:col-span-2">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received By</label>
             <input type="text" name="receivedBy" value={formData.receivedBy} onChange={handleChange} placeholder="Staff Name" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black" />
           </div>
        )}
      </div>

      {/* Amount & Narration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
            <input name="amountValue" type="number" step="0.01" value={formData.amountValue} onChange={handleChange} placeholder="0.00" className="w-full pl-10 pr-4 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:border-black outline-none" />
          </div>
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><DocumentTextIcon className="w-3 h-3" /> Narration</label>
           <textarea name="narration" value={formData.narration} onChange={handleChange} placeholder="Remarks..." rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black outline-none resize-none h-[52px]" />
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Processing..." : `Save ${mode === 'member' ? 'Member' : 'Network'} Voucher`}
        </button>
      </div>
    </form>
  );
}

export default AddTransactionForm;