import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
    console.log("==================", params);
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
    return api.get("/sales", { params: queryParams });
  },
  syncFromZappy: (date: string) => {
    return api.post("/sales/sync-from-zappy", { date });
  },
  createInvoiceViaFastApi: (docCode: string, forceRetry?: boolean) => {
    return api.post(`/sales/order/${docCode}/create-invoice-fast`, {
      forceRetry: forceRetry || false,
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
    brand?: string
  ) => {
    return api.post("/sync/stock-transfer/range", { dateFrom, dateTo, brand });
  },
  // Sync báo cáo nộp quỹ cuối ca
  syncShiftEndCash: (date: string, brand?: string) => {
    return api.post("/sync/shift-end-cash", { date, brand });
  },
  // Sync báo cáo nộp quỹ cuối ca theo khoảng thời gian
  syncShiftEndCashByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string
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
    brand?: string
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
    brand?: string
  ) => {
    return api.post("/sync/promotion/range", { startDate, endDate, brand });
  },
  // Sync danh sách Voucher Issue theo khoảng thời gian
  syncVoucherIssueByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string
  ) => {
    return api.post("/sync/voucher-issue/range", { startDate, endDate, brand });
  },
  // Sync cashio theo ngày
  syncCashio: (date: string, brand?: string) => {
    return api.post("/sync/cashio", { date, brand });
  },
  // Sync cashio theo khoảng thời gian
  syncCashioByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string
  ) => {
    return api.post("/sync/cashio/range", { startDate, endDate, brand });
  },
  // Sync sale bán buôn theo khoảng thời gian
  syncWsaleByDateRange: (
    startDate: string,
    endDate: string,
    brand?: string
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
    code?: string;
    materialType?: string;
  }) => {
    return api.get("/sync/voucher-issue", { params });
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
  }) => {
    return api.get("/sync/stock-transfers", { params });
  },
  processWarehouse: (id: string) => {
    return api.post(`/sales/stock-transfer/${id}/warehouse`);
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
      `/sales/stock-transfer/doc-code/${docCode}/warehouse-retry`
    );
  },
  retryFailedByDateRange: (dateFrom: string, dateTo: string) => {
    return api.post(
      "/sales/stock-transfer/warehouse-retry-failed-by-date-range",
      {
        dateFrom,
        dateTo,
      }
    );
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
      `/categories/warehouse-code-mappings/ma-cu/${encodeURIComponent(maCu)}`
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
      `/categories/payment-methods/code/${encodeURIComponent(code)}`
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
      `/categories/loyalty/products/code/${encodeURIComponent(itemCode)}`
    );
  },
  getDepartmentByBranchCode: (branchcode: string) => {
    return api.get(`/categories/loyalty/departments?branchcode=${branchcode}`);
  },
  getPromotionByCode: (code: string) => {
    return api.get(
      `/categories/loyalty/promotions/item/code/${encodeURIComponent(code)}`
    );
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
};
