import { useState, useEffect } from 'react';
import { 
  Archive, ArrowUpCircle, ArrowDownCircle, Activity, Edit3, Info, AlertTriangle,
  PlusCircle, BarChart3, ScanLine // Added icons for Quick Actions
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Unit, MovementLogEntry } from '../types'; // Import the shared Item and Unit types
import { AddItemModal } from '../components/AddItemModal'; // Import AddItemModal

// Removed imports: Search, Plus, SearchBar, ItemCard, AdjustQuantityModal

export const Dashboard = () => {
  const { setActivePage, openScanner } = useAppContext(); // Make sure useAppContext is providing setActivePage

  const [dashboardStats, setDashboardStats] = useState<any>({
    totalItems: 0,
    additionsToday: 0, // Placeholder - requires API endpoint
    withdrawalsToday: 0, // Placeholder - requires API endpoint
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentLogs, setRecentLogs] = useState<MovementLogEntry[]>([]);
  const [isLoadingRecentLogs, setIsLoadingRecentLogs] = useState(true);
  const [recentLogsError, setRecentLogsError] = useState<string | null>(null);

  // State for AddItemModal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [dashboardUnits, setDashboardUnits] = useState<Unit[]>([]);

  const fetchDashboardInitialData = async () => { // Renamed for clarity, includes units
    setIsLoading(true);
    setError(null);
    try {
      // Fetch total items
      const itemsResponse = await fetch('/api/items/');
      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch items: ${itemsResponse.statusText}`);
      }
      const itemsData = await itemsResponse.json();
      
      // Fetch units for AddItemModal
      const unitsResponse = await fetch('/api/units');
      if (!unitsResponse.ok) {
        const errorData = await unitsResponse.json().catch(() => ({}));
        console.warn(errorData.message || `Failed to fetch units: ${unitsResponse.statusText}`);
        // Proceed without units if this fails, modal might be partially non-functional for unit selection
      } else {
        const unitsData = await unitsResponse.json();
        setDashboardUnits(unitsData);
      }

      // Fetch daily movement summary
      let dailyAdditions = 0;
      let dailyWithdrawals = 0;
      try {
          const summaryResponse = await fetch('/api/movement-logs/summary/today');
          if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              dailyAdditions = summaryData.additions_today || 0;
              dailyWithdrawals = summaryData.withdrawals_today || 0;
          } else {
              console.warn("Failed to fetch daily movement summary:", summaryResponse.statusText);
          }
      } catch (summaryError) {
          console.warn("Error fetching daily movement summary:", summaryError);
      }

      setDashboardStats({
        totalItems: itemsData.total_items,
        additionsToday: dailyAdditions, 
        withdrawalsToday: dailyWithdrawals, 
      });

    } catch (e: any) {
      console.error("Failed to fetch dashboard data", e);
      setError(e.message || "An unexpected error occurred while fetching data.");
      setDashboardStats({
          totalItems: 0,
          additionsToday: 0, // Fallback in case of primary error
          withdrawalsToday: 0, // Fallback in case of primary error
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardInitialData(); // Call the renamed function

    const fetchRecentLogs = async () => {
      setIsLoadingRecentLogs(true);
      setRecentLogsError(null);
      try {
        // Fetch last 5 logs, ordered by timestamp descending
        const response = await fetch('/api/movement-logs?page=1&page_size=5&sort_by=timestamp&order=desc');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch recent logs: ${response.statusText}`);
        }
        const data = await response.json();
        setRecentLogs(data.logs || []);
      } catch (e: any) {
        console.error("Failed to fetch recent logs", e);
        setRecentLogsError(e.message || "An unexpected error occurred while fetching recent logs.");
      } finally {
        setIsLoadingRecentLogs(false);
      }
    };

    fetchRecentLogs();
  }, []);

  const handleItemAdded = () => {
    setIsAddItemModalOpen(false);
    fetchDashboardInitialData(); // Re-fetch all dashboard data, including items, units, and stats
  };

  const statsToDisplay = [
    { label: 'إجمالي الأصناف', value: dashboardStats.totalItems.toString(), icon: <Archive className="text-primary-500" size={24} /> },
    { label: 'إضافات اليوم', value: dashboardStats.additionsToday.toString(), icon: <ArrowUpCircle className="text-success-500" size={24} /> }, 
    { label: 'مسحوبات اليوم', value: dashboardStats.withdrawalsToday.toString(), icon: <ArrowDownCircle className="text-accent-500" size={24} /> }, 
  ];

  // Helper function to format timestamp (simple version)
  const formatTimeAgo = (isoTimestamp: string) => {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `منذ ${seconds} ثوان`;
    if (minutes < 60) return `منذ ${minutes} دقائق`;
    if (hours < 24) return `منذ ${hours} ساعات`;
    return `منذ ${days} أيام`; // Or format as date string for older logs
  };
  
  // Helper to get log icon and descriptive text
  const getLogDetails = (log: MovementLogEntry) => {
    let icon = <Activity size={18} className="text-gray-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
    let text = `${log.action_type} for item ${log.item_name}`;

    const byUser = log.person_name ? `بواسطة ${log.person_name}` : 'بواسطة النظام';

    switch (log.action_type) {
      case 'Addition':
        icon = <ArrowUpCircle size={18} className="text-success-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        text = `${log.person_name} أضاف ${log.quantity_changed} من ${log.item_name}`;
        if (log.details && log.details.includes("created and initial quantity set")) {
          icon = <Archive size={18} className="text-primary-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
          text = `تم إنشاء "${log.item_name}"`;
        }
        break;
      case 'Removal':
        icon = <ArrowDownCircle size={18} className="text-error-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        text = `${log.person_name} سحب ${log.quantity_changed} من ${log.item_name}`;
        break;
      case 'Update':
        icon = <Edit3 size={18} className="text-blue-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        text = `تم تحديث بيانات "${log.item_name}". ${log.details ? `(${log.details})` : ''} ${byUser}.`;
        break;
      case 'Status Changed to Active':
        icon = <Info size={18} className="text-green-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        text = `تم تفعيل الصنف "${log.item_name}" ${byUser}.`;
        break;
      case 'Status Changed to Inactive':
        icon = <AlertTriangle size={18} className="text-yellow-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        text = `تم إلغاء تنشيط الصنف "${log.item_name}" ${byUser}.`;
        break;
      case 'Creation':
        icon = <PlusCircle size={18} className="text-primary-500 ml-3 rtl:mr-3 rtl:ml-0 flex-shrink-0" />;
        break;
      default:
        // Generic fallback if action_type is not explicitly handled above but might be from logs
        // Or if it's a very old log type not yet mapped.
        text = `${log.action_type}: "${log.item_name}". ${log.details ? `(${log.details})` : ''} ${byUser}.`;
    }
    return { icon, text };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="ml-4 text-lg">جارٍ تحميل بيانات لوحة التحكم...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
        <span className="font-medium">خطأ!</span> {error}
        {/* Optional: Add a retry button that calls fetchDashboardData */}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold m-0">لوحة التحكم</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statsToDisplay.map((stat, index) => (
          <div key={index} className="card flex items-center p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-full ml-4 rtl:mr-4 rtl:ml-0 ${
              stat.label === 'إجمالي الأصناف' ? 'bg-primary-100' :
              stat.label === 'إضافات اليوم' ? 'bg-success-100' : 'bg-accent-100'
            }`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            className="btn btn-primary btn-lg flex items-center justify-center py-4 px-6 text-base"
            onClick={openScanner} // Open the barcode scanner overlay
          >
            <ScanLine size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
            قراءة الباركود
          </button>
          <button 
            className="btn btn-primary btn-lg flex items-center justify-center py-4 px-6 text-base"
            onClick={() => setActivePage('logs')}
          >
            <BarChart3 size={20} className="ml-2 rtl:mr-2 rtl:ml-0" />
            عرض سجل الحركات
          </button>
        </div>
      </div>

      {/* Main Content Area - Adjusted for single column full width */}
      <div className="grid grid-cols-1 gap-8">
        {/* Recent Activity Section (Now takes full width) */}
        <div className="card p-6 shadow-sm"> {/* Removed lg:col-span-2, parent grid is now effectively single column for this row */}
          <h2 className="text-xl font-semibold mb-6 text-gray-700 text-center">آخر النشاطات</h2>
          {isLoadingRecentLogs && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <p className="ml-3 text-gray-600">جارٍ تحميل آخر النشاطات...</p>
            </div>
          )}
          {recentLogsError && (
            <div className="p-4 my-2 text-sm text-red-700 bg-red-100 rounded-lg text-center" role="alert">
              <span className="font-medium">خطأ في تحميل النشاطات!</span> {recentLogsError}
            </div>
          )}
          {!isLoadingRecentLogs && !recentLogsError && recentLogs.length === 0 && (
            <p className="text-center text-gray-500 py-4">لا توجد نشاطات حديثة لعرضها.</p>
          )}
          {!isLoadingRecentLogs && !recentLogsError && recentLogs.length > 0 && (
            <div className="space-y-4">
              {recentLogs.map((log) => {
                const { icon, text } = getLogDetails(log);
                return (
                  <div key={log.id} className="flex flex-col items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="flex items-center"> {/* Wrapper for icon and text to be centered together */}
                      {icon} 
                      <div className="text-center mx-3">
                        <p className="text-sm font-medium text-gray-800">{text}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-center mt-6">
                <a 
                  href="#"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setActivePage('logs'); //Changed key to 'logs' to match what app.tsx expects
                    
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  عرض كل النشاطات &rarr;
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Items Section (Right Column - takes 1/3 on large screens) - REMOVED */}
        {/* 
        <div className="lg:col-span-1 card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">أصناف تحتاج انتباه</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-warning-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-warning-700">ورق طباعة A4</p>
                <p className="text-xs text-warning-600">متبقي: 5 رزم فقط</p>
              </div>
              <button className="btn btn-xs btn-outline-warning">إعادة طلب</button>
            </div>
            <div className="flex justify-between items-center p-3 bg-warning-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-warning-700">أقلام حبر أزرق</p>
                <p className="text-xs text-warning-600">متبقي: 12 قلم فقط</p>
              </div>
              <button className="btn btn-xs btn-outline-warning">إعادة طلب</button>
            </div>
            <div className="text-center mt-4">
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                عرض كل التنبيهات &rarr;
              </a>
            </div>
          </div>
        </div>
        */}
      </div>
      
      {/* AddItemModal Render */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        units={dashboardUnits}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};