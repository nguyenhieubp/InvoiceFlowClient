'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { warehouseProcessedApi } from '@/lib/api';

interface WarehouseProcessed {
  id: string;
  docCode: string;
  ioType: string;
  processedDate: string;
  result?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  success: number;
  failed: number;
  byIoType: {
    I: number;
    O: number;
  };
}

export default function WarehouseStatisticsPage() {
  const [warehouseProcessed, setWarehouseProcessed] = useState<WarehouseProcessed[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    success: 0,
    failed: 0,
    byIoType: { I: 0, O: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState<{
    dateFrom?: string;
    dateTo?: string;
    ioType?: string;
    success?: string;
    docCode?: string;
  }>({});
  const [filter, setFilter] = useState<{
    dateFrom?: string;
    dateTo?: string;
    ioType?: string;
    success?: boolean;
    docCode?: string;
  }>({});
  const [retryingDocCode, setRetryingDocCode] = useState<string | null>(null);
  const [batchRetryDateFrom, setBatchRetryDateFrom] = useState<string>('');
  const [batchRetryDateTo, setBatchRetryDateTo] = useState<string>('');
  const [batchRetrying, setBatchRetrying] = useState(false);
  const [batchRetryResult, setBatchRetryResult] = useState<{
    success: boolean;
    message: string;
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = useCallback((date: Date | string): string => {
    if (!date) {
      return '';
    }
    
    let d: Date;
    if (typeof date === 'string') {
      // Parse YYYY-MM-DD format (from date input)
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }, []);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadWarehouseProcessed = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filter.dateFrom) params.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      if (filter.dateTo) params.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      if (filter.ioType) params.ioType = filter.ioType;
      if (filter.success !== undefined) params.success = filter.success;
      if (filter.docCode) params.docCode = filter.docCode;

      const response = await warehouseProcessedApi.getAll(params);
      setWarehouseProcessed(response.data.data || []);
      setStatistics(response.data.statistics || {
        total: 0,
        success: 0,
        failed: 0,
        byIoType: { I: 0, O: 0 },
      });
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error: any) {
      showToast('error', 'Không thể tải thống kê warehouse processed');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, convertDateToDDMMMYYYY, showToast]);

  useEffect(() => {
    loadWarehouseProcessed();
  }, [loadWarehouseProcessed]);

  const handleFilter = () => {
    setFilter({
      dateFrom: filterInput.dateFrom,
      dateTo: filterInput.dateTo,
      ioType: filterInput.ioType,
      success: filterInput.success ? filterInput.success === 'true' : undefined,
      docCode: filterInput.docCode,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilter = () => {
    setFilterInput({});
    setFilter({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRetry = async (docCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xử lý lại warehouse cho mã chứng từ "${docCode}"?`)) {
      return;
    }

    try {
      setRetryingDocCode(docCode);
      await warehouseProcessedApi.retryByDocCode(docCode);
      showToast('success', `Xử lý lại thành công cho mã chứng từ ${docCode}`);
      // Reload data after retry
      await loadWarehouseProcessed();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xử lý lại warehouse';
      showToast('error', errorMessage);
    } finally {
      setRetryingDocCode(null);
    }
  };

  const handleBatchRetry = async () => {
    if (!batchRetryDateFrom || !batchRetryDateTo) {
      showToast('error', 'Vui lòng chọn đầy đủ từ ngày và đến ngày');
      return;
    }

    const dateFrom = convertDateToDDMMMYYYY(batchRetryDateFrom);
    const dateTo = convertDateToDDMMMYYYY(batchRetryDateTo);

    if (!dateFrom || !dateTo) {
      showToast('error', 'Ngày không hợp lệ. Vui lòng chọn lại ngày');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xử lý lại TẤT CẢ các lỗi warehouse từ ${dateFrom} đến ${dateTo}?`)) {
      return;
    }

    try {
      setBatchRetrying(true);
      setBatchRetryResult(null);
      const response = await warehouseProcessedApi.retryFailedByDateRange(dateFrom, dateTo);
      setBatchRetryResult(response.data);
      showToast('success', response.data.message || 'Xử lý lại batch thành công');
      // Reload data after retry
      await loadWarehouseProcessed();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xử lý lại warehouse batch';
      showToast('error', errorMessage);
      setBatchRetryResult({
        success: false,
        message: errorMessage,
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
      });
    } finally {
      setBatchRetrying(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const successRate = statistics.total > 0 
    ? ((statistics.success / statistics.total) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Thống kê Warehouse Processed</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Tổng số</div>
          <div className="text-2xl font-bold text-gray-800">{statistics.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Thành công</div>
          <div className="text-2xl font-bold text-green-700">{statistics.success}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-600">Thất bại</div>
          <div className="text-2xl font-bold text-red-700">{statistics.failed}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-600">Tỷ lệ thành công</div>
          <div className="text-2xl font-bold text-blue-700">{successRate}%</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <div className="text-sm text-purple-600">Nhập kho (I)</div>
          <div className="text-2xl font-bold text-purple-700">{statistics.byIoType.I}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow">
          <div className="text-sm text-orange-600">Xuất kho (O)</div>
          <div className="text-2xl font-bold text-orange-700">{statistics.byIoType.O}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã chứng từ
            </label>
            <input
              type="text"
              value={filterInput.docCode || ''}
              onChange={(e) => setFilterInput({ ...filterInput, docCode: e.target.value || undefined })}
              placeholder="Nhập mã chứng từ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filterInput.dateFrom || ''}
              onChange={(e) => setFilterInput({ ...filterInput, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filterInput.dateTo || ''}
              onChange={(e) => setFilterInput({ ...filterInput, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại (I/O)
            </label>
            <select
              value={filterInput.ioType || ''}
              onChange={(e) => setFilterInput({ ...filterInput, ioType: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="I">Nhập kho (I)</option>
              <option value="O">Xuất kho (O)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filterInput.success || ''}
              onChange={(e) => setFilterInput({ ...filterInput, success: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="true">Thành công</option>
              <option value="false">Thất bại</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Lọc
          </button>
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Batch Retry Section */}
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Xử lý lại các lỗi theo khoảng thời gian</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={batchRetryDateFrom}
              onChange={(e) => setBatchRetryDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={batchRetryDateTo}
              onChange={(e) => setBatchRetryDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBatchRetry}
              disabled={batchRetrying || !batchRetryDateFrom || !batchRetryDateTo}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {batchRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Xử lý lại tất cả lỗi</span>
                </>
              )}
            </button>
          </div>
        </div>
        {batchRetryResult && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            batchRetryResult.success
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                batchRetryResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {batchRetryResult.success ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${
                  batchRetryResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {batchRetryResult.message}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tổng xử lý:</span>
                    <span className="ml-2 font-semibold text-gray-900">{batchRetryResult.totalProcessed}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Thành công:</span>
                    <span className="ml-2 font-semibold text-green-700">{batchRetryResult.successCount}</span>
                  </div>
                  <div>
                    <span className="text-red-600">Thất bại:</span>
                    <span className="ml-2 font-semibold text-red-700">{batchRetryResult.failedCount}</span>
                  </div>
                </div>
                {batchRetryResult.errors && batchRetryResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết lỗi:</p>
                    <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {batchRetryResult.errors.map((error, idx) => (
                        <li key={idx} className="font-mono">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setBatchRetryResult(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã chứng từ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày xử lý
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lỗi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kết quả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : warehouseProcessed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                warehouseProcessed.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.docCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.ioType === 'I' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.ioType === 'I' ? 'Nhập kho' : 'Xuất kho'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.processedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.success ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.errorMessage ? (
                        <span className="text-red-600" title={item.errorMessage}>
                          {item.errorMessage.length > 50 
                            ? `${item.errorMessage.substring(0, 50)}...` 
                            : item.errorMessage}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.result ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            Xem kết quả
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(JSON.parse(item.result), null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!item.success && (
                        <button
                          onClick={() => handleRetry(item.docCode)}
                          disabled={retryingDocCode === item.docCode}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            retryingDocCode === item.docCode
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {retryingDocCode === item.docCode ? 'Đang xử lý...' : 'Xử lý lại'}
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
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> đến{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                trong tổng số <span className="font-medium">{pagination.total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

