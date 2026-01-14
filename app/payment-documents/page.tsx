'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PaymentData {
  // From daily_cashio
  fop_syscode: string;
  docdate: string;
  total_in: string;
  so_code: string;
  branch_code_cashio: string;
  ma_dvcs_cashio: string | null;
  refno: string;
  bank_code: string | null;
  period_code: string | null;
  ma_doi_tac_payment: string | null;
  
  // From sales
  docDate: string;
  revenue: string;
  branchCode: string;
  boPhan: string | null;
  ma_dvcs_sale: string | null;
  maCa: string;
  partnerCode: string;
}

const FIELD_LABELS: Record<keyof PaymentData, string> = {
  fop_syscode: 'Mã HTTT',
  docdate: 'Ngày (Cashio)',
  total_in: 'Tiền thu',
  so_code: 'Mã đơn hàng',
  branch_code_cashio: 'Chi nhánh (Cashio)',
  ma_dvcs_cashio: 'ĐVCS (Cashio)',
  ma_doi_tac_payment: 'Mã ĐT (Payment)',
  refno: 'Mã tham chiếu',
  bank_code: 'Ngân hàng',
  period_code: 'Kỳ hạn',
  docDate: 'Ngày (Sale)',
  revenue: 'Doanh thu',
  branchCode: 'Chi nhánh (Sale)',
  boPhan: 'Bộ phận',
  ma_dvcs_sale: 'ĐVCS (Sale)',
  maCa: 'Mã ca',
  partnerCode: 'Mã khách hàng'
};

export default function PaymentDocumentsPage() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Search states
  const [searchQuery, setSearchQuery] = useState(''); // Actual query to send to API
  const [tempSearchQuery, setTempSearchQuery] = useState(''); // Temporary input state

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery || undefined,
        },
      });
      
      const data = response.data.data || [];
      setPayments(data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (error: any) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') return (
      <span className="text-gray-400 italic">-</span>
    );
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
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
    
    // Format currency
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      return parseFloat(value).toLocaleString('vi-VN');
    }
    
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chứng từ thanh toán</h1>
          <p className="text-gray-600">Dữ liệu tổng hợp từ Daily Cashio và Sales</p>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng, mã đối tác, mã tham chiếu..."
                value={tempSearchQuery}
                onChange={(e) => setTempSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(tempSearchQuery);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearchQuery(tempSearchQuery);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Tìm kiếm
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Tổng: <span className="font-semibold">{pagination.total}</span> bản ghi
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    STT
                  </th>
                  {Object.entries(FIELD_LABELS).map(([key, label]) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr 
                      key={index}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={async () => {
                        console.log('Logging FAST payment...', payment);
                        try {
                          await api.post('/payments/fast', payment);
                          console.log('Logged successfully to backend!');
                        } catch (err) {
                          console.error('Failed to log payment', err);
                        }
                      }}
                    >
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-gray-900 border-r">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.fop_syscode)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.docdate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap text-right font-medium text-green-600">{formatValue(payment.total_in)}</td>
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium whitespace-nowrap">{formatValue(payment.so_code)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.branch_code_cashio)}</td>
                      <td className="px-4 py-3 text-sm text-indigo-600 font-medium whitespace-nowrap">{formatValue(payment.ma_dvcs_cashio)}</td>
                      <td className="px-4 py-3 text-sm text-pink-600 font-medium whitespace-nowrap">{formatValue(payment.ma_doi_tac_payment)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.refno)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.bank_code)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.period_code)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.docDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap text-right font-medium text-purple-600">{formatValue(payment.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.branchCode)}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 font-medium whitespace-nowrap">{formatValue(payment.boPhan)}</td>
                      <td className="px-4 py-3 text-sm text-indigo-600 font-medium whitespace-nowrap">{formatValue(payment.ma_dvcs_sale)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.maCa)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatValue(payment.partnerCode)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && payments.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                      <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong{' '}
                      <span className="font-medium">{pagination.total}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Trước</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Trang {pagination.page} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Sau</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
