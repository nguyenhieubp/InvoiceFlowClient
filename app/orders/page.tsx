'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface Order {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: {
    code: string;
    name: string;
    brand: string;
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
  };
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  isProcessed: boolean;
  sales?: Array<{
    id?: string;
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
    revenue?: number;
    product?: {
      maVatTu?: string;
      tenVatTu?: string;
      maERP?: string;
      dvt?: string;
      loaiVatTu?: string;
      tkVatTu?: string;
      suaTkVatTu?: boolean;
      tkGiaVonBanBuon?: string;
      tkDoanhThuBanBuon?: string;
      tkDoanhThuNoiBo?: string;
      tkHangBanTraLai?: string;
      tkDaiLy?: string;
      tkSanPhamDoDang?: string;
      tkChenhLechGiaVon?: string;
      tkChietKhau?: string;
      tkChiPhiKhuyenMai?: string;
      tkGiaVonBanLe?: string;
      tkDoanhThuBanLe?: string;
      tkChiPhiKhauHaoCCDC?: string;
      tkChiPhiKhauHaoTSDC?: string;
      tkDoanhThuHangNo?: string;
      tkGiaVonHangNo?: string;
      tkVatTuHangNo?: string;
    } | null;
  }>;
}

type SaleItem = NonNullable<Order['sales']>[number];

// Định nghĩa các cột có thể hiển thị
type OrderColumn = 
  | 'partnerCode'      // * Mã khách
  | 'customerName'     // * Tên khách hàng
  | 'customerMobile'   // Số điện thoại
  | 'customerSexual'   // Giới tính
  | 'customerAddress'  // Địa chỉ
  | 'customerProvince' // Tỉnh/TP
  | 'customerGrade'    // Hạng khách hàng
  | 'docDate'          // * Ngày
  | 'docCode'          // * Số hóa đơn
  | 'kyHieu'           // Ký hiệu
  | 'description'      // Diễn giải
  | 'nhanVienBan'      // Nhân viên bán
  | 'tenNhanVienBan'   // Tên nhân viên bán
  | 'itemCode'         // * Mã hàng
  | 'itemName'         // Tên mặt hàng
  | 'dvt'              // Đvt
  | 'loai'             // Loại
  | 'promCode'         // Mã khuyến mãi
  | 'maKho'            // * Mã kho
  | 'maLo'             // Mã lô
  | 'qty'              // Số lượng
  | 'giaBan'           // Giá bán
  | 'tienHang'         // Tiền hàng
  | 'revenue'          // Doanh thu
  | 'maNt'             // Mã nt
  | 'tyGia'            // Tỷ giá
  | 'maThue'           // * Mã thuế
  | 'tkNo'             // * Tk nợ
  | 'tkDoanhThu'       // * Tk doanh thu
  | 'tkGiaVon'         // * Tk giá vốn
  | 'tkChiPhiKhuyenMai'// * Tk chi phí khuyến mãi
  | 'tkThueCo'         // * Tk thuế có
  | 'cucThue'          // Cục thuế
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
  | 'soSerial'         // Số serial
  | 'tkVatTu'          // Tk vật tư
  | 'suaTkVatTu'       // Sửa tk vật tư
  | 'tkGiaVonBanBuon'  // Tk giá vốn bán buôn
  | 'tkDoanhThuBanBuon' // Tk doanh thu bán buôn
  | 'tkDoanhThuNoiBo'  // Tk doanh thu nội bộ
  | 'tkHangBanTraLai'  // Tk hàng bán trả lại
  | 'tkDaiLy'          // Tk đại lý
  | 'tkSanPhamDoDang'  // Tk sản phẩm dở dang
  | 'tkChenhLechGiaVon' // Tk chênh lệch giá vốn
  | 'tkChietKhau'      // Tk chiết khấu
  | 'tkChiPhiKhuyenMaiProduct' // Tk chi phí khuyến mãi (từ product)
  | 'tkGiaVonBanLe'    // Tk giá vốn bán lẻ
  | 'tkDoanhThuBanLe'  // Tk doanh thu bán lẻ
  | 'tkChiPhiKhauHaoCCDC' // Tk chi phí khấu hao CCDC
  | 'tkChiPhiKhauHaoTSDC' // Tk chi phí khấu hao TSDC
  | 'tkDoanhThuHangNo' // Tk doanh thu hàng nợ
  | 'tkGiaVonHangNo'   // Tk giá vốn hàng nợ
  | 'tkVatTuHangNo';   // Tk vật tư hàng nợ

const FIELD_LABELS: Record<OrderColumn, string> = {
  partnerCode: '* Mã khách',
  customerName: '* Tên khách hàng',
  customerMobile: 'Số điện thoại',
  customerSexual: 'Giới tính',
  customerAddress: 'Địa chỉ',
  customerProvince: 'Tỉnh/TP',
  customerGrade: 'Hạng khách hàng',
  docDate: '* Ngày',
  docCode: '* Số hóa đơn',
  kyHieu: 'Ký hiệu',
  description: 'Diễn giải',
  nhanVienBan: 'Nhân viên bán',
  tenNhanVienBan: 'Tên nhân viên bán',
  itemCode: '* Mã hàng',
  itemName: 'Tên mặt hàng',
  dvt: 'Đvt',
  loai: 'Loại',
  promCode: 'Mã khuyến mãi',
  maKho: '* Mã kho',
  maLo: 'Mã lô',
  qty: 'Số lượng',
  giaBan: 'Giá bán',
  tienHang: 'Tiền hàng',
  revenue: 'Doanh thu',
  maNt: 'Mã nt',
  tyGia: 'Tỷ giá',
  maThue: '* Mã thuế',
  tkNo: '* Tk nợ',
  tkDoanhThu: '* Tk doanh thu',
  tkGiaVon: '* Tk giá vốn',
  tkChiPhiKhuyenMai: '* Tk chi phí khuyến mãi',
  tkThueCo: '* Tk thuế có',
  cucThue: 'Cục thuế',
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
  tkVatTu: 'Tk vật tư',
  suaTkVatTu: 'Sửa tk vật tư',
  tkGiaVonBanBuon: 'Tk giá vốn bán buôn',
  tkDoanhThuBanBuon: 'Tk doanh thu bán buôn',
  tkDoanhThuNoiBo: 'Tk doanh thu nội bộ',
  tkHangBanTraLai: 'Tk hàng bán trả lại',
  tkDaiLy: 'Tk đại lý',
  tkSanPhamDoDang: 'Tk sản phẩm dở dang',
  tkChenhLechGiaVon: 'Tk chênh lệch giá vốn',
  tkChietKhau: 'Tk chiết khấu',
  tkChiPhiKhuyenMaiProduct: 'Tk chi phí khuyến mãi',
  tkGiaVonBanLe: 'Tk giá vốn bán lẻ',
  tkDoanhThuBanLe: 'Tk doanh thu bán lẻ',
  tkChiPhiKhauHaoCCDC: 'Tk chi phí khấu hao CCDC',
  tkChiPhiKhauHaoTSDC: 'Tk chi phí khấu hao TSDC',
  tkDoanhThuHangNo: 'Tk doanh thu hàng nợ',
  tkGiaVonHangNo: 'Tk giá vốn hàng nợ',
  tkVatTuHangNo: 'Tk vật tư hàng nợ',
};

// Các cột mặc định (các trường bắt buộc * và tất cả các tài khoản)
const MAIN_COLUMNS: OrderColumn[] = [
  'partnerCode',      // * Mã khách
  'customerName',     // * Tên khách hàng
  'docDate',          // * Ngày
  'docCode',          // * Số hóa đơn
  'itemCode',         // * Mã hàng
  'maKho',            // * Mã kho
  'maThue',           // * Mã thuế
  'tkNo',             // * Tk nợ
  'tkDoanhThu',       // * Tk doanh thu
  'tkGiaVon',         // * Tk giá vốn
  'tkChiPhiKhuyenMai',// * Tk chi phí khuyến mãi
  'tkThueCo',         // * Tk thuế có
  'cucThue',          // Cục thuế
  // Các tài khoản từ ProductItem
  'tkVatTu',          // Tk vật tư
  'suaTkVatTu',       // Sửa tk vật tư
  'tkGiaVonBanBuon',  // Tk giá vốn bán buôn
  'tkDoanhThuBanBuon', // Tk doanh thu bán buôn
  'tkDoanhThuNoiBo',  // Tk doanh thu nội bộ
  'tkHangBanTraLai',  // Tk hàng bán trả lại
  'tkDaiLy',          // Tk đại lý
  'tkSanPhamDoDang',  // Tk sản phẩm dở dang
  'tkChenhLechGiaVon', // Tk chênh lệch giá vốn
  'tkChietKhau',      // Tk chiết khấu
  'tkChiPhiKhuyenMaiProduct', // Tk chi phí khuyến mãi (từ product)
  'tkGiaVonBanLe',    // Tk giá vốn bán lẻ
  'tkDoanhThuBanLe',  // Tk doanh thu bán lẻ
  'tkChiPhiKhauHaoCCDC', // Tk chi phí khấu hao CCDC
  'tkChiPhiKhauHaoTSDC', // Tk chi phí khấu hao TSDC
  'tkDoanhThuHangNo', // Tk doanh thu hàng nợ
  'tkGiaVonHangNo',   // Tk giá vốn hàng nợ
  'tkVatTuHangNo',    // Tk vật tư hàng nợ
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]); // Orders gốc từ backend (chưa có product)
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; dateFrom?: string; dateTo?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<OrderColumn[]>([...MAIN_COLUMNS]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [productCache, setProductCache] = useState<Map<string, any>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Helper function để map API response từ Loyalty API sang cấu trúc product
  const mapLoyaltyApiProductToProductItem = (apiProduct: any) => {
    if (!apiProduct) return null;
    
    return {
      maERP: apiProduct.materialCode || null,
      maVatTu: apiProduct.materialCode || null,
      tenVatTu: apiProduct.name || apiProduct.invoiceName || apiProduct.alternativeName || null,
      dvt: apiProduct.unit || null,
      loaiVatTu: apiProduct.materialType || null,
      tkVatTu: apiProduct.materialAccount || null,
      tkGiaVonBanBuon: apiProduct.wholesaleCostAccount || null,
      tkDoanhThuBanBuon: apiProduct.wholesaleRevenueAccount || null,
      tkGiaVonBanLe: apiProduct.retailCostAccount || null,
      tkDoanhThuBanLe: apiProduct.retailRevenueAccount || null,
      tkChiPhiKhuyenMai: null, // API không có trường này, để null
      nhieuDvt: apiProduct.multipleUnits || false,
      theoDoiTonKho: apiProduct.trackInventory || false,
      theoDoiLo: apiProduct.trackBatch || false,
      theoDoiKiemKe: apiProduct.trackStocktake || false,
      theoDoiSerial: apiProduct.trackSerial || false,
      barcode: apiProduct.barcode || null,
    };
  };

  // Fetch product từ Loyalty API
  const fetchProductFromLoyaltyAPI = async (materialCode: string): Promise<any | null> => {
    // Kiểm tra cache trước
    if (productCache.has(materialCode)) {
      return productCache.get(materialCode);
    }

    try {
      const response = await fetch(
        `https://loyaltyapi.vmt.vn/products/material-code/${materialCode}`,
        {
          headers: { accept: 'application/json' },
        }
      );
      
      if (!response.ok) {
        console.error(`Lỗi khi lấy product từ Loyalty API cho materialCode ${materialCode}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const mappedProduct = mapLoyaltyApiProductToProductItem(data);
      
      // Lưu vào cache
      if (mappedProduct) {
        setProductCache(prev => new Map(prev).set(materialCode, mappedProduct));
        return mappedProduct;
      }
      
      return null;
    } catch (error) {
      console.error(`Lỗi khi lấy product từ Loyalty API cho materialCode ${materialCode}:`, error);
      return null;
    }
  };

  // Load products cho tất cả itemCode trong orders
  const loadProductsForOrders = async (orders: Order[]): Promise<void> => {
    // Lấy tất cả itemCode unique từ orders
    const itemCodes = new Set<string>();
    orders.forEach(order => {
      if (order.sales) {
        order.sales.forEach(sale => {
          if (sale.itemCode && sale.itemCode.trim() !== '') {
            itemCodes.add(sale.itemCode);
          }
        });
      }
    });

    // Filter ra những itemCode chưa có trong cache
    const itemCodesToFetch = Array.from(itemCodes).filter(code => !productCache.has(code));

    if (itemCodesToFetch.length === 0) {
      return; // Đã có đủ trong cache
    }

    setLoadingProducts(true);
    try {
      // Fetch tất cả products song song
      const productPromises = itemCodesToFetch.map(itemCode => 
        fetchProductFromLoyaltyAPI(itemCode)
      );
      
      await Promise.all(productPromises);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Enrich orders với products từ cache
  const enrichOrdersWithProducts = (ordersToEnrich: Order[]): Order[] => {
    return ordersToEnrich.map(order => ({
      ...order,
      sales: order.sales?.map(sale => ({
        ...sale,
        product: sale.itemCode && productCache.has(sale.itemCode) 
          ? productCache.get(sale.itemCode) 
          : sale.product || null,
      })) || [],
    }));
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAllOrders({
        brand: filter.brand,
        page: 1,
        limit: 1000, // Lấy tất cả để search client-side
      });
      const ordersData = response.data.data || [];
      
      // Lưu orders gốc
      setRawOrders(ordersData);

      // Load products cho các itemCode mới
      await loadProductsForOrders(ordersData);

      // Enrich orders với product từ cache (sau khi đã load products)
      const enrichedOrders = enrichOrdersWithProducts(ordersData);
      setAllOrders(enrichedOrders);
      setOrders(enrichedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showToast('error', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand]);

  // Cập nhật orders khi productCache thay đổi
  useEffect(() => {
    if (rawOrders.length > 0) {
      const enrichedOrders = enrichOrdersWithProducts(rawOrders);
      setAllOrders(enrichedOrders);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCache, rawOrders]);

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
          order.customer.code.toLowerCase().includes(query) ||
          (order.customer.mobile && order.customer.mobile.toLowerCase().includes(query))
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
          return orderDate >= dateFrom && orderDate <= dateTo;
        } else if (dateFrom) {
          return orderDate >= dateFrom;
        } else if (dateTo) {
          return orderDate <= dateTo;
        }
        return true;
      });
    }
    
    // Flatten orders thành rows (mỗi sale là một row)
    const allRows: Array<{ order: Order; sale: SaleItem | null }> = [];
    filtered.forEach((order) => {
      if (order.sales && order.sales.length > 0) {
        order.sales.forEach((sale) => {
          allRows.push({ order, sale });
        });
      } else {
        allRows.push({ order, sale: null });
      }
    });
    
    // Update pagination info dựa trên số rows
    const total = allRows.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));
    
    // Pagination trên rows
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedRows = allRows.slice(startIndex, endIndex);
    
    // Chuyển rows về orders để hiển thị
    const orderMap = new Map<string, Order>();
    paginatedRows.forEach((row) => {
      if (!orderMap.has(row.order.docCode)) {
        orderMap.set(row.order.docCode, { ...row.order, sales: [] });
      }
      const order = orderMap.get(row.order.docCode)!;
      if (row.sale) {
        order.sales = order.sales || [];
        order.sales.push(row.sale);
      }
    });
    
    setDisplayedOrders(Array.from(orderMap.values()));
    
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

  const renderCellValue = (order: Order, sale: SaleItem | null, field: OrderColumn): React.ReactNode => {
    if (!sale && field !== 'docCode' && field !== 'docDate' && field !== 'customerName' && field !== 'partnerCode') {
      return <span className="text-gray-400 italic">-</span>;
    }

    switch (field) {
      case 'docCode':
        return (
          <div className="text-sm font-semibold text-gray-900">
            {order.docCode}
          </div>
        );
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
      case 'partnerCode':
        return <div className="text-sm text-gray-900">{sale?.partnerCode || order.customer.code || '-'}</div>;
      case 'customerName':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
            <div className="text-xs text-gray-500">{order.customer.code}</div>
            {order.customer.brand && (
              <div className="text-xs text-gray-400 capitalize">{order.customer.brand}</div>
            )}
          </div>
        );
      case 'customerMobile':
        return <div className="text-sm text-gray-900">{order.customer.mobile || '-'}</div>;
      case 'customerSexual':
        return <div className="text-sm text-gray-900">{order.customer.sexual || '-'}</div>;
      case 'customerAddress':
        return <div className="text-sm text-gray-900">{order.customer.address || '-'}</div>;
      case 'customerProvince':
        return <div className="text-sm text-gray-900">{order.customer.province_name || '-'}</div>;
      case 'customerGrade':
        return <div className="text-sm text-gray-900">{order.customer.grade_name || '-'}</div>;
      case 'kyHieu':
        return <div className="text-sm text-gray-900">{sale?.kyHieu || '-'}</div>;
      case 'description':
        return <div className="text-sm text-gray-900">{sale?.description || '-'}</div>;
      case 'nhanVienBan':
        return <div className="text-sm text-gray-900">{sale?.nhanVienBan || '-'}</div>;
      case 'tenNhanVienBan':
        return <div className="text-sm text-gray-900">{sale?.tenNhanVienBan || '-'}</div>;
      case 'itemCode':
        const itemCode = sale?.itemCode || '-';
        const itemName = sale?.product?.tenVatTu || sale?.itemName || '';
        return (
          <div className="max-w-[120px]">
            <div className="text-sm font-semibold text-gray-900 truncate" title={itemCode}>
              {itemCode}
            </div>
            {itemName && itemName !== '-' && (
              <div className="text-xs text-gray-500 mt-0.5 truncate" title={itemName}>
                {itemName}
              </div>
            )}
          </div>
        );
      case 'itemName':
        return <div className="text-sm text-gray-900">{sale?.product?.tenVatTu || sale?.itemName || '-'}</div>;
      case 'dvt':
        return <div className="text-sm text-gray-900">{sale?.product?.dvt || sale?.dvt || '-'}</div>;
      case 'loai':
        return <div className="text-sm text-gray-900">{sale?.loai || '-'}</div>;
      case 'promCode':
        return <div className="text-sm text-gray-900">{sale?.promCode || '-'}</div>;
      case 'maKho':
        return <div className="text-sm text-gray-900">{sale?.maKho || '-'}</div>;
      case 'maLo':
        return <div className="text-sm text-gray-900">{sale?.maLo || '-'}</div>;
      case 'qty':
        return <div className="text-sm text-gray-900">{formatValue(sale?.qty)}</div>;
      case 'giaBan':
        return <div className="text-sm text-gray-900">{formatValue(sale?.giaBan)}</div>;
      case 'tienHang':
        return <div className="text-sm text-gray-900">{formatValue(sale?.tienHang)}</div>;
      case 'revenue':
        return <div className="text-sm text-gray-900">{formatValue(sale?.revenue)}</div>;
      case 'maNt':
        return <div className="text-sm text-gray-900">{sale?.maNt || '-'}</div>;
      case 'tyGia':
        return <div className="text-sm text-gray-900">{formatValue(sale?.tyGia)}</div>;
      case 'maThue':
        return <div className="text-sm text-gray-900">{sale?.maThue || '-'}</div>;
      case 'tkNo':
        return <div className="text-sm text-gray-900">{sale?.tkNo || '-'}</div>;
      case 'tkDoanhThu':
        return <div className="text-sm text-gray-900">{sale?.tkDoanhThu || '-'}</div>;
      case 'tkGiaVon':
        return <div className="text-sm text-gray-900">{sale?.tkGiaVon || '-'}</div>;
      case 'tkChiPhiKhuyenMai':
        return <div className="text-sm text-gray-900">{sale?.tkChiPhiKhuyenMai || '-'}</div>;
      case 'tkThueCo':
        return <div className="text-sm text-gray-900">{sale?.tkThueCo || '-'}</div>;
      case 'cucThue':
        return <div className="text-sm text-gray-900">{sale?.cucThue || '-'}</div>;
      case 'tkVatTu':
        return <div className="text-sm text-gray-900">{sale?.product?.tkVatTu || '-'}</div>;
      case 'suaTkVatTu':
        return formatValue(sale?.product?.suaTkVatTu);
      case 'tkGiaVonBanBuon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonBanBuon || '-'}</div>;
      case 'tkDoanhThuBanBuon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuBanBuon || '-'}</div>;
      case 'tkDoanhThuNoiBo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuNoiBo || '-'}</div>;
      case 'tkHangBanTraLai':
        return <div className="text-sm text-gray-900">{sale?.product?.tkHangBanTraLai || '-'}</div>;
      case 'tkDaiLy':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDaiLy || '-'}</div>;
      case 'tkSanPhamDoDang':
        return <div className="text-sm text-gray-900">{sale?.product?.tkSanPhamDoDang || '-'}</div>;
      case 'tkChenhLechGiaVon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChenhLechGiaVon || '-'}</div>;
      case 'tkChietKhau':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChietKhau || '-'}</div>;
      case 'tkChiPhiKhuyenMaiProduct':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhuyenMai || '-'}</div>;
      case 'tkGiaVonBanLe':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonBanLe || '-'}</div>;
      case 'tkDoanhThuBanLe':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuBanLe || '-'}</div>;
      case 'tkChiPhiKhauHaoCCDC':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhauHaoCCDC || '-'}</div>;
      case 'tkChiPhiKhauHaoTSDC':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhauHaoTSDC || '-'}</div>;
      case 'tkDoanhThuHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuHangNo || '-'}</div>;
      case 'tkGiaVonHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonHangNo || '-'}</div>;
      case 'tkVatTuHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkVatTuHangNo || '-'}</div>;
      default:
        // Xử lý các trường còn lại
        const value = sale?.[field as keyof typeof sale];
        return <div className="text-sm text-gray-900">{formatValue(value)}</div>;
    }
  };

  // Flatten displayedOrders thành rows (mỗi sale là một row)
  const flattenedRows: Array<{ order: Order; sale: SaleItem | null }> = [];
  displayedOrders.forEach((order) => {
    if (order.sales && order.sales.length > 0) {
      order.sales.forEach((sale) => {
        flattenedRows.push({ order, sale });
      });
    } else {
      flattenedRows.push({ order, sale: null });
    }
  });

  const filteredColumns = Object.entries(FIELD_LABELS).filter(([key]) =>
    columnSearchQuery.trim() === '' || 
    FIELD_LABELS[key as OrderColumn].toLowerCase().includes(columnSearchQuery.toLowerCase()) ||
    key.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
              <div className="flex items-center gap-2">
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
            </div>

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
                  {filteredColumns.map(([key, label]) => {
                    const isSelected = selectedColumns.includes(key as OrderColumn);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleColumn(key as OrderColumn)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    );
                  })}
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
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
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
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Đến ngày:</label>
                <input
                  type="date"
                  value={filter.dateTo || ''}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : flattenedRows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              Không có dữ liệu
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {selectedColumns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {FIELD_LABELS[column]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedRows.map((row, index) => (
                    <tr key={`${row.order.docCode}-${row.sale?.id || index}`} className="hover:bg-gray-50 transition-colors">
                      {selectedColumns.map((column) => (
                        <td key={column} className="px-4 py-3 whitespace-nowrap">
                          {renderCellValue(row.order, row.sale, column)}
                        </td>
                      ))}
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
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                    <span className="text-sm text-gray-700">bản ghi/trang</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{pagination.total}</span> bản ghi
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
