'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categoriesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import Link from 'next/link';

interface PersonalInfo {
  code: string;
  name: string;
  mobile?: string;
  sexual?: string;
  idnumber?: string;
  enteredat?: string;
  crm_lead_source?: string;
  address?: string;
  province_name?: string;
  birthday?: string;
  grade_name?: string;
  branch_code?: string;
}

interface Sale {
  qty?: number;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  ck_tm?: number;
  docid?: number;
  ck_dly?: number;
  serial?: string;
  cm_code?: string;
  doccode?: string;
  docdate?: string;
  line_id?: number;
  revenue?: number;
  catcode1?: string;
  catcode2?: string;
  catcode3?: string;
  disc_amt?: number;
  docmonth?: string;
  itemcode?: string;
  itemcost?: number;
  itemname?: string;
  linetotal?: number;
  ordertype?: string;
  prom_code?: string;
  totalcost?: number;
  crm_emp_id?: string;
  branch_code?: string;
  description?: string;
  doctype_name?: string;
  order_source?: string;
  partner_code?: string;
  partner_name?: string;
  crm_branch_id?: number;
  docsourcetype?: string;
  grade_discamt?: number;
  revenue_wsale?: number;
  saleperson_id?: number;
  revenue_retail?: number;
  paid_by_voucher_ecode_ecoin_bp?: number;
}

interface CustomerData {
  data_customer: {
    Personal_Info: PersonalInfo;
    Sales: Sale[];
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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
    if (code) {
      loadCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesApi.getCustomerByCode(code);
      const data = response.data;
      
      // Handle different response formats
      if (data.data_customer) {
        setCustomerData(data);
        setPagination((prev) => ({
          ...prev,
          total: data.data_customer.Sales?.length || 0,
          totalPages: Math.ceil((data.data_customer.Sales?.length || 0) / prev.limit),
        }));
      } else if (data.Personal_Info) {
        // If response is directly the customer data structure
        setCustomerData({ data_customer: data });
        setPagination((prev) => ({
          ...prev,
          total: data.Sales?.length || 0,
          totalPages: Math.ceil((data.Sales?.length || 0) / prev.limit),
        }));
      } else {
        setError('Không tìm thấy dữ liệu khách hàng');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin khách hàng');
      showToast('error', err.response?.data?.message || 'Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const personalInfo = customerData?.data_customer?.Personal_Info;
  const sales = customerData?.data_customer?.Sales || [];
  
  // Pagination for sales
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedSales = sales.slice(startIndex, endIndex);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
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

  const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !personalInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <p className="text-red-800">{error || 'Không tìm thấy khách hàng'}</p>
              <Link
                href="/categories/customers"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại danh sách khách hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <Link
            href="/categories/customers"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách khách hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết khách hàng</h1>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin khách hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500">Mã khách hàng</label>
              <p className="text-sm font-medium text-gray-900">{personalInfo.code}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Tên khách hàng</label>
              <p className="text-sm font-medium text-gray-900">{personalInfo.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Số điện thoại</label>
              <p className="text-sm text-gray-900">{personalInfo.mobile || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Giới tính</label>
              <p className="text-sm text-gray-900">
                {personalInfo.sexual === 'NU' ? 'Nữ' : personalInfo.sexual === 'NAM' ? 'Nam' : personalInfo.sexual || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Ngày sinh</label>
              <p className="text-sm text-gray-900">{personalInfo.birthday ? formatDate(personalInfo.birthday) : '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">CMND/CCCD</label>
              <p className="text-sm text-gray-900">{personalInfo.idnumber || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Địa chỉ</label>
              <p className="text-sm text-gray-900">{personalInfo.address || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Tỉnh/Thành phố</label>
              <p className="text-sm text-gray-900">{personalInfo.province_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Chi nhánh</label>
              <p className="text-sm text-gray-900">{personalInfo.branch_code || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Hạng khách hàng</label>
              <p className="text-sm text-gray-900">{personalInfo.grade_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Ngày tham gia</label>
              <p className="text-sm text-gray-900">{personalInfo.enteredat ? formatDate(personalInfo.enteredat) : '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Nguồn khách hàng</label>
              <p className="text-sm text-gray-900">{personalInfo.crm_lead_source || '-'}</p>
            </div>
          </div>
        </div>

        {/* Sales Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách đơn hàng ({sales.length})</h2>
          </div>
          
          {paginatedSales.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Không có đơn hàng nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên sản phẩm
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại đơn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã khuyến mại
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSales.map((sale, index) => (
                      <tr key={sale.line_id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{sale.doccode || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(sale.docdate)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.itemcode || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={sale.itemname}>
                            {sale.itemname || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{sale.qty || 0}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{formatCurrency(sale.revenue)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(sale.linetotal)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.ordertype || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.prom_code || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
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
                      <span className="text-sm text-gray-700">đơn hàng/trang</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        trong tổng số <span className="font-medium">{pagination.total}</span> đơn hàng
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

