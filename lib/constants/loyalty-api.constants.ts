/**
 * Loyalty API Constants
 * Các hằng số cho Loyalty API
 */

/**
 * Base URL của Loyalty API
 * Lấy từ biến môi trường NEXT_PUBLIC_LOYALTY_API_URL, mặc định là https://loyaltyapi.vmt.vn
 */
export const LOYALTY_API_BASE_URL = process.env.NEXT_PUBLIC_LOYALTY_API_URL || 'https://loyaltyapi.vmt.vn';

/**
 * Endpoints của Loyalty API
 */
export const LOYALTY_API_ENDPOINTS = {
  PRODUCTS: '/products',
  PRODUCT_BY_CODE: '/products/code', // Lấy product theo code
  PROMOTIONS: '/promotions/item/code',
  DEPARTMENTS: '/departments',
} as const;

