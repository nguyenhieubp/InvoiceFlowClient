'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { Order } from '@/types/order.types';

interface GiaiTrinhItem {
  partnerCode: string;
  partnerName: string;
  checkFaceIds: any[];
  isCheckFaceId: boolean;
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
    dateFrom: string;
    dateTo: string;
    faceStatus: FaceStatusFilter;
    brandCode: string;
  }>(() => {
    return {
      orderCode: '',
      partnerCode: '',
      dateFrom: '',
      dateTo: '',
      faceStatus: 'all',
      brandCode: '',
    };
  });

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
          return sales.map((sale) => {
            const explainedFaceIds = (item.checkFaceIds || []).filter((cf: any) => cf.isExplained === true);
            const explanationMessages = explainedFaceIds
              .map((cf: any) => cf.explanationMessage)
              .filter((msg: string) => msg && msg.trim());
            return {
              order,
              sale,
              item,
              hasFaceId: (item.checkFaceIds?.length || 0) > 0,
              faceCount: item.checkFaceIds?.length || 0,
              hasExplained: explainedFaceIds.length > 0,
              explanationMessages: explanationMessages,
            };
          });
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
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        orderCode: filters.orderCode?.trim() || undefined,
        partnerCode: filters.partnerCode?.trim() || undefined,
        faceStatus: filters.faceStatus !== 'all' ? filters.faceStatus : undefined,
        brandCode: filters.brandCode?.trim() || undefined,
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

  // Chỉ tự động load khi thay đổi pagination
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // Load dữ liệu lần đầu khi component mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Giải trình FaceID</h1>
          <p className="text-sm text-gray-600">Danh sách đơn hàng đã làm phẳng theo khách hàng và FaceID.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Tổng dòng hàng (order_line) theo ngày</p>
            <p className="text-xl font-semibold text-gray-900">{pagination.totalLines.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã đơn hàng</label>
              <input
                value={filters.orderCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, orderCode: value }));
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
                 }}
                 placeholder="Nhập mã KH"
                 className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               />
             </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, dateFrom: value }));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, dateTo: value }));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
             <div>
               <label className="block text-xs font-medium text-gray-600 mb-1">Brand Code</label>
               <input
                 value={filters.brandCode}
                 onChange={(e) => {
                   const value = e.target.value;
                   setFilters((prev) => ({ ...prev, brandCode: value }));
                 }}
                 placeholder="Nhập brand code"
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
                   setPagination((prev) => ({ ...prev, page: 1 }));
                   loadData();
                 }}
                 disabled={loading}
                 className="flex-1 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
                 Tìm kiếm
               </button>
             </div>
             <div className="flex gap-2">
               <button
                 onClick={() => {
                   setFilters({ orderCode: '', partnerCode: '', dateFrom: '', dateTo: '', faceStatus: 'all', brandCode: '' });
                   setPagination((prev) => ({ ...prev, page: 1 }));
                   loadData();
                 }}
                 disabled={loading}
                 className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {loading && <span>Đang tải...</span>}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Đã giải trình chưa</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thông tin giải trình</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thông tin FaceID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map(({ order, sale, item, hasFaceId, faceCount, hasExplained, explanationMessages }, idx) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              hasExplained
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}
                          >
                            {hasExplained ? 'Đã giải trình' : 'Chưa giải trình'}
                          </span>
                      </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          {!hasExplained && explanationMessages && explanationMessages.length > 0 ? (
                            <div className="space-y-1.5">
                              {explanationMessages.map((msg: string, msgIdx: number) => (
                                <div
                                  key={msgIdx}
                                  className="text-xs bg-orange-50 border-l-4 border-orange-400 rounded px-2.5 py-1.5 text-gray-700 break-words"
                                  title={msg}
                                >
                                  {msg}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                      </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {item.checkFaceIds && item.checkFaceIds.length > 0 ? (
                          <div className="space-y-2">
                              {item.checkFaceIds.map((cf, cfIdx) => (
                                <div key={cfIdx} className="text-xs rounded border border-gray-200 bg-white px-2.5 py-2 hover:bg-gray-50">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-gray-800">{cf.startTime ? new Date(cf.startTime).toLocaleString('vi-VN') : '-'}</span>
                                  {cf.isFirstInDay && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Lần đầu</span>
                                  )}
                                  {cf.isExplained && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Đã giải trình</span>
                                  )}
                                </div>
                                  <div className="text-gray-600 text-xs">
                                  {cf.shopName || cf.shopCode || '-'}
                                </div>
                                  {!cf.isExplained && cf.explanationMessage && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                      <div className="text-xs font-medium text-gray-700 mb-1">Giải trình:</div>
                                      <div className="text-xs text-gray-600 bg-orange-50 rounded px-2 py-1 border-l-2 border-orange-400">
                                        {cf.explanationMessage}
                                      </div>
                                    </div>
                                  )}
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
                      <td className="px-6 py-4 text-center text-sm text-gray-400" colSpan={7}>
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
