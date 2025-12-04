/**
 * Order Utilities
 * Các hàm tiện ích cho orders
 */

import { getOrderTypePrefix } from '@/lib/constants/order-type.constants';

/**
 * Tính mã kho từ ordertype + ma_bp (bộ phận)
 */
export const calculateMaKho = (
  ordertype: string | null | undefined,
  maBp: string | null | undefined
): string | null => {
  const prefix = getOrderTypePrefix(ordertype);
  if (!prefix || !maBp) {
    return null;
  }
  return prefix + maBp;
};

/**
 * Parse promCode từ format "Code-Name" để lấy code
 */
export const parsePromCode = (promCode: string): string | null => {
  if (!promCode || promCode.trim() === '') return null;

  // Nếu có dấu "-", lấy phần trước dấu "-" (code)
  const dashIndex = promCode.indexOf('-');
  if (dashIndex > 0) {
    return promCode.substring(0, dashIndex).trim();
  }

  // Nếu không có dấu "-", trả về nguyên promCode
  return promCode.trim();
};

/**
 * Tính giá bán từ tiền hàng và số lượng
 */
export const calculateGiaBan = (
  tienHang: number | null | undefined,
  qty: number | null | undefined,
  giaBanDefault?: number | null
): number => {
  if (tienHang != null && qty != null && qty > 0) {
    return tienHang / qty;
  }
  return giaBanDefault ?? 0;
};

/**
 * Lấy giá trị đầu tiên khác null/undefined/empty hoặc trả về giá trị mặc định
 */
export const getFirstValue = (...values: Array<any>): any => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return null;
};

