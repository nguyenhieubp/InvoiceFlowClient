'use client';

import React, { useEffect, useState } from 'react';
import { cashioApi } from '@/lib/api';
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
                Quản lý dữ liệu thanh toán từ API get_daily_cashio
              </p>
            </div>
          </div>
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

