'use client';

import React, { useEffect, useState } from 'react';
import { syncApi, cashioApi } from '@/lib/api';
import Link from 'next/link';

interface CashioRecord {
  id: string;
  api_id: number;
  code: string;
  fop_syscode: string;
  fop_description?: string;
  so_code: string;
  master_code?: string;
  docdate: string;
  branch_code?: string;
  partner_code?: string;
  partner_name?: string;
  refno?: string;
  refno_idate?: string;
  total_in: number | string;
  total_out: number | string;
  sync_date?: string;
  brand?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CashioPage() {
  const [cashioRecords, setCashioRecords] = useState<CashioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRange, setSyncingRange] = useState(false);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    soCode?: string;
    partnerCode?: string;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    soCode?: string;
    partnerCode?: string;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string): string => {
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
  };

  const [syncDateInput, setSyncDateInput] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [syncDateFromInput, setSyncDateFromInput] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [syncDateToInput, setSyncDateToInput] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);

  const [syncRangeResult, setSyncRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);

  const getSyncDate = (): string => {
    if (!syncDateInput) {
      return '';
    }
    return convertDateToDDMMMYYYY(syncDateInput);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadCashioRecords = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filter.brand) params.brand = filter.brand;
      if (filter.dateFrom) params.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      if (filter.dateTo) params.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      if (filter.branchCode) params.branchCode = filter.branchCode;
      if (filter.soCode) params.soCode = filter.soCode;
      if (filter.partnerCode) params.partnerCode = filter.partnerCode;

      const response = await cashioApi.getAll(params);
      setCashioRecords(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error: any) {
      showToast('error', 'Không thể tải danh sách cashio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashioRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filter]);

  const handleSyncByDate = async () => {
    const syncDate = getSyncDate();
    if (!syncDate) {
      setSyncResult({
        type: 'error',
        message: 'Vui lòng chọn ngày cần đồng bộ',
      });
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await syncApi.syncCashio(syncDate, selectedBrand || undefined);
      setSyncResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ cashio thành công',
        data: response.data,
      });
      showToast('success', 'Đồng bộ cashio thành công');
      // Reload data after sync
      setTimeout(() => {
        loadCashioRecords();
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi đồng bộ cashio';
      setSyncResult({
        type: 'error',
        message: errorMessage,
      });
      showToast('error', errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(syncDateFromInput);
    const endDate = convertDateToDDMMMYYYY(syncDateToInput);
    
    if (!startDate || !endDate) {
      setSyncRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingRange(true);
    setSyncRangeResult(null);
    try {
      const response = await syncApi.syncCashioByDateRange(startDate, endDate, selectedBrand || undefined);
      setSyncRangeResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ cashio thành công',
        data: response.data,
      });
      showToast('success', 'Đồng bộ cashio thành công');
      // Reload data after sync
      setTimeout(() => {
        loadCashioRecords();
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi đồng bộ cashio';
      setSyncRangeResult({
        type: 'error',
        message: errorMessage,
      });
      showToast('error', errorMessage);
    } finally {
      setSyncingRange(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numValue || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const brands = [
    { value: '', label: 'Tất cả nhãn' },
    { value: 'f3', label: 'F3' },
    { value: 'labhair', label: 'LabHair' },
    { value: 'yaman', label: 'Yaman' },
    { value: 'menard', label: 'Menard' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Overlay khi đang đồng bộ */}
      {(syncing || syncingRange) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {syncing
                  ? `Đang đồng bộ cashio cho ngày ${getSyncDate()}${selectedBrand ? ` - ${selectedBrand.toUpperCase()}` : ' - Tất cả nhãn'}`
                  : `Đang đồng bộ cashio từ ${convertDateToDDMMMYYYY(syncDateFromInput)} đến ${convertDateToDDMMMYYYY(syncDateToInput)}${selectedBrand ? ` - ${selectedBrand.toUpperCase()}` : ' - Tất cả nhãn'}`}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Vui lòng đợi trong giây lát, không đóng trang này...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về trang chủ
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Cashio</h1>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ và quản lý dữ liệu thanh toán từ API get_daily_cashio
              </p>
            </div>
          </div>
        </div>

        {/* Sync Section - Single Date */}
        <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Cashio theo ngày</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ cashio cho một ngày cụ thể
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ngày đồng bộ
                </span>
              </label>
              <input
                type="date"
                value={syncDateInput}
                onChange={(e) => setSyncDateInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {syncDateInput && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{getSyncDate()}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nhãn hàng (tùy chọn)
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {brands.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSyncByDate}
                disabled={syncing || syncingRange || !syncDateInput}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Đồng bộ
                  </>
                )}
              </button>
            </div>
          </div>

          {syncResult && (
            <div
              className={`p-4 rounded-xl border-2 shadow-sm ${
                syncResult.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {syncResult.type === 'success' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{syncResult.message}</span>
                </div>
                <button
                  onClick={() => setSyncResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {syncResult.data && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{syncResult.data.totalRecordsCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Tổng records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{syncResult.data.totalSavedCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Đã lưu mới</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{syncResult.data.totalSkippedCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Đã tồn tại</div>
                    </div>
                  </div>
                  {syncResult.data.brandResults && syncResult.data.brandResults.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {syncResult.data.brandResults.map((brand: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                            <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} records, {brand.savedCount} mới, {brand.skippedCount} đã tồn tại
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync Section - Date Range */}
        <div className="bg-white rounded-xl shadow-md border-2 border-green-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Cashio theo khoảng ngày</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ cashio cho khoảng thời gian được chọn
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={syncDateFromInput}
                onChange={(e) => setSyncDateFromInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
              {syncDateFromInput && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(syncDateFromInput)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={syncDateToInput}
                onChange={(e) => setSyncDateToInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
              {syncDateToInput && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(syncDateToInput)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nhãn hàng (tùy chọn)
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                {brands.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSyncByDateRange}
                disabled={syncing || syncingRange || !syncDateFromInput || !syncDateToInput}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {syncingRange ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Đồng bộ
                  </>
                )}
              </button>
            </div>
          </div>

          {syncRangeResult && (
            <div
              className={`p-4 rounded-xl border-2 shadow-sm ${
                syncRangeResult.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {syncRangeResult.type === 'success' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{syncRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setSyncRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {syncRangeResult.data && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{syncRangeResult.data.totalRecordsCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Tổng records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{syncRangeResult.data.totalSavedCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Đã lưu mới</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{syncRangeResult.data.totalSkippedCount || 0}</div>
                      <div className="text-xs text-gray-600 mt-1">Đã tồn tại</div>
                    </div>
                  </div>
                  {syncRangeResult.data.brandResults && syncRangeResult.data.brandResults.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {syncRangeResult.data.brandResults.map((brand: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                            <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} records, {brand.savedCount} mới, {brand.skippedCount} đã tồn tại
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bộ lọc</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nhãn hàng</label>
              <select
                value={filterInput.brand || ''}
                onChange={(e) => setFilterInput({ ...filterInput, brand: e.target.value || undefined })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={filterInput.dateFrom || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateFrom: e.target.value || undefined })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={filterInput.dateTo || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateTo: e.target.value || undefined })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mã chi nhánh</label>
              <input
                type="text"
                value={filterInput.branchCode || ''}
                onChange={(e) => setFilterInput({ ...filterInput, branchCode: e.target.value || undefined })}
                placeholder="VD: LH01"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mã đơn hàng</label>
              <input
                type="text"
                value={filterInput.soCode || ''}
                onChange={(e) => setFilterInput({ ...filterInput, soCode: e.target.value || undefined })}
                placeholder="VD: SO01.00007127"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setFilter({ ...filterInput });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Áp dụng bộ lọc
            </button>
            <button
              onClick={() => {
                setFilterInput({});
                setFilter({});
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Danh sách Cashio</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : cashioRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Chưa có dữ liệu cashio. Hãy đồng bộ để xem dữ liệu.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">API ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày CT</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nhãn</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Chi nhánh</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Loại thanh toán</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã đơn hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Master Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Khách hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ref No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ref No IDate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tiền vào</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tiền ra</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sync Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày cập nhật</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cashioRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{record.api_id}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{record.code}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(record.docdate)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{record.brand || '-'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.branch_code || '-'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.fop_syscode}</div>
                          {record.fop_description && (
                            <div className="text-xs text-gray-500">{record.fop_description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{record.so_code}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-700">{record.master_code || '-'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.partner_name || '-'}</div>
                          {record.partner_code && (
                            <div className="text-xs text-gray-500">{record.partner_code}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.refno || '-'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateOnly(record.refno_idate)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-green-600">{formatCurrency(record.total_in)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-red-600">{formatCurrency(record.total_out)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 font-mono">{record.sync_date || '-'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">{formatDate(record.createdAt)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">{formatDate(record.updatedAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

