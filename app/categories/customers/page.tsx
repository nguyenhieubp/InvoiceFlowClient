'use client';

import React, { useEffect, useState } from 'react';
import { categoriesApi, syncCustomersApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import Link from 'next/link';

interface Customer {
  code: string;
  name: string;
  mobile?: string;
  sexual?: string;
  address?: string;
  branch_code?: string;
  birthday?: string;
  province_name?: string;
  grade_name?: string;
  enteredat?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  // Xử lý search và pagination trên client
  useEffect(() => {
    let filtered = allCustomers;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.code.toLowerCase().includes(query) ||
          customer.name.toLowerCase().includes(query) ||
          (customer.mobile && customer.mobile.toLowerCase().includes(query)) ||
          (customer.address && customer.address.toLowerCase().includes(query))
      );
    }
    
    // Update pagination info
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));
    
    // Pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setDisplayedCustomers(paginated);
    
    // Reset về trang 1 nếu search query thay đổi
    if (searchQuery && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allCustomers, pagination.page, pagination.limit]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getCustomers({
        page: 1,
        limit: 10, // Load tất cả để search
      });
      const data = response.data?.data || response.data || [];
      
      // Extract unique customers from data
      const customersMap = new Map<string, Customer>();
      
      // If data is array of customer objects
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.Personal_Info) {
            const info = item.Personal_Info;
            if (info.code && !customersMap.has(info.code)) {
              customersMap.set(info.code, {
                code: info.code,
                name: info.name || '',
                mobile: info.mobile,
                sexual: info.sexual,
                address: info.address,
                branch_code: info.branch_code,
                birthday: info.birthday,
                province_name: info.province_name,
                grade_name: info.grade_name,
                enteredat: info.enteredat,
              });
            }
          } else if (item.code) {
            // Direct customer object
            if (!customersMap.has(item.code)) {
              customersMap.set(item.code, item);
            }
          }
        });
      }
      
      const customersList = Array.from(customersMap.values());
      setAllCustomers(customersList);
      setCustomers(customersList);
      
      setPagination((prev) => ({
        ...prev,
        total: customersList.length,
        totalPages: Math.ceil(customersList.length / prev.limit),
      }));
    } catch (error: any) {
      showToast('error', 'Lỗi khi tải danh sách khách hàng: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncT8 = async () => {
    try {
      setSyncing(true);
      const response = await syncCustomersApi.syncBrandT8('f3');
      showToast('success', response.data.message || 'Đồng bộ dữ liệu thành công');
      // Reload customers after sync
      setTimeout(() => {
        loadCustomers();
      }, 1000);
    } catch (error: any) {
      showToast('error', 'Lỗi khi đồng bộ dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Danh mục khách hàng</h1>
              <button
                onClick={handleSyncT8}
                disabled={syncing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Đồng bộ từ t8
                  </>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã khách hàng, tên, số điện thoại, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500">Không có khách hàng nào</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên khách hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giới tính
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Địa chỉ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi nhánh
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedCustomers.map((customer) => (
                    <tr key={customer.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{customer.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.mobile || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.sexual === 'NU' ? 'Nữ' : customer.sexual === 'NAM' ? 'Nam' : customer.sexual || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={customer.address}>
                          {customer.address || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.branch_code || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Link
                          href={`/categories/customers/${customer.code}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-700">khách hàng/trang</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{pagination.total}</span> khách hàng
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className="text-sm text-gray-700 font-medium">
                    Trang {pagination.page}/{pagination.totalPages || 1}
                  </span>
                  
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

