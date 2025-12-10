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

  // VCHB: Nếu cat1 = "CHANDO" hoặc itemcode bắt đầu bằng "S" hoặc "H"
  if (cat1Value === 'CHANDO' || itemCodeValue.toUpperCase().startsWith('S') || itemCodeValue.toUpperCase().startsWith('H')) {
    labels.push('VCHB');
  }

  // VCDV: Nếu cat1 = "FACIALBAR" hoặc itemcode bắt đầu bằng "F" hoặc "V"
  if (cat1Value === 'FACIALBAR' || itemCodeValue.toUpperCase().startsWith('F') || itemCodeValue.toUpperCase().startsWith('V')) {
    labels.push('VCDV');
  }

  // Nếu không có nhãn nào thỏa điều kiện, mặc định trả về VCDV hoặc VCHB
  // (có thể hiển thị cả hai nếu thỏa cả hai điều kiện)
  return labels.length > 0 ? labels.join(' ') : null;
};

