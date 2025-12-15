'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { Order } from '@/types/order.types';

interface GiaiTrinhItem {
  partnerCode: string;
  partnerName: string;
  checkFaceIds: any[];
  orders: Order[];
}

type FaceStatusFilter = 'all' | 'yes' | 'no';

export default function GiaiTrinhFaceIdPage() {
  const [data, setData] = useState<GiaiTrinhItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalLines: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [filters, setFilters] = useState<{
    orderCode: string;
    partnerCode: string;
    date: string;
    faceStatus: FaceStatusFilter;
  }>(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return {
      orderCode: '',
      partnerCode: '',
      date: today,
      faceStatus: 'all',
    };
  });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer khi component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const totalFaceChecks = useMemo(
    () => data.reduce((sum, item) => sum + (item.checkFaceIds?.length || 0), 0),
    [data],
  );
  const totalOrders = useMemo(() => data.reduce((sum, item) => sum + (item.orders?.length || 0), 0), [data]);
  const flattenedLines = useMemo(
    () =>
      data.flatMap((item) =>
        (item.orders || []).flatMap((order) => {
          const sales = order.sales && order.sales.length > 0 ? order.sales : [null];
          return sales.map((sale) => ({
            order,
            sale,
            item,
            hasFaceId: (item.checkFaceIds?.length || 0) > 0,
            faceCount: item.checkFaceIds?.length || 0,
          }));
        }),
      ),
    [data],
  );
  const displayedOrders = useMemo(
    () => flattenedLines.slice(0, pagination.limit),
    [flattenedLines, pagination.limit],
  );

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAllGiaiTrinhFaceId({
        page: pagination.page,
        limit: pagination.limit,
        date: filters.date || undefined,
        orderCode: filters.orderCode?.trim() || undefined,
        partnerCode: filters.partnerCode?.trim() || undefined,
        faceStatus: filters.faceStatus !== 'all' ? filters.faceStatus : undefined,
      });
      const result = response.data;
      const sortedItems: GiaiTrinhItem[] = [...(result.items || [])].sort((a, b) => {
        const orderCountA = a.orders?.length || 0;
        const orderCountB = b.orders?.length || 0;
        if (orderCountA === orderCountB) {
          const faceCountA = a.checkFaceIds?.length || 0;
          const faceCountB = b.checkFaceIds?.length || 0;
          return faceCountB - faceCountA;
        }
        return orderCountB - orderCountA;
      });
      setData(sortedItems);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalLines: result.pagination?.totalLines || 0,
        totalPages: result.pagination?.totalPages || 0,
        hasNext: result.pagination?.hasNext || false,
        hasPrev: result.pagination?.hasPrev || false,
      }));
    } catch (error: any) {
      console.error('Error loading giai trinh data:', error);
      showToast('error', `Lỗi khi tải dữ liệu giải trình: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce cho partnerCode và orderCode (input fields)
    const isInputFilter = filters.partnerCode || filters.orderCode;
    if (isInputFilter) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        loadData();
      }, 500); // Đợi 500ms sau khi user ngừng gõ
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    } else {
      // Gọi ngay cho date và faceStatus (không cần debounce)
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.date, filters.orderCode, filters.partnerCode, filters.faceStatus]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Giải trình FaceID</h1>
        <p className="text-sm text-gray-600">Danh sách đơn hàng đã làm phẳng theo khách hàng và FaceID.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Tổng khách hàng</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{pagination.total}</p>
            <p className="text-xs text-gray-500">Trang {pagination.page} / {pagination.totalPages || 1}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Tổng dòng hàng (order_line) theo ngày</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{pagination.totalLines}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã đơn hàng</label>
              <input
                value={filters.orderCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, orderCode: value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Nhập mã đơn"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
             <div>
               <label className="block text-xs font-medium text-gray-600 mb-1">Mã khách hàng</label>
               <input
                 value={filters.partnerCode}
                 onChange={(e) => {
                   const value = e.target.value;
                   setFilters((prev) => ({ ...prev, partnerCode: value }));
                   setPagination((prev) => ({ ...prev, page: 1 }));
                 }}
                 placeholder="Nhập mã KH"
                 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               />
             </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày đơn</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, date: value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
             <div>
               <label className="block text-xs font-medium text-gray-600 mb-1">Đã FaceID?</label>
               <select
                 value={filters.faceStatus}
                 onChange={(e) => {
                   const value = e.target.value as FaceStatusFilter;
                   setFilters((prev) => ({ ...prev, faceStatus: value }));
                   setPagination((prev) => ({ ...prev, page: 1 }));
                   // useEffect sẽ tự động gọi loadData khi faceStatus thay đổi
                 }}
                 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                 <option value="all">Tất cả</option>
                 <option value="yes">Có FaceID</option>
                 <option value="no">Chưa FaceID</option>
               </select>
             </div>
             <div className="flex gap-2">
               <button
                 onClick={() => {
                   const today = new Date().toISOString().split('T')[0];
                   setFilters({ orderCode: '', partnerCode: '', date: today, faceStatus: 'all' });
                   setPagination((prev) => ({ ...prev, page: 1 }));
                 }}
                 className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                 Xóa lọc
               </button>
             </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {loading ? (
                <span>Đang tải...</span>
              ) : (
                <>
                  Tổng số: <span className="font-bold text-gray-900">{pagination.total}</span> khách hàng
                  {pagination.total > 0 && (
                    <span className="ml-2 text-gray-500">
                      (Hiển thị {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)})
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Hiển thị:</label>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  setPagination({ ...pagination, limit: newLimit, page: 1 });
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">bản ghi/trang</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 space-y-2">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2">
            <p className="text-sm font-medium text-gray-700">Không có dữ liệu</p>
            <p className="text-xs text-gray-400">Hãy kiểm tra lại bộ lọc hoặc thử tải lại.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Đơn hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã KH</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Có FaceID?</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Số lần FaceID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thông tin FaceID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map(({ order, sale, item, hasFaceId, faceCount }, idx) => (
                      <tr key={`${order.docCode}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          <div className="flex flex-col gap-1">
                            <span>{order.docCode}</span>
                            {sale ? (
                              <span className="text-xs text-gray-500">
                                {sale.itemCode || sale.itemName || 'Dòng hàng'}{' '}
                                {sale.qty ? `• SL: ${sale.qty}` : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Không có dòng hàng</span>
                            )}
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{item.partnerCode}</span>
                            {item.partnerName && <span className="text-xs text-gray-500 mt-0.5">{item.partnerName}</span>}
                          </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              hasFaceId
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {hasFaceId ? 'Có' : 'Không'}
                          </span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {faceCount} lần
                      </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {item.checkFaceIds && item.checkFaceIds.length > 0 ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                              {item.checkFaceIds.map((cf, cfIdx) => (
                                <div key={cfIdx} className="text-xs rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                <div>
                                  {cf.startTime ? new Date(cf.startTime).toLocaleString('vi-VN') : '-'}
                                  {cf.isFirstInDay && (
                                    <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Lần đầu</span>
                                  )}
                                </div>
                                  <div className="text-gray-500">
                                  {cf.shopName || cf.shopCode || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-center text-sm text-gray-400" colSpan={5}>
                        Không có đơn hàng để hiển thị
                      </td>
                    </tr>
                  )}
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
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">bản ghi/trang</span>
                </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Đang hiển thị <span className="font-medium">{displayedOrders.length}</span> /{' '}
                      <span className="font-medium">{flattenedLines.length}</span> dòng đơn của trang hiện tại
                      {' • '}
                      Tổng khách: <span className="font-medium">{pagination.total}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                      <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                      </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
