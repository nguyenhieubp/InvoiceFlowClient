'use client';

import { useEffect, useState } from 'react';
import { invoicesApi } from '@/lib/api';
import Link from 'next/link';

interface Invoice {
  id: string;
  key: string;
  invoiceDate: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  fastStatus?: 'printed' | 'pending' | 'missing';
  fastStatusMessage?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesApi.getAll();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Danh sách hóa đơn</h1>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tạo hóa đơn mới
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Mã hóa đơn</th>
                <th className="px-4 py-2 border">Ngày</th>
                <th className="px-4 py-2 border">Khách hàng</th>
                <th className="px-4 py-2 border">Tổng tiền</th>
                <th className="px-4 py-2 border">Trạng thái (FAST)</th>
                <th className="px-4 py-2 border">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{invoice.key}</td>
                  <td className="px-4 py-2 border">
                    {new Date(invoice.invoiceDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-2 border">{invoice.customerName}</td>
                  <td className="px-4 py-2 border text-right">
                    {invoice.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          invoice.fastStatus === 'printed'
                            ? 'bg-green-100 text-green-800'
                            : invoice.fastStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.fastStatus === 'printed'
                          ? 'Đã in (FAST)'
                          : invoice.fastStatus === 'pending'
                          ? 'Chưa xử lý'
                          : 'Không có trên FAST'}
                      </span>
                      {invoice.fastStatusMessage && (
                        <div className="text-xs text-gray-500 mt-1">
                          {invoice.fastStatusMessage}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

