/**
 * Product Utilities
 * Các hàm tiện ích cho products
 */

import { OrderProduct } from '@/types/order.types';

/**
 * Map API response từ Loyalty API sang cấu trúc product
 */
export const mapLoyaltyApiProductToProductItem = (apiProduct: any): OrderProduct | null => {
  if (!apiProduct) return null;

  return {
    materialCode: apiProduct.materialCode || null,
    maERP: apiProduct.materialCode || null,
    maVatTu: apiProduct.materialCode || null,
    tenVatTu: apiProduct.name || apiProduct.invoiceName || apiProduct.alternativeName || null,
    dvt: apiProduct.dvt || apiProduct.unit || null,
    loaiVatTu: apiProduct.materialType || null,
    tkVatTu: apiProduct.materialAccount || null,
    tkGiaVonBanBuon: apiProduct.wholesaleCostAccount || null,
    tkDoanhThuBanBuon: apiProduct.wholesaleRevenueAccount || null,
    tkGiaVonBanLe: apiProduct.retailCostAccount || null,
    tkDoanhThuBanLe: apiProduct.retailRevenueAccount || null,
    tkChiPhiKhuyenMai: null, // API không có trường này, để null
    // Các trường khác không có trong OrderProduct interface sẽ không được map
  };
};

