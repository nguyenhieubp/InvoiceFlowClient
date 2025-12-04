/**
 * Order Mapper Utilities
 * Các hàm tiện ích để map/normalize dữ liệu order từ các format khác nhau
 */

import { Order, OrderCustomer, SaleItem } from '@/types/order.types';

/**
 * Format mới từ ERP: { data_customer: { Personal_Info: {...}, Sales: [...] } }
 */
interface ERPRawOrderData {
  data_customer: {
    Personal_Info: {
      code: string;
      name: string;
      mobile?: string;
      sexual?: string;
      idnumber?: string | null;
      enteredat?: string;
      crm_lead_source?: string;
      address?: string;
      province_name?: string;
      birthday?: string | null;
      grade_name?: string;
      branch_code?: string;
    };
    Sales: Array<{
      qty?: number;
      cat1?: string;
      cat2?: string;
      cat3?: string;
      ck_tm?: number | null;
      docid?: number;
      ck_dly?: number | null;
      serial?: string | null;
      cm_code?: string | null;
      doccode?: string;
      docdate?: string;
      line_id?: number;
      revenue?: number;
      catcode1?: string;
      catcode2?: string;
      catcode3?: string;
      disc_amt?: number;
      docmonth?: string;
      itemcode?: string;
      itemcost?: number;
      itemname?: string;
      linetotal?: number;
      ordertype?: string;
      prom_code?: string | null;
      root_code?: string;
      totalcost?: number;
      crm_emp_id?: number;
      branch_code?: string;
      description?: string;
      doctype_name?: string;
      order_source?: string | null;
      partner_code?: string;
      partner_name?: string;
      crm_branch_id?: number;
      docsourcetype?: string;
      grade_discamt?: number;
      revenue_wsale?: number;
      saleperson_id?: number;
      revenue_retail?: number;
      paid_by_voucher_ecode_ecoin_bp?: number;
      [key: string]: any;
    }>;
  };
}

/**
 * Map format mới từ ERP sang format Order hiện tại
 * @param erpData - Dữ liệu từ ERP API với format mới
 * @returns Array of Order objects
 */
export const mapERPRawOrderDataToOrders = (erpData: ERPRawOrderData): Order[] => {
  if (!erpData?.data_customer?.Personal_Info || !erpData?.data_customer?.Sales) {
    return [];
  }

  const personalInfo = erpData.data_customer.Personal_Info;
  const sales = erpData.data_customer.Sales;

  // Lấy docCode và docDate từ sale đầu tiên (vì mỗi order có nhiều sales)
  // Group sales by doccode để tạo các Order riêng biệt
  const ordersMap = new Map<string, Order>();

  sales.forEach((sale) => {
    if (!sale.doccode) return; // Bỏ qua sale không có doccode

    const docCode = sale.doccode;

    // Nếu đã có order với docCode này, thêm sale vào
    if (ordersMap.has(docCode)) {
      const existingOrder = ordersMap.get(docCode)!;
      const mappedSale = mapERPSaleToSaleItem(sale);
      existingOrder.sales = existingOrder.sales || [];
      existingOrder.sales.push(mappedSale);

      // Cập nhật totals
      existingOrder.totalQty += mappedSale.qty || 0;
      existingOrder.totalRevenue += mappedSale.revenue || mappedSale.linetotal || 0;
      existingOrder.totalItems += 1;
    } else {
      // Tạo order mới
      const docDate = sale.docdate || new Date().toISOString();
      const branchCode = sale.branch_code || personalInfo.branch_code || '';
      const docSourceType = sale.docsourcetype || 'SALE_ORDER';

      const mappedSale = mapERPSaleToSaleItem(sale);

      const newOrder: Order = {
        docCode,
        docDate,
        branchCode,
        docSourceType,
        customer: mapERPPersonalInfoToCustomer(personalInfo),
        totalRevenue: mappedSale.revenue || mappedSale.linetotal || 0,
        totalQty: mappedSale.qty || 0,
        totalItems: 1,
        isProcessed: false,
        sales: [mappedSale],
      };

      ordersMap.set(docCode, newOrder);
    }
  });

  return Array.from(ordersMap.values());
};

/**
 * Map Personal_Info từ ERP format sang OrderCustomer
 */
const mapERPPersonalInfoToCustomer = (personalInfo: ERPRawOrderData['data_customer']['Personal_Info']): OrderCustomer => {
  return {
    code: personalInfo.code || '',
    name: personalInfo.name || '',
    brand: '', // Không có trong format mới, để rỗng hoặc lấy từ nguồn khác
    mobile: personalInfo.mobile,
    sexual: personalInfo.sexual,
    idnumber: personalInfo.idnumber || undefined,
    enteredat: personalInfo.enteredat,
    crm_lead_source: personalInfo.crm_lead_source,
    address: personalInfo.address,
    province_name: personalInfo.province_name,
    birthday: personalInfo.birthday || undefined,
    grade_name: personalInfo.grade_name,
    branch_code: personalInfo.branch_code,
  };
};

/**
 * Map Sale từ ERP format sang SaleItem
 */
const mapERPSaleToSaleItem = (sale: ERPRawOrderData['data_customer']['Sales'][0]): SaleItem => {
  return {
    promCode: sale.prom_code || undefined,
    itemCode: sale.itemcode || undefined,
    itemName: sale.itemname || undefined,
    description: sale.description || undefined,
    partnerCode: sale.partner_code || undefined,
    ordertype: sale.ordertype || undefined,
    branchCode: sale.branch_code || undefined,
    serial: sale.serial || undefined,
    qty: sale.qty,
    revenue: sale.revenue,
    linetotal: sale.linetotal,
    tienHang: sale.linetotal,
    itemcost: sale.itemcost,
    totalcost: sale.totalcost,
    // Các trường từ ERP format
    cat1: sale.cat1,
    cat2: sale.cat2,
    cat3: sale.cat3,
    catcode1: sale.catcode1,
    catcode2: sale.catcode2,
    catcode3: sale.catcode3,
    ck_tm: sale.ck_tm,
    ck_dly: sale.ck_dly,
    docid: sale.docid,
    cm_code: sale.cm_code || undefined,
    line_id: sale.line_id,
    disc_amt: sale.disc_amt,
    docmonth: sale.docmonth,
    crm_emp_id: sale.crm_emp_id,
    doctype_name: sale.doctype_name,
    order_source: sale.order_source || undefined,
    partner_name: sale.partner_name,
    crm_branch_id: sale.crm_branch_id,
    grade_discamt: sale.grade_discamt,
    revenue_wsale: sale.revenue_wsale,
    saleperson_id: sale.saleperson_id,
    revenue_retail: sale.revenue_retail,
    paid_by_voucher_ecode_ecoin_bp: sale.paid_by_voucher_ecode_ecoin_bp,
    docsourcetype: sale.docsourcetype,
  };
};

/**
 * Normalize order data - hỗ trợ cả format cũ và format mới từ ERP
 * @param data - Dữ liệu từ API (có thể là format cũ hoặc format mới)
 * @returns Array of Order objects
 */
export const normalizeOrderData = (data: any): Order[] => {
  if (!data) return [];

  // Nếu là array
  if (Array.isArray(data)) {
    const normalized: Order[] = [];
    data.forEach((item) => {
      // Kiểm tra format mới từ ERP (có data_customer)
      if (item?.data_customer?.Personal_Info && item?.data_customer?.Sales) {
        normalized.push(...mapERPRawOrderDataToOrders(item));
      } 
      // Format cũ - đã là Order object
      else if (item?.docCode) {
        normalized.push(item as Order);
      }
    });
    return normalized;
  }

  // Nếu là object đơn
  // Kiểm tra format mới từ ERP (có data_customer)
  if (data?.data_customer?.Personal_Info && data?.data_customer?.Sales) {
    return mapERPRawOrderDataToOrders(data);
  }

  // Format cũ - giả sử đã là Order object, wrap trong array
  if (data?.docCode) {
    return [data as Order];
  }

  return [];
};

