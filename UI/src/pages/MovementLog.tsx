import React, { useState, useRef, useEffect } from 'react';
import { Filter, ArrowDown, ArrowUp, Package, User, Printer, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Table } from '../components/Table';
import { PrintableReport } from '../components/PrintableReport';
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate';
import type { GroupBase, OptionsOrGroups } from 'react-select';
import { Item as SharedItem, MovementLogEntry, Unit as Destination, Provider } from '../types';

// Ensure you have installed react-select-async-paginate and its peer dependency react-select
// npm install react-select-async-paginate react-select
// or
// yarn add react-select-async-paginate react-select

// Define BackendItem type based on what /api/items/ranged returns
// interface BackendItem { ... } - REMOVED

// Define ItemOption for react-select-async-paginate
interface ItemOption {
  value: number; // Item ID
  label: string; // Display string (e.g., "Item Name (Unit)")
  data: SharedItem; // Use shared Item type for the full item object
}

// Define LoadAdditional for pagination state
interface LoadAdditional {
  offset: number;
}

const ITEMS_PER_PAGE = 50; // Page size for fetching items

const AsyncPaginateComponent = AsyncPaginate as any; // Workaround for TS2786

// Mock data for demonstration
// const mockLogs = Array.from({ length: 50 }, (_, i) => ({ ... }));

// Helper to format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = date.toLocaleTimeString('en-GB', { // en-GB for HH:MM:SS typically
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return (
    <div className="flex flex-col">
      <span>{formattedDate}</span>
      <span className="text-xs text-gray-500 mt-1">{formattedTime}</span>
    </div>
  );
};

export const MovementLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<MovementLogEntry[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    itemId: '',
    providerId: '',
    destinationId: '',
  });
  const [selectedItemOption, setSelectedItemOption] = useState<ItemOption | null>(null);

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 15;

  // State and ref for printing
  const [printableData, setPrintableData] = useState<MovementLogEntry[]>([]);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleItemSelectChange = (selectedOption: ItemOption | null) => {
    setSelectedItemOption(selectedOption);
    setFilters(prev => ({
      ...prev,
      itemId: selectedOption ? String(selectedOption.value) : '',
    }));
  };
  
  const loadItems: LoadOptions<ItemOption, GroupBase<ItemOption>, LoadAdditional | undefined> = async (
    searchQuery: string,
    _loadedOptions: OptionsOrGroups<ItemOption, GroupBase<ItemOption>>,
    additional?: LoadAdditional
  ): Promise<{ options: ItemOption[]; hasMore: boolean; additional?: LoadAdditional }> => {
    const offset = additional?.offset || 0;
    try {
      const params = new URLSearchParams();
      params.append('offset', String(offset));
      params.append('limit', String(ITEMS_PER_PAGE));
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) {
        console.error('Failed to fetch items:', response.statusText);
        return { options: [], hasMore: false, additional: { offset } };
      }

      const apiResponse: { items: SharedItem[]; total_count: number } = await response.json(); // Expect items to be SharedItem[]
      
      const newOptions: ItemOption[] = apiResponse.items.map((item: SharedItem) => ({
        value: item.id,
        label: `${item.name} (${item.unit_name || 'N/A'})`, 
        data: item, // item is now SharedItem
      }));

      const currentTotalFetchedDirectlyInThisCall = newOptions.length;
      const newOffset = offset + currentTotalFetchedDirectlyInThisCall;

      const hasMore = newOffset < apiResponse.total_count;
      
      return {
        options: newOptions,
        hasMore: hasMore,
        additional: {
          offset: newOffset,
        },
      };
    } catch (error) {
      console.error('Error loading items:', error);
      return { options: [], hasMore: false, additional: { offset } };
    }
  };

  const applyFilters = async (page = 1) => {
    setLogsLoading(true);
    setLogsError(null);
    setFiltersApplied(true);
    setCurrentPage(page);

    const params = new URLSearchParams();
    if (filters.fromDate) params.append('date_from', filters.fromDate);
    if (filters.toDate) params.append('date_to', filters.toDate);
    if (filters.itemId) params.append('item_id', filters.itemId);
    if (filters.providerId) params.append('provider_id', filters.providerId);
    if (filters.destinationId) params.append('destination_id', filters.destinationId);
    params.append('page', page.toString());
    params.append('page_size', logsPerPage.toString());

    try {
      const response = await fetch(`/api/movement-logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch movement logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.total_pages || 0);
      setTotalLogs(data.total_records || 0);
    } catch (err: any) {
      console.error("Error fetching movement logs:", err);
      setLogsError(err.message || "فشل في تحميل سجل الحركات");
      setLogs([]);
      setTotalPages(0);
      setTotalLogs(0);
    } finally {
      setLogsLoading(false);
    }
  };

  const prepareAndPrint = async () => {
    // 1. Show a loading indicator if desired
    setLogsLoading(true); // Reuse existing loading state
    setLogsError(null);

    // 2. Fetch all data using the new endpoint
    const params = new URLSearchParams();
    if (filters.fromDate) params.append('date_from', filters.fromDate);
    if (filters.toDate) params.append('date_to', filters.toDate);
    if (filters.itemId) params.append('item_id', filters.itemId);
    if (filters.providerId) params.append('provider_id', filters.providerId);
    if (filters.destinationId) params.append('destination_id', filters.destinationId);

    try {
      const response = await fetch(`/api/movement-logs/all_filtered?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch data for printing');
      }
      const allLogs = await response.json();
      
      // 3. Set the data and trigger print
      if (allLogs && allLogs.length > 0) {
        setPrintableData(allLogs);
        // Use a timeout to allow state to update before printing
        setTimeout(() => {
          handlePrint();
        }, 50);
      } else {
        // Optional: Show a message if there's nothing to print
        setLogsError("لا توجد بيانات للطباعة بناءً على الفلاتر المحددة.");
      }

    } catch (err: any) {
      console.error("Error preparing for print:", err);
      setLogsError(err.message || "فشل في تحضير البيانات للطباعة.");
    } finally {
      setLogsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      itemId: '',
      providerId: '',
      destinationId: '',
    });
    setSelectedItemOption(null);
    setLogs([]);
    setFiltersApplied(false);
  };

  const columns = [
    { 
      key: 'timestamp', 
      header: 'التاريخ والوقت',
      render: (value: string) => formatDate(value),
      width: 'w-1/12 md:w-1/6'
    },
    { 
      key: 'item_name',
      header: 'الصنف',
      render: (value: string, row: MovementLogEntry) => (
        <div>
          <div className="flex items-center">
            <div className="p-1 rounded-full bg-primary-100 text-primary-600 mr-2 rtl:ml-2 rtl:mr-0">
              <Package size={16} />
            </div>
            <span className="font-medium">{value}</span>
          </div>
          <span className="text-xs text-gray-500 ml-8 rtl:mr-8 rtl:ml-0">#{row.item_id}</span>
        </div>
      ),
      width: 'w-2/12 md:w-1/4'
    },
    { 
      key: 'action_type',
      header: 'نوع الحركة',
      render: (value: string) => {
        if (value === 'Addition') {
          return (
            <div className="flex items-center text-success-600">
              <ArrowUp size={16} className="mr-1 rtl:ml-1 rtl:mr-0" />
              <span>إضافة</span>
            </div>
          );
        } else if (value === 'Removal') {
          return (
            <div className="flex items-center text-error-600">
              <ArrowDown size={16} className="mr-1 rtl:ml-1 rtl:mr-0" />
              <span>سحب</span>
            </div>
          );
        } else {
          return <span className="text-gray-700">{value}</span>; 
        }
      },
      width: 'w-1/12 md:w-1/12'
    },
    { 
      key: 'person_name',
      header: 'بواسطة',
      render: (value: string | null | undefined) => 
        value ? (
          <div className="flex items-center text-sm text-gray-600">
            <User size={14} className="mr-1 rtl:ml-1 rtl:mr-0 text-gray-400" />
            {value}
          </div>
        ) : (
          <span className="text-xs text-gray-400">غير محدد</span>
        ),
      width: 'w-1/12 md:w-1/6'
    },
    { 
      key: 'quantity_changed',
      header: 'الكمية',
      render: (value?: number | null) => value ?? '-',
      width: 'w-1/12 md:w-1/12'
    },
    {
      key: 'destination_name',
      header: 'الوجهة',
      render: (value?: string | null) => value || '-',
      width: 'w-1/12 md:w-1/6'
    },
    { 
      key: 'provider', 
      header: 'المورد',
      render: (value?: string | null) => value || '-',
      width: 'w-1/12 md:w-1/6'
    },
    {
      key: 'cost_per_item',
      header: 'التكلفة',
      render: (value?: number | null) => (value !== null && value !== undefined ? value.toFixed(2) : '-'),
      width: 'w-1/12 md:w-1/12 hidden sm:table-cell'
    },
    {
      key: 'resulting_quantity',
      header: 'الرصيد',
      render: (value?: number | null) => value ?? '-',
      width: 'w-1/12 md:w-1/12'
    }
  ];

  // Fetch destinations on component mount
  useEffect(() => {
    const fetchDestinations = async () => {
      setDestinationsLoading(true);
      try {
        const response = await fetch('/api/destinations');
        if (!response.ok) {
          throw new Error('Failed to fetch destinations');
        }
        const data: Destination[] = await response.json();
        setDestinations(data);
      } catch (error) {
        console.error("Failed to load destinations for filter", error);
        // Optionally set an error state here to show in the UI
      } finally {
        setDestinationsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Fetch providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      setProvidersLoading(true);
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        const data: Provider[] = await response.json();
        setProviders(data);
      } catch (error) {
        console.error("Failed to load providers for filter", error);
      } finally {
        setProvidersLoading(false);
      }
    };
    fetchProviders();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">سجل الحركات</h1>
      
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">تصفية النتائج</h2>
        
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow">
          {/* Date Filters */}
          <div className="flex-grow md:flex-grow-0">
            <label htmlFor="fromDate" className="text-sm font-medium text-gray-600 mb-1 block">من تاريخ</label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleInputChange}
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex-grow md:flex-grow-0">
            <label htmlFor="toDate" className="text-sm font-medium text-gray-600 mb-1 block">إلى تاريخ</label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              value={filters.toDate}
              onChange={handleInputChange}
              className="input input-bordered w-full"
            />
          </div>
          
          {/* Item Select */}
          <div className="flex-grow" style={{ minWidth: '250px' }}>
            <label htmlFor="item-select" className="text-sm font-medium text-gray-600 mb-1 block">
              الصنف
            </label>
            <AsyncPaginateComponent
              id="item-select"
              value={selectedItemOption}
              loadOptions={loadItems}
              onChange={handleItemSelectChange}
              isClearable
              placeholder="ابحث عن صنف..."
              debounceTimeout={300}
              classNamePrefix="react-select"
            />
          </div>

          {/* Destination Filter */}
          <div className="flex-grow md:flex-grow-0">
            <label htmlFor="destinationId" className="text-sm font-medium text-gray-600 mb-1 block">الوجهة</label>
            <select
              id="destinationId"
              name="destinationId"
              value={filters.destinationId}
              onChange={(e) => setFilters(prev => ({ ...prev, destinationId: e.target.value }))}
              className="input input-bordered w-full"
              disabled={destinationsLoading}
            >
              <option value="">الكل</option>
              {destinations.map(dest => (
                <option key={dest.id} value={dest.id}>{dest.name}</option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex-grow md:flex-grow-0">
            <label htmlFor="providerId" className="text-sm font-medium text-gray-600 mb-1 block">المورد</label>
            <select
              id="providerId"
              name="providerId"
              value={filters.providerId}
              onChange={(e) => setFilters(prev => ({ ...prev, providerId: e.target.value }))}
              className="input input-bordered w-full"
              disabled={providersLoading}
            >
              <option value="">الكل</option>
              {providers.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button onClick={() => applyFilters(1)} className="btn btn-primary">
              <Filter size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
              تطبيق الفلاتر
            </button>
            <button onClick={resetFilters} className="btn btn-danger">
              <Trash2 size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
              مسح
            </button>
            <button
              onClick={prepareAndPrint}
              className="btn btn-outline"
              disabled={!filtersApplied || logs.length === 0}
            >
              <Printer size={16} className="ml-2 rtl:mr-2 rtl:ml-0" />
              طباعة النتائج
            </button>
          </div>
        </div>
      </div>
      
      {/* Log Display Area */}
      {logsLoading && (
        <div className="text-center p-8">
          <p>جاري تحميل سجل الحركات...</p>
        </div>
      )}

      {!logsLoading && logsError && (
        <div className="text-center p-8 text-error-500">
          <p>خطأ في تحميل السجل: {logsError}</p>
          <button onClick={() => applyFilters(1)} className="btn btn-sm btn-link mt-2">
            حاول مرة أخرى
          </button>
        </div>
      )}

      {!logsLoading && !logsError && !filtersApplied && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <Filter size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">
            يرجى تحديد معايير التصفية وضغط "تطبيق الفلاتر"
          </h3>
          <p className="text-gray-500">
            يمكنك البحث حسب الفترة الزمنية والصنف والمورد
          </p>
        </div>
      )}

      {!logsLoading && !logsError && filtersApplied && logs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <Filter size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">
            لا توجد سجلات تطابق معايير البحث.
          </h3>
          <p className="text-gray-500 mb-4">
            يرجى تعديل الفلاتر والمحاولة مرة أخرى.
          </p>
        </div>
      )}

      {!logsLoading && !logsError && filtersApplied && logs.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              عرض {logs.length} من إجمالي {totalLogs} سجلات (صفحة {currentPage} من {totalPages})
            </p>
          </div>
          <Table 
            columns={columns}
            data={logs}
            keyField="id"
            pagination={{
              currentPage,
              totalPages: totalPages,
              onPageChange: (newPage) => applyFilters(newPage),
              totalItems: totalLogs,
              itemsPerPage: logsPerPage
            }}
            isLoading={logsLoading}
          />
        </>
      )}

      {/* Hidden component for printing */}
      <div style={{ display: 'none' }}>
        <PrintableReport ref={printComponentRef} data={printableData} />
      </div>
    </div>
  );
};