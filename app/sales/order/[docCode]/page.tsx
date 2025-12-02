'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Toast } from '@/components/Toast';

interface Sale {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  revenue: number;
  description?: string;
  kenh?: string;
  promCode?: string;
  promotion?: {
    raw?: any;
    main?: any;
  } | null;
  isProcessed: boolean;
  product?: {
    maVatTu?: string;
    tenVatTu?: string;
    maERP?: string;
    dvt?: string;
    loaiVatTu?: string;
  } | null;
  // Các trường bắt buộc
  partnerCode?: string;
  kyHieu?: string;
  maKho?: string;
  maLo?: string;
  maThue?: string;
  tkNo?: string;
  tkDoanhThu?: string;
  tkGiaVon?: string;
  tkChiPhiKhuyenMai?: string;
  tkThueCo?: string;
  cucThue?: string;
  // Các trường khác
  nhanVienBan?: string;
  tenNhanVienBan?: string;
  dvt?: string;
  loai?: string;
  giaBan?: number;
  tienHang?: number;
  maNt?: string;
  tyGia?: number;
  maThanhToan?: string;
  vuViec?: string;
  boPhan?: string;
  lsx?: string;
  sanPham?: string;
  hopDong?: string;
  phi?: number;
  kol?: string;
  kheUoc?: string;
  maCa?: string;
  isRewardLine?: boolean;
  isBundleRewardLine?: boolean;
  dongThuocGoi?: string;
  trangThai?: string;
  barcode?: string;
  muaHangGiamGia?: number;
  chietKhauMuaHangGiamGia?: number;
  ckTheoChinhSach?: string;
  chietKhauCkTheoChinhSach?: number;
  muaHangCkVip?: string;
  chietKhauMuaHangCkVip?: number;
  thanhToanCoupon?: number;
  chietKhauThanhToanCoupon?: number;
  thanhToanVoucher?: number;
  chietKhauThanhToanVoucher?: number;
  duPhong1?: number;
  chietKhauDuPhong1?: number;
  duPhong2?: number;
  chietKhauDuPhong2?: number;
  duPhong3?: number;
  chietKhauDuPhong3?: number;
  hang?: string;
  chietKhauHang?: number;
  thuongBangHang?: number;
  chietKhauThuongMuaBangHang?: number;
  thanhToanTkTienAo?: number;
  chietKhauThanhToanTkTienAo?: number;
  ckThem1?: number;
  chietKhauThem1?: number;
  ckThem2?: number;
  chietKhauThem2?: number;
  ckThem3?: number;
  chietKhauThem3?: number;
  voucherDp1?: string;
  chietKhauVoucherDp1?: number;
  voucherDp2?: string;
  chietKhauVoucherDp2?: number;
  voucherDp3?: string;
  chietKhauVoucherDp3?: number;
  voucherDp4?: string;
  chietKhauVoucherDp4?: number;
  voucherDp5?: string;
  chietKhauVoucherDp5?: number;
  voucherDp6?: string;
  chietKhauVoucherDp6?: number;
  voucherDp7?: string;
  chietKhauVoucherDp7?: number;
  voucherDp8?: string;
  chietKhauVoucherDp8?: number;
  troGia?: number;
  maCtkmTangHang?: string;
  maThe?: string;
  soSerial?: string;
}

// Định nghĩa labels cho tất cả các trường
const FIELD_LABELS: Record<keyof Sale, string> = {
  id: 'ID',
  itemCode: '* Mã hàng',
  itemName: 'Tên mặt hàng',
  qty: 'Số lượng',
  revenue: 'Doanh thu',
  description: 'Diễn giải',
  kenh: 'Kênh',
  promCode: 'Khuyến mãi',
  promotion: 'Promotion',
  isProcessed: 'Đã xử lý',
  product: 'Sản phẩm',
  partnerCode: '* Mã khách',
  kyHieu: '* Ký hiệu',
  maKho: '* Mã kho',
  maLo: '* Mã lô',
  maThue: '* Mã thuế',
  tkNo: '* Tk nợ',
  tkDoanhThu: '* Tk doanh thu',
  tkGiaVon: '* Tk giá vốn',
  tkChiPhiKhuyenMai: '* Tk chi phí khuyến mãi',
  tkThueCo: '* Tk thuế có',
  cucThue: '* Cục thuế',
  nhanVienBan: 'Nhân viên bán',
  tenNhanVienBan: 'Tên nhân viên bán',
  dvt: 'Đvt',
  loai: 'Loại',
  giaBan: 'Giá bán',
  tienHang: 'Tiền hàng',
  maNt: 'Mã nt',
  tyGia: 'Tỷ giá',
  maThanhToan: 'Mã thanh toán',
  vuViec: 'Vụ việc',
  boPhan: 'Bộ phận',
  lsx: 'Lsx',
  sanPham: 'Sản phẩm',
  hopDong: 'Hợp đồng',
  phi: 'Phí',
  kol: 'KOL',
  kheUoc: 'Khế ước',
  maCa: 'Mã ca',
  isRewardLine: 'is_reward_line',
  isBundleRewardLine: 'is_bundle_reward_line',
  dongThuocGoi: 'Dòng thuộc gói',
  trangThai: 'Trạng thái',
  barcode: 'Barcode',
  muaHangGiamGia: 'Mua hàng giảm giá',
  chietKhauMuaHangGiamGia: 'Chiết khấu mua hàng giảm giá',
  ckTheoChinhSach: 'CK theo chính sách',
  chietKhauCkTheoChinhSach: 'Chiết khấu ck theo chính sách',
  muaHangCkVip: 'Mua hàng CK VIP',
  chietKhauMuaHangCkVip: 'Chiết khấu mua hàng CK VIP',
  thanhToanCoupon: 'Thanh toán coupon',
  chietKhauThanhToanCoupon: 'Chiết khấu thanh toán coupon',
  thanhToanVoucher: 'Thanh toán voucher',
  chietKhauThanhToanVoucher: 'Chiết khấu thanh toán voucher',
  duPhong1: 'Dự phòng 1',
  chietKhauDuPhong1: 'Chiết khấu dự phòng 1',
  duPhong2: 'Dự phòng 2',
  chietKhauDuPhong2: 'Chiết khấu dự phòng 2',
  duPhong3: 'Dự phòng 3',
  chietKhauDuPhong3: 'Chiết khấu dự phòng 3',
  hang: 'Hãng',
  chietKhauHang: 'Chiết khấu hãng',
  thuongBangHang: 'Thưởng bằng hàng',
  chietKhauThuongMuaBangHang: 'Chiết khấu thưởng mua bằng hàng',
  thanhToanTkTienAo: 'Thanh toán TK tiền ảo',
  chietKhauThanhToanTkTienAo: 'Chiết khấu thanh toán TK tiền ảo',
  ckThem1: 'CK thêm 1',
  chietKhauThem1: 'Chiết khấu thêm 1',
  ckThem2: 'CK thêm 2',
  chietKhauThem2: 'Chiết khấu thêm 2',
  ckThem3: 'CK thêm 3',
  chietKhauThem3: 'Chiết khấu thêm 3',
  voucherDp1: 'Voucher DP1',
  chietKhauVoucherDp1: 'Chiết khấu Voucher DP1',
  voucherDp2: 'Voucher DP2',
  chietKhauVoucherDp2: 'Chiết khấu Voucher DP2',
  voucherDp3: 'Voucher DP3',
  chietKhauVoucherDp3: 'Chiết khấu Voucher DP3',
  voucherDp4: 'Voucher DP4',
  chietKhauVoucherDp4: 'Chiết khấu Voucher DP4',
  voucherDp5: 'Voucher DP5',
  chietKhauVoucherDp5: 'Chiết khấu Voucher DP5',
  voucherDp6: 'Voucher DP6',
  chietKhauVoucherDp6: 'Chiết khấu Voucher DP6',
  voucherDp7: 'Voucher DP7',
  chietKhauVoucherDp7: 'Chiết khấu Voucher DP7',
  voucherDp8: 'Voucher DP8',
  chietKhauVoucherDp8: 'Chiết khấu Voucher DP8',
  troGia: 'Trợ giá',
  maCtkmTangHang: 'Mã CTKM tặng hàng',
  maThe: 'Mã thẻ',
  soSerial: 'Số serial',
};

// Các cột mặc định (các trường bắt buộc)
const MAIN_COLUMNS: (keyof Sale)[] = [
  'partnerCode',
  'itemCode',
  'kyHieu',
  'maKho',
  'maLo',
  'maThue',
  'tkNo',
  'tkDoanhThu',
  'tkGiaVon',
  'tkChiPhiKhuyenMai',
  'tkThueCo',
  'cucThue',
];

interface OrderDetail {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: {
    id: string;
    code: string;
    name: string;
    brand: string;
    street?: string;
    phone?: string;
  };
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  sales: Sale[];
  promotions?: Record<
    string,
    {
      raw?: any;
      main?: any;
    }
  >;
}

export default function OrderDetailPage() {
  const params = useParams();
  const docCode = params.docCode as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<(keyof Sale)[]>([...MAIN_COLUMNS]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (docCode) {
      loadOrderDetail();
    }
  }, [docCode]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesApi.getByOrderCode(docCode);
      // Đảm bảo dữ liệu được parse đúng
      const orderData = response.data;
      if (orderData) {
        // Convert số nếu cần
        const processedOrder = {
          ...orderData,
          totalRevenue: Number(orderData.totalRevenue) || 0,
          totalQty: Number(orderData.totalQty) || 0,
          totalItems: Number(orderData.totalItems) || 0,
          sales: (orderData.sales || []).map((sale: any) => ({
            ...sale,
            qty: Number(sale.qty) || 0,
            revenue: Number(sale.revenue) || 0,
          })),
        };
        setOrder(processedOrder);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (field: keyof Sale) => {
    setSelectedColumns(prev => {
      const index = prev.indexOf(field);
      if (index > -1) {
        return prev.filter(col => col !== field);
      } else {
        const allFields = Object.keys(FIELD_LABELS) as (keyof Sale)[];
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

  const formatValue = (value: any, field: keyof Sale): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Có' : 'Không'}
        </span>
      );
    }
    
    if (typeof value === 'number') {
      if (value % 1 !== 0) {
        return value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return value.toLocaleString('vi-VN');
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
    
    if (typeof value === 'object' && value !== null) {
      return <span className="text-xs text-gray-500">[Object]</span>;
    }
    
    return String(value);
  };

  const renderCellValue = (sale: Sale, field: keyof Sale, order: OrderDetail): React.ReactNode => {
    // Xử lý các trường đặc biệt từ order
    if (field === 'partnerCode') {
      return sale.partnerCode || order.customer.code || '-';
    }
    
    if (field === 'itemName') {
      return sale.product?.tenVatTu || sale.itemName || '-';
    }
    
    // Lấy giá trị từ sale
    const value = sale[field];
    
    // Nếu là số tiền hoặc số lượng, format đặc biệt
    if (field === 'qty' || field === 'revenue' || field === 'giaBan' || field === 'tienHang') {
      if (typeof value === 'number') {
        return value.toLocaleString('vi-VN');
      }
    }
    
    if (field === 'revenue' || field === 'giaBan' || field === 'tienHang') {
      if (typeof value === 'number') {
        return `${value.toLocaleString('vi-VN')} đ`;
      }
    }
    
    return formatValue(value, field);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-800">{error || 'Không tìm thấy đơn hàng'}</p>
        </div>
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/sales" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại danh sách đơn hàng
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
        </div>

        {/* Thông tin đơn hàng và khách hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Thông tin đơn hàng */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Mã đơn hàng</label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.docCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày đơn hàng</label>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(order.docDate).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Chi nhánh</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.branchCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Loại nguồn</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.docSourceType}</p>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Mã khách hàng</label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.customer.code}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tên khách hàng</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.customer.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Nhãn hàng</label>
                <p className="text-sm text-gray-900 mt-0.5 capitalize">{order.customer.brand}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <label className="text-xs text-gray-500">Số điện thoại</label>
                  <p className="text-sm text-gray-900 mt-0.5">{order.customer.phone}</p>
                </div>
              )}
              {order.customer.street && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Địa chỉ</label>
                  <p className="text-sm text-gray-900 mt-0.5">{order.customer.street}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng số sản phẩm</label>
              <p className="text-xl font-bold text-blue-600 mt-1">{order.totalItems}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng số lượng</label>
              <p className="text-xl font-bold text-purple-600 mt-1">{Number(order.totalQty).toLocaleString('vi-VN')}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng doanh thu</label>
              <p className="text-lg font-bold text-green-600 mt-1">
                {Number(order.totalRevenue).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin chương trình khuyến mại */}
        {order.promotions && Object.keys(order.promotions).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Khuyến mại
              </h2>
            </div>
            <div className="space-y-4">
              {Object.entries(order.promotions).map(([promCode, promoData]) => {
                const promo = promoData?.main;
                if (!promo) return null;

                // Format date
                const formatDate = (dateString: string) => {
                  if (!dateString) return '-';
                  return new Date(dateString).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                };

                // Render conditions
                const renderConditions = (conditions: any) => {
                  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return null;
                  
                  const renderCondition = (condition: any, indent = 0): JSX.Element | null => {
                    if (!condition) return null;
                    
                    if (condition.type === 'PRODUCT_SET') {
                      const value = condition.value || {};
                      const productCodes = Array.isArray(value.productCode) ? value.productCode : [];
                      const quantity = value.quantity || 0;
                      const operator = value.quantityOperator || '';
                      
                      return (
                        <div className="text-sm flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-gray-700">Sản phẩm:</span>
                          <div>
                            <span className="text-gray-900">{productCodes.join(', ')}</span>
                            {quantity > 0 && (
                              <span className="text-gray-600 ml-1">
                                (Số lượng {operator === 'GREATER_OR_EQUAL' ? '≥' : operator === 'EQUAL' ? '=' : '>'} {quantity})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    if (condition.type === 'CUSTOMER_PHONE') {
                      const value = condition.value || {};
                      const phoneNumbers = Array.isArray(value.phoneNumber) ? value.phoneNumber : [];
                      
                      return (
                        <div className="text-sm flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-gray-700">Số điện thoại:</span>
                          <span className="text-gray-900">{phoneNumbers.join(', ')}</span>
                        </div>
                      );
                    }
                    
                    if (condition.children && condition.children.length > 0) {
                      return (
                        <div style={{ marginLeft: `${indent * 16}px` }} className="space-y-1">
                          {condition.matchType && (
                            <div className="text-xs font-semibold text-gray-600 mb-1.5">
                              {condition.matchType === 'ALL' ? '✓ Tất cả điều kiện' : '⊘ Một trong các điều kiện'}
                            </div>
                          )}
                          {condition.children.map((child: any, idx: number) => (
                            <div key={idx}>{renderCondition(child, indent + 1)}</div>
                          ))}
                        </div>
                      );
                    }
                    
                    return null;
                  };
                  
                  return (
                    <div className="space-y-3">
                      {conditions.map((cond: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-gray-300 pl-3">
                          {renderCondition(cond, 0)}
                        </div>
                      ))}
                    </div>
                  );
                };

                // Render actions
                const renderActions = (actions: any) => {
                  if (!actions || !Array.isArray(actions) || actions.length === 0) return null;
                  
                  const renderAction = (action: any, indent = 0): JSX.Element | null => {
                    if (!action) return null;
                    
                    if (action.type === 'PERCENT_TOTAL') {
                      const percent = action.value?.percent || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-blue-700">Giảm giá:</span>
                          <span className="text-green-600 font-bold">{percent}%</span>
                          <span className="text-gray-600">trên tổng tiền</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'FIXED_AMOUNT') {
                      const amount = action.value?.amount || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-blue-700">Giảm giá:</span>
                          <span className="text-green-600 font-bold">{Number(amount).toLocaleString('vi-VN')} đ</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'FREE_PRODUCT') {
                      const products = action.value?.products || [];
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-purple-700">Sản phẩm miễn phí:</span>
                          <div className="flex flex-wrap gap-2">
                            {products.map((product: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                {product.productCode} (x{product.quantity || 1})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    if (action.type === 'COUPON') {
                      const couponCode = action.value?.couponCode || '';
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-orange-700">Mã coupon:</span>
                          <span className="text-orange-600 font-bold">{couponCode}</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'POINT') {
                      const point = action.value?.point || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-yellow-700">Điểm thưởng:</span>
                          <span className="text-yellow-600 font-bold">{point.toLocaleString('vi-VN')} điểm</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'AMOUNT_ITEM') {
                      const productCodes = Array.isArray(action.value?.productCode) ? action.value.productCode : [];
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-indigo-700">Áp dụng cho sản phẩm:</span>
                          <div className="flex flex-wrap gap-2">
                            {productCodes.map((code: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    if (action.children && action.children.length > 0) {
                      return (
                        <div style={{ marginLeft: `${indent * 16}px` }} className="space-y-1">
                          {action.matchType && (
                            <div className="text-xs font-semibold text-gray-600 mb-1.5">
                              {action.matchType === 'ALL' ? '✓ Tất cả hành động' : '⊘ Một trong các hành động'}
                            </div>
                          )}
                          {action.children.map((child: any, idx: number) => (
                            <div key={idx}>{renderAction(child, indent + 1)}</div>
                          ))}
                        </div>
                      );
                    }
                    
                    return null;
                  };
                  
                  return (
                    <div className="space-y-3">
                      {actions.map((act: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-blue-300 pl-3">
                          {renderAction(act, 0)}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div
                    key={promCode}
                    className="border border-gray-200 rounded-xl p-6 transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-white"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{promo.name || promCode}</h3>
                          {promo.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Không hoạt động
                            </span>
                          )}
                        </div>
                        {promo.description && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed border-l-2 border-blue-200 pl-4">{promo.description}</p>
                        )}
                      </div>
                      <span className="group inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-blue-500 text-white border border-blue-600 shadow-md hover:shadow-lg hover:bg-blue-600 transition-all duration-200 cursor-default ml-3">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{promCode}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mã chương trình</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-bold">{promo.code || '-'}</p>
                      </div>
                      {promo.externalCode && (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mã ngoài</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-bold">{promo.externalCode}</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thời gian bắt đầu</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">{formatDate(promo.startDate)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thời gian kết thúc</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">{formatDate(promo.endDate)}</p>
                      </div>
                      {promo.tierCode && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tier Code</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.tierCode}</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cho phép kết hợp</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">
                          {promo.allowCombine ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Có
                            </span>
                          ) : (
                            <span className="text-gray-500">Không</span>
                          )}
                        </p>
                      </div>
                      {promo.maxUsage && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Số lần sử dụng tối đa</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.maxUsage}</p>
                        </div>
                      )}
                      {promo.maxUsagePerCustomer && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Số lần sử dụng/khách hàng</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.maxUsagePerCustomer}</p>
                        </div>
                      )}
                    </div>

                    {promo.conditions && promo.conditions.length > 0 && (
                      <div className="mb-5 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Điều kiện áp dụng
                          </label>
                        </div>
                        <div className="pl-7">
                          {renderConditions(promo.conditions)}
                        </div>
                      </div>
                    )}

                    {promo.actions && promo.actions.length > 0 && (
                      <div className="p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Hành động khuyến mại
                          </label>
                        </div>
                        <div className="pl-7">
                          {renderActions(promo.actions)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danh sách sản phẩm */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Danh sách sản phẩm</h2>
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Chọn cột hiển thị
              </button>
            </div>
            
            {/* Column Selector */}
            {showColumnSelector && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Chọn cột hiển thị</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns([...MAIN_COLUMNS])}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Mặc định
                    </button>
                    <button
                      onClick={() => {
                        const allFields = Object.keys(FIELD_LABELS) as (keyof Sale)[];
                        setSelectedColumns(allFields.filter(f => f !== 'id' && f !== 'promotion' && f !== 'product' && f !== 'isProcessed'));
                      }}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(FIELD_LABELS)
                    .filter(([key]) => key !== 'id' && key !== 'promotion' && key !== 'product' && key !== 'isProcessed')
                    .map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(key as keyof Sale)}
                          onChange={() => toggleColumn(key as keyof Sale)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  {selectedColumns.map((field) => (
                    <th
                      key={field}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {FIELD_LABELS[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {order.sales.map((sale, index) => (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-150 border-l-4 border-l-transparent hover:border-l-blue-400"
                  >
                    {selectedColumns.map((field) => (
                      <td
                        key={field}
                        className="px-4 py-3 text-sm text-gray-900"
                      >
                        <div className="max-w-xs truncate" title={String(renderCellValue(sale, field, order))}>
                          {renderCellValue(sale, field, order)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

