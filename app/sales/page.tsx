'use client';

import { useEffect, useState } from 'react';
import { salesApi, syncApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import Link from 'next/link';

interface Order {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: {
    name: string;
    code: string;
    brand: string;
  };
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  isProcessed: boolean;
  sales?: Array<{
    promCode?: string;
    itemCode?: string;
    itemName?: string;
    description?: string;
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
    nhanVienBan?: string;
    tenNhanVienBan?: string;
    dvt?: string;
    loai?: string;
    qty?: number;
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
    product?: {
      maVatTu?: string;
      tenVatTu?: string;
      maERP?: string;
      dvt?: string;
      loaiVatTu?: string;
    } | null;
  }>;
}

// Định nghĩa các cột có thể hiển thị (90 cột)
type OrderColumn = 
  | 'partnerCode'      // * Mã khách
  | 'customer'         // * Tên khách hàng
  | 'docDate'          // * Ngày
  | 'docCode'          // * Số hóa đơn
  | 'kyHieu'           // * Ký hiệu
  | 'description'      // Diễn giải
  | 'nhanVienBan'      // Nhân viên bán
  | 'tenNhanVienBan'   // Tên nhân viên bán
  | 'itemCode'         // * Mã hàng
  | 'itemName'         // Tên mặt hàng
  | 'dvt'              // Đvt
  | 'loai'             // Loại
  | 'promotions'       // Khuyến mãi
  | 'maKho'            // * Mã kho
  | 'maLo'             // * Mã lô
  | 'qty'              // Số lượng
  | 'totalItems'       // Số SP
  | 'totalQty'         // Tổng SL
  | 'totalRevenue'     // Tổng DT
  | 'giaBan'           // Giá bán
  | 'tienHang'         // Tiền hàng
  | 'maNt'             // Mã nt
  | 'tyGia'            // Tỷ giá
  | 'maThue'           // * Mã thuế
  | 'tkNo'             // * Tk nợ
  | 'tkDoanhThu'       // * Tk doanh thu
  | 'tkGiaVon'         // * Tk giá vốn
  | 'tkChiPhiKhuyenMai'// * Tk chi phí khuyến mãi
  | 'tkThueCo'         // * Tk thuế có
  | 'cucThue'          // * Cục thuế
  | 'maThanhToan'      // Mã thanh toán
  | 'vuViec'           // Vụ việc
  | 'boPhan'           // Bộ phận
  | 'lsx'              // Lsx
  | 'sanPham'          // Sản phẩm
  | 'hopDong'          // Hợp đồng
  | 'phi'              // Phí
  | 'kol'              // KOL
  | 'kheUoc'           // Khế ước
  | 'maCa'             // Mã ca
  | 'isRewardLine'     // is_reward_line
  | 'isBundleRewardLine' // is_bundle_reward_line
  | 'dongThuocGoi'     // Dòng thuộc gói
  | 'trangThai'        // Trạng thái
  | 'barcode'          // Barcode
  | 'muaHangGiamGia'   // Mua hàng giảm giá
  | 'chietKhauMuaHangGiamGia' // Chiết khấu mua hàng giảm giá
  | 'ckTheoChinhSach'  // CK theo chính sách
  | 'chietKhauCkTheoChinhSach' // Chiết khấu ck theo chính sách
  | 'muaHangCkVip'     // Mua hàng CK VIP
  | 'chietKhauMuaHangCkVip' // Chiết khấu mua hàng CK VIP
  | 'thanhToanCoupon'  // Thanh toán coupon
  | 'chietKhauThanhToanCoupon' // Chiết khấu thanh toán coupon
  | 'thanhToanVoucher' // Thanh toán voucher
  | 'chietKhauThanhToanVoucher' // Chiết khấu thanh toán voucher
  | 'duPhong1'         // Dự phòng 1
  | 'chietKhauDuPhong1' // Chiết khấu dự phòng 1
  | 'duPhong2'         // Dự phòng 2
  | 'chietKhauDuPhong2' // Chiết khấu dự phòng 2
  | 'duPhong3'         // Dự phòng 3
  | 'chietKhauDuPhong3' // Chiết khấu dự phòng 3
  | 'hang'             // Hãng
  | 'chietKhauHang'    // Chiết khấu hãng
  | 'thuongBangHang'   // Thưởng bằng hàng
  | 'chietKhauThuongMuaBangHang' // Chiết khấu thưởng mua bằng hàng
  | 'thanhToanTkTienAo' // Thanh toán TK tiền ảo
  | 'chietKhauThanhToanTkTienAo' // Chiết khấu thanh toán TK tiền ảo
  | 'ckThem1'          // CK thêm 1
  | 'chietKhauThem1'   // Chiết khấu thêm 1
  | 'ckThem2'          // CK thêm 2
  | 'chietKhauThem2'   // Chiết khấu thêm 2
  | 'ckThem3'          // CK thêm 3
  | 'chietKhauThem3'   // Chiết khấu thêm 3
  | 'voucherDp1'       // Voucher DP1
  | 'chietKhauVoucherDp1' // Chiết khấu Voucher DP1
  | 'voucherDp2'       // Voucher DP2
  | 'chietKhauVoucherDp2' // Chiết khấu Voucher DP2
  | 'voucherDp3'       // Voucher DP3
  | 'chietKhauVoucherDp3' // Chiết khấu Voucher DP3
  | 'voucherDp4'       // Voucher DP4
  | 'chietKhauVoucherDp4' // Chiết khấu Voucher DP4
  | 'voucherDp5'       // Voucher DP5
  | 'chietKhauVoucherDp5' // Chiết khấu Voucher DP5
  | 'voucherDp6'       // Voucher DP6
  | 'chietKhauVoucherDp6' // Chiết khấu Voucher DP6
  | 'voucherDp7'       // Voucher DP7
  | 'chietKhauVoucherDp7' // Chiết khấu Voucher DP7
  | 'voucherDp8'       // Voucher DP8
  | 'chietKhauVoucherDp8' // Chiết khấu Voucher DP8
  | 'troGia'           // Trợ giá
  | 'maCtkmTangHang'   // Mã CTKM tặng hàng
  | 'maThe'            // Mã thẻ
  | 'soSerial';        // Số serial

const FIELD_LABELS: Record<OrderColumn, string> = {
  partnerCode: '* Mã khách',
  customer: '* Tên khách hàng',
  docDate: '* Ngày',
  docCode: '* Số hóa đơn',
  kyHieu: '* Ký hiệu',
  description: 'Diễn giải',
  nhanVienBan: 'Nhân viên bán',
  tenNhanVienBan: 'Tên nhân viên bán',
  itemCode: '* Mã hàng',
  itemName: 'Tên mặt hàng',
  dvt: 'Đvt',
  loai: 'Loại',
  promotions: 'Khuyến mãi',
  maKho: '* Mã kho',
  maLo: '* Mã lô',
  qty: 'Số lượng',
  totalItems: 'Số SP',
  totalQty: 'Tổng SL',
  totalRevenue: 'Tổng DT',
  giaBan: 'Giá bán',
  tienHang: 'Tiền hàng',
  maNt: 'Mã nt',
  tyGia: 'Tỷ giá',
  maThue: '* Mã thuế',
  tkNo: '* Tk nợ',
  tkDoanhThu: '* Tk doanh thu',
  tkGiaVon: '* Tk giá vốn',
  tkChiPhiKhuyenMai: '* Tk chi phí khuyến mãi',
  tkThueCo: '* Tk thuế có',
  cucThue: '* Cục thuế',
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

// Các cột mặc định (các trường bắt buộc *)
const MAIN_COLUMNS: OrderColumn[] = [
  'partnerCode',      // * Mã khách
  'customer',         // * Tên khách hàng
  'docDate',          // * Ngày
  'docCode',          // * Số hóa đơn
  'kyHieu',           // * Ký hiệu
  'itemCode',         // * Mã hàng
  'maKho',            // * Mã kho
  'maLo',             // * Mã lô
  'maThue',           // * Mã thuế
  'tkNo',             // * Tk nợ
  'tkDoanhThu',       // * Tk doanh thu
  'tkGiaVon',         // * Tk giá vốn
  'tkChiPhiKhuyenMai',// * Tk chi phí khuyến mãi
  'tkThueCo',         // * Tk thuế có
  'cucThue',          // * Cục thuế
];

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Tất cả orders để search
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]); // Orders hiển thị sau khi search/pagination
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; dateFrom?: string; dateTo?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingBrand, setSyncingBrand] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<OrderColumn[]>([...MAIN_COLUMNS]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand, pagination.page]);

  useEffect(() => {
    // Reset về trang 1 khi filter thay đổi (trừ date vì đã xử lý ở useEffect khác)
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand]);

  // Xử lý search và pagination trên client
  useEffect(() => {
    let filtered = allOrders;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.docCode.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.code.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
      const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;
      
      if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
      if (dateTo) dateTo.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.docDate);
        orderDate.setHours(0, 0, 0, 0);
        
        if (dateFrom && dateTo) {
          // Có cả từ ngày và đến ngày
          return orderDate >= dateFrom && orderDate <= dateTo;
        } else if (dateFrom) {
          // Chỉ có từ ngày
          return orderDate >= dateFrom;
        } else if (dateTo) {
          // Chỉ có đến ngày
          return orderDate <= dateTo;
        }
        return true;
      });
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
    
    setDisplayedOrders(paginated);
    
    // Reset về trang 1 nếu search query hoặc filter thay đổi
    if ((searchQuery || filter.dateFrom || filter.dateTo) && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filter.dateFrom, filter.dateTo, allOrders, pagination.page, pagination.limit]);

  const toggleColumn = (field: OrderColumn) => {
    setSelectedColumns(prev => {
      const index = prev.indexOf(field);
      if (index > -1) {
        return prev.filter(col => col !== field);
    } else {
        const allFields = Object.keys(FIELD_LABELS) as OrderColumn[];
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

  // Helper function để lấy giá trị từ sale đầu tiên
  const getSaleValue = (order: Order, field: keyof NonNullable<Order['sales']>[0]): any => {
    if (!order.sales || order.sales.length === 0) return null;
    return order.sales[0][field];
  };

  const formatValue = (value: any): React.ReactNode => {
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
    return String(value);
  };

  const renderCellValue = (order: Order, field: OrderColumn): React.ReactNode => {
    // Lấy sale đầu tiên để lấy giá trị
    const firstSale = order.sales && order.sales.length > 0 ? order.sales[0] : null;

    switch (field) {
      case 'docCode':
        return <div className="text-sm font-semibold text-gray-900">{order.docCode}</div>;
      case 'docDate':
        return (
          <div className="text-sm text-gray-900">
            {new Date(order.docDate).toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        );
      case 'customer':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
            <div className="text-xs text-gray-500">{order.customer.code}</div>
            <div className="text-xs text-gray-400 capitalize">{order.customer.brand}</div>
          </div>
        );
      case 'partnerCode':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'partnerCode') || order.customer.code || '-'}</div>;
      case 'kyHieu':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'kyHieu') || '-'}</div>;
      case 'description':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'description') || '-'}</div>;
      case 'nhanVienBan':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'nhanVienBan') || '-'}</div>;
      case 'tenNhanVienBan':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tenNhanVienBan') || '-'}</div>;
      case 'itemCode':
        const itemCode = getSaleValue(order, 'itemCode') || '-';
        const itemName = firstSale?.product?.tenVatTu || getSaleValue(order, 'itemName') || '';
        return (
          <div>
            <div className="text-sm font-semibold text-gray-900">{itemCode}</div>
            {itemName && itemName !== '-' && (
              <div className="text-xs text-gray-500 mt-0.5">{itemName}</div>
            )}
          </div>
        );
      case 'itemName':
        return <div className="text-sm text-gray-900">{firstSale?.product?.tenVatTu || getSaleValue(order, 'itemName') || '-'}</div>;
      case 'dvt':
        return <div className="text-sm text-gray-900">{firstSale?.product?.dvt || getSaleValue(order, 'dvt') || '-'}</div>;
      case 'loai':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'loai') || '-'}</div>;
      case 'promotions':
        const promCodes = order.sales
          ? Array.from(
              new Set(
                order.sales
                  .map((sale) => sale.promCode)
                  .filter((code): code is string => !!code && code.trim() !== '')
              )
            )
          : [];
        if (promCodes.length === 0) {
          return <span className="text-xs text-gray-400 italic">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {promCodes.map((code) => (
              <span
                key={code}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-blue-700 border border-blue-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-default break-words"
                title={`Mã khuyến mại: ${code}`}
              >
                <svg className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-medium whitespace-normal break-words">{code}</span>
              </span>
            ))}
          </div>
        );
      case 'maKho':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maKho') || '-'}</div>;
      case 'maLo':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maLo') || '-'}</div>;
      case 'qty':
        return <div className="text-sm text-gray-900 text-center">{formatValue(getSaleValue(order, 'qty'))}</div>;
      case 'totalItems':
        return <div className="text-sm font-medium text-gray-900 text-center">{order.totalItems}</div>;
      case 'totalQty':
        return <div className="text-sm text-gray-900 text-center">{Number(order.totalQty).toLocaleString('vi-VN')}</div>;
      case 'totalRevenue':
        return <div className="text-sm font-semibold text-gray-900 text-right">{Number(order.totalRevenue).toLocaleString('vi-VN')} đ</div>;
      case 'giaBan':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'giaBan'))} {typeof getSaleValue(order, 'giaBan') === 'number' ? 'đ' : ''}</div>;
      case 'tienHang':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'tienHang'))} {typeof getSaleValue(order, 'tienHang') === 'number' ? 'đ' : ''}</div>;
      case 'maNt':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maNt') || '-'}</div>;
      case 'tyGia':
        return <div className="text-sm text-gray-900">{formatValue(getSaleValue(order, 'tyGia'))}</div>;
      case 'maThue':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maThue') || '-'}</div>;
      case 'tkNo':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tkNo') || '-'}</div>;
      case 'tkDoanhThu':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tkDoanhThu') || '-'}</div>;
      case 'tkGiaVon':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tkGiaVon') || '-'}</div>;
      case 'tkChiPhiKhuyenMai':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tkChiPhiKhuyenMai') || '-'}</div>;
      case 'tkThueCo':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'tkThueCo') || '-'}</div>;
      case 'cucThue':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'cucThue') || '-'}</div>;
      case 'maThanhToan':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maThanhToan') || '-'}</div>;
      case 'vuViec':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'vuViec') || '-'}</div>;
      case 'boPhan':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'boPhan') || '-'}</div>;
      case 'lsx':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'lsx') || '-'}</div>;
      case 'sanPham':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'sanPham') || '-'}</div>;
      case 'hopDong':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'hopDong') || '-'}</div>;
      case 'phi':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'phi'))} {typeof getSaleValue(order, 'phi') === 'number' ? 'đ' : ''}</div>;
      case 'kol':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'kol') || '-'}</div>;
      case 'kheUoc':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'kheUoc') || '-'}</div>;
      case 'maCa':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maCa') || '-'}</div>;
      case 'isRewardLine':
        return formatValue(getSaleValue(order, 'isRewardLine'));
      case 'isBundleRewardLine':
        return formatValue(getSaleValue(order, 'isBundleRewardLine'));
      case 'dongThuocGoi':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'dongThuocGoi') || '-'}</div>;
      case 'trangThai':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'trangThai') || '-'}</div>;
      case 'barcode':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'barcode') || '-'}</div>;
      case 'muaHangGiamGia':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'muaHangGiamGia'))} {typeof getSaleValue(order, 'muaHangGiamGia') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauMuaHangGiamGia':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauMuaHangGiamGia'))} {typeof getSaleValue(order, 'chietKhauMuaHangGiamGia') === 'number' ? 'đ' : ''}</div>;
      case 'ckTheoChinhSach':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'ckTheoChinhSach') || '-'}</div>;
      case 'chietKhauCkTheoChinhSach':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauCkTheoChinhSach'))} {typeof getSaleValue(order, 'chietKhauCkTheoChinhSach') === 'number' ? 'đ' : ''}</div>;
      case 'muaHangCkVip':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'muaHangCkVip') || '-'}</div>;
      case 'chietKhauMuaHangCkVip':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauMuaHangCkVip'))} {typeof getSaleValue(order, 'chietKhauMuaHangCkVip') === 'number' ? 'đ' : ''}</div>;
      case 'thanhToanCoupon':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'thanhToanCoupon'))} {typeof getSaleValue(order, 'thanhToanCoupon') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThanhToanCoupon':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThanhToanCoupon'))} {typeof getSaleValue(order, 'chietKhauThanhToanCoupon') === 'number' ? 'đ' : ''}</div>;
      case 'thanhToanVoucher':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'thanhToanVoucher'))} {typeof getSaleValue(order, 'thanhToanVoucher') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThanhToanVoucher':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThanhToanVoucher'))} {typeof getSaleValue(order, 'chietKhauThanhToanVoucher') === 'number' ? 'đ' : ''}</div>;
      case 'duPhong1':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'duPhong1'))} {typeof getSaleValue(order, 'duPhong1') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauDuPhong1':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauDuPhong1'))} {typeof getSaleValue(order, 'chietKhauDuPhong1') === 'number' ? 'đ' : ''}</div>;
      case 'duPhong2':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'duPhong2'))} {typeof getSaleValue(order, 'duPhong2') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauDuPhong2':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauDuPhong2'))} {typeof getSaleValue(order, 'chietKhauDuPhong2') === 'number' ? 'đ' : ''}</div>;
      case 'duPhong3':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'duPhong3'))} {typeof getSaleValue(order, 'duPhong3') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauDuPhong3':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauDuPhong3'))} {typeof getSaleValue(order, 'chietKhauDuPhong3') === 'number' ? 'đ' : ''}</div>;
      case 'hang':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'hang') || '-'}</div>;
      case 'chietKhauHang':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauHang'))} {typeof getSaleValue(order, 'chietKhauHang') === 'number' ? 'đ' : ''}</div>;
      case 'thuongBangHang':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'thuongBangHang'))} {typeof getSaleValue(order, 'thuongBangHang') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThuongMuaBangHang':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThuongMuaBangHang'))} {typeof getSaleValue(order, 'chietKhauThuongMuaBangHang') === 'number' ? 'đ' : ''}</div>;
      case 'thanhToanTkTienAo':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'thanhToanTkTienAo'))} {typeof getSaleValue(order, 'thanhToanTkTienAo') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThanhToanTkTienAo':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThanhToanTkTienAo'))} {typeof getSaleValue(order, 'chietKhauThanhToanTkTienAo') === 'number' ? 'đ' : ''}</div>;
      case 'ckThem1':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'ckThem1'))} {typeof getSaleValue(order, 'ckThem1') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThem1':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThem1'))} {typeof getSaleValue(order, 'chietKhauThem1') === 'number' ? 'đ' : ''}</div>;
      case 'ckThem2':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'ckThem2'))} {typeof getSaleValue(order, 'ckThem2') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThem2':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThem2'))} {typeof getSaleValue(order, 'chietKhauThem2') === 'number' ? 'đ' : ''}</div>;
      case 'ckThem3':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'ckThem3'))} {typeof getSaleValue(order, 'ckThem3') === 'number' ? 'đ' : ''}</div>;
      case 'chietKhauThem3':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauThem3'))} {typeof getSaleValue(order, 'chietKhauThem3') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp1':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp1') || '-'}</div>;
      case 'chietKhauVoucherDp1':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp1'))} {typeof getSaleValue(order, 'chietKhauVoucherDp1') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp2':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp2') || '-'}</div>;
      case 'chietKhauVoucherDp2':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp2'))} {typeof getSaleValue(order, 'chietKhauVoucherDp2') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp3':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp3') || '-'}</div>;
      case 'chietKhauVoucherDp3':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp3'))} {typeof getSaleValue(order, 'chietKhauVoucherDp3') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp4':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp4') || '-'}</div>;
      case 'chietKhauVoucherDp4':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp4'))} {typeof getSaleValue(order, 'chietKhauVoucherDp4') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp5':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp5') || '-'}</div>;
      case 'chietKhauVoucherDp5':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp5'))} {typeof getSaleValue(order, 'chietKhauVoucherDp5') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp6':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp6') || '-'}</div>;
      case 'chietKhauVoucherDp6':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp6'))} {typeof getSaleValue(order, 'chietKhauVoucherDp6') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp7':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp7') || '-'}</div>;
      case 'chietKhauVoucherDp7':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp7'))} {typeof getSaleValue(order, 'chietKhauVoucherDp7') === 'number' ? 'đ' : ''}</div>;
      case 'voucherDp8':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'voucherDp8') || '-'}</div>;
      case 'chietKhauVoucherDp8':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'chietKhauVoucherDp8'))} {typeof getSaleValue(order, 'chietKhauVoucherDp8') === 'number' ? 'đ' : ''}</div>;
      case 'troGia':
        return <div className="text-sm text-gray-900 text-right">{formatValue(getSaleValue(order, 'troGia'))} {typeof getSaleValue(order, 'troGia') === 'number' ? 'đ' : ''}</div>;
      case 'maCtkmTangHang':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maCtkmTangHang') || '-'}</div>;
      case 'maThe':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'maThe') || '-'}</div>;
      case 'soSerial':
        return <div className="text-sm text-gray-900">{getSaleValue(order, 'soSerial') || '-'}</div>;
      default:
        return <span className="text-gray-400 italic">-</span>;
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncingBrand(null);
    setSyncResult(null);
    try {
      const response = await syncApi.syncAll();
      setSyncResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ tất cả thành công',
      });
      // Reload orders after sync
      setTimeout(() => {
        loadOrders();
      }, 1000);
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ',
      });
    } finally {
      setSyncing(false);
      setSyncingBrand(null);
    }
  };

  const handleSyncBrand = async (brandName: string) => {
    setSyncing(true);
    setSyncingBrand(brandName);
    setSyncResult(null);
    try {
      const response = await syncApi.syncBrand(brandName);
      setSyncResult({
        type: 'success',
        message: response.data.message || `Đồng bộ ${brandName} thành công`,
      });
      // Reload orders after sync
      setTimeout(() => {
        loadOrders();
      }, 1000);
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.response?.data?.message || error.message || `Lỗi khi đồng bộ ${brandName}`,
      });
    } finally {
      setSyncing(false);
      setSyncingBrand(null);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Load tất cả orders (không phân trang) để có thể search trên toàn bộ data
      const response = await salesApi.getAll({
        ...filter,
        groupBy: 'order',
        page: 1,
        limit: 10000, // Load tất cả để search
      });
      const data = response.data.data || [];
      
      setAllOrders(data);
      setOrders(data);
      
      // Update pagination từ response (nếu có)
      if (response.data.total !== undefined) {
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / prev.limit),
        }));
      }
    } catch (error: any) {
      showToast('error', 'Lỗi khi tải danh sách đơn hàng: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      {/* Overlay khi đang đồng bộ */}
      {syncing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {syncingBrand ? `Đang đồng bộ ${syncingBrand.toUpperCase()}` : 'Đang đồng bộ dữ liệu'}
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Vui lòng đợi trong giây lát, quá trình này có thể mất vài phút...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Sync Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Chọn cột hiển thị
                </button>
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-md hover:shadow-lg disabled:transform-none"
                >
                  {syncing && !syncingBrand ? (
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
                      Đồng bộ tất cả
                    </>
                  )}
                </button>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSyncBrand(e.target.value);
                        e.target.value = ''; // Reset sau khi chọn
                      }
                    }}
                    disabled={syncing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <option value="">Đồng bộ theo nhãn hàng</option>
                    <option value="chando">Chando</option>
                    <option value="f3">F3</option>
                    <option value="labhair">LabHair</option>
                    <option value="yaman">Yaman</option>
                    <option value="menard">Menard</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Result Notification */}
            {syncResult && (
              <div
                className={`p-4 rounded-lg text-sm border-2 animate-slideDown ${
                  syncResult.type === 'success'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 shadow-md'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-300 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {syncResult.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="font-medium">{syncResult.message}</span>
                  </div>
                  <button
                    onClick={() => setSyncResult(null)}
                    className="text-gray-400 hover:text-gray-600 ml-2 transition-colors p-1 rounded hover:bg-white/50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Column Selector */}
            {showColumnSelector && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                        const allFields = Object.keys(FIELD_LABELS) as OrderColumn[];
                        setSelectedColumns(allFields);
                      }}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>
                {/* Search input for columns */}
                <div className="mb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm cột..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(FIELD_LABELS)
                    .filter(([key, label]) => {
                      if (!columnSearchQuery.trim()) return true;
                      const query = columnSearchQuery.toLowerCase();
                      return label.toLowerCase().includes(query) || key.toLowerCase().includes(query);
                    })
                    .map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(key as OrderColumn)}
                          onChange={() => toggleColumn(key as OrderColumn)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, mã khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filter.brand || ''}
                onChange={(e) => setFilter({ ...filter, brand: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả nhãn hàng</option>
                <option value="chando">Chando</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Từ ngày:</label>
                <input
                  type="date"
                  value={filter.dateFrom || ''}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value || undefined })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Đến ngày:</label>
                <input
                  type="date"
                  value={filter.dateTo || ''}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value || undefined })}
                  min={filter.dateFrom || undefined}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {(filter.dateFrom || filter.dateTo) && (
                <button
                  onClick={() => setFilter({ ...filter, dateFrom: undefined, dateTo: undefined })}
                  className="px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Xóa bộ lọc ngày"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
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
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Không có đơn hàng nào</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedColumns.map((field) => (
                      <th
                        key={field}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {FIELD_LABELS[field]}
                    </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedOrders.map((order) => (
                    <tr key={order.docCode} className="hover:bg-gray-50 transition-colors">
                      {selectedColumns.map((field) => (
                        <td
                          key={field}
                          className="px-4 py-3 text-sm text-gray-900"
                        >
                          {renderCellValue(order, field)}
                      </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Link
                          href={`/sales/order/${order.docCode}`}
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
          </div>
        )}
      </div>
    </div>
  );
}

