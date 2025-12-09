'use client';

import { useEffect, useState } from 'react';
import { salesApi, categoriesApi, fastApiInvoicesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { TAX_CODE, DEBIT_ACCOUNT } from '@/lib/constants/accounting.constants';
import { ORDER_TYPE_NORMAL, ORDER_TYPE_LAM_DV, ORDER_TYPE_BAN_ECOIN, ORDER_TYPE_SAN_TMDT, mapOrderTypeNameToCode } from '@/lib/constants/order-type.constants';
import { calculateThanhToanVoucher } from '@/lib/utils/voucher.utils';
import { Order, SaleItem } from '@/types/order.types';
import { OrderColumn, FIELD_LABELS, MAIN_COLUMNS } from '@/lib/constants/order-columns.constants';
import { calculateMaLo } from '@/lib/utils/order.utils';
import { normalizeOrderData } from '@/lib/utils/order-mapper.utils';
import { mapLoyaltyApiProductToProductItem } from '@/lib/utils/product.utils';
import { OrderProduct, OrderDepartment } from '@/types/order.types';


interface FastApiInvoice {
  id: string;
  docCode: string;
  maDvcs: string | null;
  maKh: string | null;
  tenKh: string | null;
  ngayCt: string | null;
  status: number;
  message: string | null;
  guid: string | null;
  fastApiResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [enrichedDisplayedOrders, setEnrichedDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; dateFrom?: string; dateTo?: string; invoiceStatus?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<OrderColumn[]>([...MAIN_COLUMNS]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<OrderColumn, string>>({} as Record<OrderColumn, string>);
  const [syncing, setSyncing] = useState(false);
  const [invoiceStatusMap, setInvoiceStatusMap] = useState<Record<string, FastApiInvoice>>({});
  const [invoiceStatistics, setInvoiceStatistics] = useState<{
    total: number;
    success: number;
    failed: number;
    successRate: string;
  } | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  
  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return '';
    }
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  };

  // Hàm convert từ YYYY-MM-DD sang Date object để hiển thị trong date picker
  const getDatePickerValue = (ddmmmyyyy: string): string => {
    if (!ddmmmyyyy || ddmmmyyyy.length !== 9) return '';
    const day = ddmmmyyyy.substring(0, 2);
    const monthStr = ddmmmyyyy.substring(2, 5);
    const year = ddmmmyyyy.substring(5, 9);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = months.indexOf(monthStr.toUpperCase());
    if (monthIndex === -1) return '';
    const month = (monthIndex + 1).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [syncDateInput, setSyncDateInput] = useState<string>(() => {
    // Format ngày hiện tại thành YYYY-MM-DD cho date picker
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Convert syncDateInput sang DDMMMYYYY khi gọi API
  const getSyncDate = (): string => {
    return convertDateToDDMMMYYYY(syncDateInput);
  };
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Bỏ cache - chỉ dùng data trực tiếp từ backend order API

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Map company từ department sang brand
  const mapCompanyToBrand = (company: string | null | undefined): string | undefined => {
    if (!company) return undefined;

    const companyUpper = company.toUpperCase();
    const brandMap: Record<string, string> = {
      'F3': 'f3',
      'FACIALBAR': 'f3',
      'MENARD': 'menard',
      'CHANDO': 'chando',
      'LABHAIR': 'labhair',
      'YAMAN': 'yaman',
    };

    return brandMap[companyUpper] || company.toLowerCase();
  };

  // Hàm đồng bộ từ Zappy
  const handleSyncFromZappy = async () => {
    const syncDate = getSyncDate();
    if (!syncDate) {
      showToast('error', 'Vui lòng chọn ngày cần đồng bộ');
      return;
    }

    try {
      setSyncing(true);
      const response = await salesApi.syncFromZappy(syncDate);
      const data = response.data;

      if (data.success) {
        showToast('success', `${data.message}. Đã đồng bộ ${data.ordersCount} đơn hàng, ${data.salesCount} dòng bán hàng mới, ${data.customersCount} khách hàng mới.`);
        // Reload orders sau khi đồng bộ thành công
        await loadOrders();
      } else {
        showToast('error', data.message || 'Đồng bộ thất bại');
      }
    } catch (error: any) {
      console.error('Error syncing from Zappy:', error);
      showToast('error', error?.response?.data?.message || 'Lỗi khi đồng bộ dữ liệu từ Zappy');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch product từ backend API (proxy đến Loyalty API)
  const fetchProduct = async (itemCode: string): Promise<OrderProduct | null> => {
    if (!itemCode) return null;
    try {
      const response = await categoriesApi.getProductByCode(itemCode);
      const product = response.data;
      
      if (product) {
        return mapLoyaltyApiProductToProductItem(product);
      }

      return null;
    } catch (error) {
      console.error(`Error fetching product ${itemCode}:`, error);
      return null;
    }
  };

  // Fetch department từ backend API (proxy đến Loyalty API)
  const fetchDepartment = async (branchcode: string): Promise<OrderDepartment | null> => {
    if (!branchcode) return null;
    try {
      const response = await categoriesApi.getDepartmentByBranchCode(branchcode);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching department ${branchcode}:`, error);
      return null;
    }
  };

  // Enrich orders với products và departments (batch fetch để tối ưu)
  const enrichOrdersWithProducts = async (orders: Order[]): Promise<Order[]> => {
    // Collect tất cả itemCodes và branchCodes cần fetch
    const itemCodesToFetch = new Set<string>();
    const branchCodesToFetch = new Set<string>();

    orders.forEach(order => {
      order.sales?.forEach(sale => {
        if (sale.itemCode) {
          itemCodesToFetch.add(sale.itemCode);
        }
        if (sale.branchCode) {
          branchCodesToFetch.add(sale.branchCode);
        }
      });
    });

    // Batch fetch products (10 items một lần)
    const BATCH_SIZE = 10;
    const itemCodesArray = Array.from(itemCodesToFetch);
    const productCache = new Map<string, OrderProduct>();

    for (let i = 0; i < itemCodesArray.length; i += BATCH_SIZE) {
      const batch = itemCodesArray.slice(i, i + BATCH_SIZE);
      const products = await Promise.all(
        batch.map(itemCode => fetchProduct(itemCode))
      );

      batch.forEach((itemCode, index) => {
        const product = products[index];
        if (product) {
          productCache.set(itemCode, product);
        }
      });
    }

    // Batch fetch departments (5 items một lần)
    const BATCH_SIZE_DEPT = 5;
    const branchCodesArray = Array.from(branchCodesToFetch);
    const departmentCache = new Map<string, OrderDepartment>();

    for (let i = 0; i < branchCodesArray.length; i += BATCH_SIZE_DEPT) {
      const batch = branchCodesArray.slice(i, i + BATCH_SIZE_DEPT);
      const departments = await Promise.all(
        batch.map(branchCode => fetchDepartment(branchCode))
      );

      batch.forEach((branchCode, index) => {
        const department = departments[index];
        if (department) {
          departmentCache.set(branchCode, department);
        }
      });
    }

    // Enrich orders với products và departments từ cache
    const enrichedOrders = orders.map(order => {
      if (!order.sales || order.sales.length === 0) return order;

      // Tìm department đầu tiên để lấy company/brand
      let departmentForBrand: OrderDepartment | null = null;
      if (order.sales.length > 0 && order.sales[0].branchCode) {
        departmentForBrand = departmentCache.get(order.sales[0].branchCode) || null;
      }

      // Map company từ department sang brand cho customer
      const brandFromDepartment = departmentForBrand?.company
        ? mapCompanyToBrand(departmentForBrand.company)
        : undefined;

      const enrichedSales = order.sales.map(sale => {
        let enrichedSale = { ...sale };

        // Enrich product
        if (sale.itemCode) {
          const product = productCache.get(sale.itemCode);
          if (product) {
            enrichedSale = {
              ...enrichedSale,
              dvt: product.dvt || enrichedSale.dvt,
              itemCode: product.maVatTu || enrichedSale.itemCode,
              itemName: product.tenVatTu || enrichedSale.itemName,
              product,
              // Giữ lại maKho từ backend
              maKho: enrichedSale.maKho || sale.maKho,
            };
          }
        }

        // Enrich department
        if (sale.branchCode) {
          const department = departmentCache.get(sale.branchCode);
          if (department) {
            enrichedSale = {
              ...enrichedSale,
              department,
              // Giữ lại maKho từ backend
              maKho: enrichedSale.maKho || sale.maKho,
            };
          }
        }

        // Đảm bảo maKho luôn được giữ lại
        if (!enrichedSale.maKho && sale.maKho) {
          enrichedSale.maKho = sale.maKho;
        }

        return enrichedSale;
      });

      return {
        ...order,
        customer: {
          ...order.customer,
          // Cập nhật brand từ department.company nếu có
          brand: brandFromDepartment || order.customer.brand || '',
        },
        sales: enrichedSales,
      };
    });

    return enrichedOrders;
  };

  // Load invoice status từ FastApiInvoice table
  const loadInvoiceStatuses = async () => {
    try {
      const params: any = {
        page: 1,
        limit: 10000, // Lấy tất cả để map
      };
      if (filter.dateFrom) params.startDate = filter.dateFrom;
      if (filter.dateTo) params.endDate = filter.dateTo;

      const response = await fastApiInvoicesApi.getAll(params);
      const invoices: FastApiInvoice[] = response.data.items || [];
      
      // Tạo map docCode -> invoice
      const statusMap: Record<string, FastApiInvoice> = {};
      invoices.forEach((invoice) => {
        statusMap[invoice.docCode] = invoice;
      });
      
      setInvoiceStatusMap(statusMap);
    } catch (error: any) {
      console.error('Error loading invoice statuses:', error);
    }
  };

  // Load invoice statistics
  const loadInvoiceStatistics = async () => {
    try {
      const params: any = {};
      if (filter.dateFrom) params.startDate = filter.dateFrom;
      if (filter.dateTo) params.endDate = filter.dateTo;

      const response = await fastApiInvoicesApi.getStatistics(params);
      setInvoiceStatistics(response.data);
    } catch (error: any) {
      console.error('Error loading invoice statistics:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Lấy orders từ backend API
      const response = await salesApi.getAllOrders({
        brand: filter.brand,
        page: 1,
        limit: 1000, // Lấy tất cả để search client-side
      });
      const rawData = response.data.data || [];

      // Normalize dữ liệu - hỗ trợ cả format cũ và format mới từ ERP
      const ordersData = normalizeOrderData(rawData);

      setRawOrders(ordersData);

      // Không enrich tất cả ngay - chỉ enrich khi hiển thị (theo phân trang)
      setAllOrders(ordersData);
      
      // Load invoice statuses sau khi load orders
      await loadInvoiceStatuses();
      await loadInvoiceStatistics();
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showToast('error', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand, filter.dateFrom, filter.dateTo]);

  // Bỏ cache - không enrich nữa

  // Xử lý search và pagination trên client
  useEffect(() => {
    let filtered = allOrders;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.docCode.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.code.toLowerCase().includes(query) ||
          (order.customer.mobile && order.customer.mobile.toLowerCase().includes(query))
      );
    }

    // Filter by brand
    if (filter.brand) {
      filtered = filtered.filter((order) => {
        const orderBrand = order.customer.brand?.toLowerCase();
        return orderBrand === filter.brand?.toLowerCase();
      });
    }

    // Filter by invoice status
    if (filter.invoiceStatus) {
      filtered = filtered.filter((order) => {
        const invoice = invoiceStatusMap[order.docCode];
        if (filter.invoiceStatus === '1') {
          return invoice && invoice.status === 1;
        } else if (filter.invoiceStatus === '0') {
          return invoice && invoice.status === 0;
        } else if (filter.invoiceStatus === 'none') {
          return !invoice;
        }
        return true;
      });
    }

    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
      const dateTo = filter.dateTo ? new Date(filter.dateTo) : null;

      if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
      if (dateTo) dateTo.setHours(23, 59, 59, 999);

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.docDate);
        orderDate.setHours(0, 0, 0, 0);

        if (dateFrom && dateTo) {
          return orderDate >= dateFrom && orderDate <= dateTo;
        } else if (dateFrom) {
          return orderDate >= dateFrom;
        } else if (dateTo) {
          return orderDate <= dateTo;
        }
        return true;
      });
    }

    // Flatten orders thành rows (mỗi sale là một row)
    const allRows: Array<{ order: Order; sale: SaleItem | null }> = [];
    filtered.forEach((order) => {
      if (order.sales && order.sales.length > 0) {
        order.sales.forEach((sale) => {
          allRows.push({ order, sale });
        });
      } else {
        allRows.push({ order, sale: null });
      }
    });

    // Apply column filters
    const filteredRows = allRows.filter((row) => {
      return selectedColumns.every((column) => {
        const filterValue = columnFilters[column];
        if (!filterValue || filterValue.trim() === '') {
          return true; // Không có filter cho cột này
        }

        const cellValue = getCellRawValue(row.order, row.sale, column);
        const searchValue = filterValue.toLowerCase().trim();
        const cellValueLower = cellValue.toLowerCase();

        // Hỗ trợ tìm kiếm số (so sánh chính xác hoặc chứa)
        if (!isNaN(Number(searchValue)) && !isNaN(Number(cellValue))) {
          return cellValue === searchValue || cellValueLower.includes(searchValue);
        }

        // Tìm kiếm text (chứa)
        return cellValueLower.includes(searchValue);
      });
    });

    // Update pagination info dựa trên số rows đã filter
    const total = filteredRows.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));

    // Pagination trên rows đã filter
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedRows = filteredRows.slice(startIndex, endIndex);

    // Chuyển rows về orders để hiển thị
    const orderMap = new Map<string, Order>();
    paginatedRows.forEach((row) => {
      if (!orderMap.has(row.order.docCode)) {
        orderMap.set(row.order.docCode, { ...row.order, sales: [] });
      }
      const order = orderMap.get(row.order.docCode)!;
      if (row.sale) {
        order.sales = order.sales || [];
        order.sales.push(row.sale);
      }
    });

    setDisplayedOrders(Array.from(orderMap.values()));

    // Reset về trang 1 nếu search query, filter hoặc column filters thay đổi
    const hasColumnFilters = Object.values(columnFilters).some(v => v && v.trim() !== '');
    if ((searchQuery || filter.brand || filter.dateFrom || filter.dateTo || hasColumnFilters) && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filter.brand, filter.dateFrom, filter.dateTo, columnFilters, allOrders, pagination.page, pagination.limit, selectedColumns]);

  // Enrich products chỉ cho displayedOrders (theo phân trang)
  useEffect(() => {
    if (displayedOrders.length === 0) {
      setEnrichedDisplayedOrders([]);
      return;
    }

    const enrichDisplayed = async () => {
      try {
        const enriched = await enrichOrdersWithProducts(displayedOrders);
        setEnrichedDisplayedOrders(enriched);
      } catch (error) {
        console.error('Error enriching orders:', error);
        setEnrichedDisplayedOrders(displayedOrders);
      }
    };

    enrichDisplayed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedOrders]);

  const toggleColumn = (field: OrderColumn) => {
    setSelectedColumns(prev => {
      const index = prev.indexOf(field);
      if (index > -1) {
        // Xóa filter của cột khi ẩn cột
        setColumnFilters((prevFilters) => {
          const newFilters = { ...prevFilters };
          delete newFilters[field];
          return newFilters;
        });
        return prev.filter(col => col !== field);
      } else {
        const allFields = Object.keys(FIELD_LABELS) as OrderColumn[];
        const fieldIndex = allFields.indexOf(field);

        let insertIndex = prev.length;
        for (let i = 0; i < prev.length; i++) {
          const currentIndex = allFields.indexOf(prev[i]);
          if (currentIndex > fieldIndex) {
            insertIndex = i;
            break;
          }
        }

        const newSelected = [...prev];
        newSelected.splice(insertIndex, 0, field);
        return newSelected;
      }
    });
  };

  // Xóa filter của các cột không còn được hiển thị
  useEffect(() => {
    setColumnFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      let hasChanges = false;

      Object.keys(newFilters).forEach((column) => {
        if (!selectedColumns.includes(column as OrderColumn)) {
          delete newFilters[column as OrderColumn];
          hasChanges = true;
        }
      });

      return hasChanges ? newFilters : prevFilters;
    });
  }, [selectedColumns]);

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
          {value ? 'Có' : 'Không'}
        </span>
      );
    }
    if (typeof value === 'number') {
      if (value % 1 !== 0) {
        return value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return value.toLocaleString('vi-VN');
    }
    return String(value);
  };

  // Hàm helper để lấy giá trị thô của cell (dùng cho filter)
  const getCellRawValue = (order: Order, sale: SaleItem | null, field: OrderColumn): string => {
    if (!sale && field !== 'docCode' && field !== 'docDate' && field !== 'customerName' && field !== 'partnerCode') {
      return '';
    }

    switch (field) {
      case 'docCode':
        return order.docCode || '';
      case 'docDate':
        return new Date(order.docDate).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      case 'partnerCode':
        return sale?.partnerCode || '';
      case 'customerName':
        return order.customer.name || '';
      case 'customerMobile':
        return order.customer.mobile || '';
      case 'customerSexual':
        return order.customer.sexual || '';
      case 'customerAddress':
        return order.customer.address || '';
      case 'customerProvince':
        return order.customer.province_name || '';
      case 'customerGrade':
        return order.customer.grade_name || '';
      case 'kyHieu':
        return sale?.department?.branchcode || sale?.branchCode || '';
      case 'description':
        return order.docCode || '';
      case 'nhanVienBan':
        return sale?.saleperson_id?.toString() || '';
      case 'tenNhanVienBan':
        return sale?.tenNhanVienBan || '';
      case 'itemCode':
        return sale?.product?.maVatTu || sale?.itemCode || '';
      case 'itemName':
        return sale?.product?.tenVatTu || sale?.itemName || '';
      case 'dvt':
        return sale?.product?.dvt || sale?.dvt || '';
      case 'loai':
        const loaiValue = sale?.loai ||
          (sale?.cat1 ? `${sale.cat1}${sale.cat2 ? ` / ${sale.cat2}` : ''}${sale.cat3 ? ` / ${sale.cat3}` : ''}` : null) ||
          (sale?.catcode1 ? `${sale.catcode1}${sale.catcode2 ? ` / ${sale.catcode2}` : ''}${sale.catcode3 ? ` / ${sale.catcode3}` : ''}` : null);
        return loaiValue || '';
      case 'promCode':
        const tienHangForPromCode = sale?.linetotal ?? sale?.tienHang;
        const qtyForPromCode = sale?.qty;
        let giaBanForPromCode: number = 0;
        if (tienHangForPromCode != null && qtyForPromCode != null && qtyForPromCode > 0) {
          giaBanForPromCode = tienHangForPromCode / qtyForPromCode;
        } else {
          giaBanForPromCode = sale?.giaBan ?? 0;
        }
        const ordertypeForPromCode = mapOrderTypeNameToCode(sale?.ordertype) || sale?.ordertype;
        if (giaBanForPromCode === 0 && ordertypeForPromCode &&
          (ordertypeForPromCode === ORDER_TYPE_NORMAL ||
            ordertypeForPromCode === ORDER_TYPE_BAN_ECOIN ||
            ordertypeForPromCode === ORDER_TYPE_SAN_TMDT)) {
          return '1';
        }
        return '';
      case 'muaHangGiamGia':
        // Sử dụng promotionDisplayCode từ backend
        return sale?.promotionDisplayCode || '';
      case 'maKho':
        // Sử dụng maKho từ backend (đã được tính sẵn)
        return sale?.maKho || '';
      case 'maLo':
        // Hiển thị ma_lo dựa trên productType từ Loyalty API (bỏ logic cũ dựa trên producttype I/B/M/V/S)
        const productTypeFromLoyalty = sale?.product?.productType;
        const productTypeUpper = productTypeFromLoyalty ? String(productTypeFromLoyalty).toUpperCase().trim() : null;
        
        // VOUC → không hiển thị ma_lo (sẽ hiển thị ở so_serial)
        // SKIN, TPCN → hiển thị ma_lo
        if (productTypeUpper === 'SKIN' || productTypeUpper === 'TPCN') {
          const serial = sale?.serial || '';
          if (serial) {
            if (productTypeUpper === 'TPCN') {
              // Nếu productType là "TPCN", cắt lấy 8 ký tự cuối
              return serial.length >= 8 ? serial.slice(-8) : serial;
            } else if (productTypeUpper === 'SKIN') {
              // Nếu productType là "SKIN", cắt lấy 4 ký tự cuối
              return serial.length >= 4 ? serial.slice(-4) : serial;
            }
          }
          return serial;
        }
        return '';
      case 'qty':
        return sale?.qty?.toString() || '';
      case 'giaBan':
        const tienHangForGiaBan = sale?.linetotal ?? sale?.tienHang;
        const qtyForGiaBan = sale?.qty;
        let giaBan: number | null = null;
        if (tienHangForGiaBan != null && qtyForGiaBan != null && qtyForGiaBan > 0) {
          giaBan = tienHangForGiaBan / qtyForGiaBan;
        } else {
          giaBan = sale?.giaBan ?? 0;
        }
        return giaBan?.toString() || '';
      case 'tienHang':
        const tienHangValue = sale?.linetotal ?? sale?.tienHang;
        return tienHangValue?.toString() || '';
      case 'revenue':
        return sale?.revenue?.toString() || '';
      case 'maNt':
        return sale?.maNt || '';
      case 'tyGia':
        return sale?.tyGia?.toString() || '';
      case 'maThue':
        return sale?.maThue || TAX_CODE;
      case 'tkNo':
        return sale?.tkNo || DEBIT_ACCOUNT;
      case 'tkDoanhThu':
        const deptTypeDoanhThu = sale?.department?.type;
        let tkDoanhThu = '';
        // So sánh không phân biệt hoa thường
        if (deptTypeDoanhThu?.toLowerCase() === 'bán lẻ') {
          tkDoanhThu = sale?.product?.tkDoanhThuBanLe || '';
        } else if (deptTypeDoanhThu?.toLowerCase() === 'bán buôn') {
          tkDoanhThu = sale?.product?.tkDoanhThuBanBuon || '';
        }
        return tkDoanhThu;
      case 'tkGiaVon':
        const deptTypeGiaVon = sale?.department?.type;
        let tkGiaVon = '';
        // So sánh không phân biệt hoa thường
        if (deptTypeGiaVon?.toLowerCase() === 'bán lẻ') {
          tkGiaVon = sale?.product?.tkGiaVonBanLe || '';
        } else if (deptTypeGiaVon?.toLowerCase() === 'bán buôn') {
          tkGiaVon = sale?.product?.tkGiaVonBanBuon || '';
        }
        return tkGiaVon;
      case 'tkChiPhiKhuyenMai':
        return sale?.tkChiPhiKhuyenMai || '';
      case 'tkThueCo':
        return sale?.tkThueCo || '';
      case 'cucThue':
        return sale?.cucThue || '';
      case 'boPhan':
        return sale?.department?.ma_bp || sale?.branchCode || '';
      case 'chietKhauMuaHangGiamGia':
        const chietKhauMuaHangGiamGia = sale?.disc_amt ?? sale?.chietKhauMuaHangGiamGia ?? 0;
        return chietKhauMuaHangGiamGia.toString();
      case 'chietKhauMuaHangCkVip':
        const gradeDiscamt = sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0;
        return gradeDiscamt.toString();
      case 'chietKhauThanhToanVoucher':
        const chietKhauThanhToanVoucher = sale?.paid_by_voucher_ecode_ecoin_bp ?? sale?.chietKhauThanhToanVoucher ?? 0;
        return chietKhauThanhToanVoucher.toString();
      case 'thanhToanVoucher':
        const voucherLabels = calculateThanhToanVoucher(sale);
        return voucherLabels || '';
      case 'soSerial':
        return sale?.serial || '';
      case 'maThe':
        // Ưu tiên mvc_serial (từ Zappy API), nếu không có thì dùng maThe
        if (sale?.mvc_serial) {
          return sale.mvc_serial;
        }
        if (sale?.serial) {
          return '';
        }
        const ordertypeForThe = mapOrderTypeNameToCode(sale?.ordertype) || sale?.ordertype;
        const branchCodeForThe = sale?.branchCode || order.customer.branch_code;
        const lineIdForThe = sale?.line_id;
        if (ordertypeForThe === ORDER_TYPE_NORMAL && branchCodeForThe && lineIdForThe) {
          return `${branchCodeForThe}/${lineIdForThe}`;
        }
        if (ordertypeForThe === ORDER_TYPE_LAM_DV) {
          return '';
        }
        return sale?.maThe || '';
      default:
        const value = sale?.[field as keyof typeof sale];
        if (value === null || value === undefined || value === '') {
          return '';
        }
        return String(value);
    }
  };

  const renderCellValue = (order: Order, sale: SaleItem | null, field: OrderColumn): React.ReactNode => {
    if (!sale && field !== 'docCode' && field !== 'docDate' && field !== 'customerName' && field !== 'partnerCode') {
      return <span className="text-gray-400 italic">-</span>;
    }

    switch (field) {
      case 'docCode':
        return (
          <div className="text-sm font-semibold text-gray-900">
            {order.docCode}
          </div>
        );
      case 'docDate':
        return (
          <div className="text-sm text-gray-900">
            {new Date(order.docDate).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </div>
        );
      case 'partnerCode':
        return <div className="text-sm text-gray-900">{sale?.partnerCode || '-'}</div>;
      case 'customerName':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
          </div>
        );
      case 'customerMobile':
        return <div className="text-sm text-gray-900">{order.customer.mobile || '-'}</div>;
      case 'customerSexual':
        return <div className="text-sm text-gray-900">{order.customer.sexual || '-'}</div>;
      case 'customerAddress':
        return <div className="text-sm text-gray-900">{order.customer.address || '-'}</div>;
      case 'customerProvince':
        return <div className="text-sm text-gray-900">{order.customer.province_name || '-'}</div>;
      case 'customerGrade':
        return <div className="text-sm text-gray-900">{order.customer.grade_name || '-'}</div>;
      case 'kyHieu':
        // Lấy branchcode từ department API (mã chi nhánh), nếu không có thì fallback về branchCode
        return <div className="text-sm text-gray-900">{sale?.department?.branchcode || sale?.branchCode || '-'}</div>;
      case 'description':
        return <div className="text-sm text-gray-900">{order.docCode || '-'}</div>;
      case 'nhanVienBan':
        // Ưu tiên saleperson_id hoặc crm_emp_id, nếu không có thì dùng nhanVienBan
        const nhanVienBanValue = sale?.saleperson_id?.toString();
        return <div className="text-sm text-gray-900">{nhanVienBanValue || '-'}</div>;
      case 'tenNhanVienBan':
        return <div className="text-sm text-gray-900">{sale?.tenNhanVienBan || '-'}</div>;
      case 'itemCode':
        // Ưu tiên lấy từ product (đã được enrich), nếu không có thì lấy từ sale
        const itemCode = sale?.product?.maVatTu || sale?.itemCode || '-';
        return (
          <div className="max-w-[120px]">
            <div className="text-sm font-semibold text-gray-900 truncate" title={itemCode}>
              {itemCode}
            </div>
          </div>
        );
      case 'itemName':
        // Ưu tiên lấy từ product (đã được enrich), nếu không có thì lấy từ sale
        // Nếu không có giá trị thì ẩn đi (không hiển thị gì)
        const itemName = sale?.product?.tenVatTu || sale?.itemName;
        if (!itemName) {
          return null;
        }
        return <div className="text-sm text-gray-900">{itemName}</div>;
      case 'dvt':
        // Ưu tiên lấy từ product (đã được enrich), nếu không có thì lấy từ sale
        return <div className="text-sm text-gray-900">{sale?.product?.dvt || sale?.dvt || '-'}</div>;
      case 'loai':
        // Map từ cat1, cat2, cat3 hoặc catcode1, catcode2, catcode3
        const loaiValue = sale?.loai ||
          (sale?.cat1 ? `${sale.cat1}${sale.cat2 ? ` / ${sale.cat2}` : ''}${sale.cat3 ? ` / ${sale.cat3}` : ''}` : null) ||
          (sale?.catcode1 ? `${sale.catcode1}${sale.catcode2 ? ` / ${sale.catcode2}` : ''}${sale.catcode3 ? ` / ${sale.catcode3}` : ''}` : null);
        return <div className="text-sm text-gray-900">{loaiValue || '-'}</div>;
      case 'promCode':
        // Tính giá bán
        const tienHangForPromCode = sale?.linetotal ?? sale?.tienHang;
        const qtyForPromCode = sale?.qty;
        let giaBanForPromCode: number = 0;
        if (tienHangForPromCode != null && qtyForPromCode != null && qtyForPromCode > 0) {
          giaBanForPromCode = tienHangForPromCode / qtyForPromCode;
        } else {
          giaBanForPromCode = sale?.giaBan ?? 0;
        }

        // Nếu giá bán = 0 và ordertype là NORMAL, BAN_ECOIN, hoặc SAN_TMDT thì hiển thị "1"
        // Ngược lại bỏ trống
        const ordertypeForPromCode = mapOrderTypeNameToCode(sale?.ordertype) || sale?.ordertype;
        if (giaBanForPromCode === 0 && ordertypeForPromCode &&
          (ordertypeForPromCode === ORDER_TYPE_NORMAL ||
            ordertypeForPromCode === ORDER_TYPE_BAN_ECOIN ||
            ordertypeForPromCode === ORDER_TYPE_SAN_TMDT)) {
          return <div className="text-sm text-gray-900">1</div>;
        }

        // Ngược lại bỏ trống
        return <div className="text-sm text-gray-900">-</div>;
      case 'muaHangGiamGia':
        // Sử dụng promotionDisplayCode từ backend
        const displayCode = sale?.promotionDisplayCode;
        if (!displayCode) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-900">{displayCode}</div>;
      case 'maKho':
        // Sử dụng maKho từ backend (đã được tính sẵn)
        return <div className="text-sm text-gray-900">{sale?.maKho || '-'}</div>;
      case 'maLo':
        // Hiển thị ma_lo dựa trên productType từ Loyalty API (bỏ logic cũ dựa trên producttype I/B/M/V/S)
        const productTypeFromLoyaltyRender = sale?.product?.productType;
        const productTypeUpperRender = productTypeFromLoyaltyRender ? String(productTypeFromLoyaltyRender).toUpperCase().trim() : null;
        
        // VOUC → không hiển thị ma_lo (sẽ hiển thị ở so_serial)
        // SKIN, TPCN → hiển thị ma_lo
        if (productTypeUpperRender === 'SKIN' || productTypeUpperRender === 'TPCN') {
          const serial = sale?.serial || '';
          let maLo = serial;
          if (serial) {
            if (productTypeUpperRender === 'TPCN') {
              // Nếu productType là "TPCN", cắt lấy 8 ký tự cuối
              maLo = serial.length >= 8 ? serial.slice(-8) : serial;
            } else if (productTypeUpperRender === 'SKIN') {
              // Nếu productType là "SKIN", cắt lấy 4 ký tự cuối
              maLo = serial.length >= 4 ? serial.slice(-4) : serial;
            }
          }
          return <div className="text-sm text-gray-900">{maLo || '-'}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'qty':
        return <div className="text-sm text-gray-900">{formatValue(sale?.qty)}</div>;
      case 'giaBan':
        // Giá bán = tiền hàng (linetotal hoặc tienHang) / số lượng (qty)
        const tienHangForGiaBan = sale?.linetotal ?? sale?.tienHang;
        const qtyForGiaBan = sale?.qty;

        let giaBan: number | null = null;
        if (tienHangForGiaBan != null && qtyForGiaBan != null && qtyForGiaBan > 0) {
          giaBan = tienHangForGiaBan / qtyForGiaBan;
        } else {
          // Nếu không tính được thì dùng giá trị gốc, mặc định là 0
          giaBan = sale?.giaBan ?? 0;
        }

        return <div className="text-sm text-gray-900">{formatValue(giaBan)}</div>;
      case 'tienHang':
        // Ưu tiên linetotal (thành tiền của dòng), nếu không có thì dùng tienHang
        const tienHangValue = sale?.linetotal ?? sale?.tienHang;
        return <div className="text-sm text-gray-900">{formatValue(tienHangValue)}</div>;
      case 'revenue':
        return <div className="text-sm text-gray-900">{formatValue(sale?.revenue)}</div>;
      case 'maNt':
        return <div className="text-sm text-gray-900">{sale?.maNt || '-'}</div>;
      case 'tyGia':
        return <div className="text-sm text-gray-900">{formatValue(sale?.tyGia)}</div>;
      case 'maThue':
        return <div className="text-sm text-gray-900">{sale?.maThue || TAX_CODE}</div>;
      case 'tkNo':
        return <div className="text-sm text-gray-900">{sale?.tkNo || DEBIT_ACCOUNT}</div>;
      case 'tkDoanhThu':
        // Nếu department.type = "bán lẻ" → hiển thị retailRevenueAccount (tkDoanhThuBanLe)
        // Nếu department.type = "bán buôn" → hiển thị wholesaleRevenueAccount (tkDoanhThuBanBuon)
        const deptTypeDoanhThu = sale?.department?.type;
        let tkDoanhThu = '-';
        // So sánh không phân biệt hoa thường
        if (deptTypeDoanhThu?.toLowerCase() === 'bán lẻ') {
          tkDoanhThu = sale?.product?.tkDoanhThuBanLe || '-';
        } else if (deptTypeDoanhThu?.toLowerCase() === 'bán buôn') {
          tkDoanhThu = sale?.product?.tkDoanhThuBanBuon || '-';
        }
        return <div className="text-sm text-gray-900">{tkDoanhThu}</div>;
      case 'tkGiaVon':
        // Nếu department.type = "bán lẻ" → hiển thị retailCostAccount (tkGiaVonBanLe)
        // Nếu department.type = "bán buôn" → hiển thị wholesaleCostAccount (tkGiaVonBanBuon)
        const deptTypeGiaVon = sale?.department?.type;
        let tkGiaVon = '-';
        // So sánh không phân biệt hoa thường
        if (deptTypeGiaVon?.toLowerCase() === 'bán lẻ') {
          tkGiaVon = sale?.product?.tkGiaVonBanLe || '-';
        } else if (deptTypeGiaVon?.toLowerCase() === 'bán buôn') {
          tkGiaVon = sale?.product?.tkGiaVonBanBuon || '-';
        }
        return <div className="text-sm text-gray-900">{tkGiaVon}</div>;
      case 'tkChiPhiKhuyenMai':
        return <div className="text-sm text-gray-900">{sale?.tkChiPhiKhuyenMai || '-'}</div>;
      case 'tkThueCo':
        return <div className="text-sm text-gray-900">{sale?.tkThueCo || '-'}</div>;
      case 'cucThue':
        return <div className="text-sm text-gray-900">{sale?.cucThue || '-'}</div>;
      case 'tkVatTu':
        return <div className="text-sm text-gray-900">-</div>;
      case 'suaTkVatTu':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkGiaVonBanBuon':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkDoanhThuBanBuon':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkDoanhThuNoiBo':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkHangBanTraLai':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkDaiLy':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkSanPhamDoDang':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkChenhLechGiaVon':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkChietKhau':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkChiPhiKhuyenMaiProduct':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkGiaVonBanLe':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkDoanhThuBanLe':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkChiPhiKhauHaoCCDC':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkChiPhiKhauHaoTSDC':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkDoanhThuHangNo':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkGiaVonHangNo':
        return <div className="text-sm text-gray-900">-</div>;
      case 'tkVatTuHangNo':
        return <div className="text-sm text-gray-900">-</div>;
      case 'boPhan':
        // Lấy ma_bp từ department API (mã bộ phận), nếu không có thì fallback về branchCode
        return <div className="text-sm text-gray-900">{sale?.department?.ma_bp || sale?.branchCode || '-'}</div>;
      case 'chietKhauMuaHangGiamGia':
     
        const other_discamt = sale?.other_discamt ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(other_discamt)}</div>;
      case 'chietKhauMuaHangCkVip':
        // Lấy giá trị từ grade_discamt trong đơn hàng
        const gradeDiscamt = sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(gradeDiscamt)}</div>;
      case 'chietKhauThanhToanVoucher':
        // Map từ paid_by_voucher_ecode_ecoin_bp (tổng tiền thanh toán bằng voucher/ecode/ecoin/BP), nếu không có thì dùng chietKhauThanhToanVoucher, mặc định là 0
        const chietKhauThanhToanVoucher = sale?.paid_by_voucher_ecode_ecoin_bp ?? sale?.chietKhauThanhToanVoucher ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(chietKhauThanhToanVoucher)}</div>;
      case 'thanhToanVoucher':
        const voucherLabels = calculateThanhToanVoucher(sale);
        if (!voucherLabels) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-900">{voucherLabels}</div>;
      case 'soSerial':
        // Hiển thị so_serial nếu producttype là V, S
        const producttypeForSoSerial = sale?.producttype || sale?.product?.producttype;
        if (producttypeForSoSerial === 'V' || producttypeForSoSerial === 'S') {
          return <div className="text-sm text-gray-900">{sale?.serial || '-'}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'maThe':
        // Ưu tiên mvc_serial (từ Zappy API)
          return <div className="text-sm text-gray-900">{sale?.maThe ?? '-'}</div>;
      default:
        // Xử lý các trường còn lại
        const value = sale?.[field as keyof typeof sale];
        return <div className="text-sm text-gray-900">{formatValue(value)}</div>;
    }
  };

  // Hàm xử lý double click - gọi backend API để tạo hóa đơn
  const handleRowDoubleClick = async (order: Order, sale: SaleItem | null) => {
    if (!sale) {
      showToast('error', 'Không có dữ liệu bán hàng cho dòng này');
      return;
    }

    if (submittingInvoice) {
      return;
    }

    try {
      setSubmittingInvoice(true);

      // Gọi backend API để tạo hóa đơn với forceRetry = true để cho phép retry nếu đã tồn tại
      const response = await salesApi.createInvoiceViaFastApi(order.docCode, true);
      const result = response.data;

      // Nếu đã tồn tại (alreadyExists = true), vẫn coi như thành công
      if (result.alreadyExists) {
        showToast('info', result.message || 'Đơn hàng đã được tạo hóa đơn trước đó');
        return;
      }

      // Check success flag và status trong result (status === 0 là lỗi)
      const hasError = Array.isArray(result.result) 
        ? result.result.some((item: any) => item.status === 0)
        : (result.result?.status === 0);

      if (result.success && !hasError) {
        showToast('success', result.message || 'Tạo hóa đơn thành công');
        // Reload invoice statuses sau khi tạo thành công
        await loadInvoiceStatuses();
        await loadInvoiceStatistics();
      } else {
        // Xử lý lỗi chi tiết hơn
        let errorMessage = result.message || 'Tạo hóa đơn thất bại';
        
        if (Array.isArray(result.result) && result.result.length > 0) {
          const firstError = result.result[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (result.result?.message) {
          errorMessage = result.result.message;
        }
        
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error handling row double click:', error);
      // Xử lý lỗi từ response hoặc error object
      let errorMessage = 'Lỗi không xác định';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast('error', `Lỗi: ${errorMessage}`);
    } finally {
      setSubmittingInvoice(false);
      // Reload invoice statuses sau khi xử lý xong
      await loadInvoiceStatuses();
      await loadInvoiceStatistics();
    }
  };

  // Hàm retry invoice (giống như trong fast-api-invoices page)
  const handleRetryInvoice = async (docCode: string) => {
    try {
      setRetrying((prev) => ({ ...prev, [docCode]: true }));
      const response = await salesApi.createInvoiceViaFastApi(docCode, true);
      const data = response.data;

      if (data.alreadyExists) {
        showToast('info', data.message || `Đơn hàng ${docCode} đã được tạo hóa đơn trước đó`);
        await loadInvoiceStatuses();
        await loadInvoiceStatistics();
        return;
      }

      let hasError = false;
      if (Array.isArray(data.result) && data.result.length > 0) {
        hasError = data.result.some((item: any) => item.status === 0);
      } else if (data.result && typeof data.result === 'object') {
        hasError = data.result.status === 0;
      }

      if (data.success && !hasError) {
        showToast('success', data.message || `Đồng bộ lại ${docCode} thành công`);
        await loadInvoiceStatuses();
        await loadInvoiceStatistics();
      } else {
        let errorMessage = data.message || `Đồng bộ lại ${docCode} thất bại`;
        
        if (Array.isArray(data.result) && data.result.length > 0) {
          const firstError = data.result[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (data.result?.message) {
          errorMessage = data.result.message;
        }
        
        showToast('error', errorMessage);
        await loadInvoiceStatuses();
        await loadInvoiceStatistics();
      }
    } catch (error: any) {
      console.error('Error retrying invoice:', error);
      let errorMessage = `Lỗi khi đồng bộ lại ${docCode}`;
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast('error', errorMessage);
      await loadInvoiceStatuses();
      await loadInvoiceStatistics();
    } finally {
      setRetrying((prev) => ({ ...prev, [docCode]: false }));
    }
  };

  const flattenedRows: Array<{ order: Order; sale: SaleItem | null }> = [];
  enrichedDisplayedOrders.forEach((order) => {
    if (order.sales && order.sales.length > 0) {
      order.sales.forEach((sale) => {
        flattenedRows.push({ order, sale });
      });
    } else {
      flattenedRows.push({ order, sale: null });
    }
  });

  const filteredColumns = Object.entries(FIELD_LABELS).filter(([key]) =>
    columnSearchQuery.trim() === '' ||
    FIELD_LABELS[key as OrderColumn].toLowerCase().includes(columnSearchQuery.toLowerCase()) ||
    key.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sync from Zappy */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={syncDateInput}
                    onChange={(e) => setSyncDateInput(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={syncing}
                  />
                  <button
                    onClick={handleSyncFromZappy}
                    disabled={syncing || !syncDateInput}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Đồng bộ dữ liệu từ Zappy"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang đồng bộ...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Đồng bộ từ Zappy
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setColumnFilters({} as Record<OrderColumn, string>);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                  title="Xóa tất cả bộ lọc cột"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Chọn cột hiển thị
                </button>
              </div>
            </div>

            {/* Column Selector */}
            {showColumnSelector && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Chọn cột hiển thị</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns([...MAIN_COLUMNS])}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Mặc định
                    </button>
                    <button
                      onClick={() => {
                        const allFields = Object.keys(FIELD_LABELS) as OrderColumn[];
                        setSelectedColumns(allFields);
                      }}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>
                {/* Search input for columns */}
                <div className="mb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm cột..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {filteredColumns.map(([key, label]) => {
                    const isSelected = selectedColumns.includes(key as OrderColumn);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleColumn(key as OrderColumn)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filter.brand || ''}
                onChange={(e) => setFilter({ ...filter, brand: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả nhãn hàng</option>
                <option value="chando">Chando</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
              <select
                value={filter.invoiceStatus || ''}
                onChange={(e) => setFilter({ ...filter, invoiceStatus: e.target.value || undefined })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Tất cả trạng thái invoice</option>
                <option value="1">Invoice thành công</option>
                <option value="0">Invoice thất bại</option>
                <option value="none">Chưa tạo invoice</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Từ ngày:</label>
                <input
                  type="date"
                  value={filter.dateFrom || ''}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Đến ngày:</label>
                <input
                  type="date"
                  value={filter.dateTo || ''}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {selectedColumns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {FIELD_LABELS[column]}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {selectedColumns.map((column) => (
                      <th
                        key={`filter-${column}`}
                        className="px-4 py-2"
                      >
                        <input
                          type="text"
                          placeholder={`Lọc ${FIELD_LABELS[column]}`}
                          value={columnFilters[column] || ''}
                          onChange={(e) => {
                            setColumnFilters((prev) => ({
                              ...prev,
                              [column]: e.target.value,
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedRows.length === 0 ? (
                    <tr>
                      <td colSpan={selectedColumns.length} className="px-4 py-8 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    flattenedRows.map((row, index) => {
                      const rowKey = `${row.order.docCode}-${row.sale?.id || index}`;
                      const isSelected = selectedRowKey === rowKey;
                      return (
                        <tr
                          key={rowKey}
                          onDoubleClick={() => {
                            setSelectedRowKey(isSelected ? null : rowKey);
                            handleRowDoubleClick(row.order, row.sale);
                          }}
                          className={`transition-colors cursor-pointer ${isSelected
                              ? 'bg-blue-100 hover:bg-blue-200'
                              : 'hover:bg-gray-50'
                            } ${submittingInvoice ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {selectedColumns.map((column) => (
                            <td key={column} className="px-4 py-3 whitespace-nowrap">
                              {renderCellValue(row.order, row.sale, column)}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-700">bản ghi/trang</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{pagination.total}</span> bản ghi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <span className="text-sm text-gray-700 font-medium">
                    Trang {pagination.page}/{pagination.totalPages || 1}
                  </span>

                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
