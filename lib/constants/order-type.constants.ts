/**
 * Order Type Constants
 * Các hằng số loại đơn hàng
 */

/**
 * Kiểu L: 02. Làm dịch vụ, 04. Đổi DV, 08. Tách thẻ, Đổi thẻ KEEP->Thẻ DV
 * Type L: Service orders, Exchange service, Card operations
 */
export const ORDER_TYPE_L: readonly string[] = [
  "LAM_DV",
  "DOI_VO_LAY_DV",
  "KEEP_TO_SVC",
  "LAM_THE_DV",
  "SUA_THE_DV",
  "DOI_THE_DV",
  "LAM_DV_LE",
  "LAM_THE_KEEP",
  "NOI_THE_KEEP",
  "RENAME_CARD",
] as const;

/**
 * Kiểu B: 01.Thường, 03. Đổi điểm, 05. Tặng sinh nhật, 06. Đầu tư, 07. Bán tài khoản, 9. Sàn TMD
 * Type B: Normal orders, Point exchange, Birthday gifts, Investment, Account sales, E-commerce platform
 */
export const ORDER_TYPE_B: readonly string[] = [
  "NORMAL",
  "KM_TRA_DL",
  "BIRTHDAY_PROM",
  "BP_TO_ITEM",
  "BAN_ECOIN",
  "SAN_TMDT",
  "SO_DL",
  "SO_HTDT_HB",
  "SO_HTDT_HK",
  "SO_HTDT_HL_CB",
  "SO_HTDT_HL_HB",
  "SO_HTDT_HL_KM",
  "SO_HTDT_HT",
  "ZERO_CTY",
  "ZERO_SHOP",
] as const;

/**
 * Order type để tính mã thẻ
 * Order types for card code calculation
 */
export const ORDER_TYPE_NORMAL = "NORMAL";
export const ORDER_TYPE_LAM_DV = "LAM_DV";

/**
 * Order types cho logic khuyến mãi khi giá bán = 0
 * Order types for promotion logic when price = 0
 */
export const ORDER_TYPE_BAN_ECOIN = "BAN_ECOIN"; // 07.Bán tài khoản
export const ORDER_TYPE_SAN_TMDT = "SAN_TMDT"; // 9. Sàn TMDT

/**
 * Map ordertype_name từ Zappy sang prefix L hoặc B
 * Map order type name from Zappy to L or B prefix
 *
 * Kho hàng làm (prefix L):
 * - "02. Làm dịch vụ"
 * - "04. Đổi DV"
 * - "08. Tách thẻ"
 * - "Đổi thẻ KEEP->Thẻ DV"
 *
 * Kho hàng bán (prefix B):
 * - "01.Thường"
 * - "03. Đổi điểm"
 * - "05. Tặng sinh nhật"
 * - "06. Đầu tư"
 * - "07. Bán tài khoản"
 * - "9. Sàn TMDT"
 * - "Đổi vỏ"
 */
export const getOrderTypePrefix = (
  ordertypeName: string | null | undefined
): string | null => {
  if (!ordertypeName) return null;

  // Normalize: trim và loại bỏ khoảng trắng thừa
  const normalized = ordertypeName.trim();

  // Kho hàng làm (prefix L)
  const orderTypeLNames: readonly string[] = [
    "02. Làm dịch vụ",
    "04. Đổi DV",
    "08. Tách thẻ",
    "Đổi thẻ KEEP->Thẻ DV",
  ] as const;

  // Kho hàng bán (prefix B)
  const orderTypeBNames: readonly string[] = [
    "01.Thường",
    "01. Thường", // Có thể có dấu cách
    "03. Đổi điểm",
    "05. Tặng sinh nhật",
    "06. Đầu tư",
    "07. Bán tài khoản",
    "9. Sàn TMDT",
    "Đổi vỏ",
  ] as const;

  // Check kho hàng làm (L)
  if (orderTypeLNames.includes(normalized as any)) {
    return "L";
  }

  // Check kho hàng bán (B)
  if (orderTypeBNames.includes(normalized as any)) {
    return "B";
  }

  // Fallback: Nếu không khớp với ordertype_name, thử check với code cũ (để tương thích ngược)
  if ((ORDER_TYPE_L as readonly string[]).includes(normalized)) {
    return "L";
  } else if ((ORDER_TYPE_B as readonly string[]).includes(normalized)) {
    return "B";
  }

  return null; // Không khớp thì bỏ
};

/**
 * Map ordertype_name từ Zappy sang code cũ (để tương thích với logic hiện có)
 * Map order type name from Zappy to old code (for backward compatibility)
 */
export const mapOrderTypeNameToCode = (
  ordertypeName: string | null | undefined
): string | null => {
  if (!ordertypeName) return null;

  const normalized = ordertypeName.trim();

  const typeMap: Record<string, string> = {
    "02. Làm dịch vụ": "LAM_DV",
    "01.Thường": "NORMAL",
    "01. Thường": "NORMAL",
    "03. Đổi điểm": "KM_TRA_DL",
    "05. Tặng sinh nhật": "BIRTHDAY_PROM",
    "06. Đầu tư": "BP_TO_ITEM",
    "07. Bán tài khoản": "BAN_ECOIN",
    "9. Sàn TMDT": "SAN_TMDT",
    "04. Đổi DV": "DOI_VO_LAY_DV",
    "08. Tách thẻ": "LAM_THE_DV",
    "Đổi thẻ KEEP->Thẻ DV": "KEEP_TO_SVC",
    "Đổi vỏ": "DOI_VO_LAY_DV",
  };

  return typeMap[normalized] || normalized; // Nếu không map được, trả về giá trị gốc
};
