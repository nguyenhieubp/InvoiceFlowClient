/**
 * Order Enrichment Utilities
 * Các hàm tiện ích cho việc enrich orders với data từ API
 */

import { Order, SaleItem, OrderProduct, OrderPromotion, OrderDepartment } from '@/types/order.types';
import { parsePromCode } from './order.utils';

/**
 * Enrich orders với products, promotions và departments từ cache
 */
export const enrichOrdersWithProducts = (
  ordersToEnrich: Order[],
  productCache: Map<string, OrderProduct>,
  promotionCache: Map<string, OrderPromotion>,
  departmentCache: Map<string, OrderDepartment>
): Order[] => {
  return ordersToEnrich.map(order => ({
    ...order,
    sales: order.sales?.map(sale => {
      // Enrich product - tìm trong cache bằng itemCode
      const product = sale.itemCode && productCache.has(sale.itemCode)
        ? productCache.get(sale.itemCode)!
        : sale.product || null;

      // Enrich promotion - tìm bằng code (từ parsed promCode)
      let promotion: OrderPromotion | null = null;
      if (sale.promCode) {
        const parsedCode = parsePromCode(sale.promCode);

        // Tìm promotion trong cache bằng parsed code
        if (parsedCode && promotionCache.has(parsedCode)) {
          promotion = promotionCache.get(parsedCode)!;
        }
      }

      // Enrich department - lấy từ sale.branchCode
      const saleBranchCode = sale.branchCode;
      const saleDepartment: OrderDepartment | null = saleBranchCode && departmentCache.has(saleBranchCode)
        ? departmentCache.get(saleBranchCode)!
        : null;

      return {
        ...sale,
        product,
        promotion,
        department: saleDepartment,
        // Lấy muaHangGiamGia từ promotion nếu có
        muaHangGiamGia: promotion?.muaHangGiamGia !== undefined
          ? (promotion.muaHangGiamGia ? 1 : 0)
          : (sale as any).muaHangGiamGia,
      };
    }) || [],
  }));
};

/**
 * Extract unique item codes from orders
 */
export const extractUniqueItemCodes = (orders: Order[]): Set<string> => {
  const itemCodes = new Set<string>();
  orders.forEach(order => {
    if (order.sales) {
      order.sales.forEach(sale => {
        if (sale.itemCode && sale.itemCode.trim() !== '') {
          itemCodes.add(sale.itemCode);
        }
      });
    }
  });
  return itemCodes;
};

/**
 * Extract unique promotion codes from orders
 */
export const extractUniquePromCodes = (orders: Order[]): Set<string> => {
  const promCodesSet = new Set<string>();
  orders.forEach(order => {
    if (order.sales) {
      order.sales.forEach(sale => {
        if (sale.promCode && sale.promCode.trim() !== '') {
          promCodesSet.add(sale.promCode);
        }
      });
    }
  });
  return promCodesSet;
};

/**
 * Extract unique branch codes from orders
 */
export const extractUniqueBranchCodes = (orders: Order[]): Set<string> => {
  const branchCodes = new Set<string>();
  orders.forEach(order => {
    if (order.sales) {
      order.sales.forEach(sale => {
        const saleBranchCode = sale.branchCode;
        if (saleBranchCode && saleBranchCode.trim() !== '') {
          branchCodes.add(saleBranchCode);
        }
      });
    }
  });
  return branchCodes;
};

