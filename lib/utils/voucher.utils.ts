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
  productType?: string | null;
  trackInventory?: boolean | null;
  customer?: {
    brand?: string;
  } | null;
  product?: {
    brand?: {
      code?: string;
      name?: string;
    };
    productType?: string | null;
    producttype?: string | null;
    trackInventory?: boolean | null;
    cat1?: string;
    catcode1?: string;
  } | null;
}

/**
 * Tính và trả về các nhãn thanh toán voucher
 * @param sale - Sale item object
 * @returns Loại VC: "VCDV" | "VCHB" | "VCKM" | null
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

  // Chỉ hiển thị VC labels khi có chiết khấu (paid_by_voucher > 0)
  if (paidByVoucher <= 0) {
    return null;
  }

  // Lấy productType và trackInventory từ sale hoặc product
  const productType = sale.productType || sale.product?.productType || sale.product?.producttype || null;
  const trackInventory = sale.trackInventory ?? sale.product?.trackInventory ?? null;

  // Sử dụng logic VC mới dựa trên productType và trackInventory
  const vcType = calculateVCType(productType, trackInventory);

  // Lấy brand để phân biệt logic
  const brand = sale.customer?.brand || '';
  const brandLower = (brand || '').toLowerCase().trim();
  
  let vcLabel: string | null = null;
  
  // Nếu có VC type từ logic mới, dùng nó
  if (vcType) {
    vcLabel = vcType;
  } else {
    // Fallback: Logic cũ dựa trên cat1 và itemCode (chỉ khi có paid_by_voucher)
    if (paidByVoucher <= 0) {
      return null;
    }

    const cat1Value = sale.cat1 || sale.catcode1 || sale.product?.cat1 || sale.product?.catcode1 || '';
    const itemCodeValue = sale.itemCode || '';

    // Tập hợp các nhãn sẽ hiển thị
    const labels: string[] = [];

    // VCDV: Nếu cat1 = "CHANDO" hoặc itemcode bắt đầu bằng "S" hoặc "H"
    if (cat1Value === 'CHANDO' || itemCodeValue.toUpperCase().startsWith('S') || itemCodeValue.toUpperCase().startsWith('H')) {
      labels.push('VCDV');
    }

    // VCHB: Nếu cat1 = "FACIALBAR" hoặc itemcode bắt đầu bằng "F" hoặc "V"
    if (cat1Value === 'FACIALBAR' || itemCodeValue.toUpperCase().startsWith('F') || itemCodeValue.toUpperCase().startsWith('V')) {
      labels.push('VCHB');
    }

    vcLabel = labels.length > 0 ? labels.join(' ') : null;
  }
  
  // Nếu không có label, trả về null
  if (!vcLabel) {
    return null;
  }
  
  // Normalize "VC KM" thành "VCKM" và "VC HB" thành "VC HB" (giữ nguyên để xử lý sau cho F3)
  let normalizedVcLabel = vcLabel;
  // Normalize "VC KM" thành "VCKM" cho tất cả các brand
  if (normalizedVcLabel.includes('VC KM')) {
    normalizedVcLabel = normalizedVcLabel.replace(/VC\s+KM/g, 'VCKM');
  }
  
  // Với F3, thêm prefix "FBV TT" trước VC label
  // Và chuyển tất cả VCHB hoặc VCHH thành VCHH
  if (brandLower === 'f3') {
    let finalVcLabel = normalizedVcLabel;
    // Xử lý cả "VCHB" và "VC HB" (có khoảng trắng) - chuyển thành VCHH
    if (finalVcLabel.includes('VCHB') || finalVcLabel.includes('VC HB')) {
      // Thay thế "VC HB" trước, sau đó thay "VCHB"
      finalVcLabel = finalVcLabel.replace(/VC\s+HB/g, 'VCHH');
      finalVcLabel = finalVcLabel.replace(/VCHB/g, 'VCHH');
    }
    // Nếu có VCHH thì giữ nguyên (không cần thay thế)
    return `FBV TT ${finalVcLabel}`;
  }
  
  return normalizedVcLabel;
};

