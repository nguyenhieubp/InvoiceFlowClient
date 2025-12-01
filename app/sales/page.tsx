'use client';

import { useEffect, useState } from 'react';
import { salesApi, syncApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import Link from 'next/link';

interface Order {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: {
    name: string;
    code: string;
    brand: string;
  };
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  isProcessed: boolean;
  sales?: Array<{
    promCode?: string;
  }>;
}

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Tất cả orders để search
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]); // Orders hiển thị sau khi search/pagination
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; processed?: boolean; dateFrom?: string; dateTo?: string; hasPromotion?: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [syncingBrand, setSyncingBrand] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand, filter.processed, pagination.page]);

  useEffect(() => {
    // Reset về trang 1 khi filter thay đổi (trừ date và promotion vì đã xử lý ở useEffect khác)
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand, filter.processed]);

  // Xử lý search và pagination trên client
  useEffect(() => {
    let filtered = allOrders;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.docCode.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.code.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
      const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;
      
      if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
      if (dateTo) dateTo.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.docDate);
        orderDate.setHours(0, 0, 0, 0);
        
        if (dateFrom && dateTo) {
          // Có cả từ ngày và đến ngày
          return orderDate >= dateFrom && orderDate <= dateTo;
        } else if (dateFrom) {
          // Chỉ có từ ngày
          return orderDate >= dateFrom;
        } else if (dateTo) {
          // Chỉ có đến ngày
          return orderDate <= dateTo;
        }
        return true;
      });
    }
    
    // Filter by promotion
    if (filter.hasPromotion !== undefined) {
      filtered = filtered.filter((order) => {
        const hasPromo = order.sales && order.sales.some(
          (sale) => sale.promCode && sale.promCode.trim() !== ''
        );
        return filter.hasPromotion ? hasPromo : !hasPromo;
      });
    }
    
    // Update pagination info
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));
    
    // Pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setDisplayedOrders(paginated);
    
    // Reset về trang 1 nếu search query hoặc filter thay đổi
    if ((searchQuery || filter.dateFrom || filter.dateTo || filter.hasPromotion !== undefined) && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filter.dateFrom, filter.dateTo, filter.hasPromotion, allOrders, pagination.page, pagination.limit]);

  const handleSelectOrder = (docCode: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(docCode)) {
      newSelected.delete(docCode);
    } else {
      newSelected.add(docCode);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === displayedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(displayedOrders.map((o) => o.docCode)));
    }
  };

  const handlePrintInvoices = async () => {
    if (selectedOrders.size === 0) {
      showToast('error', 'Vui lòng chọn ít nhất một đơn hàng để in hóa đơn');
      return;
    }

    const docCodes = Array.from(selectedOrders);

    try {
      setPrinting(true);
      const response = await salesApi.printOrders(docCodes);
      const { successCount, failureCount, results } = response.data || {};

      let message = `Đã gửi yêu cầu in ${successCount ?? docCodes.length}/${docCodes.length} hóa đơn.`;

      if (failureCount > 0 && Array.isArray(results)) {
        const errorMessages = results
          .filter((r: any) => !r.success)
          .map((r: any) => `${r.docCode}: ${r.error || r.message || 'Không rõ lỗi'}`);
        if (errorMessages.length > 0) {
          message += `\nCác hóa đơn lỗi:\n- ${errorMessages.join('\n- ')}`;
        }
      }

      showToast(failureCount > 0 ? 'error' : 'success', message);
      setSelectedOrders(new Set());
      loadOrders();
    } catch (error: any) {
      console.error('Lỗi khi in hóa đơn:', error);
      showToast('error', 'Lỗi khi in hóa đơn: ' + (error.response?.data?.message || error.message));
    } finally {
      setPrinting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncingBrand(null);
    setSyncResult(null);
    try {
      const response = await syncApi.syncAll();
      setSyncResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ tất cả thành công',
      });
      // Reload orders after sync
      setTimeout(() => {
        loadOrders();
      }, 1000);
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ',
      });
    } finally {
      setSyncing(false);
      setSyncingBrand(null);
    }
  };

  const handleSyncBrand = async (brandName: string) => {
    setSyncing(true);
    setSyncingBrand(brandName);
    setSyncResult(null);
    try {
      const response = await syncApi.syncBrand(brandName);
      setSyncResult({
        type: 'success',
        message: response.data.message || `Đồng bộ ${brandName} thành công`,
      });
      // Reload orders after sync
      setTimeout(() => {
        loadOrders();
      }, 1000);
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.response?.data?.message || error.message || `Lỗi khi đồng bộ ${brandName}`,
      });
    } finally {
      setSyncing(false);
      setSyncingBrand(null);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Load tất cả orders (không phân trang) để có thể search trên toàn bộ data
      const response = await salesApi.getAll({
        ...filter,
        groupBy: 'order',
        page: 1,
        limit: 10000, // Load tất cả để search
      });
      const data = response.data.data || [];
      
      setAllOrders(data);
      setOrders(data);
      
      // Update pagination từ response (nếu có)
      if (response.data.total !== undefined) {
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / prev.limit),
        }));
      }
    } catch (error: any) {
      showToast('error', 'Lỗi khi tải danh sách đơn hàng: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      {/* Overlay khi đang đồng bộ */}
      {syncing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {syncingBrand ? `Đang đồng bộ ${syncingBrand.toUpperCase()}` : 'Đang đồng bộ dữ liệu'}
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Vui lòng đợi trong giây lát, quá trình này có thể mất vài phút...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Sync Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-md hover:shadow-lg disabled:transform-none"
                >
                  {syncing && !syncingBrand ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang đồng bộ...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Đồng bộ tất cả
                    </>
                  )}
                </button>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSyncBrand(e.target.value);
                        e.target.value = ''; // Reset sau khi chọn
                      }
                    }}
                    disabled={syncing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <option value="">Đồng bộ theo nhãn hàng</option>
                    <option value="chando">Chando</option>
                    <option value="f3">F3</option>
                    <option value="labhair">LabHair</option>
                    <option value="yaman">Yaman</option>
                    <option value="menard">Menard</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Result Notification */}
            {syncResult && (
              <div
                className={`p-4 rounded-lg text-sm border-2 animate-slideDown ${
                  syncResult.type === 'success'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 shadow-md'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-300 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {syncResult.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="font-medium">{syncResult.message}</span>
                  </div>
                  <button
                    onClick={() => setSyncResult(null)}
                    className="text-gray-400 hover:text-gray-600 ml-2 transition-colors p-1 rounded hover:bg-white/50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, mã khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filter.brand || ''}
                onChange={(e) => setFilter({ ...filter, brand: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả nhãn hàng</option>
                <option value="chando">Chando</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
              <select
                value={filter.processed === undefined ? '' : filter.processed ? 'true' : 'false'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilter({
                    ...filter,
                    processed: value === '' ? undefined : value === 'true',
                  });
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="false">Chưa xử lý</option>
                <option value="true">Đã xử lý</option>
              </select>
              <select
                value={filter.hasPromotion === undefined ? '' : filter.hasPromotion ? 'true' : 'false'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilter({
                    ...filter,
                    hasPromotion: value === '' ? undefined : value === 'true',
                  });
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả khuyến mại</option>
                <option value="true">Có khuyến mại</option>
                <option value="false">Không có khuyến mại</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Từ ngày:</label>
                <input
                  type="date"
                  value={filter.dateFrom || ''}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value || undefined })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Đến ngày:</label>
                <input
                  type="date"
                  value={filter.dateTo || ''}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value || undefined })}
                  min={filter.dateFrom || undefined}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {(filter.dateFrom || filter.dateTo) && (
                <button
                  onClick={() => setFilter({ ...filter, dateFrom: undefined, dateTo: undefined })}
                  className="px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Xóa bộ lọc ngày"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Print Invoice Button */}
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-700 whitespace-nowrap">
                  Đã chọn <span className="font-semibold text-blue-600">{selectedOrders.size}</span>
                </div>
                <button
                  onClick={handlePrintInvoices}
                  disabled={printing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {printing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang in...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      In hóa đơn
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Không có đơn hàng nào</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === displayedOrders.length && displayedOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi nhánh
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số SP
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng SL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng DT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khuyến mại
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedOrders.map((order) => (
                    <tr key={order.docCode} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.docCode)}
                          onChange={() => handleSelectOrder(order.docCode)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{order.docCode}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.docDate).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-xs text-gray-500">{order.customer.code}</div>
                        <div className="text-xs text-gray-400 capitalize">{order.customer.brand}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.branchCode}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">{order.totalItems}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {Number(order.totalQty).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {Number(order.totalRevenue).toLocaleString('vi-VN')} đ
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          // Lấy danh sách các promCode từ các sales trong order
                          const promCodes = order.sales
                            ? Array.from(
                                new Set(
                                  order.sales
                                    .map((sale) => sale.promCode)
                                    .filter((code): code is string => !!code && code.trim() !== '')
                                )
                              )
                            : [];
                          
                          if (promCodes.length === 0) {
                            return <span className="text-xs text-gray-400 italic">-</span>;
                          }
                          
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {promCodes.map((code) => (
                                <span
                                  key={code}
                                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-blue-700 border border-blue-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-default break-words"
                                  title={`Mã khuyến mại: ${code}`}
                                >
                                  <svg className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  <span className="font-medium whitespace-normal break-words">{code}</span>
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Link
                          href={`/sales/order/${order.docCode}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-700">đơn hàng/trang</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{pagination.total}</span> đơn hàng
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className="text-sm text-gray-700 font-medium">
                    Trang {pagination.page}/{pagination.totalPages || 1}
                  </span>
                  
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

