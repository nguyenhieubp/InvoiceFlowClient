'use client';

import React, { useEffect, useState } from 'react';
import { platformFeeImportApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface PlatformFeeMap {
  id?: string;
  platform: string;
  rawFeeName: string;
  normalizedFeeName?: string;
  internalCode: string;
  accountCode: string;
  description?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const FIELD_LABELS: Record<keyof PlatformFeeMap, string> = {
  id: 'ID',
  platform: 'Platform',
  rawFeeName: 'Tên phí gốc',
  normalizedFeeName: 'Tên phí đã chuẩn hóa',
  internalCode: 'Mã nội bộ',
  accountCode: 'Mã tài khoản',
  description: 'Mô tả',
  active: 'Trạng thái',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
};

const MAIN_COLUMNS: (keyof PlatformFeeMap)[] = [
  'platform',
  'rawFeeName',
  'accountCode',
  'internalCode',
  'active',
];

const PLATFORMS = ['shopee', 'tiktok', 'lazada'];

export default function PlatformFeeMapPage() {
  const [feeMaps, setFeeMaps] = useState<PlatformFeeMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<(keyof PlatformFeeMap)[]>(
    [...MAIN_COLUMNS]
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFeeMap, setEditingFeeMap] = useState<PlatformFeeMap | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFeeMap, setDeletingFeeMap] = useState<PlatformFeeMap | null>(null);
  const [formData, setFormData] = useState<Partial<PlatformFeeMap>>({
    platform: 'shopee',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadFeeMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchQuery, selectedPlatform, selectedActive]);

  const loadFeeMaps = async () => {
    try {
      setLoading(true);
      const response = await platformFeeImportApi.getFeeMaps({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchQuery || undefined,
        platform: selectedPlatform || undefined,
        active: selectedActive === 'true' ? true : selectedActive === 'false' ? false : undefined,
      });
      const data = response.data.data || response.data || [];
      setFeeMaps(data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.meta?.total || data.length,
        totalPages: response.data.meta?.totalPages || Math.ceil((response.data.meta?.total || data.length) / prev.limit),
      }));
    } catch (error: any) {
      showToast('error', 'Lỗi khi tải danh sách map phí: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (field: keyof PlatformFeeMap) => {
    setSelectedColumns(prev => {
      const index = prev.indexOf(field);
      if (index > -1) {
        return prev.filter(col => col !== field);
      } else {
        const allFields = Object.keys(FIELD_LABELS) as (keyof PlatformFeeMap)[];
        const fieldIndex = allFields.indexOf(field);
        
        let insertIndex = prev.length;
        for (let i = 0; i < prev.length; i++) {
          const currentIndex = allFields.indexOf(prev[i]);
          if (currentIndex > fieldIndex) {
            insertIndex = i;
            break;
          }
        }
        
        const newSelected = [...prev];
        newSelected.splice(insertIndex, 0, field);
        return newSelected;
      }
    });
  };

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') return (
      <span className="text-gray-400 italic">-</span>
    );
    
    if (typeof value === 'boolean') {
      return value ? (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Hoạt động
        </span>
      ) : (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Tắt
        </span>
      );
    }
    
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          return new Date(value).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return value;
        }
      }
    }
    return String(value);
  };

  const handleCreate = () => {
    setEditingFeeMap(null);
    setFormData({
      platform: 'shopee',
      active: true,
    });
    setShowFormModal(true);
  };

  const handleEdit = (feeMap: PlatformFeeMap) => {
    setEditingFeeMap(feeMap);
    setFormData({
      platform: feeMap.platform,
      rawFeeName: feeMap.rawFeeName,
      internalCode: feeMap.internalCode,
      accountCode: feeMap.accountCode,
      description: feeMap.description || '',
      active: feeMap.active !== undefined ? feeMap.active : true,
    });
    setShowFormModal(true);
  };

  const handleDelete = (feeMap: PlatformFeeMap) => {
    setDeletingFeeMap(feeMap);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.platform || !formData.rawFeeName || !formData.internalCode || !formData.accountCode) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSaving(true);
      if (editingFeeMap?.id) {
        await platformFeeImportApi.updateFeeMap(editingFeeMap.id, formData);
        showToast('success', 'Cập nhật map phí thành công');
      } else {
        await platformFeeImportApi.createFeeMap(formData as any);
        showToast('success', 'Tạo map phí thành công');
      }
      setShowFormModal(false);
      await loadFeeMaps();
    } catch (error: any) {
      showToast('error', 'Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFeeMap?.id) return;

    try {
      setDeleting(true);
      await platformFeeImportApi.deleteFeeMap(deletingFeeMap.id);
      showToast('success', 'Xóa map phí thành công');
      setShowDeleteModal(false);
      setDeletingFeeMap(null);
      await loadFeeMaps();
    } catch (error: any) {
      showToast('error', 'Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Map Phí</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mới
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phí, mã nội bộ, mã tài khoản..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            {PLATFORMS.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={selectedActive}
            onChange={(e) => setSelectedActive(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Tắt</option>
          </select>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Cột
          </button>
          {showColumnSelector && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 max-h-96 overflow-y-auto">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(key as keyof PlatformFeeMap)}
                    onChange={() => toggleColumn(key as keyof PlatformFeeMap)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectedColumns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {FIELD_LABELS[col]}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={selectedColumns.length + 1} className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : feeMaps.length === 0 ? (
                <tr>
                  <td colSpan={selectedColumns.length + 1} className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                feeMaps.map((feeMap) => (
                  <tr key={feeMap.id} className="hover:bg-gray-50">
                    {selectedColumns.map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatValue(feeMap[col])}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(feeMap)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(feeMap)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-sm">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingFeeMap ? 'Sửa Map Phí' : 'Tạo Map Phí Mới'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.platform || ''}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phí gốc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rawFeeName || ''}
                  onChange={(e) => setFormData({ ...formData, rawFeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã nội bộ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.internalCode || ''}
                  onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountCode || ''}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active !== false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingFeeMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
            <p className="mb-4">
              Bạn có chắc chắn muốn xóa map phí <strong>{deletingFeeMap.rawFeeName}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingFeeMap(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

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
