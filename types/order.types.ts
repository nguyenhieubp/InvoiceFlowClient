/**
 * Order Types
 * Các type definitions cho orders
 */

export interface OrderCustomer {
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
}

export interface OrderProduct {
  materialCode?: string;
  maVatTu?: string;
  tenVatTu?: string;
  maERP?: string;
  dvt?: string;
  loaiVatTu?: string;
  producttype?: string; // Product type: S (Serial), I (Item), V (Voucher), B (Batch), M (Material)
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
}

export interface OrderPromotion {
  id?: string;
  code?: string;
  name?: string;
  muaHangGiamGia?: boolean;
  taiKhoanChiPhiKhuyenMai?: string;
  [key: string]: any;
}

export interface OrderDepartment {
  id?: string;
  ma_bp?: string;
  ten_bp?: string;
  branchcode?: string;
  type?: string;
  company?: string; // F3, MENARD, etc.
  [key: string]: any;
}

export interface SaleItem {
  id?: string;
  promCode?: string;
  promotionDisplayCode?: string | null;
  itemCode?: string;
  itemName?: string;
  description?: string;
  partnerCode?: string;
  ordertype?: string;
  branchCode?: string;
  serial?: string;
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
  producttype?: string; // Product type: S (Serial), I (Item), V (Voucher), B (Batch), M (Material)
  revenue?: number;
  // Các trường bổ sung từ API
  cat1?: string;
  cat2?: string;
  cat3?: string;
  catcode1?: string;
  catcode2?: string;
  catcode3?: string;
  ck_tm?: number | null;
  ck_dly?: number | null;
  docid?: number;
  cm_code?: string | null;
  line_id?: number;
  disc_amt?: number;
  docmonth?: string;
  itemcost?: number;
  linetotal?: number;
  totalcost?: number;
  crm_emp_id?: number;
  doctype_name?: string;
  order_source?: string | null;
  partner_name?: string;
  mvc_serial?: string; // Mã thẻ từ Zappy API
  crm_branch_id?: number;
  grade_discamt?: number;
  other_discamt?: number;
  revenue_wsale?: number;
  saleperson_id?: number;
  revenue_retail?: number;
  paid_by_voucher_ecode_ecoin_bp?: number;
  docsourcetype?: string;
  product?: OrderProduct | null;
  promotion?: OrderPromotion | null;
  department?: OrderDepartment | null;
}

export interface Order {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: OrderCustomer;
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  isProcessed: boolean;
  sales?: SaleItem[];
}

export type OrderRow = {
  order: Order;
  sale: SaleItem | null;
};

