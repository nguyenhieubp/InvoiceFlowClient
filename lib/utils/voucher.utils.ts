/**
 * Voucher Utilities
 * Các hàm tiện ích cho logic voucher
 */

import { calculateVCType } from './product.utils';

interface SaleItemForVoucher {
  paid_by_voucher_ecode_ecoin_bp?: number;
  revenue?: number;
  linetotal?: number;
  tienHang?: number;
  cat1?: string;
  catcode1?: string;
  itemCode?: string;
  productType?: string;
  trackInventory?: boolean;
  customer?: {
    brand?: string;
  } | null;
  product?: {
    brand?: {
      code?: string;
      name?: string;
    };
    productType?: string;
    producttype?: string;
    trackInventory?: boolean;
  } | null;
}

/**
 * Tính và trả về các nhãn thanh toán voucher
 * @param sale - Sale item object
 * @returns Loại VC: "VCDV" | "VCBH" | "VCKM" | null
 */
export const calculateThanhToanVoucher = (sale: SaleItemForVoucher | null | undefined): string | null => {
  if (!sale) return null;

  const paidByVoucher = sale.paid_by_voucher_ecode_ecoin_bp ?? 0;
  const revenueValue = sale.revenue ?? 0;
  const linetotalValue = sale.linetotal ?? sale.tienHang ?? 0;

  // Nếu revenue = 0 và linetotal = 0 → không gắn nhãn
  if (revenueValue === 0 && linetotalValue === 0) {
    return null;
  }

  // Lấy productType và trackInventory từ sale hoặc product
  const productType = sale.productType || sale.product?.productType || sale.product?.producttype || null;
  const trackInventory = sale.trackInventory ?? sale.product?.trackInventory ?? null;

  // Sử dụng logic VC mới dựa trên productType và trackInventory
  const vcType = calculateVCType(productType, trackInventory);

  // Nếu có VC type từ logic mới, trả về ngay (không cần kiểm tra paid_by_voucher)
  if (vcType) {
    return vcType;
  }

  // Fallback: Logic cũ dựa trên cat1 và itemCode (chỉ khi có paid_by_voucher)
  if (paidByVoucher <= 0) {
    return null;
  }

  const cat1Value = sale.cat1 || sale.catcode1 || '';
  const itemCodeValue = sale.itemCode || '';

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

  // Nếu không có nhãn nào thỏa điều kiện, mặc định trả về null
  return labels.length > 0 ? labels.join(' ') : null;
};

