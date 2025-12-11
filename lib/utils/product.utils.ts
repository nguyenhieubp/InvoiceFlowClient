/**
 * Product Utilities
 * Các hàm tiện ích cho products
 */

import { OrderProduct } from '@/types/order.types';

/**
 * Tính loại VC dựa trên productType và trackInventory
 * @param productType - Loại sản phẩm (DIVU, GIFT, ...)
 * @param trackInventory - Có theo dõi tồn kho hay không
 * @returns Loại VC: "VCDV" | "VCHB" | "VCKM" | null
 */
export const calculateVCType = (
  productType: string | null | undefined,
  trackInventory: boolean | null | undefined,
): 'VCDV' | 'VCHB' | 'VCKM' | null => {
  // Normalize productType
  const normalizedProductType = productType ? String(productType).trim().toUpperCase() : null;

  // VCDV: productType = "DIVU"
  if (normalizedProductType === 'DIVU') {
    return 'VCDV';
  }

  // VCKM: productType = "GIFT"
  if (normalizedProductType === 'GIFT') {
    return 'VCKM';
  }

  // VCHB: productType != "DIVU" && productType != "GIFT" && trackInventory = true
  if (normalizedProductType && normalizedProductType !== 'DIVU' && normalizedProductType !== 'GIFT') {
    if (trackInventory === true) {
      return 'VCHB';
    }
  }

  return null;
};

/**
 * Map API response từ Loyalty API sang cấu trúc product
 */
export const mapLoyaltyApiProductToProductItem = (apiProduct: any): OrderProduct | null => {
  if (!apiProduct) return null;

  return {
    materialCode: apiProduct.materialCode || apiProduct.code || null,
    maERP: apiProduct.code || apiProduct.materialCode || null,
    maVatTu: apiProduct.materialCode || apiProduct.code || null,
    tenVatTu: apiProduct.name || apiProduct.invoiceName || apiProduct.alternativeName || null,
    dvt: apiProduct.unit || apiProduct.dvt || null, // Ưu tiên unit trước
    loaiVatTu: apiProduct.materialType || null,
    productType: apiProduct.productType || apiProduct.producttype || null,
    trackSerial: apiProduct.trackSerial === true,
    trackBatch: apiProduct.trackBatch === true,
    trackInventory: apiProduct.trackInventory === true,
    tkVatTu: apiProduct.materialAccount || null,
    tkGiaVonBanBuon: apiProduct.wholesaleCostAccount || null,
    tkDoanhThuBanBuon: apiProduct.wholesaleRevenueAccount || null,
    tkGiaVonBanLe: apiProduct.retailCostAccount || null,
    tkDoanhThuBanLe: apiProduct.retailRevenueAccount || null,
    tkChiPhiKhuyenMai: apiProduct.promotionCostAccount || null,
    // Các trường khác nếu có trong OrderProduct interface
    tkDoanhThuNoiBo: apiProduct.internalRevenueAccount || null,
    tkHangBanTraLai: apiProduct.returnSalesAccount || null,
    tkDaiLy: apiProduct.agentAccount || null,
    tkSanPhamDoDang: apiProduct.workInProgressAccount || null,
    tkChenhLechGiaVon: apiProduct.costVarianceAccount || null,
    tkChietKhau: apiProduct.discountAccount || null,
    tkChiPhiKhauHaoCCDC: apiProduct.depreciationCcdcAccount || null,
    tkChiPhiKhauHaoTSDC: apiProduct.depreciationTsdcAccount || null,
    tkDoanhThuHangNo: apiProduct.debtRevenueAccount || null,
    tkGiaVonHangNo: apiProduct.debtCostAccount || null,
    tkVatTuHangNo: apiProduct.debtMaterialAccount || null,
  };
};

