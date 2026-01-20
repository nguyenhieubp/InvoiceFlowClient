/**
 * Order Columns Constants
 * Các hằng số định nghĩa cột cho orders
 */

export type OrderColumn =
  | "partnerCode" // * Mã khách
  | "customerName" // * Tên khách hàng
  | "customerMobile" // Số điện thoại
  | "customerSexual" // Giới tính
  | "customerAddress" // Địa chỉ
  | "customerProvince" // Tỉnh/TP
  | "brand" // Brand
  | "type_sale" // Type sale
  | "customerGrade" // Hạng khách hàng
  | "docDate" // * Ngày
  | "docCode" // * Số hóa đơn
  | "kyHieu" // Ký hiệu
  | "description" // Diễn giải
  | "nhanVienBan" // Nhân viên bán
  | "tenNhanVienBan" // Tên nhân viên bán
  | "itemCode" // * Mã hàng
  | "itemName" // Tên mặt hàng
  | "dvt" // Đvt
  // | 'loai'             // Loại
  | "ordertypeName" // Loại đơn hàng (từ ordertypeName)
  | "productType" // Loại sản phẩm (I, S, V, etc.)
  | "promCode" // Mã khuyến mãi
  | "maKho" // * Mã kho
  | "maLo" // Mã lô
  | "qty" // Số lượng
  | "giaBan" // Giá bán
  | "tienHang" // Tiền hàng
  | "revenue" // Doanh thu
  | "maNt" // Mã nt
  | "tyGia" // Tỷ giá
  | "maThue" // * Mã thuế
  | "tkNo" // * Tk nợ
  | "tkDoanhThu" // * Tk doanh thu
  | "tkGiaVon" // * Tk giá vốn
  | "tkChiPhiKhuyenMai" // * Tk chi phí khuyến mãi
  | "tkThueCo" // * Tk thuế có
  | "cucThue" // Cục thuế
  | "maThanhToan" // Mã thanh toán
  | "vuViec" // Vụ việc
  | "boPhan" // Bộ phận
  | "lsx" // Lsx
  | "sanPham" // Sản phẩm
  | "hopDong" // Hợp đồng
  | "phi" // Phí
  | "kol" // KOL
  | "kheUoc" // Khế ước
  | "maCa" // Mã ca
  | "svcCode" // Mã dịch vụ
  | "isRewardLine" // is_reward_line
  | "isBundleRewardLine" // is_bundle_reward_line
  | "dongThuocGoi" // Dòng thuộc gói
  | "trangThai" // Trạng thái
  | "barcode" // Barcode
  | "muaHangGiamGia" // Mua hàng giảm giá
  | "chietKhauMuaHangGiamGia" // Chiết khấu mua hàng giảm giá
  | "maCkTheoChinhSach" // Mã CK theo chính sách (bán buôn)
  | "ckTheoChinhSach" // CK theo chính sách
  | "muaHangCkVip" // Mua hàng CK VIP
  | "chietKhauMuaHangCkVip" // Chiết khấu mua hàng CK VIP
  | "thanhToanCoupon" // Thanh toán coupon
  | "chietKhauThanhToanCoupon" // Chiết khấu thanh toán coupon
  | "thanhToanVoucher" // Thanh toán voucher
  | "chietKhauThanhToanVoucher" // Chiết khấu thanh toán voucher
  | "duPhong1" // Dự phòng 1
  | "chietKhauDuPhong1" // Chiết khấu dự phòng 1
  | "duPhong2" // Dự phòng 2
  | "chietKhauDuPhong2" // Chiết khấu dự phòng 2
  | "duPhong3" // Dự phòng 3
  | "chietKhauDuPhong3" // Chiết khấu dự phòng 3
  | "hang" // Hãng
  | "chietKhauHang" // Chiết khấu hãng
  | "thuongBangHang" // Thưởng bằng hàng
  | "chietKhauThuongMuaBangHang" // Chiết khấu thưởng mua bằng hàng
  | "thanhToanTkTienAo" // Thanh toán TK tiền ảo
  | "chietKhauThanhToanTkTienAo" // Chiết khấu thanh toán TK tiền ảo
  | "ckThem1" // CK thêm 1
  | "chietKhauThem1" // Chiết khấu thêm 1
  | "ckThem2" // CK thêm 2
  | "chietKhauThem2" // Chiết khấu thêm 2
  | "ckThem3" // CK thêm 3
  | "chietKhauThem3" // Chiết khấu thêm 3
  | "voucherDp1" // Voucher DP1
  | "chietKhauVoucherDp1" // Chiết khấu Voucher DP1
  | "voucherDp2" // Voucher DP2
  | "chietKhauVoucherDp2" // Chiết khấu Voucher DP2
  | "voucherDp3" // Voucher DP3
  | "chietKhauVoucherDp3" // Chiết khấu Voucher DP3
  | "voucherDp4" // Voucher DP4
  | "chietKhauVoucherDp4" // Chiết khấu Voucher DP4
  | "voucherDp5" // Voucher DP5
  | "chietKhauVoucherDp5" // Chiết khấu Voucher DP5
  | "voucherDp6" // Voucher DP6
  | "chietKhauVoucherDp6" // Chiết khấu Voucher DP6
  | "voucherDp7" // Voucher DP7
  | "chietKhauVoucherDp7" // Chiết khấu Voucher DP7
  | "voucherDp8" // Voucher DP8
  | "chietKhauVoucherDp8" // Chiết khấu Voucher DP8
  | "troGia" // Trợ giá
  | "maCtkmTangHang" // Mã CTKM tặng hàng
  | "maThe" // Mã thẻ
  | "soSerial" // Số serial
  | "tkVatTu" // Tk vật tư
  | "suaTkVatTu" // Sửa tk vật tư
  | "tkGiaVonBanBuon" // Tk giá vốn bán buôn
  | "tkDoanhThuBanBuon" // Tk doanh thu bán buôn
  | "tkDoanhThuNoiBo" // Tk doanh thu nội bộ
  | "tkHangBanTraLai" // Tk hàng bán trả lại
  | "tkDaiLy" // Tk đại lý
  | "tkSanPhamDoDang" // Tk sản phẩm dở dang
  | "tkChenhLechGiaVon" // Tk chênh lệch giá vốn
  | "tkChietKhau" // Tk chiết khấu
  | "tkChiPhiKhuyenMaiProduct" // Tk chi phí khuyến mãi (từ product)
  | "tkGiaVonBanLe" // Tk giá vốn bán lẻ
  | "tkDoanhThuBanLe" // Tk doanh thu bán lẻ
  | "tkChiPhiKhauHaoCCDC" // Tk chi phí khấu hao CCDC
  | "tkChiPhiKhauHaoTSDC" // Tk chi phí khấu hao TSDC
  | "tkDoanhThuHangNo" // Tk doanh thu hàng nợ
  | "tkGiaVonHangNo" // Tk giá vốn hàng nợ
  | "tkVatTuHangNo" // Tk vật tư hàng nợ
  | "tkChiPhi" // Tk chi phí
  | "maPhi" // Mã phí
  | "ma_vt_ref" // Mã vật tư tham chiếu
  // Stock Transfer columns
  | "stockTransferDoctype" // Loại xuất kho
  | "stockTransferTransDate" // Ngày xuất kho
  | "stockTransferDocDesc" // Mô tả xuất kho
  | "stockTransferStockCode" // Mã kho xuất
  | "stockTransferQty" // Số lượng xuất kho
  | "stockTransferIoType" // Loại nhập/xuất
  | "stockTransferBatchSerial" // Mã lô/serial xuất kho
  | "stockTransferSoCode" // Mã đơn hàng xuất kho
  | "stockTransferDocCode"; // Mã CT (docCode của stock transfer);

export const FIELD_LABELS: Record<OrderColumn, string> = {
  partnerCode: "* Mã khách",
  customerName: "Tên khách hàng",
  customerMobile: "Số điện thoại",
  customerSexual: "Giới tính",
  customerAddress: "Địa chỉ",
  customerProvince: "Tỉnh/TP",
  brand: "Nhãn Hàng",
  type_sale: "Loại Bán",
  customerGrade: "Hạng khách hàng",
  docDate: "* Ngày",
  docCode: "* Số hóa đơn",
  kyHieu: "* Ký hiệu",
  description: "Diễn giải",
  nhanVienBan: "Nhân viên bán",
  tenNhanVienBan: "Tên nhân viên bán",
  itemCode: "* Mã hàng",
  itemName: "Tên mặt hàng",
  dvt: "Đvt",
  // loai: 'Loại',
  ordertypeName: "Loại đơn hàng",
  productType: "Loại sản phẩm",
  promCode: "Khuyến mãi",
  maKho: "* Mã kho",
  maLo: "* Mã lô",
  qty: "Số lượng",
  giaBan: "Giá bán",
  tienHang: " Tiền hàng ",
  revenue: "Doanh thu",
  maNt: "Mã nt",
  tyGia: "Tỷ giá",
  maThue: "* Mã thuế",
  tkNo: "* Tk nợ",
  tkDoanhThu: "* Tk doanh thu",
  tkGiaVon: "* Tk giá vốn",
  tkChiPhiKhuyenMai: "* Tk chi phí khuyến mãi",
  tkThueCo: "* Tk thuế có",
  cucThue: "* Cục thuế",
  maThanhToan: "Mã thanh toán",
  vuViec: "Vụ việc",
  boPhan: "Bộ phận",
  lsx: "Lsx",
  sanPham: "Sản phẩm",
  hopDong: "Hợp đồng",
  phi: "Phí",
  kol: "KOL",
  kheUoc: "Khế ước",
  maCa: "Mã ca",
  svcCode: "Mã dịch vụ",
  isRewardLine: "is_reward_line",
  isBundleRewardLine: "is_bundle_reward_line",
  dongThuocGoi: "Dòng thuộc gói",
  trangThai: "Trạng thai",
  barcode: "Barcode",
  muaHangGiamGia: "Mua hàng giảm giá",
  chietKhauMuaHangGiamGia: "Chiết khấu mua hàng giảm giá",
  maCkTheoChinhSach: "Mã CK theo chính sách",
  ckTheoChinhSach: "CK theo chính sách",
  muaHangCkVip: "Mua hàng CK VIP",
  chietKhauMuaHangCkVip: "Chiết khấu mua hàng CK VIP",
  thanhToanCoupon: "Thanh toán coupon",
  chietKhauThanhToanCoupon: "Chiết khấu thanh toán coupon",
  thanhToanVoucher: "Thanh toán voucher",
  chietKhauThanhToanVoucher: "Chiết khấu thanh toán voucher",
  duPhong1: "Dự phòng 1",
  chietKhauDuPhong1: "Chiết khấu dự phòng 1",
  duPhong2: "Dự phòng 2",
  chietKhauDuPhong2: "Chiết khấu dự phòng 2",
  duPhong3: "Dự phòng 3",
  chietKhauDuPhong3: "Chiết khấu dự phòng 3",
  hang: "Hãng",
  chietKhauHang: "Chiết khấu hãng",
  thuongBangHang: "Thưởng bằng hàng",
  chietKhauThuongMuaBangHang: "Chiết khấu thưởng mua bằng hàng",
  thanhToanTkTienAo: "Thanh toán TK tiền ảo",
  chietKhauThanhToanTkTienAo: "Chiết khấu thanh toán TK tiền ảo",
  ckThem1: "CK thêm 1",
  chietKhauThem1: "Chiết khấu thêm 1",
  ckThem2: "CK thêm 2",
  chietKhauThem2: "Chiết khấu thêm 2",
  ckThem3: "CK thêm 3",
  chietKhauThem3: "Chiết khấu thêm 3",
  voucherDp1: "Voucher DP1",
  chietKhauVoucherDp1: "Chiết khấu Voucher DP1",
  voucherDp2: "Voucher DP2",
  chietKhauVoucherDp2: "Chiết khấu Voucher DP2",
  voucherDp3: "Voucher DP3",
  chietKhauVoucherDp3: "Chiết khấu Voucher DP3",
  voucherDp4: "Voucher DP4",
  chietKhauVoucherDp4: "Chiết khấu Voucher DP4",
  voucherDp5: "Voucher DP5",
  chietKhauVoucherDp5: "Chiết khấu Voucher DP5",
  voucherDp6: "Voucher DP6",
  chietKhauVoucherDp6: "Chiết khấu Voucher DP6",
  voucherDp7: "Voucher DP7",
  chietKhauVoucherDp7: "Chiết khấu Voucher DP7",
  voucherDp8: "Voucher DP8",
  chietKhauVoucherDp8: "Chiết khấu Voucher DP8",
  troGia: "Trợ giá",
  maCtkmTangHang: "Mã CTKM tặng hàng",
  maThe: "Mã thẻ",
  soSerial: "Số serial",
  tkVatTu: "Tk vật tư",
  suaTkVatTu: "Sửa tk vật tư",
  tkGiaVonBanBuon: "Tk giá vốn bán buôn",
  tkDoanhThuBanBuon: "Tk doanh thu bán buôn",
  tkDoanhThuNoiBo: "Tk doanh thu nội bộ",
  tkHangBanTraLai: "Tk hàng bán trả lại",
  tkDaiLy: "Tk đại lý",
  tkSanPhamDoDang: "Tk sản phẩm dở dang",
  tkChenhLechGiaVon: "Tk chênh lệch giá vốn",
  tkChiPhiKhuyenMaiProduct: "Tk chi phí khuyến mãi",
  tkGiaVonBanLe: "Tk giá vốn bán lẻ",
  tkDoanhThuBanLe: "Tk doanh thu bán lẻ",
  tkChiPhiKhauHaoCCDC: "Tk chi phí khấu hao CCDC",
  tkChiPhiKhauHaoTSDC: "Tk chi phí khấu hao TSDC",
  tkDoanhThuHangNo: "Tk doanh thu hàng nợ",
  tkGiaVonHangNo: "Tk giá vốn hàng nợ",
  tkVatTuHangNo: "Tk vật tư hàng nợ",
  tkChietKhau: "TK Chiết khấu",
  tkChiPhi: "TK Chi phí",
  maPhi: "Mã phí",
  ma_vt_ref: "Mã VT tham chiếu",
  // Stock Transfer labels
  stockTransferDoctype: "Loại xuất kho",
  stockTransferTransDate: "Ngày xuất kho",
  stockTransferDocDesc: "Mô tả xuất kho",
  stockTransferStockCode: "Mã kho xuất",
  stockTransferQty: "Số lượng xuất kho",
  stockTransferIoType: "Loại nhập/xuất",
  stockTransferBatchSerial: "Mã lô/serial xuất kho",
  stockTransferSoCode: "Mã đơn hàng xuất kho",
  stockTransferDocCode: "Mã CT",
};

// Các cột mặc định theo thứ tự
export const MAIN_COLUMNS: OrderColumn[] = [
  "partnerCode", // * Mã khách
  "docDate", // * Ngày
  "docCode", // * Số hóa đơn
  "kyHieu", // * Ký hiệu
  "brand",
  "type_sale",
  "description", // Diễn giải
  "itemCode", // * Mã hàng
  "dvt", // Đvt
  // 'loai',                     // Loại
  "ordertypeName", // Loại đơn hàng
  "productType", // Loại sản phẩm
  "promCode", // Khuyến mãi
  "maKho", // * Mã kho
  "maLo", // * Mã lô
  "qty", // Số lượng
  "giaBan", // Giá bán
  "tienHang", // Tiền hàng
  "tyGia", // Tỷ giá
  "maThue", // * Mã thuế
  "tkNo", // * Tk nợ
  "tkDoanhThu", // * Tk doanh thu
  "tkGiaVon", // * Tk giá vốn
  "tkChietKhau", // TK Chiết khấu
  "tkChiPhi", // TK Chi phí
  "maPhi", // Mã phí
  "cucThue", // * Cục thuế
  "maThanhToan", // Mã thanh toán
  "vuViec", // Vụ việc
  "boPhan", // Bộ phận
  "svcCode", // Mã dịch vụ
  "trangThai", // Trạng thai
  "barcode", // Barcode
  "muaHangGiamGia", // Mua hàng giảm giá
  "chietKhauMuaHangGiamGia", // Chiết khấu mua hàng giảm giá
  "maCkTheoChinhSach", // Mã CK theo chính sách (bán buôn)
  "ckTheoChinhSach", // CK theo chính sách
  "muaHangCkVip", // Mua hàng CK VIP
  "chietKhauMuaHangCkVip", // Chiết khấu mua hàng CK VIP
  "thanhToanCoupon", // Thanh toán coupon
  "chietKhauThanhToanCoupon", // Chiết khấu thanh toán coupon
  "thanhToanVoucher", // Thanh toán voucher
  "chietKhauThanhToanVoucher", // Chiết khấu thanh toán voucher
  "thanhToanTkTienAo", // Thanh toán TK tiền ảo
  "chietKhauThanhToanTkTienAo", // Chiết khấu thanh toán TK tiền ảo
  "maCtkmTangHang", // Mã CTKM tặng hàng
  "maThe", // Mã thẻ
  "soSerial", // Số serial
  "ma_vt_ref", // Mã VT tham chiếu
  // Stock Transfer columns
  "stockTransferStockCode", // Mã kho xuất
  "stockTransferQty", // Số lượng xuất kho
  "stockTransferTransDate", // Ngày xuất kho
  "stockTransferDocCode", // Mã CT
];
