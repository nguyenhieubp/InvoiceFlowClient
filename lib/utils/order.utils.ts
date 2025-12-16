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

/**
 * Quy đổi prom_code sang ma_ctkm_th cho trường hợp tặng sản phẩm
 * Quy tắc: PRMN.020255-R510ECOM → 2512MN.TANGSP (nếu đơn hàng tháng 12/2025)
 * - Từ "PRMN.020255": lấy 2 ký tự cuối của phần trước dấu chấm → "MN"
 * - Từ docDate: lấy năm và tháng (ví dụ: 2025-12-14 → "2512")
 * - Kết hợp: "2512MN.TANGSP"
 */
export const convertPromCodeToTangSp = (promCode: string | null | undefined, docDate?: string | Date | null): string | null => {
  if (!promCode || promCode.trim() === '') return null;
  
  const parts = promCode.split('-');
  if (parts.length < 2) return null;
  
  const part1 = parts[0].trim(); // "PRMN.020255"
  const part2 = parts[1].trim(); // "R510ECOM"
  
  // Lấy 2 ký tự cuối của phần trước dấu chấm từ part1
  const dotIndex = part1.indexOf('.');
  let mnPart = '';
  if (dotIndex > 0) {
    const beforeDot = part1.substring(0, dotIndex); // "PRMN"
    if (beforeDot.length >= 2) {
      mnPart = beforeDot.substring(beforeDot.length - 2); // "MN"
    }
  }
  
  // Lấy năm và tháng từ docDate (ngày đơn hàng)
  let yearMonth = '';
  if (docDate) {
    try {
      const date = typeof docDate === 'string' ? new Date(docDate) : docDate;
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() trả về 0-11
        // Lấy 2 số cuối của năm và tháng (ví dụ: 2025-12 → "2512")
        const yearLast2 = String(year).slice(-2);
        const monthStr = String(month).padStart(2, '0');
        yearMonth = `${yearLast2}${monthStr}`;
      }
    } catch (error) {
      // Nếu không parse được date, fallback về logic cũ
    }
  }
  
  // Nếu không có docDate hoặc parse thất bại, fallback về logic cũ (parse từ promCode)
  if (!yearMonth) {
    // Parse số từ part2: R510ECOM → tìm số 5 và 10
    // Quy tắc: 5 → 25, 10 → 10
    // Cần tìm "10" trước (2 chữ số), sau đó tìm "5" (1 chữ số, nhưng không phải là phần của "10")
    const numbers: string[] = [];
    const part2Upper = part2.toUpperCase();
    
    // Tìm tất cả số "10" trước (2 chữ số)
    let searchIndex = 0;
    while (searchIndex < part2Upper.length - 1) {
      const foundIndex = part2Upper.indexOf('10', searchIndex);
      if (foundIndex >= 0) {
        numbers.push('10');
        searchIndex = foundIndex + 2;
      } else {
        break;
      }
    }
    
    // Tìm tất cả số "5" (1 chữ số, nhưng không phải là phần của "10")
    searchIndex = 0;
    while (searchIndex < part2Upper.length) {
      if (part2Upper[searchIndex] === '5') {
        // Kiểm tra xem có phải là phần của "10" không (trước đó là "1" hoặc sau đó là "0")
        const isPartOf10 = 
          (searchIndex > 0 && part2Upper[searchIndex - 1] === '1') ||
          (searchIndex < part2Upper.length - 1 && part2Upper[searchIndex + 1] === '0');
        if (!isPartOf10) {
          numbers.push('25'); // 5 → 25
        }
      }
      searchIndex++;
    }
    
    // Sắp xếp: 25 trước, 10 sau
    const sortedNumbers = numbers.sort((a, b) => {
      if (a === '25' && b === '10') return -1;
      if (a === '10' && b === '25') return 1;
      return 0;
    });
    
    yearMonth = sortedNumbers.join('');
  }
  
  // Kết hợp: số + MN + .TANGSP
  if (yearMonth && mnPart) {
    return `${yearMonth}${mnPart}.TANGSP`;
  }
  
  return null;
};

