'use client';

import { useEffect, useState, useMemo } from 'react';
import { fastApiInvoicesApi, salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { Order, SaleItem } from '@/types/order.types';
import { normalizeOrderData } from '@/lib/utils/order-mapper.utils';
import { TAX_CODE, DEBIT_ACCOUNT } from '@/lib/constants/accounting.constants';
import { mapOrderTypeNameToCode, ORDER_TYPE_NORMAL, ORDER_TYPE_LAM_DV } from '@/lib/constants/order-type.constants';
import { calculateMaKho, calculateMaLo } from '@/lib/utils/order.utils';
import { calculateThanhToanVoucher } from '@/lib/utils/voucher.utils';

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

interface InvoiceRow {
  invoice: FastApiInvoice;
  order: Order | null;
  sale: SaleItem | null;
}

export default function FastApiInvoicesPage() {
  const [invoices, setInvoices] = useState<FastApiInvoice[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FastApiInvoice | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    status: '',
    docCode: '',
    maKh: '',
    tenKh: '',
    maDvcs: '',
    startDate: '',
    endDate: '',
  });
  const [statistics, setStatistics] = useState<{
    total: number;
    success: number;
    failed: number;
    successRate: string;
  } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Load order detail for modal
  const loadOrderDetail = async (invoice: FastApiInvoice) => {
    try {
      setLoadingDetail(true);
      setSelectedInvoice(invoice);
      
      // Check if order is already loaded
      if (ordersMap[invoice.docCode]) {
        setSelectedOrder(ordersMap[invoice.docCode]);
        setShowDetailModal(true);
        setLoadingDetail(false);
        return;
      }

      // Load order data
      const response = await salesApi.getByOrderCode(invoice.docCode);
      const orderData = response.data;
      if (orderData) {
        const normalized = normalizeOrderData([orderData]);
        if (normalized.length > 0) {
          const order = normalized[0];
          setOrdersMap((prev) => ({ ...prev, [invoice.docCode]: order }));
          setSelectedOrder(order);
        }
      }
      
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading order detail:', error);
      showToast('error', 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Flatten selected order into rows for modal
  const detailRows = useMemo<InvoiceRow[]>(() => {
    if (!selectedInvoice || !selectedOrder) return [];
    
    const rows: InvoiceRow[] = [];
    
    if (selectedOrder.sales && selectedOrder.sales.length > 0) {
      selectedOrder.sales.forEach((sale) => {
        rows.push({ invoice: selectedInvoice, order: selectedOrder, sale });
      });
    } else {
      rows.push({ invoice: selectedInvoice, order: selectedOrder, sale: null });
    }

    return rows;
  }, [selectedInvoice, selectedOrder]);

  const handleRetry = async (docCode: string) => {
    try {
      setRetrying((prev) => ({ ...prev, [docCode]: true }));
      const response = await salesApi.createInvoiceViaFastApi(docCode, true);
      const data = response.data;

      console.log('[Retry] Response data:', data);

      if (data.alreadyExists) {
        showToast('info', data.message || `Đơn hàng ${docCode} đã được tạo hóa đơn trước đó`);
        await loadInvoices();
        await loadStatistics();
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
        await loadInvoices();
        await loadStatistics();
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
        await loadInvoices();
        await loadStatistics();
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
    } finally {
      setRetrying((prev) => ({ ...prev, [docCode]: false }));
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = parseInt(filters.status);
      if (filters.docCode) params.docCode = filters.docCode;
      if (filters.maKh) params.maKh = filters.maKh;
      if (filters.tenKh) params.tenKh = filters.tenKh;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await fastApiInvoicesApi.getAll(params);
      const data = response.data;

      const invoiceList = data.items || [];
      setInvoices(invoiceList);
      setPagination({
        ...pagination,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        hasNext: data.pagination?.hasNext || false,
        hasPrev: data.pagination?.hasPrev || false,
      });
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      showToast('error', error?.response?.data?.message || 'Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;

      const response = await fastApiInvoicesApi.getStatistics(params);
      setStatistics(response.data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, [pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    loadInvoices();
    loadStatistics();
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      docCode: '',
      maKh: '',
      tenKh: '',
      maDvcs: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Thành công
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Thất bại
        </span>
      );
    }
  };

  // Format value function giống như orders page
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toLocaleString('vi-VN');
      }
      return value.toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  };

  // Helper function to get cell value
  const getCellValue = (row: InvoiceRow, field: string): string | number => {
    const { invoice, order, sale } = row;

    switch (field) {
      case 'docCode':
        return invoice.docCode;
      case 'maKh':
        return invoice.maKh || order?.customer?.code || '';
      case 'tenKh':
        return invoice.tenKh || order?.customer?.name || '';
      case 'maDvcs':
        return invoice.maDvcs || '';
      case 'ngayCt':
        return invoice.ngayCt || order?.docDate || '';
      case 'status':
        return invoice.status;
      case 'message':
        return invoice.message || '';
      case 'maHang':
        return sale?.product?.maVatTu || sale?.itemCode || '';
      case 'tenMatHang':
        return sale?.product?.tenVatTu || sale?.itemName || '';
      case 'dvt':
        return sale?.product?.dvt || sale?.dvt || '';
      case 'loaiGiaoDich':
        return mapOrderTypeNameToCode(sale?.ordertype) || sale?.ordertype || '';
      case 'soSerial':
        return sale?.serial || '';
      case 'loai':
        const loaiValue = sale?.loai ||
          (sale?.cat1 ? `${sale.cat1}${sale.cat2 ? ` / ${sale.cat2}` : ''}${sale.cat3 ? ` / ${sale.cat3}` : ''}` : null) ||
          (sale?.catcode1 ? `${sale.catcode1}${sale.catcode2 ? ` / ${sale.catcode2}` : ''}${sale.catcode3 ? ` / ${sale.catcode3}` : ''}` : null);
        return loaiValue || '';
      case 'khuyenMai':
        return sale?.promCode ? 1 : 0;
      case 'maCtkmTangHang':
        return sale?.maCtkmTangHang || '';
      case 'maKho':
        const maBpForMaKho = sale?.department?.ma_bp;
        const calculatedMaKho = sale?.ordertype && maBpForMaKho
          ? calculateMaKho(sale.ordertype, maBpForMaKho)
          : null;
        return calculatedMaKho || sale?.maKho || '';
      case 'maLo':
        const maLo = calculateMaLo(sale?.serial, sale?.catcode1, sale?.catcode2);
        return maLo || sale?.maLo || '';
      case 'ton':
        return ''; // Tồn - không có trong data
      case 'soLuong':
        return sale?.qty || 0;
      case 'soLuongHangNo':
        return ''; // Số lượng hàng nợ - không có trong data
      case 'giaBan':
        const tienHangForGiaBan = sale?.linetotal ?? sale?.tienHang;
        const qtyForGiaBan = sale?.qty;
        if (tienHangForGiaBan != null && qtyForGiaBan != null && qtyForGiaBan > 0) {
          return tienHangForGiaBan / qtyForGiaBan;
        }
        return sale?.giaBan || 0;
      case 'tienHang':
        return sale?.linetotal ?? sale?.tienHang ?? 0;
      case 'tkDoanhThu':
        const deptTypeDoanhThu = sale?.department?.type;
        if (deptTypeDoanhThu?.toLowerCase() === 'bán lẻ') {
          return sale?.product?.tkDoanhThuBanLe || '';
        } else if (deptTypeDoanhThu?.toLowerCase() === 'bán buôn') {
          return sale?.product?.tkDoanhThuBanBuon || '';
        }
        return '';
      case 'giaDichDanh':
        return ''; // Giá đích danh - không có trong data
      case 'giaVon':
        return sale?.itemcost || 0;
      case 'tienVon':
        return sale?.totalcost || 0;
      case 'tkKho':
        return sale?.product?.tkVatTu || '';
      case 'tkGiaVon':
        const deptTypeGiaVon = sale?.department?.type;
        if (deptTypeGiaVon?.toLowerCase() === 'bán lẻ') {
          return sale?.product?.tkGiaVonBanLe || '';
        } else if (deptTypeGiaVon?.toLowerCase() === 'bán buôn') {
          return sale?.product?.tkGiaVonBanBuon || '';
        }
        return '';
      case 'tkChiPhiKhuyenMai':
        return sale?.tkChiPhiKhuyenMai || sale?.promotion?.taiKhoanChiPhiKhuyenMai || '';
      case 'donHang':
        return invoice.docCode;
      case 'dong':
        return sale?.line_id || '';
      case 'phieuXuat':
        return ''; // Phiếu xuất - không có trong data
      case 'dongPhieuXuat':
        return ''; // Dòng phiếu xuất - không có trong data
      case 'barcode':
        return sale?.barcode || '';
      case 'muaHangGiamGia':
        return sale?.promCode || '';
      case 'chietKhauMuaHangGiamGia':
        return sale?.other_discamt ?? sale?.disc_amt ?? sale?.chietKhauMuaHangGiamGia ?? 0;
      case 'ckTheoChinhSach':
        return sale?.ckTheoChinhSach || '';
      case 'chietKhauCkTheoChinhSach':
        return sale?.chietKhauCkTheoChinhSach ?? 0;
      case 'muaHangCkVip':
        return sale?.muaHangCkVip || '';
      case 'chietKhauMuaHangCkVip':
        return sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0;
      case 'thanhToanCoupon':
        return sale?.thanhToanCoupon ?? 0;
      case 'chietKhauThanhToanCoupon':
        return sale?.chietKhauThanhToanCoupon ?? 0;
      case 'thanhToanVoucher':
        const voucherLabels = calculateThanhToanVoucher(sale);
        return voucherLabels || '';
      case 'chietKhauThanhToanVoucher':
        return sale?.paid_by_voucher_ecode_ecoin_bp ?? sale?.chietKhauThanhToanVoucher ?? 0;
      case 'duPhong1':
        return sale?.duPhong1 ?? 0;
      case 'chietKhauDuPhong1':
        return sale?.chietKhauDuPhong1 ?? 0;
      case 'duPhong2':
        return sale?.duPhong2 ?? 0;
      case 'chietKhauDuPhong2':
        return sale?.chietKhauDuPhong2 ?? 0;
      case 'duPhong3':
        return sale?.duPhong3 ?? 0;
      case 'chietKhauDuPhong3':
        return sale?.chietKhauDuPhong3 ?? 0;
      case 'hang':
        return sale?.hang || '';
      case 'chietKhauHang':
        return sale?.chietKhauHang ?? 0;
      case 'thuongBangHang':
        return sale?.thuongBangHang ?? 0;
      case 'chietKhauThuongBangHang':
        return sale?.chietKhauThuongMuaBangHang ?? 0;
      case 'thanhToanTkTienAo':
        return sale?.thanhToanTkTienAo ?? 0;
      case 'chietKhauThanhToanTkTienAo':
        return sale?.chietKhauThanhToanTkTienAo ?? 0;
      case 'ckThem1':
        return sale?.ckThem1 ?? 0;
      case 'chietKhauThem1':
        return sale?.chietKhauThem1 ?? 0;
      case 'ckThem2':
        return sale?.ckThem2 ?? 0;
      case 'chietKhauThem2':
        return sale?.chietKhauThem2 ?? 0;
      case 'ckThem3':
        return sale?.ckThem3 ?? 0;
      case 'chietKhauThem3':
        return sale?.chietKhauThem3 ?? 0;
      case 'voucherDp1':
        return sale?.voucherDp1 || '';
      case 'chietKhauVoucherDp1':
        return sale?.chietKhauVoucherDp1 ?? 0;
      case 'voucherDp2':
        return sale?.voucherDp2 || '';
      case 'chietKhauVoucherDp2':
        return sale?.chietKhauVoucherDp2 ?? 0;
      case 'voucherDp3':
        return sale?.voucherDp3 || '';
      case 'chietKhauVoucherDp3':
        return sale?.chietKhauVoucherDp3 ?? 0;
      case 'voucherDp4':
        return sale?.voucherDp4 || '';
      case 'chietKhauVoucherDp4':
        return sale?.chietKhauVoucherDp4 ?? 0;
      case 'voucherDp5':
        return sale?.voucherDp5 || '';
      case 'chietKhauVoucherDp5':
        return sale?.chietKhauVoucherDp5 ?? 0;
      case 'voucherDp6':
        return sale?.voucherDp6 || '';
      case 'chietKhauVoucherDp6':
        return sale?.chietKhauVoucherDp6 ?? 0;
      case 'voucherDp7':
        return sale?.voucherDp7 || '';
      case 'chietKhauVoucherDp7':
        return sale?.chietKhauVoucherDp7 ?? 0;
      case 'voucherDp8':
        return sale?.voucherDp8 || '';
      case 'chietKhauVoucherDp8':
        return sale?.chietKhauVoucherDp8 ?? 0;
      case 'tongChietKhau':
        const tongCK = 
          (sale?.disc_amt ?? sale?.chietKhauMuaHangGiamGia ?? 0) +
          (sale?.chietKhauCkTheoChinhSach ?? 0) +
          (sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0) +
          (sale?.chietKhauThanhToanCoupon ?? 0) +
          (sale?.paid_by_voucher_ecode_ecoin_bp ?? sale?.chietKhauThanhToanVoucher ?? 0) +
          (sale?.chietKhauDuPhong1 ?? 0) +
          (sale?.chietKhauDuPhong2 ?? 0) +
          (sale?.chietKhauDuPhong3 ?? 0) +
          (sale?.chietKhauHang ?? 0) +
          (sale?.chietKhauThuongMuaBangHang ?? 0) +
          (sale?.chietKhauThanhToanTkTienAo ?? 0) +
          (sale?.chietKhauThem1 ?? 0) +
          (sale?.chietKhauThem2 ?? 0) +
          (sale?.chietKhauThem3 ?? 0) +
          (sale?.chietKhauVoucherDp1 ?? 0) +
          (sale?.chietKhauVoucherDp2 ?? 0) +
          (sale?.chietKhauVoucherDp3 ?? 0) +
          (sale?.chietKhauVoucherDp4 ?? 0) +
          (sale?.chietKhauVoucherDp5 ?? 0) +
          (sale?.chietKhauVoucherDp6 ?? 0) +
          (sale?.chietKhauVoucherDp7 ?? 0) +
          (sale?.chietKhauVoucherDp8 ?? 0);
        return tongCK;
      case 'tkTroGia':
        return ''; // Tài khoản trợ giá - không có trong data
      case 'troGia':
        return sale?.troGia ?? 0;
      case 'tkDoanhThuHangNo':
        return sale?.product?.tkDoanhThuHangNo || '';
      case 'tkGiaVonHangNo':
        return sale?.product?.tkGiaVonHangNo || '';
      case 'tkVatTuHangNo':
        return sale?.product?.tkVatTuHangNo || '';
      case 'maThue':
        return sale?.maThue || TAX_CODE;
      case 'thueSuat':
        return ''; // Thuế suất - lấy theo mã thuế
      case 'tkThue':
        return sale?.tkThueCo || '';
      case 'tienThue':
        return ''; // Tiền thuế - tính theo mã thuế
      case 'cucThue':
        return sale?.cucThue || '';
      case 'vuViec':
        return sale?.vuViec || '';
      case 'boPhan':
        return sale?.department?.ma_bp || sale?.branchCode || '';
      case 'sanPham':
        return sale?.sanPham || '';
      case 'hopDong':
        return sale?.hopDong || '';
      case 'phi':
        return sale?.phi || 0;
      case 'kheUoc':
        return sale?.kheUoc || '';
      case 'maThe':
        // Ưu tiên mvc_serial (từ Zappy API), nếu không có thì dùng maThe
        if (sale?.mvc_serial) {
          return sale.mvc_serial;
        }
        if (sale?.serial) {
          return '';
        }
        const ordertypeForThe = mapOrderTypeNameToCode(sale?.ordertype) || sale?.ordertype;
        const branchCodeForThe = sale?.branchCode || order?.customer?.branch_code;
        const lineIdForThe = sale?.line_id;
        if (ordertypeForThe === ORDER_TYPE_NORMAL && branchCodeForThe && lineIdForThe) {
          return `${branchCodeForThe}/${lineIdForThe}`;
        }
        if (ordertypeForThe === ORDER_TYPE_LAM_DV) {
          return '';
        }
        return sale?.maThe || '';
      default:
        return '';
    }
  };

  // Basic columns for main table
  const basicColumns = [
    { key: 'docCode', label: 'Mã đơn hàng', width: 'w-32' },
    { key: 'maKh', label: 'Mã KH', width: 'w-24' },
    { key: 'tenKh', label: 'Tên KH', width: 'w-40' },
    { key: 'maDvcs', label: 'Mã ĐVCS', width: 'w-20' },
    { key: 'ngayCt', label: 'Ngày CT', width: 'w-24' },
    { key: 'status', label: 'Trạng thái', width: 'w-24' },
    { key: 'message', label: 'Thông báo', width: 'w-64' },
    { key: 'action', label: 'Thao tác', width: 'w-40' },
  ];

  // Full columns for detail modal
  const detailColumns = [
    { key: 'docCode', label: 'Mã đơn hàng', width: 'w-32' },
    { key: 'maKh', label: 'Mã KH', width: 'w-24' },
    { key: 'tenKh', label: 'Tên KH', width: 'w-40' },
    { key: 'maDvcs', label: 'Mã ĐVCS', width: 'w-20' },
    { key: 'ngayCt', label: 'Ngày CT', width: 'w-24' },
    { key: 'status', label: 'Trạng thái', width: 'w-24' },
    { key: 'maHang', label: 'Mã hàng', width: 'w-24' },
    { key: 'tenMatHang', label: 'Tên mặt hàng', width: 'w-48' },
    { key: 'dvt', label: 'Đvt', width: 'w-16' },
    { key: 'loaiGiaoDich', label: 'Loại giao dịch', width: 'w-24' },
    { key: 'soSerial', label: 'Số serial', width: 'w-24' },
    { key: 'loai', label: 'Loại', width: 'w-24' },
    { key: 'khuyenMai', label: 'Khuyến mãi', width: 'w-24' },
    { key: 'maCtkmTangHang', label: 'Mã CTKM tặng hàng', width: 'w-32' },
    { key: 'maKho', label: 'Mã kho', width: 'w-20' },
    { key: 'maLo', label: 'Mã lô', width: 'w-20' },
    { key: 'soLuong', label: 'Số lượng', width: 'w-20' },
    { key: 'giaBan', label: 'Giá bán', width: 'w-24' },
    { key: 'tienHang', label: 'Tiền hàng', width: 'w-24' },
    { key: 'tkDoanhThu', label: 'Tk doanh thu', width: 'w-24' },
    { key: 'giaVon', label: 'Giá vốn', width: 'w-24' },
    { key: 'tienVon', label: 'Tiền vốn', width: 'w-24' },
    { key: 'tkKho', label: 'Tk kho', width: 'w-20' },
    { key: 'tkGiaVon', label: 'Tk giá vốn', width: 'w-24' },
    { key: 'tkChiPhiKhuyenMai', label: 'Tk chi phí khuyến mãi', width: 'w-32' },
    { key: 'dong', label: 'Dòng', width: 'w-16' },
    { key: 'barcode', label: 'Barcode', width: 'w-24' },
    { key: 'muaHangGiamGia', label: 'Mua hàng giảm giá', width: 'w-32' },
    { key: 'chietKhauMuaHangGiamGia', label: 'Chiết khấu mua hàng giảm giá', width: 'w-40' },
    { key: 'ckTheoChinhSach', label: 'CK theo chính sách', width: 'w-32' },
    { key: 'chietKhauCkTheoChinhSach', label: 'Chiết khấu ck theo chính sách', width: 'w-40' },
    { key: 'muaHangCkVip', label: 'Mua hàng CK VIP', width: 'w-32' },
    { key: 'chietKhauMuaHangCkVip', label: 'Chiết khấu mua hàng CK VIP', width: 'w-40' },
    { key: 'thanhToanCoupon', label: 'Thanh toán coupon', width: 'w-32' },
    { key: 'chietKhauThanhToanCoupon', label: 'Chiết khấu thanh toán coupon', width: 'w-40' },
    { key: 'thanhToanVoucher', label: 'Thanh toán voucher', width: 'w-32' },
    { key: 'chietKhauThanhToanVoucher', label: 'Chiết khấu thanh toán voucher', width: 'w-40' },
    { key: 'duPhong1', label: 'Dự phòng 1', width: 'w-24' },
    { key: 'chietKhauDuPhong1', label: 'Chiết khấu dự phòng 1', width: 'w-32' },
    { key: 'duPhong2', label: 'Dự phòng 2', width: 'w-24' },
    { key: 'chietKhauDuPhong2', label: 'Chiết khấu dự phòng 2', width: 'w-32' },
    { key: 'duPhong3', label: 'Dự phòng 3', width: 'w-24' },
    { key: 'chietKhauDuPhong3', label: 'Chiết khấu dự phòng 3', width: 'w-32' },
    { key: 'hang', label: 'Hãng', width: 'w-24' },
    { key: 'chietKhauHang', label: 'Chiết khấu hãng', width: 'w-32' },
    { key: 'thuongBangHang', label: 'Thưởng bằng hàng', width: 'w-32' },
    { key: 'chietKhauThuongBangHang', label: 'Chiết khấu thưởng bằng hàng', width: 'w-40' },
    { key: 'thanhToanTkTienAo', label: 'Thanh toán TK tiền ảo', width: 'w-32' },
    { key: 'chietKhauThanhToanTkTienAo', label: 'Chiết khấu thanh toán TK tiền ảo', width: 'w-40' },
    { key: 'ckThem1', label: 'CK thêm 1', width: 'w-24' },
    { key: 'chietKhauThem1', label: 'Chiết khấu thêm 1', width: 'w-32' },
    { key: 'ckThem2', label: 'CK thêm 2', width: 'w-24' },
    { key: 'chietKhauThem2', label: 'Chiết khấu thêm 2', width: 'w-32' },
    { key: 'ckThem3', label: 'CK thêm 3', width: 'w-24' },
    { key: 'chietKhauThem3', label: 'Chiết khấu thêm 3', width: 'w-32' },
    { key: 'voucherDp1', label: 'Voucher DP1', width: 'w-24' },
    { key: 'chietKhauVoucherDp1', label: 'Chiết khấu voucher DP1', width: 'w-32' },
    { key: 'voucherDp2', label: 'Voucher DP2', width: 'w-24' },
    { key: 'chietKhauVoucherDp2', label: 'Chiết khấu Voucher DP2', width: 'w-32' },
    { key: 'voucherDp3', label: 'Voucher DP3', width: 'w-24' },
    { key: 'chietKhauVoucherDp3', label: 'Chiết khấu voucher DP3', width: 'w-32' },
    { key: 'voucherDp4', label: 'Voucher DP4', width: 'w-24' },
    { key: 'chietKhauVoucherDp4', label: 'Chiết khấu voucher DP4', width: 'w-32' },
    { key: 'voucherDp5', label: 'Voucher DP5', width: 'w-24' },
    { key: 'chietKhauVoucherDp5', label: 'Chiết khấu voucher DP5', width: 'w-32' },
    { key: 'voucherDp6', label: 'Voucher DP6', width: 'w-24' },
    { key: 'chietKhauVoucherDp6', label: 'Chiết khấu voucher DP6', width: 'w-32' },
    { key: 'voucherDp7', label: 'Voucher DP7', width: 'w-24' },
    { key: 'chietKhauVoucherDp7', label: 'Chiết khấu voucher DP7', width: 'w-32' },
    { key: 'voucherDp8', label: 'Voucher DP8', width: 'w-24' },
    { key: 'chietKhauVoucherDp8', label: 'Chiết khấu voucher DP8', width: 'w-32' },
    { key: 'tongChietKhau', label: 'Chiết khấu', width: 'w-24' },
    { key: 'troGia', label: 'Trợ giá', width: 'w-24' },
    { key: 'maThue', label: 'Mã thuế', width: 'w-20' },
    { key: 'tkThue', label: 'Tk thuế', width: 'w-20' },
    { key: 'cucThue', label: 'Cục thuế', width: 'w-24' },
    { key: 'vuViec', label: 'Vụ việc', width: 'w-24' },
    { key: 'boPhan', label: 'Bộ phận', width: 'w-24' },
    { key: 'sanPham', label: 'Sản phẩm', width: 'w-24' },
    { key: 'hopDong', label: 'Hợp đồng', width: 'w-24' },
    { key: 'phi', label: 'Phí', width: 'w-20' },
    { key: 'kheUoc', label: 'Khế ước', width: 'w-24' },
    { key: 'maThe', label: 'Mã thẻ', width: 'w-32' },
    { key: 'message', label: 'Thông báo', width: 'w-64' },
    { key: 'action', label: 'Thao tác', width: 'w-32' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng kê hóa đơn</h1>
        <p className="text-sm text-gray-600 mt-1">Danh sách chi tiết các hóa đơn đã tạo từ Fast API</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Thành công</div>
            <div className="text-2xl font-bold text-green-600">{statistics.success}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Thất bại</div>
            <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.successRate}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="1">Thành công</option>
              <option value="0">Thất bại</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
            <input
              type="text"
              value={filters.docCode}
              onChange={(e) => handleFilterChange('docCode', e.target.value)}
              placeholder="SO31.00149453"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
            <input
              type="text"
              value={filters.maKh}
              onChange={(e) => handleFilterChange('maKh', e.target.value)}
              placeholder="KF25127785"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
            <input
              type="text"
              value={filters.tenKh}
              onChange={(e) => handleFilterChange('tenKh', e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn vị</label>
            <input
              type="text"
              value={filters.maDvcs}
              onChange={(e) => handleFilterChange('maDvcs', e.target.value)}
              placeholder="FBV"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Áp dụng
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {basicColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width || ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.docCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.maKh || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.tenKh || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.maDvcs || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateOnly(invoice.ngayCt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={invoice.message || ''}>
                        {invoice.message || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadOrderDetail(invoice)}
                            disabled={loadingDetail}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Chi tiết
                          </button>
                          {invoice.status === 0 && (
                            <button
                              onClick={() => handleRetry(invoice.docCode)}
                              disabled={retrying[invoice.docCode]}
                              className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {retrying[invoice.docCode] ? 'Đang xử lý...' : 'Đồng bộ lại'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong tổng số <span className="font-medium">{pagination.total}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết hóa đơn</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Mã đơn hàng: <span className="font-medium">{selectedInvoice.docCode}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInvoice(null);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              {loadingDetail ? (
                <div className="p-8 text-center text-gray-500">Đang tải chi tiết...</div>
              ) : detailRows.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Không có dữ liệu chi tiết</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {detailColumns.map((col) => (
                          <th
                            key={col.key}
                            className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width || ''}`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailRows.map((row, index) => {
                        const cellValue = (field: string) => {
                          const value = getCellValue(row, field);
                          return formatValue(value);
                        };

                        return (
                          <tr key={`${row.invoice.id}-${row.sale?.id || index}`} className="hover:bg-gray-50">
                            {detailColumns.map((col) => {
                              if (col.key === 'status') {
                                return (
                                  <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                                    {getStatusBadge(row.invoice.status)}
                                  </td>
                                );
                              }
                              if (col.key === 'ngayCt') {
                                return (
                                  <td key={col.key} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {formatDateOnly(cellValue(col.key))}
                                  </td>
                                );
                              }
                              return (
                                <td
                                  key={col.key}
                                  className="px-3 py-2 text-sm text-gray-500"
                                  title={cellValue(col.key)}
                                >
                                  {cellValue(col.key)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInvoice(null);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
