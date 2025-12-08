'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import Link from 'next/link';

interface Sale {
  id: string;
  docCode: string;
  docDate: string;
  itemName: string;
  qty: number;
  revenue: number;
  kenh?: string;
  promCode?: string;
  promotionName?: string | null;
  isProcessed: boolean;
  customer: {
    name: string;
    code: string;
    brand: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; processed?: boolean }>({});

  useEffect(() => {
    loadSales();
  }, [filter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll(filter);
      const salesData = response.data.data || [];
      
      // Debug: Log một vài sale để kiểm tra promotionName
      if (salesData.length > 0) {
        const saleWithPromo = salesData.find((s: Sale) => s.promCode);
        if (saleWithPromo) {
          console.log('Sample sale with promotion:', {
            promCode: saleWithPromo.promCode,
            promotionName: saleWithPromo.promotionName,
            fullSale: saleWithPromo,
          });
        }
      }
      
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Danh sách đơn hàng</h1>
        <div className="flex gap-4">
          <select
            value={filter.brand || ''}
            onChange={(e) => setFilter({ ...filter, brand: e.target.value || undefined })}
            className="px-4 py-2 border rounded"
          >
            <option value="">Tất cả nhãn hàng</option>
            <option value="chando">Chando</option>
            <option value="f3">F3</option>
            <option value="labhair">LabHair</option>
            <option value="yaman">Yaman</option>
            <option value="menard">Menard</option>
          </select>
          <select
            value={filter.processed === undefined ? '' : filter.processed ? 'true' : 'false'}
            onChange={(e) => {
              const value = e.target.value;
              setFilter({
                ...filter,
                processed: value === '' ? undefined : value === 'true',
              });
            }}
            className="px-4 py-2 border rounded"
          >
            <option value="">Tất cả</option>
            <option value="false">Chưa xử lý</option>
            <option value="true">Đã xử lý</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Mã đơn</th>
                <th className="px-4 py-2 border">Ngày</th>
                <th className="px-4 py-2 border">Khách hàng</th>
                <th className="px-4 py-2 border">Sản phẩm</th>
                <th className="px-4 py-2 border">Số lượng</th>
                <th className="px-4 py-2 border">Doanh thu</th>
                <th className="px-4 py-2 border">Kênh</th>
                <th className="px-4 py-2 border">Mã khuyến mại</th>
                <th className="px-4 py-2 border">Trạng thái</th>
                <th className="px-4 py-2 border">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{sale.docCode}</td>
                  <td className="px-4 py-2 border">
                    {new Date(sale.docDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-2 border">
                    <div>
                      <div className="font-medium">{sale.customer.name}</div>
                      <div className="text-sm text-gray-500">{sale.customer.code}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{sale.itemName}</td>
                  <td className="px-4 py-2 border text-center">{sale.qty}</td>
                  <td className="px-4 py-2 border text-right">
                    {sale.revenue.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-2 border">{sale.kenh || '-'}</td>
                  <td className="px-4 py-2 border">
                    {(() => {
                      // Ưu tiên promotionName từ API
                      if (sale.promotionName) {
                        return sale.promotionName;
                      }
                      // Nếu không có promotionName, cắt phần sau dấu "-" từ promCode
                      if (sale.promCode) {
                        const parts = sale.promCode.split('-');
                        return parts[0] || sale.promCode;
                      }
                      return '-';
                    })()}
                  </td>
                  <td className="px-4 py-2 border">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        sale.isProcessed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sale.isProcessed ? 'Đã xử lý' : 'Chưa xử lý'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Xem chi tiết
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

