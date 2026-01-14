'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PaymentSyncLog {
  id: string;
  docCode: string;
  docDate: string;
  requestPayload: string;
  responsePayload: string;
  status: string; // SUCCESS, ERROR
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

export default function PaymentAuditPage() {
  const [logs, setLogs] = useState<PaymentSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    docCode: '',
    status: '',
  });

  const [selectedLog, setSelectedLog] = useState<PaymentSyncLog | null>(null);
  const [retryLoading, setRetryLoading] = useState<string | null>(null); // id of log being retried

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/audit', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          docCode: filters.docCode || undefined,
          status: filters.status || undefined,
        },
      });
      
      setLogs(response.data.items || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (log: PaymentSyncLog) => {
    if (!confirm('Bạn có chắc muốn chạy lại giao dịch này?')) return;
    
    try {
      setRetryLoading(log.id);
      const response = await api.post(`/payments/audit/${log.id}/retry`);
      
      // Reload logs after retry (a new log will be created)
      alert(response.data?.success ? 'Retry thành công!' : 'Retry thất bại/có lỗi!');
      loadLogs();
    } catch (error: any) {
      console.error('Retry failed:', error);
      alert('Retry thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setRetryLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
          Lịch sử đồng bộ thanh toán
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã đơn hàng / Chứng từ
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Nhập mã..."
                value={filters.docCode}
                onChange={(e) => setFilters({ ...filters, docCode: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && setPagination(p => ({...p, page: 1}))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="ERROR">Lỗi</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã chứng từ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lỗi</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {log.docCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                        {log.errorMessage || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Chi tiết
                        </button>
                        {log.status === 'ERROR' && (
                          <button
                            onClick={() => handleRetry(log)}
                            disabled={retryLoading === log.id}
                            className={`text-red-600 hover:text-red-900 transition-colors ${
                              retryLoading === log.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {retryLoading === log.id ? 'Running...' : 'Chạy lại'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Chi tiết Log #...{selectedLog.id.slice(-8)}</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Request Payload</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                    {tryFormatJson(selectedLog.requestPayload)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Response Payload</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                    {tryFormatJson(selectedLog.responsePayload)}
                  </pre>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function tryFormatJson(str: string | null) {
  if (!str) return 'null';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch (e) {
    return str;
  }
}
