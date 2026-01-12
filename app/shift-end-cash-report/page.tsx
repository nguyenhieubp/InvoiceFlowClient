'use client';

import React, { useEffect, useState } from 'react';
import { shiftEndCashApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface ShiftEndCashLine {
  id: string;
  fop_code: string | null;
  fop_name: string | null;
  system_amt: number;
  sys_acct_code: string | null;
  actual_amt: number;
  actual_acct_code: string | null;
  diff_amount: number;
  diff_acct_code: string | null;
  template_id: number | null;
}

interface ShiftEndCash {
  id: string;
  api_id: number;
  draw_code: string;
  branch_code: string | null;
  status: string | null;
  teller_code: string | null;
  openat: Date | null;
  closedat: Date | null;
  shift_status: string | null;
  docdate: Date | null;
  gl_date: Date | null;
  description: string | null;
  total: number;
  enteredat: Date | null;
  enteredby: string | null;
  sync_date: string | null;
  brand: string | null;
  payment_success?: boolean | null;
  payment_message?: string | null;
  payment_date?: Date | null;
  payment_response?: string | null;
  lines?: ShiftEndCashLine[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ShiftEndCashReportPage() {
  const [shiftEndCashList, setShiftEndCashList] = useState<ShiftEndCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    drawCode?: string;
    apiId?: string;
    paymentSuccess?: boolean;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    drawCode?: string;
    apiId?: string;
    paymentSuccess?: boolean;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string): string => {
    if (!date) {
      return '';
    }
    
    let d: Date;
    if (typeof date === 'string') {
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
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

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadShiftEndCash = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        onlyProcessed: true,
      };

      if (filter.paymentSuccess !== undefined) params.paymentSuccess = filter.paymentSuccess;

      if (filter.brand) params.brand = filter.brand;
      if (filter.dateFrom) params.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      if (filter.dateTo) params.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      if (filter.branchCode) params.branchCode = filter.branchCode;
      if (filter.drawCode) params.drawCode = filter.drawCode;
      if (filter.apiId) params.apiId = parseInt(filter.apiId, 10);

      const response = await shiftEndCashApi.getAll(params);
      setShiftEndCashList(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error: any) {
      showToast('error', 'Không thể tải danh sách báo cáo nộp quỹ cuối ca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShiftEndCash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, pagination.page, pagination.limit]);

  const handleSearch = () => {
    setFilter({ ...filterInput });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo nộp quỹ cuối ca</h1>
          <p className="text-sm text-gray-600 mt-1">Xem chi tiết các báo cáo nộp quỹ cuối ca</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhãn hàng
              </label>
              <select
                value={filterInput.brand || ''}
                onChange={(e) => setFilterInput({ ...filterInput, brand: e.target.value || undefined })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Tất cả</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={filterInput.dateFrom || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateFrom: e.target.value || undefined })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={filterInput.dateTo || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateTo: e.target.value || undefined })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã ca
              </label>
              <input
                type="text"
                value={filterInput.drawCode || ''}
                onChange={(e) => setFilterInput({ ...filterInput, drawCode: e.target.value || undefined })}
                placeholder="Ví dụ: HMS15_05"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API ID
              </label>
              <input
                type="number"
                value={filterInput.apiId || ''}
                onChange={(e) => setFilterInput({ ...filterInput, apiId: e.target.value || undefined })}
                placeholder="Ví dụ: 26521727"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterInput.paymentSuccess === undefined ? '' : String(filterInput.paymentSuccess)}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterInput({ 
                    ...filterInput, 
                    paymentSuccess: val === '' ? undefined : val === 'true' 
                  });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Tất cả</option>
                <option value="true">Thành công</option>
                <option value="false">Thất bại</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilterInput({});
                setFilter({});
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng số phiếu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Thành công</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Thất bại</p>
              <p className="text-2xl font-bold text-red-600">{stats.failure}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : shiftEndCashList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có dữ liệu
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái nộp tiền</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã ca</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teller Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open At</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed At</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doc Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entered At</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entered By</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Date</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftEndCashList.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        // Removed onDoubleClick handler
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {item.payment_success === true ? (
                            <span className="inline-flex items-center justify-center p-1 rounded-full bg-green-100 text-green-600" title={item.payment_message || 'Thành công'}>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                               </svg>
                            </span>
                          ) : item.payment_success === false ? (
                            <span className="inline-flex items-center justify-center p-1 rounded-full bg-red-100 text-red-600" title={item.payment_message || 'Thất bại'}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                             <span className="text-gray-400 text-xs italic">Chưa nộp</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.api_id || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.draw_code || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.branch_code || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.status || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.teller_code || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(item.openat)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(item.closedat)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.shift_status || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(item.docdate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(item.gl_date)}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{item.description || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(item.enteredat)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.enteredby || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.brand || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.sync_date || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={() => toggleRow(item.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            {expandedRows.has(item.id) ? 'Thu gọn' : 'Mở rộng'}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(item.id) && (
                        <tr>
                          <td colSpan={17} className="px-4 py-4 bg-gray-50">
                            {/* Thông tin chính */}
                            <div className="mb-4 pb-4 border-b border-gray-300">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin chi tiết:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">API ID:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.api_id || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Người nhập:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.enteredby || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Ngày nhập:</span>
                                  <span className="ml-2 font-medium text-gray-900">{formatDate(item.enteredat) || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Ngày sync:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.sync_date || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Ngày nộp tiền:</span>
                                  <span className="ml-2 font-medium text-gray-900">{formatDate(item.payment_date || null) || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Thông báo từ hệ thống:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.payment_message || '-'}</span>
                                </div>
                              </div>
                              
                              {item.payment_response && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Chi tiết kết quả nộp tiền (API Response):</h4>
                                  <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                                      {(() => {
                                        try {
                                           return JSON.stringify(JSON.parse(item.payment_response), null, 2);
                                        } catch (e) {
                                           return item.payment_response;
                                        }
                                      })()}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>


                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && shiftEndCashList.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} kết quả
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-700">
                  Trang {pagination.page}/{pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
