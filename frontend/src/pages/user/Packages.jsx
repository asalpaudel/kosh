import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Check,
  ArrowRight,
  CreditCard,
  Landmark,
  Banknote,
  Briefcase,
} from "lucide-react";
import Modal from "../../component/superadmin/Modal.jsx";
import ApplyPackageForm from "../../component/user/ApplyPackageForm.jsx";
import loanImage from "../../assets/image/loan.png"; 

const apiBase = "http://localhost:8080/api";

// Helper function to get banner URL
const getBannerUrl = (pkg, type) => {
  if (!pkg.id) return null;
  
  switch (type) {
    case "fixed-deposit":
      return `${apiBase}/finance/fixed-deposits/${pkg.id}/banner`;
    case "saving-account":
      return `${apiBase}/finance/saving-accounts/${pkg.id}/banner`;
    case "loan-package":
      return `${apiBase}/finance/loan-packages/${pkg.id}/banner`;
    default:
      return null;
  }
};

// --- Helper Components ---

// 1. The Package Card (Thumbnail)
const PackageCard = ({ pkg, type, onClick, isGrid }) => {
  const [bannerError, setBannerError] = useState(false);
  const bannerUrl = getBannerUrl(pkg, type);

  const getGradient = () => {
    switch (type) {
      case "fixed-deposit":
        return "from-teal-500 to-emerald-700";
      case "saving-account":
        return "from-blue-500 to-indigo-700";
      case "loan-package":
        return "from-rose-500 to-red-700";
      default:
        return "from-gray-700 to-gray-900";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "fixed-deposit":
        return <Landmark className="w-8 h-8 text-white opacity-80" />;
      case "saving-account":
        return <CreditCard className="w-8 h-8 text-white opacity-80" />;
      case "loan-package":
        return <Banknote className="w-8 h-8 text-white opacity-80" />;
      default:
        return <Briefcase className="w-8 h-8 text-white opacity-80" />;
    }
  };

  return (
    <div
      onClick={() => onClick(pkg)}
      className={`relative rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group overflow-hidden shadow-lg ${
        isGrid ? "w-full h-48" : "flex-shrink-0 w-72 h-48"
      }`}
    >
      {/* Banner Image or Gradient Background */}
      {bannerUrl && !bannerError ? (
        <>
          <img
            src={bannerUrl}
            alt={pkg.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setBannerError(true)}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </>
      ) : (
        <>
          {/* Fallback to gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-90 group-hover:opacity-100 transition-opacity`}
          />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-150" />
        </>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          {getIcon()}
          <span className="text-xs font-bold text-white bg-black/30 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
            {pkg.interestRate}% Rate
          </span>
        </div>
        
        <div>
          <h3 className="text-white font-bold text-xl leading-tight drop-shadow-lg line-clamp-2 mb-2">
            {pkg.name}
          </h3>
          
          <div className="flex items-center gap-3 text-xs text-gray-100 font-medium">
            {type === "loan-package" && (
              <span className="bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                Max: Rs. {pkg.maxAmount?.toLocaleString()}
              </span>
            )}
            {type === "fixed-deposit" && (
              <span className="bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                Min: Rs. {pkg.minAmount?.toLocaleString()}
              </span>
            )}
            {type === "saving-account" && (
              <span className="bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                Min Bal: Rs. {pkg.minBalance?.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Section Component (Carousel Logic) - Keep as is
const PackageSection = ({ title, items, type, onItemClick }) => {
  const [showGrid, setShowGrid] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -620 : 620; 
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 500);
    }
  };

  if (!items || items.length === 0) return null;

  if (showGrid) {
    return (
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            <span className="text-sm font-normal text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
              All {items.length}
            </span>
          </h2>
          <button
            onClick={() => setShowGrid(false)}
            className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full"
          >
            Show Less <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <PackageCard 
              key={item.id} 
              pkg={item} 
              type={type} 
              isGrid={true} 
              onClick={() => onItemClick(item, type)} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 relative group">
      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          {title} 
        </h2>
        
        {items.length > 6 && (
           <button 
             onClick={() => setShowGrid(true)}
             className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider flex items-center gap-1"
           >
             View All ({items.length}) <ChevronRight className="w-3 h-3"/>
           </button>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 hover:bg-teal-50 hover:text-teal-700 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-5 pb-6 pt-2 scrollbar-hide px-1"
          style={{ scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <PackageCard
              key={item.id}
              pkg={item}
              type={type}
              isGrid={false}
              onClick={() => onItemClick(item, type)}
            />
          ))}
        </div>

        {canScrollRight && items.length > 4 && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-100 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 hover:bg-teal-50 hover:text-teal-700 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        
        {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-white/90 to-transparent pointer-events-none z-10 block md:hidden" />
        )}
      </div>
    </div>
  );
};

// 3. Detail Modal (with Banner)
const DetailModal = ({ isOpen, onClose, pkg, type, onApply }) => {
  const [bannerError, setBannerError] = useState(false);
  
  if (!isOpen || !pkg) return null;

  const bannerUrl = getBannerUrl(pkg, type);

  const getGradient = () => {
    switch (type) {
      case "fixed-deposit": return "bg-gradient-to-r from-teal-600 to-teal-900";
      case "saving-account": return "bg-gradient-to-r from-blue-600 to-blue-900";
      case "loan-package": return "bg-gradient-to-r from-rose-600 to-red-900";
      default: return "bg-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Banner or Gradient */}
        <div className={`h-72 relative flex items-end p-8 md:p-12 overflow-hidden`}>
          {bannerUrl && !bannerError ? (
            <>
              <img
                src={bannerUrl}
                alt={pkg.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setBannerError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <>
              <div className={`absolute inset-0 ${getGradient()}`} />
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
            </>
          )}
          
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-3 mb-3">
               <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                 {type.replace("-", " ")}
               </span>
               {pkg.interestRate && (
                 <span className="text-green-300 font-bold text-sm flex items-center gap-1">
                   <Check className="w-4 h-4" /> {pkg.interestRate}% Interest Rate
                 </span>
               )}
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-xl tracking-tight">
              {pkg.name}
            </h2>
          </div>
        </div>

        <div className="p-8 md:p-10 overflow-y-auto bg-white">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Package Overview</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {pkg.description || "This package is designed to meet your financial goals with flexible terms and competitive interest rates."}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {pkg.minAmount !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Min Amount</p>
                    <p className="text-xl font-bold text-gray-900">Rs. {pkg.minAmount.toLocaleString()}</p>
                  </div>
                )}
                {pkg.maxAmount !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Max Amount</p>
                    <p className="text-xl font-bold text-gray-900">Rs. {pkg.maxAmount.toLocaleString()}</p>
                  </div>
                )}
                {pkg.minDuration !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Min Duration</p>
                    <p className="text-xl font-bold text-gray-900">{pkg.minDuration} Months</p>
                  </div>
                )}
                {pkg.maxDuration !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Max Duration</p>
                    <p className="text-xl font-bold text-gray-900">{pkg.maxDuration} Months</p>
                  </div>
                )}
                {pkg.minBalance !== undefined && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Min Balance</p>
                    <p className="text-xl font-bold text-gray-900">Rs. {pkg.minBalance.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-80 flex flex-col gap-4 pt-2">
               <div className="p-5 rounded-xl bg-teal-50 border border-teal-100">
                 <h4 className="font-bold text-teal-800 mb-2">Ready to apply?</h4>
                 <p className="text-sm text-teal-600 mb-4">Submit your application today and get processed within 48 hours.</p>
                 <button
                   onClick={onApply}
                   className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                 >
                   <span>Apply Now</span>
                   <ArrowRight className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="text-xs text-gray-400 px-2">
                 <p className="mb-1">• Terms and conditions apply.</p>
                 <p>• Interest rates are subject to market change.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component (Keep rest as is) ---

export default function UserPackages() {
  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [detailModal, setDetailModal] = useState({ open: false, pkg: null, type: null });
  const [applyModal, setApplyModal] = useState({ open: false, pkg: null, type: null });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.sahakariId) {
            setSelectedNetworkId(data.sahakariId);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSessionLoading(false);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (selectedNetworkId) {
      fetchData();
    }
  }, [selectedNetworkId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fdRes, saRes, lpRes] = await Promise.all([
        fetch(`${apiBase}/finance/fixed-deposits/${selectedNetworkId}`, { credentials: "include" }),
        fetch(`${apiBase}/finance/saving-accounts/${selectedNetworkId}`, { credentials: "include" }),
        fetch(`${apiBase}/finance/loan-packages/${selectedNetworkId}`, { credentials: "include" }),
      ]);

      if (fdRes.ok) setFixedDeposits(await fdRes.json());
      if (saRes.ok) setSavingAccounts(await saRes.json());
      if (lpRes.ok) setLoans(await lpRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (pkg, type) => {
    setDetailModal({ open: true, pkg, type });
  };

  const closeDetail = () => {
    setDetailModal({ ...detailModal, open: false });
  };

  const openApply = () => {
    setApplyModal({ 
      open: true, 
      pkg: detailModal.pkg, 
      type: detailModal.type 
    });
    closeDetail();
  };

  const closeApply = () => {
    setApplyModal({ open: false, pkg: null, type: null });
  };

  if (sessionLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    </div>
  );
  
  if (!selectedNetworkId) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-red-500 font-semibold">
      Access Denied. Please login again.
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-20">
      
      <div className="px-4 md:px-8 pt-6 relative z-0">
        <div className="relative h-[45vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center group">
           <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
           <img 
             src={loanImage}
             alt="Featured" 
             className="absolute right-0 top-1/2 -translate-y-1/2 w-2/3 opacity-60 object-cover transition-transform duration-1000 group-hover:scale-105 z-0"
           />
           
           <div className="relative z-20 p-8 md:p-16 max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Dreams</span>
              </h1>
              <p className="text-gray-300 text-lg md:text-xl mb-8 font-light leading-relaxed">
                Explore our curated selection of financial packages. Whether you want to grow your savings or fund your next big project, we have the right plan for you.
              </p>
              <button 
                onClick={() => document.getElementById('loans-section').scrollIntoView({ behavior: 'smooth' })}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 px-8 rounded-full transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              >
                <Info className="w-5 h-5" /> Browse Packages
              </button>
           </div>
        </div>
      </div>

      <div className="px-4 md:px-12 space-y-4 mt-12 relative z-0">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading Packages...</div>
        ) : (
          <>
            <div id="loans-section">
              <PackageSection 
                title="Loans For You" 
                items={loans} 
                type="loan-package" 
                onItemClick={openDetail} 
              />
            </div>

            <PackageSection 
              title="High Yield Fixed Deposits" 
              items={fixedDeposits} 
              type="fixed-deposit" 
              onItemClick={openDetail} 
            />

            <PackageSection 
              title="Saving Accounts" 
              items={savingAccounts} 
              type="saving-account" 
              onItemClick={openDetail} 
            />
          </>
        )}
      </div>

      <DetailModal 
        isOpen={detailModal.open}
        onClose={closeDetail}
        pkg={detailModal.pkg}
        type={detailModal.type}
        onApply={openApply}
      />

      <Modal
        isOpen={applyModal.open}
        onClose={closeApply}
        title="Application Form"
        size="2xl"
      >
        {applyModal.pkg && (
          <ApplyPackageForm
            packageData={applyModal.pkg}
            packageType={applyModal.type}
            onClose={closeApply}
          />
        )}
      </Modal>

    </div>
  );
}