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
  getAllOrders: (params?: { brand?: string; processed?: boolean; page?: number; limit?: number }) => {
    return api.get('/sales', { params: { ...params, groupBy: 'order' } });
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
  syncAll: () => {
    return api.post('/sync/all');
  },
  syncBrand: (brandName: string) => {
    return api.post(`/sync/brand/${brandName}`);
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
};

