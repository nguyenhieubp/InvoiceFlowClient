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
    limit: 10,
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
  const [syncingAll, setSyncingAll] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
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

      const invoiceList = data.items || [];
      setInvoices(invoiceList);
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

  const handleRetry = async (docCode: string) => {
    try {
      setRetrying((prev) => ({ ...prev, [docCode]: true }));
      const response = await salesApi.createInvoiceViaFastApi(docCode, true);
      const data = response.data;

      console.log('[Retry] Response data:', data);

      if (data.alreadyExists) {
        showToast('info', data.message || `Đơn hàng ${docCode} đã được tạo hóa đơn trước đó`);
        await loadInvoices();
        await loadStatistics();
        return;
      }

      let hasError = false;
      if (Array.isArray(data.result) && data.result.length > 0) {
        hasError = data.result.some((item: any) => item.status === 0);
      } else if (data.result && typeof data.result === 'object') {
        hasError = data.result.status === 0;
      }

      if (data.success && !hasError) {
        showToast('success', data.message || `Đồng bộ lại ${docCode} thành công`);
        // Đợi một chút để đảm bảo database đã được cập nhật
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadInvoices();
        await loadStatistics();
      } else {
        let errorMessage = data.message || `Đồng bộ lại ${docCode} thất bại`;
        
        if (Array.isArray(data.result) && data.result.length > 0) {
          const firstError = data.result[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (data.result?.message) {
          errorMessage = data.result.message;
        }
        
        showToast('error', errorMessage);
        await loadInvoices();
        await loadStatistics();
      }
    } catch (error: any) {
      console.error('Error retrying invoice:', error);
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

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, [pagination.page, pagination.limit]);

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

  const handleSyncByDateRange = async () => {
    if (!syncDateRange.startDate || !syncDateRange.endDate) {
      showToast('error', 'Vui lòng chọn từ ngày và đến ngày');
      return;
    }

    const startDate = new Date(syncDateRange.startDate);
    const endDate = new Date(syncDateRange.endDate);
    
    if (startDate > endDate) {
      showToast('error', 'Từ ngày phải nhỏ hơn hoặc bằng đến ngày');
      return;
    }

    try {
      setSyncingAll(true);
      setShowSyncModal(false);
      showToast('info', 'Đang đồng bộ invoice thất bại theo khoảng thời gian...');

      // Gọi API backend để xử lý đồng bộ
      const response = await fastApiInvoicesApi.syncByDateRange({
        startDate: syncDateRange.startDate,
        endDate: syncDateRange.endDate,
        maDvcs: filters.maDvcs || undefined,
      });

      const data = response.data;

      // Đợi một chút để đảm bảo database đã được cập nhật
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload data
      await loadInvoices();
      await loadStatistics();

      // Hiển thị kết quả
      if (data.successCount > 0 && data.failCount === 0 && data.alreadyExistsCount === 0) {
        showToast('success', `Đồng bộ thành công ${data.successCount} invoice trong khoảng ${syncDateRange.startDate} - ${syncDateRange.endDate}`);
      } else if (data.successCount > 0 && data.failCount === 0 && data.alreadyExistsCount > 0) {
        showToast('success', `Đồng bộ thành công ${data.successCount} invoice, ${data.alreadyExistsCount} invoice đã tồn tại trước đó`);
      } else if (data.successCount > 0 && data.failCount > 0) {
        showToast('info', `Đồng bộ thành công ${data.successCount} invoice, thất bại ${data.failCount} invoice${data.alreadyExistsCount > 0 ? `, ${data.alreadyExistsCount} đã tồn tại` : ''}`);
      } else if (data.successCount === 0 && data.failCount > 0) {
        const errorMessages = data.results
          .filter((r: any) => !r.success)
          .slice(0, 3)
          .map((r: any) => `${r.docCode}: ${r.error || r.message || 'Thất bại'}`)
          .join('; ');
        showToast('error', `Đồng bộ thất bại ${data.failCount} invoice. ${errorMessages}`);
      } else {
        showToast('info', data.message || 'Không có invoice nào được xử lý');
      }
    } catch (error: any) {
      console.error('Error syncing invoices by date range:', error);
      showToast('error', error?.response?.data?.message || error?.message || 'Lỗi khi đồng bộ lại invoice theo khoảng thời gian');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncAllFailed = async () => {
    try {
      setSyncingAll(true);
      showToast('info', 'Đang tải danh sách invoice thất bại...');

      // Lấy TẤT CẢ invoice thất bại từ API (không chỉ trang hiện tại)
      // Sử dụng limit lớn để lấy tất cả
      const params: any = {
        page: 1,
        limit: 10000, // Limit lớn để lấy tất cả
        status: 0, // Chỉ lấy invoice thất bại
      };

      // Áp dụng các filter hiện tại (nếu có) để lấy đúng danh sách
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await fastApiInvoicesApi.getAll(params);
      const failedInvoices = response.data.items || [];
      
      if (failedInvoices.length === 0) {
        showToast('info', 'Không có invoice thất bại nào để đồng bộ');
        setSyncingAll(false);
        return;
      }

      showToast('info', `Đang đồng bộ lại ${failedInvoices.length} invoice thất bại lên Fast API...`);

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Đồng bộ từng invoice
      for (const invoice of failedInvoices) {
        try {
          setRetrying((prev) => ({ ...prev, [invoice.docCode]: true }));
          const response = await salesApi.createInvoiceViaFastApi(invoice.docCode, true);
          const data = response.data;

          // Kiểm tra success giống như handleRetry
          let hasError = false;
          if (Array.isArray(data.result) && data.result.length > 0) {
            hasError = data.result.some((item: any) => item.status === 0);
          } else if (data.result && typeof data.result === 'object') {
            hasError = data.result.status === 0;
          }

          if (data.success && !hasError) {
            successCount++;
          } else {
            failCount++;
            const errorMsg = data.message || 'Thất bại';
            errors.push(`${invoice.docCode}: ${errorMsg}`);
          }
        } catch (error: any) {
          failCount++;
          const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
          errors.push(`${invoice.docCode}: ${errorMsg}`);
        } finally {
          setRetrying((prev) => ({ ...prev, [invoice.docCode]: false }));
        }
      }

      // Đợi một chút để đảm bảo database đã được cập nhật
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload data
      await loadInvoices();
      await loadStatistics();

      // Hiển thị kết quả
      if (successCount > 0 && failCount === 0) {
        showToast('success', `Đồng bộ thành công ${successCount} invoice`);
      } else if (successCount > 0 && failCount > 0) {
        showToast('info', `Đồng bộ thành công ${successCount} invoice, thất bại ${failCount} invoice`);
      } else {
        showToast('error', `Đồng bộ thất bại ${failCount} invoice. ${errors.slice(0, 3).join('; ')}`);
      }
    } catch (error: any) {
      console.error('Error syncing all failed invoices:', error);
      showToast('error', error?.message || 'Lỗi khi đồng bộ lại tất cả invoice');
    } finally {
      setSyncingAll(false);
    }
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

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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


  // Basic columns for main table
  const basicColumns = [
    { key: 'docCode', label: 'Mã đơn hàng', width: 'w-32' },
    { key: 'maKh', label: 'Mã KH', width: 'w-24' },
    { key: 'tenKh', label: 'Tên KH', width: 'w-40' },
    { key: 'maDvcs', label: 'Mã ĐVCS', width: 'w-20' },
    { key: 'ngayCt', label: 'Ngày CT', width: 'w-24' },
    { key: 'status', label: 'Trạng thái', width: 'w-24' },
    { key: 'action', label: 'Thao tác', width: 'w-40' },
    { key: 'message', label: 'Thông báo', width: 'w-96' },
  ];


  return (
    <div className="p-6">
      {/* Toast - Fixed position at top */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bảng kê hóa đơn</h1>
            <p className="text-sm text-gray-600 mb-4">Danh sách chi tiết các hóa đơn đã tạo từ Fast API</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSyncModal(true)}
              disabled={syncingAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Đồng bộ theo ngày</span>
            </button>
            <button
              onClick={handleSyncAllFailed}
              disabled={syncingAll || invoices.filter(inv => inv.status === 0).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncingAll ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đồng bộ...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Đồng bộ lại lên Fast</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal đồng bộ theo ngày */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Đồng bộ theo khoảng thời gian</h2>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={syncDateRange.startDate}
                  onChange={(e) => setSyncDateRange({ ...syncDateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={syncDateRange.endDate}
                  onChange={(e) => setSyncDateRange({ ...syncDateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {filters.maDvcs && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Sẽ áp dụng filter Mã ĐVCS: <strong>{filters.maDvcs}</strong>
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleSyncByDateRange}
                disabled={syncingAll || !syncDateRange.startDate || !syncDateRange.endDate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncingAll ? 'Đang đồng bộ...' : 'Đồng bộ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <>
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
        {/* Table Header with Count - Always visible */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {loading ? (
                <span>Đang tải...</span>
              ) : (
                <>
                  Tổng số: <span className="font-bold text-gray-900">{pagination.total}</span> đơn hàng
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
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {basicColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width || ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
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
                        {formatDateOnly(invoice.ngayCt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
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
                      <td className={`px-6 py-4 text-sm max-w-96 ${invoice.status === 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {invoice.status === 0 && invoice.message ? (
                          <div className="break-words whitespace-normal" title={invoice.message}>
                            {invoice.message}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
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
      </>
    </div>
  );
}
