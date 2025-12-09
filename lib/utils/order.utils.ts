/**
 * Order Utilities
 * Các hàm tiện ích cho orders
 */

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

/**
 * Tính mã lô từ serial dựa trên catcode1 và catcode2
 * @param serial - Giá trị serial gốc
 * @param catcode1 - Catcode1 (ví dụ: "MENARD")
 * @param catcode2 - Catcode2 (ví dụ: "001_SKIN", "003_TPCN")
 * @returns Mã lô đã được tính toán hoặc null
 */
export const calculateMaLo = (
  serial: string | null | undefined,
  catcode1: string | null | undefined,
  catcode2: string | null | undefined
): string | null => {
  // Nếu không có serial, trả về null
  if (!serial || serial.trim() === '') {
    return null;
  }

  // Nếu catcode1 = "MENARD", áp dụng logic đặc biệt
  if (catcode1 === 'MENARD') {
    // Nếu catcode2 = "003_TPCN" => lấy 8 ký tự cuối
    if (catcode2 === '003_TPCN') {
      return serial.length >= 8 ? serial.slice(-8) : serial;
    }
    
    // Nếu catcode2 = "001_SKIN" hoặc các trường hợp khác => lấy 4 ký tự cuối
    return serial.length >= 4 ? serial.slice(-4) : serial;
  }

  // Các trường hợp khác, trả về serial gốc
  return serial;
};

