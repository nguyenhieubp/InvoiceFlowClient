'use client';

import { useEffect, useState } from 'react';
import { fastApiInvoicesApi, salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface FastApiInvoice {
  id: string;
  docCode: string;
  maDvcs: string | null;
  maKh: string | null;
  tenKh: string | null;
  ngayCt: string | null;
  status: number;
  message: string | null;
  guid: string | null;
  fastApiResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FastApiInvoicesPage() {
  const [invoices, setInvoices] = useState<FastApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    status: '',
    docCode: '',
    maKh: '',
    tenKh: '',
    maDvcs: '',
    startDate: '',
    endDate: '',
  });
  const [statistics, setStatistics] = useState<{
    total: number;
    success: number;
    failed: number;
    successRate: string;
  } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRetry = async (docCode: string) => {
    try {
      setRetrying((prev) => ({ ...prev, [docCode]: true }));
      const response = await salesApi.createInvoiceViaFastApi(docCode, true);
      const data = response.data;

      console.log('[Retry] Response data:', data);

      // Nếu đã tồn tại (alreadyExists = true), vẫn coi như thành công
      if (data.alreadyExists) {
        showToast('info', data.message || `Đơn hàng ${docCode} đã được tạo hóa đơn trước đó`);
        await loadInvoices();
        await loadStatistics();
        return;
      }

      // Check success flag và status trong result (status === 0 là lỗi)
      let hasError = false;
      if (Array.isArray(data.result) && data.result.length > 0) {
        hasError = data.result.some((item: any) => item.status === 0);
      } else if (data.result && typeof data.result === 'object') {
        hasError = data.result.status === 0;
      }

      console.log('[Retry] hasError:', hasError, 'data.success:', data.success, 'data.result:', data.result);

      // Nếu success = false hoặc có error trong result, coi như thất bại
      if (data.success && !hasError) {
        showToast('success', data.message || `Đồng bộ lại ${docCode} thành công`);
        // Reload danh sách sau khi retry thành công
        await loadInvoices();
        await loadStatistics();
      } else {
        // Xử lý lỗi chi tiết hơn
        let errorMessage = data.message || `Đồng bộ lại ${docCode} thất bại`;
        
        if (Array.isArray(data.result) && data.result.length > 0) {
          const firstError = data.result[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (data.result?.message) {
          errorMessage = data.result.message;
        }
        
        console.log('[Retry] Error message:', errorMessage);
        showToast('error', errorMessage);
        // Vẫn reload để cập nhật status mới
        await loadInvoices();
        await loadStatistics();
      }
    } catch (error: any) {
      console.error('Error retrying invoice:', error);
      // Xử lý lỗi từ response hoặc error object
      let errorMessage = `Lỗi khi đồng bộ lại ${docCode}`;
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast('error', errorMessage);
    } finally {
      setRetrying((prev) => ({ ...prev, [docCode]: false }));
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = parseInt(filters.status);
      if (filters.docCode) params.docCode = filters.docCode;
      if (filters.maKh) params.maKh = filters.maKh;
      if (filters.tenKh) params.tenKh = filters.tenKh;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await fastApiInvoicesApi.getAll(params);
      const data = response.data;

      setInvoices(data.items || []);
      setPagination({
        ...pagination,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        hasNext: data.pagination?.hasNext || false,
        hasPrev: data.pagination?.hasPrev || false,
      });
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      showToast('error', error?.response?.data?.message || 'Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;

      const response = await fastApiInvoicesApi.getStatistics(params);
      setStatistics(response.data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, [pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    loadInvoices();
    loadStatistics();
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      docCode: '',
      maKh: '',
      tenKh: '',
      maDvcs: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Thành công
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Thất bại
        </span>
      );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng kê hóa đơn</h1>
        <p className="text-sm text-gray-600 mt-1">Danh sách các hóa đơn đã tạo từ Fast API</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Thành công</div>
            <div className="text-2xl font-bold text-green-600">{statistics.success}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Thất bại</div>
            <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.successRate}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="1">Thành công</option>
              <option value="0">Thất bại</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
            <input
              type="text"
              value={filters.docCode}
              onChange={(e) => handleFilterChange('docCode', e.target.value)}
              placeholder="SO31.00149453"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
            <input
              type="text"
              value={filters.maKh}
              onChange={(e) => handleFilterChange('maKh', e.target.value)}
              placeholder="KF25127785"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
            <input
              type="text"
              value={filters.tenKh}
              onChange={(e) => handleFilterChange('tenKh', e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn vị</label>
            <input
              type="text"
              value={filters.maDvcs}
              onChange={(e) => handleFilterChange('maDvcs', e.target.value)}
              placeholder="FBV"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Áp dụng
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã KH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên KH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã ĐVCS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày CT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông báo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.docCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.maKh || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.tenKh || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.maDvcs || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.ngayCt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={invoice.message || ''}>
                        {invoice.message || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.status === 0 && (
                          <button
                            onClick={() => handleRetry(invoice.docCode)}
                            disabled={retrying[invoice.docCode]}
                            className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {retrying[invoice.docCode] ? 'Đang xử lý...' : 'Đồng bộ lại'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong tổng số <span className="font-medium">{pagination.total}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

