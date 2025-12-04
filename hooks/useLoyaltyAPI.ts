/**
 * Loyalty API Hook
 * Custom hook để quản lý API calls và cache cho Loyalty API
 */

import { useState, useCallback } from 'react';
import { OrderProduct, OrderPromotion, OrderDepartment } from '@/types/order.types';
import { mapLoyaltyApiProductToProductItem } from '@/lib/utils/product.utils';
import { parsePromCode } from '@/lib/utils/order.utils';
import { extractUniqueItemCodes, extractUniquePromCodes, extractUniqueBranchCodes } from '@/lib/utils/order-enrichment.utils';
import { Order } from '@/types/order.types';

const BATCH_SIZE_PRODUCTS = 10;
const BATCH_SIZE_PROMOTIONS = 10;
const BATCH_SIZE_DEPARTMENTS = 5;

/**
 * Fetch product từ Loyalty API
 */
const fetchProductFromAPI = async (materialCode: string): Promise<OrderProduct | null> => {
  try {
    const response = await fetch(
      `https://loyaltyapi.vmt.vn/products/material-code/${materialCode}`,
      {
        headers: { accept: 'application/json' },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return mapLoyaltyApiProductToProductItem(data);
  } catch (error) {
    return null;
  }
};

/**
 * Fetch promotion từ Loyalty API
 */
const fetchPromotionFromAPI = async (code: string): Promise<OrderPromotion | null> => {
  try {
    const response = await fetch(
      `https://loyaltyapi.vmt.vn/promotions/item/code/${code}`,
      {
        headers: { accept: 'application/json' },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data && data.code ? data : null;
  } catch (error) {
    return null;
  }
};

/**
 * Fetch department từ Loyalty API
 */
const fetchDepartmentFromAPI = async (branchcode: string): Promise<OrderDepartment | null> => {
  try {
    const response = await fetch(
      `https://loyaltyapi.vmt.vn/departments?page=1&limit=25&branchcode=${branchcode}`,
      {
        headers: { accept: 'application/json' },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.data?.items?.[0] || null;
  } catch (error) {
    return null;
  }
};

export const useLoyaltyAPI = () => {
  const [productCache, setProductCache] = useState<Map<string, OrderProduct>>(new Map());
  const [promotionCache, setPromotionCache] = useState<Map<string, OrderPromotion>>(new Map());
  const [departmentCache, setDepartmentCache] = useState<Map<string, OrderDepartment>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  /**
   * Load products cho tất cả itemCode trong orders
   */
  const loadProductsForOrders = useCallback(async (orders: Order[]): Promise<void> => {
    const itemCodes = extractUniqueItemCodes(orders);
    const itemCodesToFetch = Array.from(itemCodes).filter(code => !productCache.has(code));

    if (itemCodesToFetch.length === 0) {
      return;
    }

    setLoadingProducts(true);
    try {
      for (let i = 0; i < itemCodesToFetch.length; i += BATCH_SIZE_PRODUCTS) {
        const batch = itemCodesToFetch.slice(i, i + BATCH_SIZE_PRODUCTS);
        const results = await Promise.all(
          batch.map(async (itemCode) => {
            const product = await fetchProductFromAPI(itemCode);
            if (product) {
              setProductCache(prev => new Map(prev).set(itemCode, product));
            }
            return product;
          })
        );
      }
    } catch (error) {
      // Silent fail - errors are handled in fetchProductFromAPI
    } finally {
      setLoadingProducts(false);
    }
  }, [productCache]);

  /**
   * Load promotions cho tất cả promCode trong orders
   */
  const loadPromotionsForOrders = useCallback(async (orders: Order[]): Promise<void> => {
    const promCodesSet = extractUniquePromCodes(orders);
    const codeSet = new Set<string>();

    // Kiểm tra cache hiện có
    promCodesSet.forEach(promCode => {
      const parsedCode = parsePromCode(promCode);
      if (parsedCode && promotionCache.has(parsedCode)) {
        codeSet.add(parsedCode);
      }
    });

    const promCodesToFetch = Array.from(promCodesSet).filter(promCode => {
      const parsedCode = parsePromCode(promCode);
      return parsedCode && !codeSet.has(parsedCode);
    });

    if (promCodesToFetch.length === 0) {
      return;
    }

    setLoadingPromotions(true);
    try {
      for (let i = 0; i < promCodesToFetch.length; i += BATCH_SIZE_PROMOTIONS) {
        const batch = promCodesToFetch.slice(i, i + BATCH_SIZE_PROMOTIONS);
        await Promise.all(
          batch.map(async (promCode) => {
            const parsedCode = parsePromCode(promCode);
            if (!parsedCode) return;

            const promotion = await fetchPromotionFromAPI(parsedCode);
            if (promotion && promotion.code) {
              setPromotionCache(prev => {
                const newCache = new Map(prev);
                newCache.set(promotion.code!, promotion);
                if (parsedCode !== promotion.code) {
                  newCache.set(parsedCode, promotion);
                }
                return newCache;
              });
            }
          })
        );
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingPromotions(false);
    }
  }, [promotionCache]);

  /**
   * Load departments cho tất cả branch_code trong orders
   */
  const loadDepartmentsForOrders = useCallback(async (orders: Order[]): Promise<void> => {
    const branchCodes = extractUniqueBranchCodes(orders);
    const branchCodesToFetch = Array.from(branchCodes).filter(code => !departmentCache.has(code));

    if (branchCodesToFetch.length === 0) {
      return;
    }

    setLoadingDepartments(true);
    try {
      for (let i = 0; i < branchCodesToFetch.length; i += BATCH_SIZE_DEPARTMENTS) {
        const batch = branchCodesToFetch.slice(i, i + BATCH_SIZE_DEPARTMENTS);
        await Promise.all(
          batch.map(async (branchCode) => {
            const department = await fetchDepartmentFromAPI(branchCode);
            if (department) {
              setDepartmentCache(prev => new Map(prev).set(branchCode, department));
            }
          })
        );
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingDepartments(false);
    }
  }, [departmentCache]);

  return {
    productCache,
    promotionCache,
    departmentCache,
    loadingProducts,
    loadingPromotions,
    loadingDepartments,
    loadProductsForOrders,
    loadPromotionsForOrders,
    loadDepartmentsForOrders,
  };
};

