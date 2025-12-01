'use client';

import { useEffect, useState } from 'react';
import { salesApi } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Toast } from '@/components/Toast';

interface Sale {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  revenue: number;
  description?: string;
  kenh?: string;
  promCode?: string;
  promotion?: {
    raw?: any;
    main?: any;
  } | null;
  isProcessed: boolean;
}

interface OrderDetail {
  docCode: string;
  docDate: string;
  branchCode: string;
  docSourceType: string;
  customer: {
    id: string;
    code: string;
    name: string;
    brand: string;
    street?: string;
    phone?: string;
  };
  totalRevenue: number;
  totalQty: number;
  totalItems: number;
  sales: Sale[];
  promotions?: Record<
    string,
    {
      raw?: any;
      main?: any;
    }
  >;
}

export default function OrderDetailPage() {
  const params = useParams();
  const docCode = params.docCode as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (docCode) {
      loadOrderDetail();
    }
  }, [docCode]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesApi.getByOrderCode(docCode);
      // Đảm bảo dữ liệu được parse đúng
      const orderData = response.data;
      if (orderData) {
        // Convert số nếu cần
        const processedOrder = {
          ...orderData,
          totalRevenue: Number(orderData.totalRevenue) || 0,
          totalQty: Number(orderData.totalQty) || 0,
          totalItems: Number(orderData.totalItems) || 0,
          sales: (orderData.sales || []).map((sale: any) => ({
            ...sale,
            qty: Number(sale.qty) || 0,
            revenue: Number(sale.revenue) || 0,
          })),
        };
        setOrder(processedOrder);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-800">{error || 'Không tìm thấy đơn hàng'}</p>
        </div>
        <Link href="/sales" className="text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const handlePrintInvoice = async () => {
    if (!order) return;
    
    try {
      await salesApi.printOrder(order.docCode);
      showToast('success', `Đã gửi yêu cầu in hóa đơn cho đơn hàng ${order.docCode} thành công`);
    } catch (error: any) {
      showToast('error', 'Lỗi khi in hóa đơn: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/sales" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại danh sách đơn hàng
            </Link>
            <button
              onClick={handlePrintInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In hóa đơn
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
        </div>

        {/* Thông tin đơn hàng và khách hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Thông tin đơn hàng */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Mã đơn hàng</label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.docCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày đơn hàng</label>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(order.docDate).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Chi nhánh</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.branchCode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Loại nguồn</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.docSourceType}</p>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Mã khách hàng</label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.customer.code}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tên khách hàng</label>
                <p className="text-sm text-gray-900 mt-0.5">{order.customer.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Nhãn hàng</label>
                <p className="text-sm text-gray-900 mt-0.5 capitalize">{order.customer.brand}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <label className="text-xs text-gray-500">Số điện thoại</label>
                  <p className="text-sm text-gray-900 mt-0.5">{order.customer.phone}</p>
                </div>
              )}
              {order.customer.street && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Địa chỉ</label>
                  <p className="text-sm text-gray-900 mt-0.5">{order.customer.street}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng số sản phẩm</label>
              <p className="text-xl font-bold text-blue-600 mt-1">{order.totalItems}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng số lượng</label>
              <p className="text-xl font-bold text-purple-600 mt-1">{Number(order.totalQty).toLocaleString('vi-VN')}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <label className="text-xs text-gray-600">Tổng doanh thu</label>
              <p className="text-lg font-bold text-green-600 mt-1">
                {Number(order.totalRevenue).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin chương trình khuyến mại */}
        {order.promotions && Object.keys(order.promotions).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-4">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Khuyến mại
              </h2>
            </div>
            <div className="space-y-4">
              {Object.entries(order.promotions).map(([promCode, promoData]) => {
                const promo = promoData?.main;
                if (!promo) return null;

                // Format date
                const formatDate = (dateString: string) => {
                  if (!dateString) return '-';
                  return new Date(dateString).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                };

                // Render conditions
                const renderConditions = (conditions: any) => {
                  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return null;
                  
                  const renderCondition = (condition: any, indent = 0): JSX.Element | null => {
                    if (!condition) return null;
                    
                    if (condition.type === 'PRODUCT_SET') {
                      const value = condition.value || {};
                      const productCodes = Array.isArray(value.productCode) ? value.productCode : [];
                      const quantity = value.quantity || 0;
                      const operator = value.quantityOperator || '';
                      
                      return (
                        <div className="text-sm flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-gray-700">Sản phẩm:</span>
                          <div>
                            <span className="text-gray-900">{productCodes.join(', ')}</span>
                            {quantity > 0 && (
                              <span className="text-gray-600 ml-1">
                                (Số lượng {operator === 'GREATER_OR_EQUAL' ? '≥' : operator === 'EQUAL' ? '=' : '>'} {quantity})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    if (condition.type === 'CUSTOMER_PHONE') {
                      const value = condition.value || {};
                      const phoneNumbers = Array.isArray(value.phoneNumber) ? value.phoneNumber : [];
                      
                      return (
                        <div className="text-sm flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-gray-700">Số điện thoại:</span>
                          <span className="text-gray-900">{phoneNumbers.join(', ')}</span>
                        </div>
                      );
                    }
                    
                    if (condition.children && condition.children.length > 0) {
                      return (
                        <div style={{ marginLeft: `${indent * 16}px` }} className="space-y-1">
                          {condition.matchType && (
                            <div className="text-xs font-semibold text-gray-600 mb-1.5">
                              {condition.matchType === 'ALL' ? '✓ Tất cả điều kiện' : '⊘ Một trong các điều kiện'}
                            </div>
                          )}
                          {condition.children.map((child: any, idx: number) => (
                            <div key={idx}>{renderCondition(child, indent + 1)}</div>
                          ))}
                        </div>
                      );
                    }
                    
                    return null;
                  };
                  
                  return (
                    <div className="space-y-3">
                      {conditions.map((cond: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-gray-300 pl-3">
                          {renderCondition(cond, 0)}
                        </div>
                      ))}
                    </div>
                  );
                };

                // Render actions
                const renderActions = (actions: any) => {
                  if (!actions || !Array.isArray(actions) || actions.length === 0) return null;
                  
                  const renderAction = (action: any, indent = 0): JSX.Element | null => {
                    if (!action) return null;
                    
                    if (action.type === 'PERCENT_TOTAL') {
                      const percent = action.value?.percent || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-blue-700">Giảm giá:</span>
                          <span className="text-green-600 font-bold">{percent}%</span>
                          <span className="text-gray-600">trên tổng tiền</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'FIXED_AMOUNT') {
                      const amount = action.value?.amount || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-blue-700">Giảm giá:</span>
                          <span className="text-green-600 font-bold">{Number(amount).toLocaleString('vi-VN')} đ</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'FREE_PRODUCT') {
                      const products = action.value?.products || [];
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-purple-700">Sản phẩm miễn phí:</span>
                          <div className="flex flex-wrap gap-2">
                            {products.map((product: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                {product.productCode} (x{product.quantity || 1})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    if (action.type === 'COUPON') {
                      const couponCode = action.value?.couponCode || '';
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-orange-700">Mã coupon:</span>
                          <span className="text-orange-600 font-bold">{couponCode}</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'POINT') {
                      const point = action.value?.point || 0;
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-yellow-700">Điểm thưởng:</span>
                          <span className="text-yellow-600 font-bold">{point.toLocaleString('vi-VN')} điểm</span>
                        </div>
                      );
                    }
                    
                    if (action.type === 'AMOUNT_ITEM') {
                      const productCodes = Array.isArray(action.value?.productCode) ? action.value.productCode : [];
                      return (
                        <div className="text-sm font-medium flex items-start gap-2" style={{ marginLeft: `${indent * 16}px` }}>
                          <span className="font-semibold text-indigo-700">Áp dụng cho sản phẩm:</span>
                          <div className="flex flex-wrap gap-2">
                            {productCodes.map((code: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    if (action.children && action.children.length > 0) {
                      return (
                        <div style={{ marginLeft: `${indent * 16}px` }} className="space-y-1">
                          {action.matchType && (
                            <div className="text-xs font-semibold text-gray-600 mb-1.5">
                              {action.matchType === 'ALL' ? '✓ Tất cả hành động' : '⊘ Một trong các hành động'}
                            </div>
                          )}
                          {action.children.map((child: any, idx: number) => (
                            <div key={idx}>{renderAction(child, indent + 1)}</div>
                          ))}
                        </div>
                      );
                    }
                    
                    return null;
                  };
                  
                  return (
                    <div className="space-y-3">
                      {actions.map((act: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-blue-300 pl-3">
                          {renderAction(act, 0)}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div
                    key={promCode}
                    className="border border-gray-200 rounded-xl p-6 transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-white"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{promo.name || promCode}</h3>
                          {promo.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Không hoạt động
                            </span>
                          )}
                        </div>
                        {promo.description && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed border-l-2 border-blue-200 pl-4">{promo.description}</p>
                        )}
                      </div>
                      <span className="group inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-blue-500 text-white border border-blue-600 shadow-md hover:shadow-lg hover:bg-blue-600 transition-all duration-200 cursor-default ml-3">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>{promCode}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mã chương trình</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-bold">{promo.code || '-'}</p>
                      </div>
                      {promo.externalCode && (
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mã ngoài</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-bold">{promo.externalCode}</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thời gian bắt đầu</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">{formatDate(promo.startDate)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thời gian kết thúc</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">{formatDate(promo.endDate)}</p>
                      </div>
                      {promo.tierCode && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tier Code</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.tierCode}</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cho phép kết hợp</label>
                        <p className="text-sm text-gray-900 mt-1.5 font-medium">
                          {promo.allowCombine ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Có
                            </span>
                          ) : (
                            <span className="text-gray-500">Không</span>
                          )}
                        </p>
                      </div>
                      {promo.maxUsage && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Số lần sử dụng tối đa</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.maxUsage}</p>
                        </div>
                      )}
                      {promo.maxUsagePerCustomer && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Số lần sử dụng/khách hàng</label>
                          <p className="text-sm text-gray-900 mt-1.5 font-medium">{promo.maxUsagePerCustomer}</p>
                        </div>
                      )}
                    </div>

                    {promo.conditions && promo.conditions.length > 0 && (
                      <div className="mb-5 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Điều kiện áp dụng
                          </label>
                        </div>
                        <div className="pl-7">
                          {renderConditions(promo.conditions)}
                        </div>
                      </div>
                    )}

                    {promo.actions && promo.actions.length > 0 && (
                      <div className="p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                            Hành động khuyến mại
                          </label>
                        </div>
                        <div className="pl-7">
                          {renderActions(promo.actions)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danh sách sản phẩm */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-base font-semibold text-gray-900">Danh sách sản phẩm</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã SP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Khuyến mại
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kênh
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {order.sales.map((sale, index) => (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-150 border-l-4 border-l-transparent hover:border-l-blue-400"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900 break-words" title={sale.itemCode}>
                        {sale.itemCode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{sale.itemName}</div>
                      {sale.description && (
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">{sale.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sale.promCode ? (
                        <span className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-blue-700 border border-blue-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 hover:scale-[1.02] cursor-default break-words" title={sale.promCode}>
                          <svg className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium whitespace-normal break-words">{sale.promCode}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-center font-medium text-gray-900">
                        {Number(sale.qty).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-right font-semibold text-gray-900">
                        {Number(sale.revenue).toLocaleString('vi-VN')} đ
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {sale.kenh ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            {sale.kenh}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

