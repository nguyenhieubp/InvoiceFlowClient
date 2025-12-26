'use client';

import React, { useEffect, useState } from 'react';
import { promotionApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface PromotionLine {
  id: string;
  line_type: string;
  seq: number | null;
  buy_items: string | null;
  buy_qty: number;
  buy_type: string | null;
  buy_combined_qty: number | null;
  buy_fromtotal: number | null;
  buy_tototal: number | null;
  prom_group: string | null;
  card_pattern: string | null;
  get_items: string | null;
  get_item_price: number | null;
  get_qty: number;
  get_discamt: number | null;
  get_max_discamt: number;
  get_discpct: number | null;
  get_value_range: number | null;
  get_vouchertype: string | null;
  get_item_option: string | null;
  svc_card_months: number | null;
  guideline: string | null;
}

interface Promotion {
  id: string;
  api_id: number;
  code: string | null;
  seq: number | null;
  name: string | null;
  fromdate: Date | null;
  todate: Date | null;
  ptype: string | null;
  pricetype: string | null;
  brand_code: string | null;
  locked: string | null;
  status: string | null;
  enteredby: string | null;
  enteredat: Date | null;
  sync_date_from: string | null;
  sync_date_to: string | null;
  brand: string | null;
  lines?: PromotionLine[];
  createdAt: Date;
  updatedAt: Date;
}

export default function PromotionPage() {
  const [promotionList, setPromotionList] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    ptype?: string;
    status?: string;
    code?: string;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    ptype?: string;
    status?: string;
    code?: string;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string | null): string => {
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

  const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadPromotion = async () => {
    setLoading(true);
    try {
      const response = await promotionApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filter,
      });
      if (response.data.success) {
        setPromotionList(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      } else {
        showToast('error', 'Lỗi khi tải dữ liệu');
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.message || error.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotion();
  }, [filter, pagination.page, pagination.limit]);

  const handleSearch = () => {
    setFilter({ ...filterInput });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const response = await promotionApi.exportExcel(filter);
      
      // Create blob URL and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const brandSuffix = filter.brand ? `_${filter.brand.toUpperCase()}` : '';
      link.download = `CTKM_ChiTiet_${dateStr}${brandSuffix}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setToast({ type: 'success', message: 'Xuất Excel thành công!' });
    } catch (error: any) {
      console.error('Export error:', error);
      setToast({
        type: 'error',
        message: error?.response?.data?.message || 'Lỗi khi xuất Excel',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Danh sách CTKM</h1>
          <p className="text-gray-600">Quản lý chương trình khuyến mãi</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn hàng</label>
              <select
                value={filterInput.brand || ''}
                onChange={(e) => setFilterInput({ ...filterInput, brand: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="menard">Menard</option>
                <option value="f3">F3</option>
                <option value="labhair">Labhair</option>
                <option value="yaman">Yaman</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filterInput.dateFrom || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateFrom: e.target.value ? convertDateToDDMMMYYYY(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filterInput.dateTo || ''}
                onChange={(e) => setFilterInput({ ...filterInput, dateTo: e.target.value ? convertDateToDDMMMYYYY(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
              <select
                value={filterInput.ptype || ''}
                onChange={(e) => setFilterInput({ ...filterInput, ptype: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="V">V</option>
                <option value="P">P</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <input
                type="text"
                value={filterInput.status || ''}
                onChange={(e) => setFilterInput({ ...filterInput, status: e.target.value || undefined })}
                placeholder="Nhập trạng thái"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã CTKM</label>
              <input
                type="text"
                value={filterInput.code || ''}
                onChange={(e) => setFilterInput({ ...filterInput, code: e.target.value || undefined })}
                placeholder="Nhập mã CTKM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã CTKM</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhãn</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Từ ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đến ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      promotionList.map((promotion) => {
                        const isExpanded = expandedRows.has(promotion.id);
                        const iLines = promotion.lines?.filter((line) => line.line_type === 'i_lines') || [];
                        const vLines = promotion.lines?.filter((line) => line.line_type === 'v_lines') || [];

                        return (
                          <React.Fragment key={promotion.id}>
                            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(promotion.id)}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <svg
                                  className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{promotion.api_id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{promotion.code || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{promotion.name || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  promotion.ptype === 'V' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {promotion.ptype || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{promotion.brand || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(promotion.fromdate)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(promotion.todate) || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  promotion.locked === 'Y' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {promotion.status || '-'}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="px-4 py-4 bg-gray-50">
                                  <div className="mb-4 pb-4 border-b border-gray-300">
                                    <div className="text-sm text-gray-700">
                                      <strong>Mã gốc:</strong> <span className="font-semibold text-gray-900 ml-2">{promotion.code || `ID: ${promotion.api_id}`}</span>
                                      {promotion.lines && promotion.lines.length > 0 && (
                                        <span className="ml-4 text-gray-600">
                                          ({promotion.lines.length} chi tiết)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-full">
                                    {promotion.lines && promotion.lines.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã chi tiết</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seq</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Items</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Qty</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy From Total</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy To Total</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Type</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Combined Qty</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prom Group</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Pattern</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Items</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Item Price</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Qty</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Disc Amt</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Max Disc Amt</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Disc Pct</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Value Range</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Voucher Type</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Get Item Option</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Svc Card Months</th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guideline</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {promotion.lines.map((line, idx) => {
                                              const detailCode = line.seq !== null && promotion.code
                                                ? `${promotion.code}.${String(line.seq).padStart(2, '0')}`
                                                : null;
                                              return (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {detailCode || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.line_type === 'i_lines' ? 'I Lines' : 'V Lines'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.seq !== null ? line.seq : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_items || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_qty !== undefined && line.buy_qty !== null ? line.buy_qty : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_fromtotal !== undefined && line.buy_fromtotal !== null ? line.buy_fromtotal.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_tototal !== undefined && line.buy_tototal !== null ? line.buy_tototal.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_type || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.buy_combined_qty !== undefined && line.buy_combined_qty !== null ? line.buy_combined_qty : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.prom_group || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.card_pattern || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_items || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_item_price !== undefined && line.get_item_price !== null ? line.get_item_price.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_qty !== undefined && line.get_qty !== null ? line.get_qty : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_discamt !== undefined && line.get_discamt !== null ? line.get_discamt.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_max_discamt !== undefined && line.get_max_discamt !== null ? line.get_max_discamt.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_discpct !== undefined && line.get_discpct !== null ? `${line.get_discpct}%` : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_value_range !== undefined && line.get_value_range !== null && line.get_value_range > 0 ? line.get_value_range.toLocaleString() : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_vouchertype || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.get_item_option || '-'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {line.svc_card_months !== undefined && line.svc_card_months !== null && line.svc_card_months > 0 ? line.svc_card_months : '-'}
                                                  </td>
                                                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                                    {line.guideline || '-'}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">Không có chi tiết</p>
                                    )}
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-600">Người tạo:</span>
                                        <span className="ml-2 font-medium">{promotion.enteredby || '-'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Ngày tạo:</span>
                                        <span className="ml-2 font-medium">{formatDate(promotion.enteredat)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Brand Code:</span>
                                        <span className="ml-2 font-medium">{promotion.brand_code || '-'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Khóa:</span>
                                        <span className="ml-2 font-medium">{promotion.locked === 'Y' ? 'Có' : 'Không'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

