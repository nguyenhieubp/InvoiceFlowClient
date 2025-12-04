/**
 * Order Type Constants
 * Các hằng số loại đơn hàng
 */

/**
 * Kiểu L: 02. Làm dịch vụ, 04. Đổi DV, 08. Tách thẻ, Đổi thẻ KEEP->Thẻ DV
 * Type L: Service orders, Exchange service, Card operations
 */
export const ORDER_TYPE_L: readonly string[] = [
  'LAM_DV',
  'DOI_VO_LAY_DV',
  'KEEP_TO_SVC',
  'LAM_THE_DV',
  'SUA_THE_DV',
  'DOI_THE_DV',
  'LAM_DV_LE',
  'LAM_THE_KEEP',
  'NOI_THE_KEEP',
  'RENAME_CARD',
] as const;

/**
 * Kiểu B: 01.Thường, 03. Đổi điểm, 05. Tặng sinh nhật, 06. Đầu tư, 07. Bán tài khoản, 9. Sàn TMD
 * Type B: Normal orders, Point exchange, Birthday gifts, Investment, Account sales, E-commerce platform
 */
export const ORDER_TYPE_B: readonly string[] = [
  'NORMAL',
  'KM_TRA_DL',
  'BIRTHDAY_PROM',
  'BP_TO_ITEM',
  'BAN_ECOIN',
  'SAN_TMDT',
  'SO_DL',
  'SO_HTDT_HB',
  'SO_HTDT_HK',
  'SO_HTDT_HL_CB',
  'SO_HTDT_HL_HB',
  'SO_HTDT_HL_KM',
  'SO_HTDT_HT',
  'ZERO_CTY',
  'ZERO_SHOP',
] as const;

/**
 * Order type để tính mã thẻ
 * Order types for card code calculation
 */
export const ORDER_TYPE_NORMAL = 'NORMAL';
export const ORDER_TYPE_LAM_DV = 'LAM_DV';

/**
 * Order types cho logic khuyến mãi khi giá bán = 0
 * Order types for promotion logic when price = 0
 */
export const ORDER_TYPE_BAN_ECOIN = 'BAN_ECOIN'; // 07.Bán tài khoản
export const ORDER_TYPE_SAN_TMDT = 'SAN_TMDT'; // 9. Sàn TMDT

/**
 * Map ordertype sang L hoặc B
 * Map order type to L or B prefix
 */
export const getOrderTypePrefix = (ordertype: string | null | undefined): string | null => {
  if (!ordertype) return null;

  if ((ORDER_TYPE_L as readonly string[]).includes(ordertype)) {
    return 'L';
  } else if ((ORDER_TYPE_B as readonly string[]).includes(ordertype)) {
    return 'B';
  }

  return null; // Không khớp thì bỏ
};

