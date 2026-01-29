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
  productType?: string; // Product type from Loyalty API: TPCN, VOUC, etc.
  trackSerial?: boolean; // Track serial from Loyalty API
  trackBatch?: boolean; // Track batch from Loyalty API
  trackInventory?: boolean; // Track inventory from Loyalty API
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
  muaHangGiamGiaDisplay?: string | null;
  itemCode?: string;
  itemName?: string;
  description?: string;
  partnerCode?: string;
  issuePartnerCode?: string; // Mã khách hàng từ API get_card (cho đơn "08. Tách thẻ")
  ordertype?: string;
  ordertypeName?: string; // Tên loại đơn hàng (01.Thường, etc.)
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
  productType?: string; // Product type from Loyalty API (VOUC, SKIN, TPCN, GIFT, etc.) - saved in database
  producttype?: string; // Legacy product type (I, B, M, V, S) - deprecated
  trackInventory?: boolean; // Track inventory from Loyalty API
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
  svcCode?: string; // Mã dịch vụ từ Zappy API
  isRewardLine?: boolean;
  isBundleRewardLine?: boolean;
  dongThuocGoi?: string;
  trangThai?: string;
  barcode?: string;
  // ========== STANDARDIZED DISCOUNT FIELDS (01-11) ==========
  ma_ck01?: string; // Mua hàng giảm giá
  ck01_nt?: number;
  ma_ck02?: string; // CK theo chính sách
  ck02_nt?: number;
  ma_ck03?: string; // Mua hàng CK VIP
  ck03_nt?: number;
  ma_ck04?: string; // Thanh toán coupon
  ck04_nt?: number;
  ma_ck05?: string; // Thanh toán Voucher
  ck05_nt?: number;
  ma_ck06?: string; // Dự phòng 1
  ck06_nt?: number;
  ma_ck07?: string; // Dự phòng 2
  ck07_nt?: number;
  ma_ck08?: string; // Dự phòng 3
  ck08_nt?: number;
  ma_ck09?: string; // Chiết khấu hãng
  ck09_nt?: number;
  ma_ck10?: string; // Thưởng bằng hàng
  ck10_nt?: number;
  ma_ck11?: string; // Thanh toán TK tiền ảo
  ck11_nt?: number;

  troGia?: number;
  maCtkmTangHang?: string;
  maThe?: string;
  maSerial?: string; // Số serial (single source of truth)
  soSerial?: string; // Deprecated - use maSerial instead
  revenue?: number;
  tkChietKhau?: string; // Tk chiết khấu
  tkChiPhi?: string; // Tk chi phí (từ creditAdvice)
  maPhi?: string; // Mã phí (từ creditAdvice)
  // Các field display từ backend
  isTangHang?: boolean;
  isDichVu?: boolean;
  km_yn?: number; // [RENAME] Was promCodeDisplay
  thanhToanCouponDisplay?: string | null;
  chietKhauThanhToanCouponDisplay?: number | null;
  thanhToanVoucherDisplay?: string | null;
  chietKhauThanhToanVoucherDisplay?: number | null;
  voucherDp1Display?: string | null;
  chietKhauVoucherDp1Display?: number | null;
  thanhToanTkTienAoDisplay?: string | null;
  chietKhauThanhToanTkTienAoDisplay?: number | null;
  cucThueDisplay?: string | null;
  tkDoanhThuDisplay?: string | null;
  tkGiaVonDisplay?: string | null;
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
  statusAsys?: boolean; // Trạng thái đồng bộ: true = đồng bộ thành công, false = sản phẩm không tồn tại trong Loyalty API (404)
  stockTransfer?: StockTransfer; // Thông tin stock transfer cụ thể cho sale item này (nếu có)
}

export interface StockTransfer {
  id?: string;
  doctype?: string; // SALE_STOCKOUT
  docCode?: string; // ST37.00131367_1
  transDate?: Date | string; // 01/11/2025 19:00
  docDesc?: string; // Đơn hàng bán lẻ
  branchCode?: string; // FS07
  brandCode?: string; // NH_FB
  itemCode?: string; // F00011
  itemName?: string; // Joukin_Liệu trình...
  stockCode?: string; // BFS07
  relatedStockCode?: string; // null
  ioType?: string; // O
  qty?: number; // -5
  batchSerial?: string; // null
  lineInfo1?: string; // null
  lineInfo2?: string; // null
  soCode?: string; // SO37.00131367
  syncDate?: string; // Ngày sync (DDMMMYYYY format)
  brand?: string; // Brand name (f3, labhair, yaman, menard)
  compositeKey?: string; // Composite key
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
  cashioFopSyscode?: string | null;
  cashioData?: any[] | null;
  cashioTotalIn?: number | null;
  brand?: string; // Brand name (f3, menard, labhair, yaman, etc.)
  stockTransferInfo?: any;
  stockTransfers?: StockTransfer[];
}

export type OrderRow = {
  order: Order;
  sale: SaleItem | null;
};
