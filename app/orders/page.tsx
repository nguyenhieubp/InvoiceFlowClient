'use client';

import React, { useEffect, useState, useRef } from 'react';
import { salesApi, categoriesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';
import { TAX_CODE, DEBIT_ACCOUNT } from '@/lib/constants/accounting.constants';
import { ORDER_TYPE_NORMAL, ORDER_TYPE_LAM_DV, ORDER_TYPE_BAN_ECOIN, ORDER_TYPE_SAN_TMDT, mapOrderTypeNameToCode } from '@/lib/constants/order-type.constants';
import { calculateThanhToanVoucher } from '@/lib/utils/voucher.utils';
import { Order, SaleItem } from '@/types/order.types';
import { OrderColumn, FIELD_LABELS, MAIN_COLUMNS } from '@/lib/constants/order-columns.constants';
import { calculateMaLo, parsePromCode, convertPromCodeToTangSp } from '@/lib/utils/order.utils';
import { normalizeOrderData } from '@/lib/utils/order-mapper.utils';
import { mapLoyaltyApiProductToProductItem } from '@/lib/utils/product.utils';
import { OrderProduct, OrderDepartment } from '@/types/order.types';
import * as XLSX from 'xlsx';


export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [enrichedDisplayedOrders, setEnrichedDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  // Cache để tránh fetch lại products và departments (dùng useRef để không trigger re-render)
  const productCacheRef = useRef<Map<string, OrderProduct>>(new Map());
  const departmentCacheRef = useRef<Map<string, OrderDepartment>>(new Map());
  // Cache full order data để tránh fetch lại
  const fullOrderCacheRef = useRef<Map<string, Order>>(new Map());
  // Track searchQuery và filter trước đó để chỉ reset page khi chúng thay đổi
  const prevSearchQueryRef = useRef<string>('');
  const prevFilterRef = useRef<{ brand?: string; dateFrom?: string; dateTo?: string }>({});
  const [filter, setFilter] = useState<{ brand?: string; dateFrom?: string; dateTo?: string }>({});
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
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  
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

  // Hàm helper để extract text từ React element (đệ quy)
  const extractTextFromReactNode = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (typeof node === 'boolean') return node ? 'Có' : 'Không';
    if (Array.isArray(node)) {
      return node.map(extractTextFromReactNode).join(' ');
    }
    if (React.isValidElement(node)) {
      const props = node.props as { children?: any };
      if (props?.children) {
        return extractTextFromReactNode(props.children);
      }
      return '';
    }
    return String(node);
  };

  // Hàm lấy giá trị raw từ order/sale (không render React element)
  const getRawCellValue = (order: Order, sale: SaleItem | null, field: OrderColumn): any => {
    if (!sale && field !== 'docCode' && field !== 'docDate' && field !== 'customerName' && field !== 'partnerCode') {
      return null;
    }

    switch (field) {
      case 'docCode':
        return order.docCode || '';
      case 'docDate':
        return order.docDate ? new Date(order.docDate).toLocaleDateString('vi-VN') : '';
      case 'customerName':
        return order.customer?.name || '';
      case 'partnerCode':
        return sale?.partnerCode || order.customer?.code || '';
      case 'itemCode':
        return sale?.itemCode || '';
      case 'itemName':
        return sale?.itemName || sale?.product?.tenVatTu || '';
      case 'qty':
        // Làm tròn số lượng về số nguyên
        const qtyValue = sale?.qty ?? null;
        return qtyValue !== null ? Math.round(Number(qtyValue)) : null;
      case 'giaBan':
        // Trả về số nguyên (làm tròn) cho Excel export
        const tienHangForGiaBan = sale?.linetotal ?? sale?.tienHang;
        const qtyForGiaBan = sale?.qty;
        let giaBanValue: number = 0;
        if (tienHangForGiaBan != null && qtyForGiaBan != null && qtyForGiaBan > 0) {
          giaBanValue = tienHangForGiaBan / qtyForGiaBan;
        } else {
          giaBanValue = sale?.giaBan ?? 0;
        }
        // Làm tròn về số nguyên
        return Math.round(Number(giaBanValue));
      case 'tienHang':
        // Trả về số nguyên (làm tròn) cho Excel export
        const tienHangRaw = sale?.linetotal ?? sale?.tienHang ?? null;
        if (tienHangRaw !== null && tienHangRaw !== undefined) {
          const numValue = typeof tienHangRaw === 'string' ? parseFloat(tienHangRaw) : Number(tienHangRaw);
          return Math.round(numValue);
        }
        return null;
      case 'revenue':
        return sale?.revenue ?? null;
      case 'maNt':
        return sale?.maNt || 'VND';
      case 'tyGia':
        return sale?.tyGia ?? 1;
      case 'maThue':
        return sale?.maThue || TAX_CODE;
      case 'tkNo':
        return sale?.tkNo || DEBIT_ACCOUNT;
      case 'dvt':
        return sale?.dvt || sale?.product?.dvt || '';
      case 'maKho':
        return sale?.maKho || '';
      case 'maLo':
        // Hiển thị ma_lo - ưu tiên lấy từ backend nếu có, nếu không thì tính toán từ serial
        if (sale?.maLo) {
          return sale.maLo;
        }
        
        // Nếu không có, tính toán từ serial
        const serial = sale?.serial || sale?.soSerial;
        if (serial) {
          // Lấy brand để phân biệt logic cho F3
          const brand = order.customer?.brand || order.brand || '';
          const brandLower = (brand || '').toLowerCase().trim();
          
          // Kiểm tra nếu serial có dạng "XXX_YYYY" (có dấu gạch dưới), lấy phần sau dấu gạch dưới
          const underscoreIndex = serial.indexOf('_');
          if (underscoreIndex > 0 && underscoreIndex < serial.length - 1) {
            // Lấy phần sau dấu gạch dưới
            const maLo = serial.substring(underscoreIndex + 1);
            return maLo;
          }
          
          // Nếu không có dấu gạch dưới, kiểm tra trackBatch
          const trackBatch = sale?.product?.trackBatch === true;
          if (trackBatch) {
            // Với F3, lấy toàn bộ serial (không cắt, không xử lý)
            if (brandLower === 'f3') {
              return serial;
            }
            
            // Các brand khác: tính toán theo productType
            let maLo = serial;
            const productTypeFromLoyalty = sale?.productType || sale?.product?.productType;
            const productTypeUpper = productTypeFromLoyalty ? String(productTypeFromLoyalty).toUpperCase().trim() : null;
            if (productTypeUpper === 'TPCN') {
              // Nếu productType là "TPCN", cắt lấy 8 ký tự cuối
              maLo = serial.length >= 8 ? serial.slice(-8) : serial;
            } else if (productTypeUpper === 'SKIN' || productTypeUpper === 'GIFT') {
              // Nếu productType là "SKIN" hoặc "GIFT", cắt lấy 4 ký tự cuối
              maLo = serial.length >= 4 ? serial.slice(-4) : serial;
            } else {
              // Các trường hợp khác → lấy 4 ký tự cuối (mặc định)
              maLo = serial.length >= 4 ? serial.slice(-4) : serial;
            }
            return maLo;
          }
        }
        return '';
      case 'soSerial':
        return sale?.serial || '';
      case 'promCode':
        // Chỉ hiển thị "Khuyến mãi" cho hàng tặng (giaBan = 0 và tienHang = 0 và revenue = 0)
        // Convert string to number nếu cần
        const tienHangForPromCodeRaw = parseFloat(String(sale?.linetotal ?? sale?.tienHang ?? 0)) || 0;
        const revenueForPromCodeRaw = parseFloat(String(sale?.revenue ?? 0)) || 0;
        // Ưu tiên sử dụng giaBan từ API (từ field price), nếu không có thì tính từ tienHang/qty
        let giaBanForPromCodeRaw: number = parseFloat(String(sale?.giaBan ?? 0)) || 0;
        if (giaBanForPromCodeRaw === 0 && tienHangForPromCodeRaw != null && sale?.qty != null) {
          const qtyNum = parseFloat(String(sale.qty)) || 0;
          if (qtyNum > 0) {
            giaBanForPromCodeRaw = tienHangForPromCodeRaw / qtyNum;
          }
        }
        
        // Lấy brand để phân biệt logic F3
        const brandForPromCodeRaw = order?.customer?.brand || order?.brand || '';
        let brandLowerForPromCodeRaw = (brandForPromCodeRaw || '').toLowerCase().trim();
        // Normalize: "facialbar" → "f3"
        if (brandLowerForPromCodeRaw === 'facialbar') {
          brandLowerForPromCodeRaw = 'f3';
        }
        
        const hasPromCodeForPromCodeRaw = sale?.promCode && String(sale.promCode).trim() !== '';
        let isTangHangForPromCodeRaw = giaBanForPromCodeRaw === 0 && tienHangForPromCodeRaw === 0 && revenueForPromCodeRaw === 0;
        
        // Với F3: Nếu có promCode và giaBan = 0 && tienHang = 0 → là "mua hàng giảm giá" (giảm 100%), không phải "tặng hàng"
        if (brandLowerForPromCodeRaw === 'f3' && hasPromCodeForPromCodeRaw && isTangHangForPromCodeRaw) {
          isTangHangForPromCodeRaw = false;
        }
        
        // Các ordertype dịch vụ không được coi là hàng tặng (không hiển thị "1")
        const ordertypeNameForPromCodeRaw = sale?.ordertype || '';
        const isDichVuForPromCodeRaw = ordertypeNameForPromCodeRaw.includes('02. Làm dịch vụ') || 
                                        ordertypeNameForPromCodeRaw.includes('04. Đổi DV') ||
                                        ordertypeNameForPromCodeRaw.includes('08. Tách thẻ') ||
                                        ordertypeNameForPromCodeRaw.includes('Đổi thẻ KEEP->Thẻ DV');
        if (isDichVuForPromCodeRaw) {
          isTangHangForPromCodeRaw = false;
        }
        
        // Kiểm tra có mã số thẻ (maThe) không - nếu có thì km_yn = 0 (không hiển thị "1")
        const hasMaTheForPromCodeRaw = sale?.maThe && String(sale.maThe).trim() !== '';
        // Kiểm tra nếu ma_ctkm_th = "TT DAU TU" thì cũng không hiển thị "1"
        // Nếu chưa có từ backend, tính toán lại từ ordertype
        let maCtkmTangHangForPromCodeRaw = sale?.maCtkmTangHang || '';
        if (!maCtkmTangHangForPromCodeRaw && isTangHangForPromCodeRaw) {
          if (ordertypeNameForPromCodeRaw.includes('06. Đầu tư') || ordertypeNameForPromCodeRaw.includes('06.Đầu tư')) {
            maCtkmTangHangForPromCodeRaw = 'TT DAU TU';
          }
        }
        const isTTDauTuForPromCodeRaw = maCtkmTangHangForPromCodeRaw.trim() === 'TT DAU TU';
        
        // Nếu có mã số thẻ (maThe) hoặc ma_ctkm_th = "TT DAU TU" thì không hiển thị "1"
        if (hasMaTheForPromCodeRaw || isTTDauTuForPromCodeRaw) {
          return '';
        }
        
        // Chỉ hiển thị khi là hàng tặng → hiển thị "1" (giống km_yn = 1 trong backend)
        if (isTangHangForPromCodeRaw) {
          return '1';
        }
        
        // Các trường hợp khác (không phải hàng tặng) → bỏ trống
        return '';
      default:
        // Với các field phức tạp, dùng renderCellValue và extract text
        const renderedValue = renderCellValue(order, sale, field);
        return extractTextFromReactNode(renderedValue);
    }
  };

  // Hàm xuất Excel - xuất tất cả dữ liệu (không chỉ phần hiển thị)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      
      // Fetch tất cả orders (không paginate, không filter)
      showToast('info', 'Đang tải dữ liệu để xuất Excel...');
      const response = await salesApi.getAllOrders({
        brand: filter.brand, // Vẫn giữ brand filter nếu có
        page: 1,
        limit: 10000, // Lấy tối đa 10000 orders
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
        search: searchQuery.trim() || undefined,
      });
      
      const rawData = response.data.data || [];
      const ordersData = normalizeOrderData(rawData);
      
      if (ordersData.length === 0) {
        showToast('info', 'Không có dữ liệu để xuất Excel');
        setIsExporting(false);
        return;
      }
      
      // Enrich tất cả orders (fetch full data nếu cần)
      showToast('info', `Đang xử lý ${ordersData.length} đơn hàng...`);
      const ordersWithFullData = await Promise.all(
        ordersData.map(async (order) => {
          // Nếu đã có trong cache, dùng cache
          if (fullOrderCacheRef.current.has(order.docCode)) {
            return fullOrderCacheRef.current.get(order.docCode)!;
          }
          
          // Nếu không có sales, fetch full data
          if (!order.sales || order.sales.length === 0) {
            try {
              const fullResponse = await salesApi.getByOrderCode(order.docCode);
              const fullOrder = normalizeOrderData([fullResponse.data])[0];
              // Lưu vào cache
              fullOrderCacheRef.current.set(order.docCode, fullOrder);
              return fullOrder;
            } catch (error) {
              console.error(`Error fetching full data for order ${order.docCode}:`, error);
              return order;
            }
          }
          
          return order;
        })
      );
      
      // Enrich với products và departments
      const enrichedOrders = await enrichOrdersWithProducts(ordersWithFullData);
      
      // Tính toán flattened rows từ tất cả enriched orders
      const rowsToExport: Array<{ order: Order; sale: SaleItem | null }> = [];
      enrichedOrders.forEach((order) => {
        if (order.sales && order.sales.length > 0) {
          order.sales.forEach((sale) => {
            rowsToExport.push({ order, sale });
          });
        } else {
          // Nếu order không có sales, dùng totalItems để tạo rows
          const rowCount = order.totalItems > 0 ? order.totalItems : 1;
          for (let i = 0; i < rowCount; i++) {
            rowsToExport.push({ order, sale: null });
          }
        }
      });

      if (rowsToExport.length === 0) {
        showToast('info', 'Không có dữ liệu để xuất Excel');
        setIsExporting(false);
        return;
      }

      // Lấy brand từ orders (ưu tiên brand đầu tiên tìm thấy)
      let brandName = '';
      for (const row of rowsToExport) {
        const brand = row.order?.customer?.brand || row.order?.brand || '';
        if (brand) {
          brandName = brand;
          break;
        }
      }

      // Tạo workbook mới
      showToast('info', `Đang tạo file Excel với ${rowsToExport.length} dòng...`);
      const wb = XLSX.utils.book_new();

      // Chuẩn bị dữ liệu cho Excel
      const excelData = rowsToExport.map((row) => {
        const rowData: any = {};
        selectedColumns.forEach((column) => {
          const label = FIELD_LABELS[column];
          const value = getRawCellValue(row.order, row.sale, column);
          
          // Format giá trị - Giữ số dạng số để Excel có thể tính toán
          let cellValue: any = '';
          if (value === null || value === undefined) {
            cellValue = '';
          } else if (typeof value === 'number') {
            // Danh sách các cột số: giữ nguyên giá trị number (không format thành string)
            const numericColumns = [
              'qty', 'giaBan', 'tienHang', 'revenue', 'tyGia',
              'chietKhauMuaHangGiamGia', 'chietKhauCkTheoChinhSach', 'chietKhauMuaHangCkVip',
              'chietKhauThanhToanCoupon', 'chietKhauThanhToanVoucher', 'chietKhauThanhToanTkTienAo',
              'chietKhauDuPhong1', 'chietKhauDuPhong2', 'chietKhauDuPhong3',
              'chietKhauHang', 'chietKhauThuongMuaBangHang',
              'chietKhauThem1', 'chietKhauThem2', 'chietKhauThem3',
              'chietKhauVoucherDp1', 'chietKhauVoucherDp2', 'chietKhauVoucherDp3',
              'chietKhauVoucherDp4', 'chietKhauVoucherDp5', 'chietKhauVoucherDp6',
              'chietKhauVoucherDp7', 'chietKhauVoucherDp8',
              'muaHangGiamGia', 'muaHangCkVip',
              'thanhToanCoupon', 'thanhToanVoucher', 'thanhToanTkTienAo',
              'duPhong1', 'duPhong2', 'duPhong3',
              'voucherDp1', 'voucherDp2', 'voucherDp3', 'voucherDp4', 'voucherDp5',
              'voucherDp6', 'voucherDp7', 'voucherDp8',
              'troGia', 'ckTheoChinhSach', 'ckThem1', 'ckThem2', 'ckThem3',
              'thuongBangHang'
            ];
            
            // Giữ nguyên giá trị number cho các cột số
            if (numericColumns.includes(column) || column.includes('chietKhau') || column.includes('ThanhToan') || column.includes('thanhToan')) {
              // Làm tròn tất cả các số về số nguyên (bỏ phần thập phân)
              // Đảm bảo convert sang number trước khi làm tròn
              const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
              cellValue = Math.round(numValue);
            } else {
              cellValue = value; // Các số khác cũng giữ nguyên
            }
          } else {
            cellValue = String(value);
          }
          
          rowData[label] = cellValue;
        });
        return rowData;
      });

      // Tạo worksheet từ dữ liệu
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Danh sách các cột số cần set format
      const numericColumns = [
        'qty', 'giaBan', 'tienHang', 'revenue', 'tyGia',
        'chietKhauMuaHangGiamGia', 'chietKhauCkTheoChinhSach', 'chietKhauMuaHangCkVip',
        'chietKhauThanhToanCoupon', 'chietKhauThanhToanVoucher', 'chietKhauThanhToanTkTienAo',
        'chietKhauDuPhong1', 'chietKhauDuPhong2', 'chietKhauDuPhong3',
        'chietKhauHang', 'chietKhauThuongMuaBangHang',
        'chietKhauThem1', 'chietKhauThem2', 'chietKhauThem3',
        'chietKhauVoucherDp1', 'chietKhauVoucherDp2', 'chietKhauVoucherDp3',
        'chietKhauVoucherDp4', 'chietKhauVoucherDp5', 'chietKhauVoucherDp6',
        'chietKhauVoucherDp7', 'chietKhauVoucherDp8',
        'muaHangGiamGia', 'muaHangCkVip',
        'thanhToanCoupon', 'thanhToanVoucher', 'thanhToanTkTienAo',
        'duPhong1', 'duPhong2', 'duPhong3',
        'voucherDp1', 'voucherDp2', 'voucherDp3', 'voucherDp4', 'voucherDp5',
        'voucherDp6', 'voucherDp7', 'voucherDp8',
        'troGia', 'ckTheoChinhSach', 'ckThem1', 'ckThem2', 'ckThem3',
        'thuongBangHang'
      ];

      // Set cell type và format cho các cột số - TẤT CẢ đều là số nguyên (không có số thập phân, không có dấu phân cách hàng nghìn)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const headerCell = ws[colLetter + '1'];
        if (headerCell && headerCell.v) {
          const columnLabel = headerCell.v;
          // Tìm column tương ứng với label
          const column = selectedColumns.find(col => FIELD_LABELS[col] === columnLabel);
          
          if (column && (numericColumns.includes(column) || column.includes('chietKhau') || column.includes('ThanhToan') || column.includes('thanhToan'))) {
            // Set format cho tất cả cells trong cột này (trừ header)
            for (let row = range.s.r + 1; row <= range.e.r; row++) {
              const cellAddress = colLetter + (row + 1);
              const cell = ws[cellAddress];
              if (cell) {
                // Convert giá trị sang number nếu là string
                let numValue: number;
                if (typeof cell.v === 'string') {
                  numValue = parseFloat(cell.v);
                } else if (typeof cell.v === 'number') {
                  numValue = cell.v;
                } else {
                  continue; // Skip nếu không phải number hoặc string có thể parse
                }
                
                // Làm tròn về số nguyên (bỏ phần thập phân)
                const intValue = Math.round(numValue);
                
                // Set cell type là number
                cell.t = 'n'; // number type
                // Format: số nguyên không có dấu phân cách hàng nghìn
                cell.z = '0'; // Format '0' = số nguyên, không có số thập phân, không có dấu phân cách
                // Set giá trị đã làm tròn
                cell.v = intValue;
              }
            }
          }
        }
      }

      // Đặt độ rộng cột tự động
      const colWidths = selectedColumns.map((column) => {
        const label = FIELD_LABELS[column];
        const maxLength = Math.max(
          label.length,
          ...excelData.map((row) => String(row[label] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) }; // Giới hạn tối đa 50 ký tự
      });
      ws['!cols'] = colWidths;

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');

      // Tạo tên file với ngày hiện tại và brand
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const brandSuffix = brandName ? `_${brandName.toUpperCase()}` : '';
      const fileName = `DonHang_${dateStr}${brandSuffix}.xlsx`;

      // Xuất file
      XLSX.writeFile(wb, fileName);
      
      showToast('success', `Đã xuất Excel thành công: ${fileName} (${excelData.length} dòng)`);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      showToast('error', `Lỗi khi xuất Excel: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
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
        showToast('success', `${data.message} Đã đồng bộ ${data.ordersCount} đơn hàng, ${data.salesCount} dòng bán hàng mới, ${data.customersCount} khách hàng mới.`);
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

  // Enrich orders với products và departments (batch fetch để tối ưu) - sử dụng cache
  const enrichOrdersWithProducts = async (orders: Order[]): Promise<Order[]> => {
    // Collect tất cả itemCodes và branchCodes cần fetch (chỉ những cái chưa có trong cache)
    const itemCodesToFetch = new Set<string>();
    const branchCodesToFetch = new Set<string>();

    orders.forEach(order => {
      order.sales?.forEach(sale => {
        if (sale.itemCode && !productCacheRef.current.has(sale.itemCode)) {
          itemCodesToFetch.add(sale.itemCode);
        }
        if (sale.branchCode && !departmentCacheRef.current.has(sale.branchCode)) {
          branchCodesToFetch.add(sale.branchCode);
        }
      });
    });

    // Batch fetch products (50 items một lần để tối ưu)
    const BATCH_SIZE = 50;
    const itemCodesArray = Array.from(itemCodesToFetch);

    if (itemCodesArray.length > 0) {
      for (let i = 0; i < itemCodesArray.length; i += BATCH_SIZE) {
        const batch = itemCodesArray.slice(i, i + BATCH_SIZE);
        const products = await Promise.all(
          batch.map(itemCode => fetchProduct(itemCode))
        );

        batch.forEach((itemCode, index) => {
          const product = products[index];
          if (product) {
            productCacheRef.current.set(itemCode, product);
          }
        });
      }
    }

    // Batch fetch departments (50 items một lần để tối ưu)
    const BATCH_SIZE_DEPT = 50;
    const branchCodesArray = Array.from(branchCodesToFetch);

    if (branchCodesArray.length > 0) {
      for (let i = 0; i < branchCodesArray.length; i += BATCH_SIZE_DEPT) {
        const batch = branchCodesArray.slice(i, i + BATCH_SIZE_DEPT);
        const departments = await Promise.all(
          batch.map(branchCode => fetchDepartment(branchCode))
        );

        batch.forEach((branchCode, index) => {
          const department = departments[index];
          if (department) {
            departmentCacheRef.current.set(branchCode, department);
          }
        });
      }
    }

    // Sử dụng cache đã có
    const finalProductCache = productCacheRef.current;
    const finalDepartmentCache = departmentCacheRef.current;

    // Enrich orders với products và departments từ cache
    const enrichedOrders = orders.map(order => {
      if (!order.sales || order.sales.length === 0) return order;

      // Tìm department đầu tiên để lấy company/brand
      let departmentForBrand: OrderDepartment | null = null;
      if (order.sales.length > 0 && order.sales[0].branchCode) {
        departmentForBrand = finalDepartmentCache.get(order.sales[0].branchCode) || null;
      }

      // Map company từ department sang brand cho customer
      const brandFromDepartment = departmentForBrand?.company
        ? mapCompanyToBrand(departmentForBrand.company)
        : undefined;

      const enrichedSales = order.sales.map(sale => {
        let enrichedSale = { ...sale };

        // Enrich product
        if (sale.itemCode) {
          const product = finalProductCache.get(sale.itemCode);
          if (product) {
            enrichedSale = {
              ...enrichedSale,
              dvt: product.dvt || enrichedSale.dvt,
              itemCode: product.maVatTu || enrichedSale.itemCode,
              itemName: product.tenVatTu || enrichedSale.itemName,
              productType: product.productType || enrichedSale.productType,
              trackInventory: product.trackInventory ?? enrichedSale.trackInventory,
              product,
              // Giữ lại maKho, maCtkmTangHang và muaHangCkVip từ backend
              maKho: enrichedSale.maKho || sale.maKho,
              maCtkmTangHang: enrichedSale.maCtkmTangHang || sale.maCtkmTangHang,
              muaHangCkVip: enrichedSale.muaHangCkVip || sale.muaHangCkVip,
              grade_discamt: enrichedSale.grade_discamt ?? sale.grade_discamt,
              chietKhauMuaHangCkVip: enrichedSale.chietKhauMuaHangCkVip ?? sale.chietKhauMuaHangCkVip,
            };
          }
        }

        // Enrich department
        if (sale.branchCode) {
          const department = finalDepartmentCache.get(sale.branchCode);
          if (department) {
            enrichedSale = {
              ...enrichedSale,
              department,
              // Giữ lại maKho, maCtkmTangHang và muaHangCkVip từ backend
              maKho: enrichedSale.maKho || sale.maKho,
              maCtkmTangHang: enrichedSale.maCtkmTangHang || sale.maCtkmTangHang,
              muaHangCkVip: enrichedSale.muaHangCkVip || sale.muaHangCkVip,
              grade_discamt: enrichedSale.grade_discamt ?? sale.grade_discamt,
              chietKhauMuaHangCkVip: enrichedSale.chietKhauMuaHangCkVip ?? sale.chietKhauMuaHangCkVip,
            };
          }
        }

        // Đảm bảo maKho, maCtkmTangHang và muaHangCkVip luôn được giữ lại
        if (!enrichedSale.maKho && sale.maKho) {
          enrichedSale.maKho = sale.maKho;
        }
        if (!enrichedSale.maCtkmTangHang && sale.maCtkmTangHang) {
          enrichedSale.maCtkmTangHang = sale.maCtkmTangHang;
        }
        // Giữ lại muaHangCkVip từ sale gốc (ưu tiên từ sale gốc)
        if (sale.muaHangCkVip) {
          enrichedSale.muaHangCkVip = sale.muaHangCkVip;
        }
        if (sale.grade_discamt !== undefined) {
          enrichedSale.grade_discamt = sale.grade_discamt;
        }
        if (sale.chietKhauMuaHangCkVip !== undefined) {
          enrichedSale.chietKhauMuaHangCkVip = sale.chietKhauMuaHangCkVip;
        }
        return enrichedSale;
      });

      return {
        ...order,
        customer: {
          ...order.customer,
          // Cập nhật brand từ department.company nếu có
          brand: brandFromDepartment || order.customer?.brand || '',
        },
        sales: enrichedSales,
      };
    });

    return enrichedOrders;
  };


  const loadOrders = async () => {
    try {
      setLoading(true);
      // Khi có search query, backend đã filter rồi, vẫn cần gửi page để backend trả về đúng trang
      // Chỉ reset về page 1 khi searchQuery thay đổi (xử lý ở useEffect khác)
      
      // Lấy orders từ backend API - chỉ lấy basic data (backend đã tối ưu)
      // Nếu có search query, gửi lên backend để search trực tiếp trên database
      // Khi có search query, gửi dateFrom/dateTo để search trong date range
      // Khi không có search query, có thể dùng date (single day) để lấy từ Zappy API
      const response = await salesApi.getAllOrders({
        brand: filter.brand,
        page: pagination.page,
        limit: pagination.limit,
        // Nếu có search query, dùng dateFrom/dateTo (date range)
        // Nếu không có search query, dùng date (single day) để lấy từ Zappy API
        date: (!searchQuery.trim() && filter.dateFrom && !filter.dateTo) ? convertDateToDDMMMYYYY(filter.dateFrom) : undefined,
        dateFrom: (searchQuery.trim() || filter.dateTo) ? filter.dateFrom : undefined,
        dateTo: filter.dateTo || undefined,
        search: searchQuery.trim() || undefined, // Gửi search query lên backend
      });
      const rawData = response.data.data || [];
      const backendTotal = response.data.total || 0;

      // Normalize dữ liệu - hỗ trợ cả format cũ và format mới từ ERP
      const ordersData = normalizeOrderData(rawData);

      setRawOrders(ordersData);
      setAllOrders(ordersData);
      
      // Cập nhật pagination từ backend response
      // Backend trả về total là tổng số rows (sale items) trong database
      // Frontend sẽ paginate lại sau khi flatten, nên dùng total từ backend
      setPagination((prev) => ({
        ...prev,
        total: backendTotal,
        totalPages: Math.ceil(backendTotal / prev.limit),
      }));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showToast('error', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Reset về trang 1 khi search query hoặc filter thay đổi
  useEffect(() => {
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery;
    const filterChanged = 
      prevFilterRef.current.brand !== filter.brand ||
      prevFilterRef.current.dateFrom !== filter.dateFrom ||
      prevFilterRef.current.dateTo !== filter.dateTo;
    
    if (searchQueryChanged || filterChanged) {
      prevSearchQueryRef.current = searchQuery;
      prevFilterRef.current = { ...filter };
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchQuery, filter.brand, filter.dateFrom, filter.dateTo]);

  // Load orders khi pagination hoặc filter thay đổi
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.brand, filter.dateFrom, filter.dateTo, pagination.page, pagination.limit, searchQuery]);

  // Backend đã filter và paginate rồi, frontend chỉ cần hiển thị những gì backend trả về
  useEffect(() => {
    setDisplayedOrders(allOrders);
  }, [allOrders]);

  // Enrich products chỉ cho displayedOrders (theo phân trang) - chỉ khi có sales
  useEffect(() => {
    if (displayedOrders.length === 0) {
      setEnrichedDisplayedOrders([]);
      return;
    }

    // Kiểm tra xem có orders nào cần fetch full data không (sales array rỗng)
    const ordersNeedingFullData = displayedOrders.filter(order => !order.sales || order.sales.length === 0);
    
    const enrichDisplayed = async () => {
      try {
        setEnriching(true);
        
        // Fetch full data cho các orders chưa có sales (từ cache hoặc API)
        const ordersWithFullData = await Promise.all(
          displayedOrders.map(async (order) => {
            // Nếu đã có trong cache, dùng cache
            if (fullOrderCacheRef.current.has(order.docCode)) {
              return fullOrderCacheRef.current.get(order.docCode)!;
            }
            
            // Nếu không có sales, fetch full data
            if (!order.sales || order.sales.length === 0) {
              try {
                const response = await salesApi.getByOrderCode(order.docCode);
                const fullOrder = normalizeOrderData([response.data])[0];
                // Lưu vào cache
                fullOrderCacheRef.current.set(order.docCode, fullOrder);
                return fullOrder;
              } catch (error) {
                console.error(`Error fetching full data for order ${order.docCode}:`, error);
                return order;
              }
            }
            
            return order;
          })
        );
        
        // Enrich với products và departments
        const enriched = await enrichOrdersWithProducts(ordersWithFullData);
        setEnrichedDisplayedOrders(enriched);
      } catch (error) {
        console.error('Error enriching orders:', error);
        setEnrichedDisplayedOrders(displayedOrders);
      } finally {
        setEnriching(false);
      }
    };

    enrichDisplayed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedOrders]);

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
    // Convert string numbers to number first
    // Xử lý cả string numbers (như "118000.00", "118000", "118.000,00", "118,000.00")
    if (typeof value === 'string' && value.trim() !== '') {
      // Thử parse trực tiếp trước (cho số thuần như "118000.00" hoặc "118000")
      let numValue = parseFloat(value);
      
      // Nếu parse trực tiếp không được (có dấu phân cách hàng nghìn), thử clean trước
      if (isNaN(numValue) || String(numValue).replace('.', '') !== value.replace(/[^\d]/g, '')) {
        // Format VN: "118.000,00" → loại bỏ dấu chấm, thay dấu phẩy bằng dấu chấm
        // Format US: "118,000.00" → loại bỏ dấu phẩy, giữ dấu chấm
        let cleanedValue = value;
        // Nếu có dấu phẩy ở cuối (sau 2-3 chữ số) → format VN
        if (/,(\d{1,3})$/.test(value)) {
          cleanedValue = value.replace(/\./g, '').replace(',', '.');
        } else {
          // Format US hoặc số thuần, chỉ loại bỏ dấu phẩy (phân cách hàng nghìn)
          cleanedValue = value.replace(/,/g, '');
        }
        numValue = parseFloat(cleanedValue);
      }
      
      if (!isNaN(numValue)) {
        // Format tất cả số tiền đều có 2 chữ số thập phân và nhất quán
        // Sử dụng locale 'vi-VN' với dấu chấm (.) phân cách hàng nghìn, dấu phẩy (,) phân cách thập phân
        return numValue.toLocaleString('vi-VN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      }
    }
    if (typeof value === 'number') {
      // Format tất cả số tiền đều có 2 chữ số thập phân và nhất quán
      // Sử dụng locale 'vi-VN' với dấu chấm (.) phân cách hàng nghìn, dấu phẩy (,) phân cách thập phân
      return value.toLocaleString('vi-VN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
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
            <div className="text-sm font-medium text-gray-900">{order.customer?.name || '-'}</div>
          </div>
        );
      case 'customerMobile':
        return <div className="text-sm text-gray-900">{order.customer?.mobile || '-'}</div>;
      case 'customerSexual':
        return <div className="text-sm text-gray-900">{order.customer?.sexual || '-'}</div>;
      case 'customerAddress':
        return <div className="text-sm text-gray-900">{order.customer?.address || '-'}</div>;
      case 'customerProvince':
        return <div className="text-sm text-gray-900">{order.customer?.province_name || '-'}</div>;
      case 'customerGrade':
        return <div className="text-sm text-gray-900">{order.customer?.grade_name || '-'}</div>;
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
        // Chỉ hiển thị "Khuyến mãi" cho hàng tặng (giaBan = 0 và tienHang = 0 và revenue = 0)
        // Convert string to number nếu cần
        const tienHangForPromCode = parseFloat(String(sale?.linetotal ?? sale?.tienHang ?? 0)) || 0;
        const revenueForPromCode = parseFloat(String(sale?.revenue ?? 0)) || 0;
        // Ưu tiên sử dụng giaBan từ API (từ field price), nếu không có thì tính từ tienHang/qty
        let giaBanForPromCode: number = parseFloat(String(sale?.giaBan ?? 0)) || 0;
        if (giaBanForPromCode === 0 && tienHangForPromCode != null && sale?.qty != null) {
          const qtyNum = parseFloat(String(sale.qty)) || 0;
          if (qtyNum > 0) {
            giaBanForPromCode = tienHangForPromCode / qtyNum;
          }
        }
        
        // Lấy brand để phân biệt logic F3
        const brandForPromCode = order?.customer?.brand || order?.brand || '';
        let brandLowerForPromCode = (brandForPromCode || '').toLowerCase().trim();
        // Normalize: "facialbar" → "f3"
        if (brandLowerForPromCode === 'facialbar') {
          brandLowerForPromCode = 'f3';
        }
        
        const hasPromCodeForPromCode = sale?.promCode && String(sale.promCode).trim() !== '';
        let isTangHangForPromCode = giaBanForPromCode === 0 && tienHangForPromCode === 0 && revenueForPromCode === 0;
        
        // Với F3: Nếu có promCode và giaBan = 0 && tienHang = 0 → là "mua hàng giảm giá" (giảm 100%), không phải "tặng hàng"
        if (brandLowerForPromCode === 'f3' && hasPromCodeForPromCode && isTangHangForPromCode) {
          isTangHangForPromCode = false;
        }
        
        // Các ordertype dịch vụ không được coi là hàng tặng (không hiển thị "1")
        const ordertypeNameForPromCode = sale?.ordertype || '';
        const isDichVuForPromCode = ordertypeNameForPromCode.includes('02. Làm dịch vụ') || 
                                     ordertypeNameForPromCode.includes('04. Đổi DV') ||
                                     ordertypeNameForPromCode.includes('08. Tách thẻ') ||
                                     ordertypeNameForPromCode.includes('Đổi thẻ KEEP->Thẻ DV');
        if (isDichVuForPromCode) {
          isTangHangForPromCode = false;
        }
        
        // Kiểm tra có mã số thẻ (maThe) không - nếu có thì km_yn = 0 (không hiển thị "1")
        const hasMaTheForPromCode = sale?.maThe && String(sale.maThe).trim() !== '';
        // Kiểm tra nếu ma_ctkm_th = "TT DAU TU" thì cũng không hiển thị "1"
        // Nếu chưa có từ backend, tính toán lại từ ordertype
        let maCtkmTangHangForPromCode = sale?.maCtkmTangHang || '';
        if (!maCtkmTangHangForPromCode && isTangHangForPromCode) {
          if (ordertypeNameForPromCode.includes('06. Đầu tư') || ordertypeNameForPromCode.includes('06.Đầu tư')) {
            maCtkmTangHangForPromCode = 'TT DAU TU';
          }
        }
        const isTTDauTuForPromCode = maCtkmTangHangForPromCode.trim() === 'TT DAU TU';
        
        // Nếu có mã số thẻ (maThe) hoặc ma_ctkm_th = "TT DAU TU" thì không hiển thị "1"
        if (hasMaTheForPromCode || isTTDauTuForPromCode) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Chỉ hiển thị khi là hàng tặng → hiển thị "1" (giống km_yn = 1 trong backend)
        if (isTangHangForPromCode) {
          return <div className="text-sm text-gray-900">1</div>;
        }

        // Các trường hợp khác (không phải hàng tặng) → bỏ trống
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'muaHangGiamGia':
        // Chỉ hiển thị khi không phải hàng tặng
        // Hàng tặng: price = 0 và mn_linetotal = 0 và revenue = 0 (hoặc giaBan = 0 và tienHang = 0 và revenue = 0)
        // Convert string to number nếu cần
        const tienHangForMuaHangGiamGiaRender = parseFloat(String(sale?.linetotal ?? sale?.tienHang ?? 0)) || 0;
        const revenueForMuaHangGiamGiaRender = parseFloat(String(sale?.revenue ?? 0)) || 0;
        // Ưu tiên sử dụng giaBan từ API (từ field price), nếu không có thì tính từ tienHang/qty
        let giaBanForMuaHangGiamGiaRender: number = parseFloat(String(sale?.giaBan ?? 0)) || 0;
        if (giaBanForMuaHangGiamGiaRender === 0 && tienHangForMuaHangGiamGiaRender != null && sale?.qty != null) {
          const qtyNum = parseFloat(String(sale.qty)) || 0;
          if (qtyNum > 0) {
            giaBanForMuaHangGiamGiaRender = tienHangForMuaHangGiamGiaRender / qtyNum;
          }
        }
        
        // Lấy brand để phân biệt logic F3
        const brandForMuaHangGiamGia = order?.customer?.brand || order?.brand || '';
        let brandLowerForMuaHangGiamGia = (brandForMuaHangGiamGia || '').toLowerCase().trim();
        // Normalize: "facialbar" → "f3"
        if (brandLowerForMuaHangGiamGia === 'facialbar') {
          brandLowerForMuaHangGiamGia = 'f3';
        }
        
        const hasPromCodeForMuaHangGiamGia = sale?.promCode && String(sale.promCode).trim() !== '';
        const isTangHangForMuaHangGiamGia = giaBanForMuaHangGiamGiaRender === 0 && tienHangForMuaHangGiamGiaRender === 0 && revenueForMuaHangGiamGiaRender === 0;
        
        // Với F3: Nếu có promCode và giaBan = 0 && tienHang = 0 → là "mua hàng giảm giá" (giảm 100%), không phải "tặng hàng"
        // → Hiển thị ở cột này
        if (brandLowerForMuaHangGiamGia === 'f3' && hasPromCodeForMuaHangGiamGia && isTangHangForMuaHangGiamGia) {
          const displayCode = sale?.promotionDisplayCode || sale?.promCode;
          if (displayCode) {
            return <div className="text-sm text-gray-900">{displayCode}</div>;
          }
        }
        
        // Nếu là hàng tặng (giaBan = 0 và tienHang = 0 và revenue = 0), không hiển thị ở cột này
        if (isTangHangForMuaHangGiamGia) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Sử dụng promotionDisplayCode từ backend
        const displayCode = sale?.promotionDisplayCode || sale?.promCode;
        if (!displayCode) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-900">{displayCode}</div>;
      case 'maCtkmTangHang':
        // Ưu tiên sử dụng maCtkmTangHang từ backend (nếu đã được tính sẵn)
        if (sale?.maCtkmTangHang && sale.maCtkmTangHang.trim() !== '') {
          return <div className="text-sm text-gray-900">{sale.maCtkmTangHang}</div>;
        }
        // Nếu không có, tính toán lại: chỉ hiển thị khi là hàng tặng (price = 0 và mn_linetotal = 0 và revenue = 0)
        // Convert string to number nếu cần
        const tienHangForTangHangRender = parseFloat(String(sale?.linetotal ?? sale?.tienHang ?? 0)) || 0;
        const revenueForTangHangRender = parseFloat(String(sale?.revenue ?? 0)) || 0;
        // Ưu tiên sử dụng giaBan từ API (từ field price), nếu không có thì tính từ tienHang/qty
        let giaBanForTangHangRender: number = parseFloat(String(sale?.giaBan ?? 0)) || 0;
        if (giaBanForTangHangRender === 0 && tienHangForTangHangRender != null && sale?.qty != null) {
          const qtyNum = parseFloat(String(sale.qty)) || 0;
          if (qtyNum > 0) {
            giaBanForTangHangRender = tienHangForTangHangRender / qtyNum;
          }
        }
        // Lấy brand để phân biệt logic F3
        const brandForTangHang = order?.customer?.brand || order?.brand || '';
        let brandLowerForTangHang = (brandForTangHang || '').toLowerCase().trim();
        // Normalize: "facialbar" → "f3"
        if (brandLowerForTangHang === 'facialbar') {
          brandLowerForTangHang = 'f3';
        }
        
        const hasPromCodeForTangHang = sale?.promCode && String(sale.promCode).trim() !== '';
        const isTangHangForTangHangRender = giaBanForTangHangRender === 0 && tienHangForTangHangRender === 0 && revenueForTangHangRender === 0;
        
        // Với F3: Nếu có promCode và giaBan = 0 && tienHang = 0 → là "mua hàng giảm giá" (giảm 100%), không phải "tặng hàng"
        // → Không hiển thị ở cột này
        if (brandLowerForTangHang === 'f3' && hasPromCodeForTangHang && isTangHangForTangHangRender) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Nếu là hàng tặng (giaBan = 0 và tienHang = 0 và revenue = 0)
        if (isTangHangForTangHangRender) {
          // Quy tắc: Nếu ordertype_name = "06. Đầu tư" → ma_ctkm_th = "TT DAU TU"
          const ordertypeName = sale?.ordertype || '';
          if (ordertypeName.includes('06. Đầu tư') || ordertypeName.includes('06.Đầu tư')) {
            return <div className="text-sm text-gray-900">TT DAU TU</div>;
          }
          
          // Nếu ordertype_name = "01.Thường", "07. Bán tài khoản", "9. Sàn TMDT" → quy đổi prom_code sang TANGSP
          if (
            (ordertypeName.includes('01.Thường') || ordertypeName.includes('01. Thường')) ||
            (ordertypeName.includes('07. Bán tài khoản') || ordertypeName.includes('07.Bán tài khoản')) ||
            (ordertypeName.includes('9. Sàn TMDT') || ordertypeName.includes('9.Sàn TMDT'))
          ) {
            const promCodeValue = sale?.promCode || '';
            if (promCodeValue && promCodeValue.trim() !== '') {
              const tangSpCode = convertPromCodeToTangSp(promCodeValue);
              if (tangSpCode) {
                return <div className="text-sm text-gray-900">{tangSpCode}</div>;
              }
            }
          }
          
          // Các trường hợp khác: hiển thị promCode (đã parse) nếu có
          const promCodeValue = sale?.promotionDisplayCode || sale?.promCode;
          if (!promCodeValue || promCodeValue.trim() === '') {
            return <div className="text-sm text-gray-400 italic">-</div>;
          }
          // Parse promCode từ format "Code-Name" để lấy code
          const tangHangCode = parsePromCode(promCodeValue) || promCodeValue;
          if (tangHangCode && tangHangCode.trim() !== '') {
            return <div className="text-sm text-gray-900">{tangHangCode}</div>;
          }
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'maKho':
        // Sử dụng maKho từ backend (đã được tính sẵn)
        return <div className="text-sm text-gray-900">{sale?.maKho || '-'}</div>;
      case 'maLo':
        // Hiển thị ma_lo - ưu tiên lấy từ backend nếu có, nếu không thì tính toán
        // Nếu có ma_lo từ backend (đã được tính sẵn), dùng nó
        if (sale?.maLo) {
          return <div className="text-sm text-gray-900">{sale.maLo}</div>;
        }
        
        // Nếu không có, tính toán từ serial
        const serial = sale?.serial || '';
        if (serial) {
          // Lấy brand để phân biệt logic cho F3
          const brand = order.customer?.brand || order.brand || '';
          const brandLower = (brand || '').toLowerCase().trim();
          
          // Kiểm tra nếu serial có dạng "XXX_YYYY" (có dấu gạch dưới), lấy phần sau dấu gạch dưới
          const underscoreIndex = serial.indexOf('_');
          if (underscoreIndex > 0 && underscoreIndex < serial.length - 1) {
            // Lấy phần sau dấu gạch dưới
            const maLo = serial.substring(underscoreIndex + 1);
            return <div className="text-sm text-gray-900">{maLo}</div>;
          }
          
          // Nếu không có dấu gạch dưới, kiểm tra trackBatch
        const trackBatchRender = sale?.product?.trackBatch === true;
        if (trackBatchRender) {
            // Với F3, lấy toàn bộ serial (không cắt, không xử lý)
            if (brandLower === 'f3') {
              return <div className="text-sm text-gray-900">{serial}</div>;
            }
            
            // Các brand khác: tính toán theo productType
          let maLo = serial;
            const productTypeFromLoyaltyRender = sale?.productType || sale?.product?.productType;
            const productTypeUpperRender = productTypeFromLoyaltyRender ? String(productTypeFromLoyaltyRender).toUpperCase().trim() : null;
            if (productTypeUpperRender === 'TPCN') {
              // Nếu productType là "TPCN", cắt lấy 8 ký tự cuối
              maLo = serial.length >= 8 ? serial.slice(-8) : serial;
            } else if (productTypeUpperRender === 'SKIN' || productTypeUpperRender === 'GIFT') {
              // Nếu productType là "SKIN" hoặc "GIFT", cắt lấy 4 ký tự cuối
              maLo = serial.length >= 4 ? serial.slice(-4) : serial;
            } else {
              // Các trường hợp khác → lấy 4 ký tự cuối (mặc định)
              maLo = serial.length >= 4 ? serial.slice(-4) : serial;
            }
            return <div className="text-sm text-gray-900">{maLo}</div>;
          }
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'qty':
        // Hiển thị số lượng dưới dạng số thuần túy (không format)
        const qtyNum = sale?.qty ?? null;
        return qtyNum !== null && qtyNum !== undefined ? <div className="text-sm text-gray-900">{Math.round(Number(qtyNum))}</div> : <div className="text-sm text-gray-400 italic">-</div>;
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

        // Hiển thị giá bán dưới dạng số thuần túy (không format, không có phần thập phân)
        if (giaBan !== null && giaBan !== undefined) {
          const numValue = Number(giaBan);
          // Làm tròn về số nguyên và format để loại bỏ .00
          const intValue = Math.round(numValue);
          // Convert sang string và loại bỏ phần thập phân nếu có
          const displayValue = intValue.toString().replace(/\.0+$/, '');
          return <div className="text-sm text-gray-900">{displayValue}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'tienHang':
        // Ưu tiên linetotal (thành tiền của dòng), nếu không có thì dùng tienHang
        const tienHangValue = sale?.linetotal ?? sale?.tienHang;
        // Hiển thị tiền hàng dưới dạng số thuần túy (không format, không có phần thập phân)
        if (tienHangValue !== null && tienHangValue !== undefined) {
          // Convert sang number và làm tròn về số nguyên
          const numValue = typeof tienHangValue === 'string' ? parseFloat(tienHangValue) : Number(tienHangValue);
          const intValue = Math.round(numValue);
          // Hiển thị số nguyên (React sẽ tự động loại bỏ .00 khi render số nguyên)
          return <div className="text-sm text-gray-900">{intValue}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
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
        // Với F3, mặc định cục thuế là "FBV" nếu chưa có
        const brandForCucThue = order.customer?.brand || order.brand || '';
        const brandLowerForCucThue = (brandForCucThue || '').toLowerCase().trim();
        const cucThueValue = sale?.cucThue || (brandLowerForCucThue === 'f3' ? 'FBV' : null);
        return <div className="text-sm text-gray-900">{cucThueValue || '-'}</div>;
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
        // Hiển thị chiết khấu giảm giá dưới dạng số thuần túy (không format, không có phần thập phân)
        const other_discamt = sale?.other_discamt ?? 0;
        const numOtherDiscamt = Number(other_discamt);
        // Làm tròn về số nguyên và format để loại bỏ .00
        const intOtherDiscamt = Math.round(numOtherDiscamt);
        // Convert sang string và loại bỏ phần thập phân nếu có
        const displayOtherDiscamt = intOtherDiscamt.toString().replace(/\.0+$/, '');
        return <div className="text-sm text-gray-900">{displayOtherDiscamt}</div>;
      case 'muaHangCkVip':
        // Nếu đã có muaHangCkVip từ backend, hiển thị ngay
        if (sale?.muaHangCkVip) {
          return <div className="text-sm text-gray-900">{sale.muaHangCkVip}</div>;
        }
        // Nếu có chiết khấu VIP (grade_discamt > 0) nhưng chưa có mã, tính VIP type
        const gradeDiscamtForMuaHangCkVipRender = sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0;
        if (gradeDiscamtForMuaHangCkVipRender > 0) {
          // Lấy brand từ order để phân biệt logic VIP
          const brand = order.customer?.brand || order.brand || '';
          const brandLower = (brand || '').toLowerCase().trim();
          
          const productType = sale?.productType || sale?.product?.productType || sale?.product?.producttype || null;
          
          let muaHangCkVipValue = '';
          
          // Logic VIP khác nhau cho từng brand
          if (brandLower === 'f3') {
            // Logic cũ cho f3: DIVU → "FBV CKVIP DV", còn lại → "FBV CKVIP SP"
            if (productType === 'DIVU') {
              muaHangCkVipValue = 'FBV CKVIP DV';
            } else {
              muaHangCkVipValue = 'FBV CKVIP SP';
            }
          } else {
            // Logic mới cho các brand khác (menard, labhair, yaman)
            const materialCode = sale?.product?.maVatTu || sale?.product?.materialCode || sale?.itemCode || null;
            const code = sale?.itemCode || null;
            const trackInventory = sale?.trackInventory ?? sale?.product?.trackInventory ?? null;
            const trackSerial = (sale?.product as any)?.trackSerial ?? null;
            
            // Nếu productType == "DIVU"
            if (productType === 'DIVU') {
              muaHangCkVipValue = 'VIP DV MAT';
            } else if (productType === 'VOUC') {
              // Nếu productType == "VOUC" → "VIP VC MP"
              muaHangCkVipValue = 'VIP VC MP';
            } else {
              // Nếu materialCode bắt đầu bằng "E." hoặc "VC" có trong code/materialCode/itemCode hoặc (trackInventory == False và trackSerial == True)
              const materialCodeStr = materialCode || '';
              const codeStr = code || '';
              const itemCodeStr = sale?.itemCode || '';
              // Kiểm tra "VC" trong materialCode, code, hoặc itemCode (không phân biệt hoa thường)
              const hasVC = 
                materialCodeStr.toUpperCase().includes('VC') ||
                codeStr.toUpperCase().includes('VC') ||
                itemCodeStr.toUpperCase().includes('VC');
              
              if (
                materialCodeStr.startsWith('E.') ||
                hasVC ||
                (trackInventory === false && trackSerial === true)
              ) {
                muaHangCkVipValue = 'VIP VC MP';
              } else {
                // Ngược lại
                muaHangCkVipValue = 'VIP MP';
              }
            }
          }
          
          if (muaHangCkVipValue) {
            return <div className="text-sm text-gray-900">{muaHangCkVipValue}</div>;
          }
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'chietKhauMuaHangCkVip':
        // Lấy giá trị từ grade_discamt trong đơn hàng
        const gradeDiscamt = sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0;
        return <div className="text-sm text-gray-900">{formatValue(gradeDiscamt)}</div>;
      case 'thanhToanCoupon':
        // Hiển thị mã coupon nếu có
        const maCoupon = (sale as any)?.maCk04 || (sale?.thanhToanCoupon && sale?.thanhToanCoupon > 0 ? 'COUPON' : null);
        if (maCoupon) {
          return <div className="text-sm text-gray-900">{maCoupon}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'chietKhauThanhToanCoupon':
        // Chiết khấu thanh toán coupon
        const chietKhauCoupon = sale?.chietKhauThanhToanCoupon ?? (sale as any)?.chietKhau09 ?? 0;
        if (chietKhauCoupon > 0) {
          return <div className="text-sm text-gray-900">{formatValue(chietKhauCoupon)}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'chietKhauThanhToanVoucher':
        // Chiết khấu voucher chính: chỉ hiển thị nếu không phải voucher dự phòng và không phải ECOIN
        // Nếu có ECOIN thì không hiển thị voucher
        const chietKhauTkTienAoForVoucherCheck = sale?.chietKhauThanhToanTkTienAo ?? 0;
        const isEcoinForVoucherCheck = order?.cashioFopSyscode === 'ECOIN';
        const cashioTotalInForVoucherCheck = order?.cashioTotalIn ?? 0;
        
        // Check nếu có ECOIN: chietKhauThanhToanTkTienAo > 0 HOẶC (cashioFopSyscode = 'ECOIN' và có cashioTotalIn > 0)
        if (chietKhauTkTienAoForVoucherCheck > 0 || (isEcoinForVoucherCheck && cashioTotalInForVoucherCheck > 0)) {
          // Có ECOIN → không hiển thị voucher
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Convert sang number để so sánh đúng
        const chietKhauVoucherDp1ForChietKhau = Number(sale?.chietKhauVoucherDp1 ?? 0) || 0;
        const pkgCodeForChietKhauVoucher = (sale as any)?.pkg_code || (sale as any)?.pkgCode || null;
        const promCodeForChietKhauVoucher = sale?.promCode || null;
        const soSourceForChietKhauVoucher = sale?.order_source || (sale as any)?.so_source || null;
        const paidByVoucherForChietKhau = Number(sale?.paid_by_voucher_ecode_ecoin_bp ?? sale?.chietKhauThanhToanVoucher ?? 0) || 0;
        
        // Kiểm tra điều kiện voucher dự phòng - Logic giống hệt backend
        // Xác định isVoucherDuPhong dựa trên so_source và prom_code/pkg_code (KHÔNG check chietKhauVoucherDp1)
        const brandForChietKhau = order?.customer?.brand || order?.brand || '';
        const brandLowerForChietKhau = (brandForChietKhau || '').toLowerCase().trim();
        const isShopeeForChietKhau = Boolean(soSourceForChietKhauVoucher && String(soSourceForChietKhauVoucher).toUpperCase() === 'SHOPEE');
        const hasPkgCodeForChietKhau = pkgCodeForChietKhauVoucher && pkgCodeForChietKhauVoucher.trim() !== '';
        const hasPromCodeForChietKhau = promCodeForChietKhauVoucher && promCodeForChietKhauVoucher.trim() !== '';
        
        // Xác định voucher dự phòng theo logic mới (giống backend)
        let isVoucherDuPhongForChietKhau: boolean = false;
        if (brandLowerForChietKhau === 'f3') {
          // Với F3: Chỉ khi so_source = "SHOPEE" mới là voucher dự phòng
          isVoucherDuPhongForChietKhau = isShopeeForChietKhau;
        } else {
          // Với các brand khác: SHOPEE hoặc (có prom_code và không có pkg_code)
          isVoucherDuPhongForChietKhau = isShopeeForChietKhau || Boolean(hasPromCodeForChietKhau && !hasPkgCodeForChietKhau);
        }
        
        // DEBUG LOG
        console.log('[chietKhauThanhToanVoucher]', {
          itemCode: sale?.itemCode,
          brand: brandForChietKhau,
          brandLower: brandLowerForChietKhau,
          soSource: soSourceForChietKhauVoucher,
          isShopee: isShopeeForChietKhau,
          promCode: promCodeForChietKhauVoucher,
          pkgCode: pkgCodeForChietKhauVoucher,
          hasPromCode: hasPromCodeForChietKhau,
          hasPkgCode: hasPkgCodeForChietKhau,
          chietKhauVoucherDp1: chietKhauVoucherDp1ForChietKhau,
          paidByVoucher: paidByVoucherForChietKhau,
          isVoucherDuPhong: isVoucherDuPhongForChietKhau,
        });
        
        // Nếu có chietKhauVoucherDp1 > 0 nhưng theo logic mới không phải voucher dự phòng
        // → Chuyển sang voucher chính (dữ liệu cũ đã sync với logic cũ)
        // Frontend: Nếu không phải voucher dự phòng, hiển thị là voucher chính
        if (chietKhauVoucherDp1ForChietKhau > 0 && !isVoucherDuPhongForChietKhau) {
          // Chuyển sang voucher chính - không ẩn, sẽ hiển thị giá trị
          isVoucherDuPhongForChietKhau = false;
        }
        
        // Chỉ ẩn nếu thực sự là voucher dự phòng VÀ có paid_by_voucher > 0
        if (isVoucherDuPhongForChietKhau && paidByVoucherForChietKhau > 0) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Hiển thị giá trị voucher chính
        // Nếu có chietKhauVoucherDp1 > 0 nhưng không phải voucher dự phòng (dữ liệu cũ)
        // → Hiển thị giá trị đó như voucher chính (giống backend logic)
        const chietKhauThanhToanVoucher = chietKhauVoucherDp1ForChietKhau > 0 && !isVoucherDuPhongForChietKhau
          ? chietKhauVoucherDp1ForChietKhau
          : paidByVoucherForChietKhau;
        
        console.log('[chietKhauThanhToanVoucher] Final value:', chietKhauThanhToanVoucher);
        
        if (chietKhauThanhToanVoucher > 0) {
        return <div className="text-sm text-gray-900">{formatValue(chietKhauThanhToanVoucher)}</div>;
        }
        
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'thanhToanVoucher':
        // Mã voucher chính: chỉ hiển thị nếu không phải voucher dự phòng và không phải ECOIN
        // Nếu có ECOIN thì không hiển thị voucher
        const chietKhauTkTienAoForVoucherLabel = sale?.chietKhauThanhToanTkTienAo ?? 0;
        const isEcoinForVoucherLabel = order?.cashioFopSyscode === 'ECOIN';
        const cashioTotalInForVoucherLabel = order?.cashioTotalIn ?? 0;
        
        // Check nếu có ECOIN: chietKhauThanhToanTkTienAo > 0 HOẶC (cashioFopSyscode = 'ECOIN' và có cashioTotalIn > 0)
        if (chietKhauTkTienAoForVoucherLabel > 0 || (isEcoinForVoucherLabel && cashioTotalInForVoucherLabel > 0)) {
          // Có ECOIN → không hiển thị voucher
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Convert sang number để so sánh đúng
        const chietKhauVoucherDp1ForLabel = Number(sale?.chietKhauVoucherDp1 ?? 0) || 0;
        const pkgCodeForLabel = (sale as any)?.pkg_code || (sale as any)?.pkgCode || null;
        const promCodeForLabel = sale?.promCode || null;
        const soSourceForLabel = sale?.order_source || (sale as any)?.so_source || null;
        const paidByVoucherForLabel = Number(sale?.paid_by_voucher_ecode_ecoin_bp ?? 0) || 0;
        
        // Kiểm tra điều kiện voucher dự phòng - Logic giống hệt backend
        // Xác định isVoucherDuPhong dựa trên so_source và prom_code/pkg_code (KHÔNG check chietKhauVoucherDp1)
        const brandForLabel = order?.customer?.brand || order?.brand || '';
        const brandLowerForLabel = (brandForLabel || '').toLowerCase().trim();
        const isShopeeForLabel = Boolean(soSourceForLabel && String(soSourceForLabel).toUpperCase() === 'SHOPEE');
        const hasPkgCodeForLabel = pkgCodeForLabel && pkgCodeForLabel.trim() !== '';
        const hasPromCodeForLabel = promCodeForLabel && promCodeForLabel.trim() !== '';
        
        // Xác định voucher dự phòng theo logic mới (giống backend)
        let isVoucherDuPhongForLabel: boolean = false;
        if (brandLowerForLabel === 'f3') {
          // Với F3: Chỉ khi so_source = "SHOPEE" mới là voucher dự phòng
          isVoucherDuPhongForLabel = isShopeeForLabel;
        } else {
          // Với các brand khác: SHOPEE hoặc (có prom_code và không có pkg_code)
          isVoucherDuPhongForLabel = isShopeeForLabel || Boolean(hasPromCodeForLabel && !hasPkgCodeForLabel);
        }
        
        // DEBUG LOG
        console.log('[thanhToanVoucher]', {
          itemCode: sale?.itemCode,
          brand: brandForLabel,
          brandLower: brandLowerForLabel,
          soSource: soSourceForLabel,
          isShopee: isShopeeForLabel,
          promCode: promCodeForLabel,
          pkgCode: pkgCodeForLabel,
          hasPromCode: hasPromCodeForLabel,
          hasPkgCode: hasPkgCodeForLabel,
          chietKhauVoucherDp1: chietKhauVoucherDp1ForLabel,
          paidByVoucher: paidByVoucherForLabel,
          isVoucherDuPhong: isVoucherDuPhongForLabel,
        });
        
        // Nếu có chietKhauVoucherDp1 > 0 nhưng theo logic mới không phải voucher dự phòng
        // → Chuyển sang voucher chính (dữ liệu cũ đã sync với logic cũ)
        // Frontend: Nếu không phải voucher dự phòng, hiển thị label voucher chính
        if (chietKhauVoucherDp1ForLabel > 0 && !isVoucherDuPhongForLabel) {
          // Chuyển sang voucher chính - không ẩn, sẽ hiển thị label
          isVoucherDuPhongForLabel = false;
        }
        
        if (isVoucherDuPhongForLabel) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Truyền customer từ order vào sale để tính brand
        // Nếu có chietKhauVoucherDp1 > 0 nhưng không phải voucher dự phòng (dữ liệu cũ)
        // → Truyền giá trị đó vào paid_by_voucher_ecode_ecoin_bp để tính label
        const paidByVoucherForLabelCalc = chietKhauVoucherDp1ForLabel > 0 && !isVoucherDuPhongForLabel
          ? chietKhauVoucherDp1ForLabel
          : paidByVoucherForLabel;
        
        const saleWithCustomerForRender = sale ? {
          paid_by_voucher_ecode_ecoin_bp: paidByVoucherForLabelCalc,
          revenue: sale.revenue,
          linetotal: sale.linetotal,
          tienHang: sale.tienHang,
          cat1: sale.cat1,
          catcode1: sale.catcode1,
          itemCode: sale.itemCode,
          productType: sale.productType || sale.product?.productType || sale.product?.producttype || null,
          trackInventory: sale.trackInventory ?? sale.product?.trackInventory ?? null,
          customer: order.customer,
          product: sale.product,
        } : null;
        const voucherLabels = calculateThanhToanVoucher(saleWithCustomerForRender);
        if (!voucherLabels) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        return <div className="text-sm text-gray-900">{voucherLabels}</div>;
      case 'soSerial':
        // Hiển thị so_serial dựa trên trackSerial từ Loyalty API
        // trackSerial = true và trackBatch = false → hiển thị so_serial
        // Nhưng không hiển thị nếu serial có dạng "XXX_YYYY" (đã dùng cho ma_lo)
        const trackSerialRender = sale?.product?.trackSerial === true;
        const trackBatchForSoSerialRender = sale?.product?.trackBatch === true;
        const serialForSoSerial = sale?.serial || '';
        
        // Nếu serial có dạng "XXX_YYYY", không hiển thị so_serial (đã dùng cho ma_lo)
        if (serialForSoSerial && serialForSoSerial.indexOf('_') > 0) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        if (trackSerialRender && !trackBatchForSoSerialRender) {
          return <div className="text-sm text-gray-900">{serialForSoSerial || '-'}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'voucherDp1':
        // Hiển thị mã voucher dự phòng: "VC CTKM SÀN" nếu thực sự là voucher dự phòng
        // Logic giống hệt backend: xác định dựa trên so_source và prom_code/pkg_code
        const brandForVoucherDp1 = order?.customer?.brand || order?.brand || '';
        const brandLowerForVoucherDp1 = (brandForVoucherDp1 || '').toLowerCase().trim();
        const pkgCodeForVoucherDp1 = (sale as any)?.pkg_code || (sale as any)?.pkgCode || null;
        const promCodeForVoucherDp1 = sale?.promCode || null;
        const soSourceForVoucherDp1 = sale?.order_source || (sale as any)?.so_source || null;
        const paidByVoucherForVoucherDp1 = sale?.paid_by_voucher_ecode_ecoin_bp ?? 0;
        const chietKhauVoucherDp1ForVoucherDp1 = sale?.chietKhauVoucherDp1 ?? 0;
        
        // Kiểm tra điều kiện voucher dự phòng
        const isShopeeForVoucherDp1 = soSourceForVoucherDp1 && String(soSourceForVoucherDp1).toUpperCase() === 'SHOPEE';
        const hasPkgCodeForVoucherDp1 = pkgCodeForVoucherDp1 && pkgCodeForVoucherDp1.trim() !== '';
        const hasPromCodeForVoucherDp1 = promCodeForVoucherDp1 && promCodeForVoucherDp1.trim() !== '';
        
        // Xác định voucher dự phòng theo logic mới (giống backend)
        let isVoucherDuPhongForVoucherDp1 = false;
        if (brandLowerForVoucherDp1 === 'f3') {
          // Với F3: Chỉ khi so_source = "SHOPEE" mới là voucher dự phòng
          isVoucherDuPhongForVoucherDp1 = isShopeeForVoucherDp1;
        } else {
          // Với các brand khác: SHOPEE hoặc (có prom_code và không có pkg_code)
          isVoucherDuPhongForVoucherDp1 = isShopeeForVoucherDp1 || (hasPromCodeForVoucherDp1 && !hasPkgCodeForVoucherDp1);
        }
        
        // Nếu có chietKhauVoucherDp1 > 0 nhưng theo logic mới không phải voucher dự phòng
        // → Không hiển thị (đã chuyển sang voucher chính)
        if (chietKhauVoucherDp1ForVoucherDp1 > 0 && !isVoucherDuPhongForVoucherDp1) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Chỉ hiển thị nếu thực sự là voucher dự phòng VÀ có giá trị
        if (isVoucherDuPhongForVoucherDp1 && (chietKhauVoucherDp1ForVoucherDp1 > 0 || paidByVoucherForVoucherDp1 > 0)) {
          return <div className="text-sm text-gray-900">VC CTKM SÀN</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'chietKhauVoucherDp1':
        // Hiển thị chiết khấu voucher dự phòng
        // Logic giống hệt backend: xác định dựa trên so_source và prom_code/pkg_code
        const brandForChietKhauDp1 = order?.customer?.brand || order?.brand || '';
        const brandLowerForChietKhauDp1 = (brandForChietKhauDp1 || '').toLowerCase().trim();
        const chietKhauVoucherDp1Value = sale?.chietKhauVoucherDp1 ?? 0;
        const pkgCodeForChietKhauDp1 = (sale as any)?.pkg_code || (sale as any)?.pkgCode || null;
        const promCodeForChietKhauDp1 = sale?.promCode || null;
        const soSourceForChietKhauDp1 = sale?.order_source || (sale as any)?.so_source || null;
        const paidByVoucherForChietKhauDp1 = sale?.paid_by_voucher_ecode_ecoin_bp ?? 0;
        
        // Kiểm tra điều kiện voucher dự phòng
        const isShopeeForChietKhauDp1 = soSourceForChietKhauDp1 && String(soSourceForChietKhauDp1).toUpperCase() === 'SHOPEE';
        const hasPkgCodeForChietKhauDp1 = pkgCodeForChietKhauDp1 && pkgCodeForChietKhauDp1.trim() !== '';
        const hasPromCodeForChietKhauDp1 = promCodeForChietKhauDp1 && promCodeForChietKhauDp1.trim() !== '';
        
        // Xác định voucher dự phòng theo logic mới (giống backend)
        let isVoucherDuPhongForChietKhauDp1 = false;
        if (brandLowerForChietKhauDp1 === 'f3') {
          // Với F3: Chỉ khi so_source = "SHOPEE" mới là voucher dự phòng
          isVoucherDuPhongForChietKhauDp1 = isShopeeForChietKhauDp1;
        } else {
          // Với các brand khác: SHOPEE hoặc (có prom_code và không có pkg_code)
          isVoucherDuPhongForChietKhauDp1 = isShopeeForChietKhauDp1 || (hasPromCodeForChietKhauDp1 && !hasPkgCodeForChietKhauDp1);
        }
        
        // Nếu có chietKhauVoucherDp1 > 0 nhưng theo logic mới không phải voucher dự phòng
        // → Không hiển thị (đã chuyển sang voucher chính)
        if (chietKhauVoucherDp1Value > 0 && !isVoucherDuPhongForChietKhauDp1) {
          return <div className="text-sm text-gray-400 italic">-</div>;
        }
        
        // Chỉ hiển thị nếu thực sự là voucher dự phòng VÀ có giá trị
        let chietKhauVoucherDp1Final = chietKhauVoucherDp1Value;
        if (chietKhauVoucherDp1Final === 0 && isVoucherDuPhongForChietKhauDp1 && paidByVoucherForChietKhauDp1 > 0) {
          chietKhauVoucherDp1Final = paidByVoucherForChietKhauDp1;
        }
        
        // Hiển thị chiết khấu Voucher DP1 dưới dạng số thuần túy (không format, không có phần thập phân)
        if (isVoucherDuPhongForChietKhauDp1 && chietKhauVoucherDp1Final > 0) {
          const numValue = Number(chietKhauVoucherDp1Final);
          // Làm tròn về số nguyên và format để loại bỏ .00
          const intValue = Math.round(numValue);
          // Convert sang string và loại bỏ phần thập phân nếu có
          const displayValue = intValue.toString().replace(/\.0+$/, '');
          return <div className="text-sm text-gray-900">{displayValue}</div>;
        }
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'thanhToanTkTienAo':
        // Thanh toán TK tiền ảo - chỉ hiển thị nếu item có v_paid > 0 (từ chietKhauThanhToanTkTienAo hoặc paid_by_voucher_ecode_ecoin_bp)
        // Không hiển thị cho items có v_paid = 0
        const chietKhauTkTienAo = sale?.chietKhauThanhToanTkTienAo ?? 0;
        const vPaidForEcoin = sale?.paid_by_voucher_ecode_ecoin_bp ?? 0;
        
        // Map brand name sang brand code
        const mapBrandToCode = (brand: string | null | undefined): string => {
          if (!brand) return 'MN'; // Default
          
          const brandLower = String(brand).toLowerCase().trim();
          const brandMap: Record<string, string> = {
            'menard': 'MN',
            'f3': 'FBV',
            'facialbar': 'FBV',
            'chando': 'CDV',
            'labhair': 'LHV',
            'yaman': 'BTH',
          };
          
          return brandMap[brandLower] || 'MN'; // Default to MN
        };

        // Generate label: YYMM{brand_code}.TKDV (ví dụ: 2511MN.TKDV)
        // Lấy tháng từ docDate của order, không phải tháng hiện tại
        const generateTkTienAoLabel = () => {
          // Lấy ngày từ docDate của order
          let docDate: Date;
          if (order?.docDate) {
            const docDateValue = order.docDate as any;
            if (docDateValue instanceof Date) {
              docDate = docDateValue;
            } else {
              docDate = new Date(docDateValue);
              if (isNaN(docDate.getTime())) {
                // Nếu không parse được, dùng ngày hiện tại
                docDate = new Date();
              }
            }
          } else {
            // Fallback: dùng ngày hiện tại
            docDate = new Date();
          }
          
          const year = docDate.getFullYear();
          const month = docDate.getMonth() + 1;
          const yy = String(year).slice(-2);
          const mm = String(month).padStart(2, '0');
          
          // Ưu tiên lấy brand code từ customer.brand
          const brand = order?.customer?.brand || (sale as any)?.customer?.brand || '';
          
          // Map brand name sang brand code (menard → MN, f3 → FBV, etc.)
          const brandCode = mapBrandToCode(brand);
          
          return `${yy}${mm}${brandCode}.TKDV`;
        };
        
        // Chỉ hiển thị nếu có chietKhauThanhToanTkTienAo > 0 hoặc (v_paid > 0 và có ECOIN trong cashio)
        if (chietKhauTkTienAo > 0) {
          return <div className="text-sm text-gray-900">{generateTkTienAoLabel()}</div>;
        }
        
        // Fallback: nếu chưa có chietKhauThanhToanTkTienAo nhưng có v_paid > 0 và có ECOIN trong cashio
        if (vPaidForEcoin > 0 && order?.cashioData && Array.isArray(order.cashioData)) {
          const ecoinCashio = order.cashioData.find((c: any) => c.fop_syscode === 'ECOIN');
          if (ecoinCashio && ecoinCashio.total_in && parseFloat(String(ecoinCashio.total_in)) > 0) {
            return <div className="text-sm text-gray-900">{generateTkTienAoLabel()}</div>;
          }
        }
        
        return <div className="text-sm text-gray-400 italic">-</div>;
      case 'chietKhauThanhToanTkTienAo':
        // Chiết khấu thanh toán TK tiền ảo - chỉ hiển thị nếu có ECOIN
        // Không hiển thị nếu chỉ có voucher (paid_by_voucher_ecode_ecoin_bp > 0 nhưng không có ECOIN)
        const chietKhauTkTienAoForChietKhau = sale?.chietKhauThanhToanTkTienAo ?? 0;
        const vPaidForEcoinForChietKhau = sale?.paid_by_voucher_ecode_ecoin_bp ?? 0;
        
        // Ưu tiên chietKhauThanhToanTkTienAo (đã được lưu trong sync) - chỉ hiển thị nếu > 0
        if (chietKhauTkTienAoForChietKhau > 0) {
          return <div className="text-sm text-gray-900">{formatValue(chietKhauTkTienAoForChietKhau)}</div>;
        }
        
        // Fallback: nếu chưa có chietKhauThanhToanTkTienAo nhưng có v_paid > 0 VÀ có ECOIN trong cashio
        // Chỉ hiển thị khi THỰC SỰ có ECOIN, không phải chỉ vì có v_paid > 0
        if (vPaidForEcoinForChietKhau > 0 && order?.cashioData && Array.isArray(order.cashioData)) {
          const ecoinCashioForChietKhau = order.cashioData.find((c: any) => c.fop_syscode === 'ECOIN');
          if (ecoinCashioForChietKhau && ecoinCashioForChietKhau.total_in) {
            const ecoinValue = parseFloat(String(ecoinCashioForChietKhau.total_in)) || 0;
            if (ecoinValue > 0) {
              return <div className="text-sm text-gray-900">{formatValue(ecoinValue)}</div>;
            }
          }
        }
        
        // Không hiển thị nếu không có ECOIN (chỉ có voucher thông thường)
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

  // Flatten enrichedDisplayedOrders thành rows để hiển thị
  // Backend đã paginate theo rows rồi, nhưng cần giới hạn số rows ở frontend để đảm bảo đúng limit
  const flattenedRows: Array<{ order: Order; sale: SaleItem | null }> = [];
  const maxRows = pagination.limit; // Giới hạn số rows theo pagination limit
  
  for (const order of enrichedDisplayedOrders) {
    if (flattenedRows.length >= maxRows) {
      break; // Đã đủ rows, dừng lại
    }
    
    if (order.sales && order.sales.length > 0) {
      for (const sale of order.sales) {
        if (flattenedRows.length >= maxRows) {
          break; // Đã đủ rows, dừng lại
        }
        flattenedRows.push({ order, sale });
      }
    } else {
      // Nếu order không có sales, dùng totalItems để tạo rows
      const rowCount = order.totalItems > 0 ? order.totalItems : 1;
      for (let i = 0; i < rowCount; i++) {
        if (flattenedRows.length >= maxRows) {
          break; // Đã đủ rows, dừng lại
        }
        flattenedRows.push({ order, sale: null });
    }
    }
  }

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
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Chọn cột hiển thị
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || enrichedDisplayedOrders.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Xuất Excel"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Xuất Excel
                    </>
                  )}
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
        ) : enriching ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Đang tải chi tiết đơn hàng...</p>
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
