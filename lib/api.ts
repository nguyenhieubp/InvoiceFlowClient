import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Sales API
export const salesApi = {
  getAll: (params?: {
    brand?: string;
    processed?: boolean;
    page?: number;
    limit?: number;
    groupBy?: string;
  }) => {
    return api.get("/sales", { params });
  },
  getById: (id: string) => {
    return api.get(`/sales/${id}`);
  },
  getByOrderCode: (docCode: string) => {
    return api.get(`/sales/order/${docCode}`);
  },
  printOrder: (docCode: string) => {
    return api.post(`/sales/order/${docCode}/print`);
  },
  printOrders: (docCodes: string[]) => {
    return api.post("/sales/orders/print", { docCodes });
  },
  getAllOrders: (params?: {
    brand?: string;
    processed?: boolean;
    page?: number;
    limit?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    statusAsys?: boolean;
    typeSale?: string;
  }) => {
    // Convert boolean values to strings for query params
    const queryParams: any = { ...params };
    if (queryParams.statusAsys !== undefined) {
      queryParams.statusAsys = queryParams.statusAsys.toString();
    }
    if (queryParams.processed !== undefined) {
      queryParams.processed = queryParams.processed.toString();
    }
    if (queryParams.typeSale !== undefined) {
      queryParams.typeSale = queryParams.typeSale.toString();
    }
    return api.get("/sales/v2", { params: queryParams });
  },
  getAllAggregated: (params?: {
    brand?: string;
    processed?: boolean;
    page?: number;
    limit?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    statusAsys?: boolean;
    typeSale?: string;
  }) => {
    // Convert boolean values to strings for query params
    const queryParams: any = { ...params };
    if (queryParams.statusAsys !== undefined) {
      queryParams.statusAsys = queryParams.statusAsys.toString();
    }
    if (queryParams.processed !== undefined) {
      queryParams.processed = queryParams.processed.toString();
    }
    if (queryParams.typeSale !== undefined) {
      queryParams.typeSale = queryParams.typeSale.toString();
    }
    return api.get("/sales/v2/aggregated", { params: queryParams });
  },
  syncFromZappy: (date: string) => {
    return api.post("/sales/sync-from-zappy", { date });
  },
  createInvoiceViaFastApi: (
    docCode: string,
    forceRetry?: boolean,
    onlySalesOrder?: boolean,
  ) => {
    return api.post(`/sales/order/${docCode}/create-invoice-fast`, {
      forceRetry: forceRetry || false,
      onlySalesOrder: onlySalesOrder || false,
    });
  },
  createMultipleInvoicesViaFastApi: (docCodes: string[]) => {
    return api.post("/sales/orders/create-invoice-fast", { docCodes });
  },
  createStockTransfer: (data: { data: any[] }) => {
    return api.post("/sales/stock-transfer", data);
  },
  exportOrders: (params?: {
    brand?: string;
    processed?: boolean;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    statusAsys?: boolean;
    typeSale?: string;
  }) => {
    return api.get("/sales/export-orders", {
      params,
      responseType: "blob", // Để nhận file Excel
    });
  },
  getStatusAsys: (params?: {
    statusAsys?: string;
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => {
    return api.get("/sales/status-asys", { params });
  },
  syncErrorOrders: () => {
    return api.post("/sales/sync-error-orders");
  },
  syncErrorOrderByDocCode: (docCode: string) => {
    return api.post(`/sales/sync-error-order/${docCode}`);
  },
  syncSalesByDateRange: (startDate: string, endDate: string) => {
    return api.post("/sales/sync-sales-by-date-range", { startDate, endDate });
  },
  syncSalesOctDec2025: () => {
    return api.post("/sales/sync-sales-oct-dec-2025");
  },
  batchProcessInvoices: (startDate: string, endDate: string) => {
    return api.post("/sales/invoice/batch-process", { startDate, endDate });
  },
  retryFailedInvoices() {
    return api.post("/sales/invoice/retry-failed");
  },
  getOrderCount(params?: {
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    typeSale?: string;
    isProcessed?: boolean;
    statusAsys?: boolean;
  }) {
    return api.get("/sales/statistics/order-count", { params });
  },
  updateErrorOrder: (
    id: string,
    data: { materialCode?: string; branchCode?: string },
  ) => {
    return api.post(`/sales/error-order/${id}`, data);
  },
};

// Purchasing APIs
export const syncPurchaseOrders = async (
  startDate: string,
  endDate: string,
  brand?: string,
) => {
  return api.post("/purchase-orders/sync", { startDate, endDate, brand });
};

export const syncGoodsReceipts = async (
  startDate: string,
  endDate: string,
  brand?: string,
) => {
  return api.post("/goods-receipts/sync", { startDate, endDate, brand });
};

export const getPurchaseOrders = async (params: {
  startDate?: string;
  endDate?: string;
  search?: string;
  brand?: string;
  page?: number;
  limit?: number;
}) => {
  return api.get("/purchase-orders", { params });
};

export const getGoodsReceipts = async (params: {
  startDate?: string;
  endDate?: string;
  search?: string;
  brand?: string;
  page?: number;
  limit?: number;
}) => {
  return api.get("/goods-receipts", { params });
};

// Invoices API
export const invoicesApi = {
  getAll: () => {
    return api.get("/invoices");
  },
  getById: (id: string) => {
    return api.get(`/invoices/${id}`);
  },
  create: (data: any) => {
    return api.post("/invoices", data);
  },
  update: (id: string, data: any) => {
    return api.put(`/invoices/${id}`, data);
  },
  print: (id: string) => {
    return api.post(`/invoices/${id}/print`);
  },
  downloadPdf: (id: string) => {
    return api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
  },
};

// Sync API
export const syncApi = {
  syncBrand: (brandName: string, date: string) => {
    return api.post(`/sync/brand/${brandName}`, { date });
  },
  // Sync stock transfer cho một brand một ngày
  syncStockTransfer: (brandName: string, date: string) => {
    return api.post(`/sync/stock-transfer/${brandName}`, { date });
  },
  // Sync stock transfer từ ngày đến ngày
  syncStockTransferRange: (
    dateFrom: string,
    dateTo: string,
    brand?: string,
  ) => {
    return api.post("/sync/stock-transfer/range", { dateFrom, dateTo, brand });
  },
  // Retry material code for stock transfer
  retryStockTransferMaterialCode: (soCode: string) => {
    return api.post("/sync/stock-transfer/retry", { soCode });
  },
  // Sync báo cáo nộp quỹ cuối ca
  syncShiftEndCash: (date: string, brand?: string) => {
    return api.post("/sync/shift-end-cash", { date, brand });
  },
  // Sync báo cáo nộp quỹ cuối ca theo khoảng thời gian
  syncShiftEndCashByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/sync/shift-end-cash/range", {
      startDate,
      endDate,
      brand,
    });
  },
  // Sync tách gộp BOM theo khoảng thời gian
  syncRepackFormulaByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/sync/repack-formula/range", {
      startDate,
      endDate,
      brand,
    });
  },
  // Sync danh sách CTKM theo khoảng thời gian
  syncPromotionByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/sync/promotion/range", { startDate, endDate, brand });
  },
  // Sync danh sách Voucher Issue theo khoảng thời gian
  syncVoucherIssueByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/voucher-issue/sync/range", { startDate, endDate, brand });
  },
  // Sync cashio theo ngày
  syncCashio: (date: string, brand?: string) => {
    return api.post("/sync/cashio", { date, brand });
  },
  // Sync cashio theo khoảng thời gian
  syncCashioByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/sync/cashio/range", { startDate, endDate, brand });
  },
  // Sync sale bán buôn theo khoảng thời gian
  syncWsaleByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string,
  ) => {
    return api.post("/sync/wsale/range", { startDate, endDate, brand });
  },
  // Sync Order Fees theo khoảng thời gian
  syncOrderFeesByDateRange: (startAt: string, endAt: string) => {
    return api.post("/multi-db/range-sync-order-fees", { startAt, endAt });
  },
};

// Voucher Issue API
export const voucherIssueApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    serial?: string;
    code?: string;
  }) => {
    return api.get("/voucher-issue", { params });
  },
};

// Promotion API
export const promotionApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    ptype?: string;
    status?: string;
    code?: string;
  }) => {
    return api.get("/sync/promotion", { params });
  },
  exportExcel: (params?: {
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    ptype?: string;
    status?: string;
    code?: string;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.brand) queryString.append("brand", params.brand);
    if (params?.dateFrom) queryString.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryString.append("dateTo", params.dateTo);
    if (params?.ptype) queryString.append("ptype", params.ptype);
    if (params?.status) queryString.append("status", params.status);
    if (params?.code) queryString.append("code", params.code);

    return api.get(`/sync/promotion/export?${queryString.toString()}`, {
      responseType: "blob",
    });
  },
};

// Repack Formula API
export const repackFormulaApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    repackCatName?: string;
    itemcode?: string;
  }) => {
    return api.get("/sync/repack-formula", { params });
  },
};

// Stock Transfer API
export const stockTransferApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    itemCode?: string;
    soCode?: string;
    doctype?: string;
  }) => {
    return api.get("/sync/stock-transfers", { params });
  },
  processWarehouse: (id: string) => {
    return api.post(`/sales/stock-transfer/${id}/warehouse`);
  },
  getMissingMaterial: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return api.get("/stock-transfers/missing-material", { params });
  },
  update: (
    id: string,
    data: { materialCode?: string; branchCode?: string },
  ) => {
    return api.put(`/stock-transfers/${id}`, data);
  },
};

// Cashio API
export const cashioApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    soCode?: string;
    partnerCode?: string;
  }) => {
    return api.get("/sync/cashio", { params });
  },
};

// Warehouse Processed API
export const warehouseProcessedApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    ioType?: string;
    success?: boolean;
    docCode?: string;
  }) => {
    return api.get("/sync/warehouse-processed", { params });
  },
  retryByDocCode: (docCode: string) => {
    return api.post(
      `/sales/stock-transfer/doc-code/${docCode}/warehouse-retry`,
    );
  },
  retryFailedByDateRange: (dateFrom: string, dateTo: string) => {
    return api.post(
      "/sales/stock-transfer/warehouse-retry-failed-by-date-range",
      {
        dateFrom,
        dateTo,
      },
    );
  },
  syncByDateRangeAndDoctype: (
    dateFrom: string,
    dateTo: string,
    doctype?: string,
  ) => {
    return api.post("/sales/stock-transfer/warehouse-sync-by-date-range", {
      dateFrom,
      dateTo,
      doctype,
    });
  },
};

// Shift End Cash API
export const shiftEndCashApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    drawCode?: string;
  }) => {
    return api.get("/sync/shift-end-cash", { params });
  },
  createPayment: (id: string) => {
    return api.post(`/sync/shift-end-cash/${id}/create-payment`);
  },
};

// Categories API
export const categoriesApi = {
  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/products", { params });
  },
  getProductById: (id: string) => {
    return api.get(`/categories/products/${id}`);
  },
  createProduct: (data: any) => {
    return api.post("/categories/products", data);
  },
  updateProduct: (id: string, data: any) => {
    return api.put(`/categories/products/${id}`, data);
  },
  deleteProduct: (id: string) => {
    return api.delete(`/categories/products/${id}`);
  },
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/products/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // Promotions
  getPromotions: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/promotions", { params });
  },
  getPromotionById: (id: string) => {
    return api.get(`/categories/promotions/${id}`);
  },
  createPromotion: (data: any) => {
    return api.post("/categories/promotions", data);
  },
  updatePromotion: (id: string, data: any) => {
    return api.put(`/categories/promotions/${id}`, data);
  },
  deletePromotion: (id: string) => {
    return api.delete(`/categories/promotions/${id}`);
  },
  importPromotionsExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/promotions/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // Warehouses
  getWarehouses: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/warehouses", { params });
  },
  getWarehouseById: (id: string) => {
    return api.get(`/categories/warehouses/${id}`);
  },
  createWarehouse: (data: any) => {
    return api.post("/categories/warehouses", data);
  },
  updateWarehouse: (id: string, data: any) => {
    return api.put(`/categories/warehouses/${id}`, data);
  },
  deleteWarehouse: (id: string) => {
    return api.delete(`/categories/warehouses/${id}`);
  },
  importWarehousesExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/warehouses/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // Warehouse Code Mappings
  getWarehouseCodeMappings: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/warehouse-code-mappings", { params });
  },
  getWarehouseCodeMappingById: (id: string) => {
    return api.get(`/categories/warehouse-code-mappings/${id}`);
  },
  getWarehouseCodeMappingByMaCu: (maCu: string) => {
    return api.get(
      `/categories/warehouse-code-mappings/ma-cu/${encodeURIComponent(maCu)}`,
    );
  },
  createWarehouseCodeMapping: (data: any) => {
    return api.post("/categories/warehouse-code-mappings", data);
  },
  updateWarehouseCodeMapping: (id: string, data: any) => {
    return api.put(`/categories/warehouse-code-mappings/${id}`, data);
  },
  deleteWarehouseCodeMapping: (id: string) => {
    return api.delete(`/categories/warehouse-code-mappings/${id}`);
  },
  importWarehouseCodeMappingsExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/warehouse-code-mappings/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  mapWarehouseCode: (maCu: string) => {
    return api.post("/categories/warehouse-code-mappings/map", { maCu });
  },
  mapWarehouseCodeGet: (maCu: string) => {
    return api.get("/categories/warehouse-code-mappings/map", {
      params: { maCu },
    });
  },
  // Payment Methods
  getPaymentMethods: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/payment-methods", { params });
  },
  getPaymentMethodById: (id: string) => {
    return api.get(`/categories/payment-methods/${id}`);
  },
  getPaymentMethodByCode: (code: string) => {
    return api.get(
      `/categories/payment-methods/code/${encodeURIComponent(code)}`,
    );
  },
  createPaymentMethod: (data: any) => {
    return api.post("/categories/payment-methods", data);
  },
  updatePaymentMethod: (id: string, data: any) => {
    return api.put(`/categories/payment-methods/${id}`, data);
  },
  deletePaymentMethod: (id: string) => {
    return api.delete(`/categories/payment-methods/${id}`);
  },
  importPaymentMethodsExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/payment-methods/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  exportPaymentMethodsExcel: () => {
    return api.get("/categories/payment-methods/export", {
      responseType: "blob",
    });
  },
  // Customers
  getCustomers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/customers", { params });
  },
  getCustomerByCode: (code: string) => {
    return api.get(`/categories/customers/${code}`);
  },
  // Ecommerce Customers
  getEcommerceCustomers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get("/categories/ecommerce-customers", { params });
  },
  getActiveEcommerceCustomers: () => {
    return api.get("/categories/ecommerce-customers/active");
  },
  getActiveEcommerceCustomerByCode: (code: string) => {
    return api.get(`/categories/ecommerce-customers/active/${code}`);
  },
  getEcommerceCustomerById: (id: string) => {
    return api.get(`/categories/ecommerce-customers/${id}`);
  },
  createEcommerceCustomer: (data: any) => {
    return api.post("/categories/ecommerce-customers", data);
  },
  updateEcommerceCustomer: (id: string, data: any) => {
    return api.put(`/categories/ecommerce-customers/${id}`, data);
  },
  deleteEcommerceCustomer: (id: string) => {
    return api.delete(`/categories/ecommerce-customers/${id}`);
  },
  importEcommerceCustomersExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/categories/ecommerce-customers/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // Loyalty API Proxy
  getProductByCode: (itemCode: string) => {
    return api.get(
      `/categories/loyalty/products/code/${encodeURIComponent(itemCode)}`,
    );
  },
  getDepartmentByBranchCode: (branchcode: string) => {
    return api.get(`/categories/loyalty/departments?branchcode=${branchcode}`);
  },
  getPromotionByCode: (code: string) => {
    return api.get(
      `/categories/loyalty/promotions/item/code/${encodeURIComponent(code)}`,
    );
  },
};

// Payment API
export const paymentsApi = {
  exportExcel: (params?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    brand?: string;
    fopSyscode?: string;
  }) => {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append("search", params.search);
    if (params?.dateFrom) queryString.append("dateFrom", params.dateFrom);
    if (params?.dateTo) queryString.append("dateTo", params.dateTo);
    if (params?.brand) queryString.append("brand", params.brand);
    if (params?.fopSyscode) queryString.append("fopSyscode", params.fopSyscode);

    return api.get(`/payments/export?${queryString.toString()}`, {
      responseType: "blob",
    });
  },
};

// Platform Fees API
export const platformFeesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.get("/platform-fees", { params });
  },
  getById: (id: string) => {
    return api.get(`/platform-fees/${id}`);
  },
  create: (data: any) => {
    return api.post("/platform-fees", data);
  },
  update: (id: string, data: any) => {
    return api.patch(`/platform-fees/${id}`, data);
  },
  delete: (id: string) => {
    return api.delete(`/platform-fees/${id}`);
  },
};

// Shopee Fees API
export const shopeeFeesApi = {
  getAll: (params: any) => api.get("/order-fees/shopee", { params }),
  sync: (erpCode: string) => api.post(`/multi-db/sync-order-fee/${erpCode}`),
};

// TikTok Fees API
export const tiktokFeesApi = {
  getAll: (params: any) => api.get("/order-fees/tiktok", { params }),
  sync: (erpCode: string) => api.post(`/multi-db/sync-order-fee/${erpCode}`),
};

// Order Fees API (DEPRECATED - use shopeeFeesApi or tiktokFeesApi instead)
export const orderFeesApi = {
  getAll: (params?: any) => api.get("/order-fees", { params }),
};

// Platform Fee Import API
export const platformFeeImportApi = {
  import: (file: File, platform: "shopee" | "tiktok" | "lazada") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    return api.post("/platform-fee-import/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getAll: (params?: {
    platform?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    return api.get("/platform-fee-import", { params });
  },
  downloadTemplate: (platform: "shopee" | "tiktok" | "lazada") => {
    return api.get(`/platform-fee-import/template/${platform}`, {
      responseType: "blob",
    });
  },
  // Fee Map API
  getFeeMaps: (params?: {
    platform?: string;
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }) => {
    return api.get("/platform-fee-import/fee-map", { params });
  },
  createFeeMap: (data: {
    platform: string;
    rawFeeName: string;
    internalCode: string;
    accountCode: string;
    description?: string;
    active?: boolean;
  }) => {
    return api.post("/platform-fee-import/fee-map", data);
  },
  updateFeeMap: (
    id: string,
    data: {
      platform?: string;
      rawFeeName?: string;
      internalCode?: string;
      accountCode?: string;
      description?: string;
      active?: boolean;
    },
  ) => {
    return api.put(`/platform-fee-import/fee-map/${id}`, data);
  },
  deleteFeeMap: (id: string) => {
    return api.delete(`/platform-fee-import/fee-map/${id}`);
  },
};

// Fast API Invoices API (Bảng kê hóa đơn)

export const fastApiInvoicesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: number;
    docCode?: string;
    maKh?: string;
    tenKh?: string;
    maDvcs?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.get("/fast-api-invoices", { params });
  },
  exportExcel: (params?: {
    status?: number;
    docCode?: string;
    maKh?: string;
    tenKh?: string;
    maDvcs?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.get("/fast-api-invoices/export/excel", {
      params,
      responseType: "blob",
    });
  },
  getById: (id: string) => {
    return api.get(`/fast-api-invoices/${id}`);
  },
  getByDocCode: (docCode: string) => {
    return api.get(`/fast-api-invoices/doc-code/${docCode}`);
  },
  getStatistics: (params?: {
    startDate?: string;
    endDate?: string;
    maDvcs?: string;
  }) => {
    return api.get("/fast-api-invoices/statistics", { params });
  },
  syncByDateRange: (data: {
    startDate: string;
    endDate: string;
    maDvcs?: string;
  }) => {
    return api.post("/fast-api-invoices/sync-by-date-range", data);
  },
  getInvoiceDetails: (id: string) => {
    return api.get(`/fast-api-invoices/${id}/details`);
  },
  getInvoiceDetailsByDocCode: (docCode: string) => {
    return api.get(`/fast-api-invoices/doc-code/${docCode}/details`);
  },
  getInvoiceDetailsByDocCodeAndMaDvcs: (docCode: string, maDvcs: string) => {
    return api.get(
      `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/details`,
    );
  },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKh: (
    docCode: string,
    maDvcs: string,
    maKh: string,
  ) => {
    return api.get(
      `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/details`,
    );
  },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKh: (
    docCode: string,
    maDvcs: string,
    maKh: string,
    tenKh: string,
  ) => {
    return api.get(
      `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/details`,
    );
  },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatus: (
    docCode: string,
    maDvcs: string,
    maKh: string,
    tenKh: string,
    status: number,
  ) => {
    return api.get(
      `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/details`,
    );
  },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDate: (
    docCode: string,
    maDvcs: string,
    maKh: string,
    tenKh: string,
    status: number,
    startDate: string,
  ) => {
    return api.get(
      `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/details`,
    );
  },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDate:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPage:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimit:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearch:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortBy:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrder:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFields:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpand:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelect:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilter:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupBy:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregate:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCount:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinct:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormat:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallback:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallbackAndSkip:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
      skip: number,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/skip/${skip}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallbackAndSkipAndTop:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
      skip: number,
      top: number,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/skip/${skip}/top/${top}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallbackAndSkipAndTopAndInlinecount:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
      skip: number,
      top: number,
      inlinecount: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/skip/${skip}/top/${top}/inlinecount/${inlinecount}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallbackAndSkipAndTopAndInlinecountAndOrderBy:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
      skip: number,
      top: number,
      inlinecount: string,
      orderBy: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/skip/${skip}/top/${top}/inlinecount/${inlinecount}/order-by/${orderBy}/details`,
      );
    },
  getInvoiceDetailsByDocCodeAndMaDvcsAndMaKhAndTenKhAndStatusAndStartDateAndEndDateAndPageAndLimitAndSearchAndSortByAndSortOrderAndFieldsAndExpandAndSelectAndFilterAndGroupByAndAggregateAndCountAndDistinctAndFormatAndCallbackAndSkipAndTopAndInlinecountAndOrderByAndCustom:
    (
      docCode: string,
      maDvcs: string,
      maKh: string,
      tenKh: string,
      status: number,
      startDate: string,
      endDate: string,
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      fields: string,
      expand: string,
      select: string,
      filter: string,
      groupBy: string,
      aggregate: string,
      count: boolean,
      distinct: boolean,
      format: string,
      callback: string,
      skip: number,
      top: number,
      inlinecount: string,
      orderBy: string,
      custom: string,
    ) => {
      return api.get(
        `/fast-api-invoices/doc-code/${docCode}/ma-dvcs/${maDvcs}/ma-kh/${maKh}/ten-kh/${tenKh}/status/${status}/start-date/${startDate}/end-date/${endDate}/page/${page}/limit/${limit}/search/${search}/sort-by/${sortBy}/sort-order/${sortOrder}/fields/${fields}/expand/${expand}/select/${select}/filter/${filter}/group-by/${groupBy}/aggregate/${aggregate}/count/${count}/distinct/${distinct}/format/${format}/callback/${callback}/skip/${skip}/top/${top}/inlinecount/${inlinecount}/order-by/${orderBy}/custom/${custom}/details`,
      );
    },
};

// Stock Transfer API
