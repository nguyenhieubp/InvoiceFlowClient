'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { TAX_CODE, DEBIT_ACCOUNT } from '@/lib/constants/accounting.constants';
import { ORDER_TYPE_NORMAL, ORDER_TYPE_LAM_DV, ORDER_TYPE_BAN_ECOIN, ORDER_TYPE_SAN_TMDT } from '@/lib/constants/order-type.constants';
import { calculateThanhToanVoucher } from '@/lib/utils/voucher.utils';
import { Order, SaleItem } from '@/types/order.types';
import { OrderColumn, FIELD_LABELS, MAIN_COLUMNS } from '@/lib/constants/order-columns.constants';
import { calculateMaKho } from '@/lib/utils/order.utils';
import { useLoyaltyAPI } from '@/hooks/useLoyaltyAPI';
import { enrichOrdersWithProducts } from '@/lib/utils/order-enrichment.utils';


export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]); 
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ brand?: string; dateFrom?: string; dateTo?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<OrderColumn[]>([...MAIN_COLUMNS]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  // Hook để quản lý Loyalty API calls (product, promotion, department)
  const {
    productCache,
    promotionCache,
    departmentCache,
    loadingProducts,
    loadingPromotions,
    loadingDepartments,
    loadProductsForOrders,
    loadPromotionsForOrders,
    loadDepartmentsForOrders,
  } = useLoyaltyAPI();

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
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
      const ordersData = response.data.data || [];

      setRawOrders(ordersData);

      // Load products, promotions, departments từ Loyalty API
      await Promise.all([
        loadProductsForOrders(ordersData),
        loadPromotionsForOrders(ordersData),
        loadDepartmentsForOrders(ordersData),
      ]);

      // Enrich sẽ được thực hiện trong useEffect khi cache được cập nhật
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
  }, [filter.brand]);

  // Cập nhật orders khi productCache, promotionCache hoặc departmentCache thay đổi
  useEffect(() => {
    if (rawOrders.length > 0) {
      const enrichedOrders = enrichOrdersWithProducts(
        rawOrders,
        productCache,
        promotionCache,
        departmentCache
      );
      setAllOrders(enrichedOrders);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCache, promotionCache, departmentCache, rawOrders]);

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

    // Update pagination info dựa trên số rows
    const total = allRows.length;
    const totalPages = Math.ceil(total / pagination.limit);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));

    // Pagination trên rows
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedRows = allRows.slice(startIndex, endIndex);

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

    // Reset về trang 1 nếu search query hoặc filter thay đổi
    if ((searchQuery || filter.dateFrom || filter.dateTo) && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filter.dateFrom, filter.dateTo, allOrders, pagination.page, pagination.limit]);

  const toggleColumn = (field: OrderColumn) => {
    setSelectedColumns(prev => {
      const index = prev.indexOf(field);
      if (index > -1) {
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
        // Ưu tiên lấy maVatTu từ product (từ API response), nếu không có mới lấy từ sale.itemCode
        const itemCode = sale?.product?.maVatTu;
        return (
          <div className="max-w-[120px]">
            <div className="text-sm font-semibold text-gray-900 truncate" title={itemCode}>
              {itemCode}
            </div>
          </div>
        );
      case 'itemName':
        return <div className="text-sm text-gray-900">{sale?.product?.tenVatTu || '-'}</div>;
      case 'dvt':
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
        const ordertypeForPromCode = sale?.ordertype;
        if (giaBanForPromCode === 0 && ordertypeForPromCode && 
            (ordertypeForPromCode === ORDER_TYPE_NORMAL || 
             ordertypeForPromCode === ORDER_TYPE_BAN_ECOIN || 
             ordertypeForPromCode === ORDER_TYPE_SAN_TMDT)) {
          return <div className="text-sm text-gray-900">1</div>;
        }

        // Ngược lại bỏ trống
        return <div className="text-sm text-gray-900">-</div>;
      case 'muaHangGiamGia':
        // Lấy code từ promotion API response
        const promotionCode = sale?.promotion?.code;
        if (!promotionCode) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-900">{promotionCode}</div>;
      case 'maKho':
        // Lấy ma_bp từ department (bộ phận) thay vì branchCode
        const maBpForMaKho = sale?.department?.ma_bp;
        const calculatedMaKho = sale?.ordertype && maBpForMaKho
          ? calculateMaKho(sale.ordertype, maBpForMaKho)
          : null;
        return <div className="text-sm text-gray-900">{calculatedMaKho || '-'}</div>;
      case 'maLo':
        // Mã lô là giá trị serial từ sales
        return <div className="text-sm text-gray-900">{sale?.serial || '-'}</div>;
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
        // Lấy type từ department để quyết định dùng bán lẻ hay bán buôn
        const deptTypeDoanhThu = sale?.department?.type;
        const tkDoanhThu = deptTypeDoanhThu === 'Bán lẻ'
          ? (sale?.product?.tkDoanhThuBanLe || '-')
          : deptTypeDoanhThu === 'Bán buôn'
            ? (sale?.product?.tkDoanhThuBanBuon || '-')
            : '-';
        return <div className="text-sm text-gray-900">{tkDoanhThu}</div>;
      case 'tkGiaVon':
        // Lấy type từ department để quyết định dùng bán lẻ hay bán buôn
        const deptTypeGiaVon = sale?.department?.type;
        const tkGiaVon = deptTypeGiaVon === 'Bán lẻ'
          ? (sale?.product?.tkGiaVonBanLe || '-')
          : deptTypeGiaVon === 'Bán buôn'
            ? (sale?.product?.tkGiaVonBanBuon || '-')
            : '-';
        return <div className="text-sm text-gray-900">{tkGiaVon}</div>;
      case 'tkChiPhiKhuyenMai':
        return <div className="text-sm text-gray-900">{sale?.tkChiPhiKhuyenMai || '-'}</div>;
      case 'tkThueCo':
        return <div className="text-sm text-gray-900">{sale?.tkThueCo || '-'}</div>;
      case 'cucThue':
        return <div className="text-sm text-gray-900">{sale?.cucThue || '-'}</div>;
      case 'tkVatTu':
        return <div className="text-sm text-gray-900">{sale?.product?.tkVatTu || '-'}</div>;
      case 'suaTkVatTu':
        return formatValue(sale?.product?.suaTkVatTu);
      case 'tkGiaVonBanBuon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonBanBuon || '-'}</div>;
      case 'tkDoanhThuBanBuon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuBanBuon || '-'}</div>;
      case 'tkDoanhThuNoiBo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuNoiBo || '-'}</div>;
      case 'tkHangBanTraLai':
        return <div className="text-sm text-gray-900">{sale?.product?.tkHangBanTraLai || '-'}</div>;
      case 'tkDaiLy':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDaiLy || '-'}</div>;
      case 'tkSanPhamDoDang':
        return <div className="text-sm text-gray-900">{sale?.product?.tkSanPhamDoDang || '-'}</div>;
      case 'tkChenhLechGiaVon':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChenhLechGiaVon || '-'}</div>;
      case 'tkChietKhau':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChietKhau || '-'}</div>;
      case 'tkChiPhiKhuyenMaiProduct':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhuyenMai || '-'}</div>;
      case 'tkGiaVonBanLe':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonBanLe || '-'}</div>;
      case 'tkDoanhThuBanLe':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuBanLe || '-'}</div>;
      case 'tkChiPhiKhauHaoCCDC':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhauHaoCCDC || '-'}</div>;
      case 'tkChiPhiKhauHaoTSDC':
        return <div className="text-sm text-gray-900">{sale?.product?.tkChiPhiKhauHaoTSDC || '-'}</div>;
      case 'tkDoanhThuHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkDoanhThuHangNo || '-'}</div>;
      case 'tkGiaVonHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkGiaVonHangNo || '-'}</div>;
      case 'tkVatTuHangNo':
        return <div className="text-sm text-gray-900">{sale?.product?.tkVatTuHangNo || '-'}</div>;
      case 'boPhan':
        // Lấy ma_bp từ department API (mã bộ phận), nếu không có thì fallback về branchCode

        return <div className="text-sm text-gray-900">{sale?.department?.ma_bp || sale?.branchCode || '-'}</div>;
      case 'chietKhauMuaHangGiamGia':
        // Map từ disc_amt (số tiền giảm giá), nếu không có thì dùng chietKhauMuaHangGiamGia, mặc định là 0
        const chietKhauMuaHangGiamGia = sale?.disc_amt ?? sale?.chietKhauMuaHangGiamGia ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(chietKhauMuaHangGiamGia)}</div>;
      case 'chietKhauMuaHangCkVip':
        // Nếu không có giá trị thì hiển thị 0
        const chietKhauMuaHangCkVip = sale?.chietKhauMuaHangCkVip ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(chietKhauMuaHangCkVip)}</div>;
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
      case 'maThe':
        // Nếu có mã lô (serial) → Bỏ trống
        if (sale?.serial) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }

        // Nếu ordertype = "NORMAL" → Mã thẻ = branch_code/line_id
        // Nếu ordertype = "LAM_DV" → Bỏ trống
        const ordertypeForThe = sale?.ordertype;
        const branchCodeForThe = sale?.branchCode || order.customer.branch_code;
        const lineIdForThe = sale?.line_id;

        if (ordertypeForThe === ORDER_TYPE_NORMAL && branchCodeForThe && lineIdForThe) {
          return <div className="text-sm text-gray-900">{branchCodeForThe}/{lineIdForThe}</div>;
        }

        if (ordertypeForThe === ORDER_TYPE_LAM_DV) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }

        // Các trường hợp khác: hiển thị giá trị gốc hoặc "-"
        return <div className="text-sm text-gray-900">{sale?.maThe || '-'}</div>;
      default:
        // Xử lý các trường còn lại
        const value = sale?.[field as keyof typeof sale];
        return <div className="text-sm text-gray-900">{formatValue(value)}</div>;
    }
  };

  // Flatten displayedOrders thành rows (mỗi sale là một row)
  const flattenedRows: Array<{ order: Order; sale: SaleItem | null }> = [];
  displayedOrders.forEach((order) => {
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
              <div className="flex items-center gap-2">
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
        ) : flattenedRows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              Không có dữ liệu
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
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedRows.map((row, index) => {
                    const rowKey = `${row.order.docCode}-${row.sale?.id || index}`;
                    const isSelected = selectedRowKey === rowKey;
                    return (
                      <tr
                        key={rowKey}
                        onDoubleClick={() => setSelectedRowKey(isSelected ? null : rowKey)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 hover:bg-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {selectedColumns.map((column) => (
                          <td key={column} className="px-4 py-3 whitespace-nowrap">
                            {renderCellValue(row.order, row.sale, column)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
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
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
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
