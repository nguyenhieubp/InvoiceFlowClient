import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sales API
export const salesApi = {
  getAll: (params?: { brand?: string; processed?: boolean; page?: number; limit?: number; groupBy?: string }) => {
    return api.get('/sales', { params });
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
    return api.post('/sales/orders/print', { docCodes });
  },
  getAllOrders: (params?: { brand?: string; processed?: boolean; page?: number; limit?: number; date?: string; dateFrom?: string; dateTo?: string; search?: string; statusAsys?: boolean }) => {
    // Convert boolean values to strings for query params
    const queryParams: any = { ...params };
    if (queryParams.statusAsys !== undefined) {
      queryParams.statusAsys = queryParams.statusAsys.toString();
    }
    if (queryParams.processed !== undefined) {
      queryParams.processed = queryParams.processed.toString();
    }
    return api.get('/sales', { params: queryParams });
  },
  syncFromZappy: (date: string) => {
    return api.post('/sales/sync-from-zappy', { date });
  },
  createInvoiceViaFastApi: (docCode: string, forceRetry?: boolean) => {
    return api.post(`/sales/order/${docCode}/create-invoice-fast`, { forceRetry: forceRetry || false });
  },
  createMultipleInvoicesViaFastApi: (docCodes: string[]) => {
    return api.post('/sales/orders/create-invoice-fast', { docCodes });
  },
  createStockTransfer: (data: { data: any[] }) => {
    return api.post('/sales/stock-transfer', data);
  },
  getCheckFaceIdByPartnerCode: (partnerCode: string, date?: string) => {
    return api.get(`/sales/check-face-id/${partnerCode}`, { params: { date } });
  },
  getOrdersWithCheckFaceId: (partnerCode: string, date?: string) => {
    return api.get(`/sales/orders-with-check-face-id/${partnerCode}`, { params: { date } });
  },
  getAllGiaiTrinhFaceId: (params?: {
    page?: number;
    limit?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    orderCode?: string;
    partnerCode?: string;
    faceStatus?: 'yes' | 'no';
    brandCode?: string;
  }) => {
    return api.get('/sales/giai-trinh-faceid', { params });
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
    return api.get('/sales/export-orders', {
      params,
      responseType: 'blob', // Để nhận file Excel
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
    return api.get('/sales/status-asys', { params });
  },
  syncErrorOrders: () => {
    return api.post('/sales/sync-error-orders');
  },
  syncErrorOrderByDocCode: (docCode: string) => {
    return api.post(`/sales/sync-error-order/${docCode}`);
  },
  syncSalesByDateRange: (startDate: string, endDate: string) => {
    return api.post('/sales/sync-sales-by-date-range', { startDate, endDate });
  },
  syncSalesOctDec2025: () => {
    return api.post('/sales/sync-sales-oct-dec-2025');
  },
};

// Invoices API
export const invoicesApi = {
  getAll: () => {
    return api.get('/invoices');
  },
  getById: (id: string) => {
    return api.get(`/invoices/${id}`);
  },
  create: (data: any) => {
    return api.post('/invoices', data);
  },
  update: (id: string, data: any) => {
    return api.put(`/invoices/${id}`, data);
  },
  print: (id: string) => {
    return api.post(`/invoices/${id}/print`);
  },
  downloadPdf: (id: string) => {
    return api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  },
};

// Sync API
export const syncApi = {
  syncBrand: (brandName: string, date: string) => {
    return api.post(`/sync/brand/${brandName}`, { date });
  },
  // Sync FaceID data từ API inout-customer
  syncFaceId: (date: string, shopCodes?: string[]) => {
    return api.post('/sync/faceid', { date, shopCodes });
  },
  // Sync stock transfer cho một brand một ngày
  syncStockTransfer: (brandName: string, date: string) => {
    return api.post(`/sync/stock-transfer/${brandName}`, { date });
  },
  // Sync stock transfer từ ngày đến ngày
  syncStockTransferRange: (dateFrom: string, dateTo: string, brand?: string) => {
    return api.post('/sync/stock-transfer/range', { dateFrom, dateTo, brand });
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
    return api.get('/sync/stock-transfers', { params });
  },
};

// Categories API
export const categoriesApi = {
  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/categories/products', { params });
  },
  getProductById: (id: string) => {
    return api.get(`/categories/products/${id}`);
  },
  createProduct: (data: any) => {
    return api.post('/categories/products', data);
  },
  updateProduct: (id: string, data: any) => {
    return api.put(`/categories/products/${id}`, data);
  },
  deleteProduct: (id: string) => {
    return api.delete(`/categories/products/${id}`);
  },
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/categories/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Promotions
  getPromotions: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/categories/promotions', { params });
  },
  getPromotionById: (id: string) => {
    return api.get(`/categories/promotions/${id}`);
  },
  createPromotion: (data: any) => {
    return api.post('/categories/promotions', data);
  },
  updatePromotion: (id: string, data: any) => {
    return api.put(`/categories/promotions/${id}`, data);
  },
  deletePromotion: (id: string) => {
    return api.delete(`/categories/promotions/${id}`);
  },
  importPromotionsExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/categories/promotions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Warehouses
  getWarehouses: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/categories/warehouses', { params });
  },
  getWarehouseById: (id: string) => {
    return api.get(`/categories/warehouses/${id}`);
  },
  createWarehouse: (data: any) => {
    return api.post('/categories/warehouses', data);
  },
  updateWarehouse: (id: string, data: any) => {
    return api.put(`/categories/warehouses/${id}`, data);
  },
  deleteWarehouse: (id: string) => {
    return api.delete(`/categories/warehouses/${id}`);
  },
  importWarehousesExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/categories/warehouses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/categories/customers', { params });
  },
  getCustomerByCode: (code: string) => {
    return api.get(`/categories/customers/${code}`);
  },
  // Loyalty API Proxy
  getProductByCode: (itemCode: string) => {
    return api.get(`/categories/loyalty/products/code/${encodeURIComponent(itemCode)}`);
  },
  getDepartmentByBranchCode: (branchcode: string) => {
    return api.get(`/categories/loyalty/departments?branchcode=${branchcode}`);
  },
  getPromotionByCode: (code: string) => {
    return api.get(`/categories/loyalty/promotions/item/code/${encodeURIComponent(code)}`);
  },
};

// Sync API - Customers
export const syncCustomersApi = {
  syncBrandT8: (brandName: string) => {
    return api.post(`/sync/brand/${brandName}/t8`);
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
    return api.get('/fast-api-invoices', { params });
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
    return api.get('/fast-api-invoices/statistics', { params });
  },
  syncByDateRange: (data: {
    startDate: string;
    endDate: string;
    maDvcs?: string;
  }) => {
    return api.post('/fast-api-invoices/sync-by-date-range', data);
  },
};

