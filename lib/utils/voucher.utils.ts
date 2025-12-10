/**
 * Voucher Utilities
 * Các hàm tiện ích cho logic voucher
 */

interface SaleItemForVoucher {
  paid_by_voucher_ecode_ecoin_bp?: number;
  revenue?: number;
  linetotal?: number;
  tienHang?: number;
  cat1?: string;
  catcode1?: string;
  itemCode?: string;
  customer?: {
    brand?: string;
  } | null;
  product?: {
    brand?: {
      code?: string;
      name?: string;
    };
  } | null;
}

/**
 * Tính và trả về các nhãn thanh toán voucher
 * @param sale - Sale item object
 * @returns Chuỗi các nhãn cách nhau bằng dấu cách, hoặc null nếu không thỏa điều kiện
 */
export const calculateThanhToanVoucher = (sale: SaleItemForVoucher | null | undefined): string | null => {
  if (!sale) return null;

  const paidByVoucher = sale.paid_by_voucher_ecode_ecoin_bp ?? 0;
  const revenueValue = sale.revenue ?? 0;
  const linetotalValue = sale.linetotal ?? sale.tienHang ?? 0;
  const cat1Value = sale.cat1 || sale.catcode1 || '';
  const itemCodeValue = sale.itemCode || '';
  const brand = sale.customer?.brand || sale.product?.brand?.code || sale.product?.brand?.name || '';

  // Nếu revenue = 0 và linetotal = 0 → không gắn nhãn
  if (revenueValue === 0 && linetotalValue === 0) {
    return null;
  }

  // Nếu không có paid_by_voucher → không gắn nhãn
  if (paidByVoucher <= 0) {
    return null;
  }

  // Tập hợp các nhãn sẽ hiển thị
  const labels: string[] = [];

  // Kiểm tra brand: nếu là "menard" thì chỉ hiển thị VCHB/VCDV, không có FBV TT
  const isMenard = brand.toLowerCase() === 'menard';

  if (!isMenard) {
    // FBV và TT luôn hiển thị nếu có paid_by_voucher > 0 (trừ menard)
    labels.push('FBV');
    labels.push('TT');
  }

  // VCHB: Nếu cat1 = "CHANDO" hoặc itemcode bắt đầu bằng "S" hoặc "H"
  if (cat1Value === 'CHANDO' || itemCodeValue.toUpperCase().startsWith('S') || itemCodeValue.toUpperCase().startsWith('H')) {
    labels.push('VCHB');
  }

  // VCDV: Nếu cat1 = "FACIALBAR" hoặc itemcode bắt đầu bằng "F" hoặc "V"
  if (cat1Value === 'FACIALBAR' || itemCodeValue.toUpperCase().startsWith('F') || itemCodeValue.toUpperCase().startsWith('V')) {
    labels.push('VCDV');
  }

  // Trả về chuỗi các nhãn cách nhau bằng dấu cách
  return labels.length > 0 ? labels.join(' ') : null;
};

