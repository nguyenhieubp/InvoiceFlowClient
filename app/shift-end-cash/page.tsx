'use client';

import React, { useEffect, useState } from 'react';
import { shiftEndCashApi, syncApi } from '@/lib/api';
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
  lines?: ShiftEndCashLine[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ShiftEndCashPage() {
  const [shiftEndCashList, setShiftEndCashList] = useState<ShiftEndCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    drawCode?: string;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    drawCode?: string;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

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

  const [syncDateInput, setSyncDateInput] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

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

  const loadShiftEndCash = async () => {
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
      if (filter.drawCode) params.drawCode = filter.drawCode;

      const response = await shiftEndCashApi.getAll(params);
      setShiftEndCashList(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
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

  const handleSync = async () => {
    if (!syncDateInput) {
      showToast('error', 'Vui lòng chọn ngày cần đồng bộ');
      return;
    }

    const syncDate = getSyncDate();
    const brand = filterInput.brand;
    
    if (!syncDate) {
      showToast('error', 'Ngày không hợp lệ. Vui lòng chọn lại ngày');
      return;
    }

    setSyncing(true);
    try {
      const response = await syncApi.syncShiftEndCash(syncDate, brand);
      showToast('success', response.data.message || 'Đồng bộ thành công');
      loadShiftEndCash();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi đồng bộ';
      showToast('error', errorMessage);
    } finally {
      setSyncing(false);
    }
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

  const handleDoubleClick = async (item: ShiftEndCash) => {
    // Ngăn double-click khi đang xử lý
    if (processingPayment === item.id) {
      return;
    }

    setProcessingPayment(item.id);
    try {
      const response = await shiftEndCashApi.createPayment(item.id);
      showToast('success', response.data.message || 'Tạo phiếu chi tiền mặt thành công');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi khi tạo phiếu chi tiền mặt';
      showToast('error', errorMessage);
    } finally {
      setProcessingPayment(null);
    }
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

      <div className="w-full px-4 py-4">
        {/* Header with Filters & Sync */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo nộp quỹ cuối ca</h1>
                <p className="text-sm text-gray-600 mt-1">Quản lý và xem báo cáo nộp quỹ cuối ca</p>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn hàng</label>
                <select
                  value={filterInput.brand || ''}
                  onChange={(e) => setFilterInput({ ...filterInput, brand: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="f3">F3</option>
                  <option value="labhair">LabHair</option>
                  <option value="yaman">Yaman</option>
                  <option value="menard">Menard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filterInput.dateFrom || ''}
                  onChange={(e) => setFilterInput({ ...filterInput, dateFrom: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filterInput.dateTo || ''}
                  onChange={(e) => setFilterInput({ ...filterInput, dateTo: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã ca</label>
                <input
                  type="text"
                  value={filterInput.drawCode || ''}
                  onChange={(e) => setFilterInput({ ...filterInput, drawCode: e.target.value || undefined })}
                  placeholder="VD: HMS15_05"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sync Section */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Đồng bộ ngày</label>
                <input
                  type="date"
                  value={syncDateInput}
                  onChange={(e) => setSyncDateInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tìm kiếm
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
                </button>
              </div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã ca</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhãn</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftEndCashList.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-gray-50 ${processingPayment === item.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        onDoubleClick={() => handleDoubleClick(item)}
                        title="Double-click để tạo phiếu chi tiền mặt"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.draw_code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(item.docdate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.brand || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.status || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.description || ''}>{item.description || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => toggleRow(item.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {expandedRows.has(item.id) ? 'Thu gọn' : 'Mở rộng'}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(item.id) && item.lines && item.lines.length > 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-gray-50">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Mã FOP</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Tên FOP</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Số tiền hệ thống</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Số tiền thực tế</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Chênh lệch</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {item.lines.map((line) => (
                                    <tr key={line.id}>
                                      <td className="px-3 py-2 text-sm text-gray-900">{line.fop_code || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-600">{line.fop_name || '-'}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 text-right">{formatCurrency(line.system_amt)}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 text-right">{formatCurrency(line.actual_amt)}</td>
                                      <td className="px-3 py-2 text-sm text-right">
                                        <span className={line.diff_amount !== 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                          {formatCurrency(line.diff_amount)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

