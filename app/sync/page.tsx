'use client';

import { useState } from 'react';
import { syncApi, salesApi } from '@/lib/api';
import Link from 'next/link';

const brands = [
  { name: 'chando', displayName: 'Chando' },
  { name: 'f3', displayName: 'F3' },
  { name: 'labhair', displayName: 'LabHair' },
  { name: 'yaman', displayName: 'Yaman' },
  { name: 'menard', displayName: 'Menard' },
];

export default function SyncPage() {
  const [syncingBrand, setSyncingBrand] = useState<string | null>(null);
  
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
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [syncingSalesRange, setSyncingSalesRange] = useState(false);
  const [salesRangeResult, setSalesRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [syncingShiftEndCashRange, setSyncingShiftEndCashRange] = useState(false);
  const [shiftEndCashRangeResult, setShiftEndCashRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [salesStartDate, setSalesStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [salesEndDate, setSalesEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [shiftEndCashStartDate, setShiftEndCashStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [shiftEndCashEndDate, setShiftEndCashEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [shiftEndCashBrand, setShiftEndCashBrand] = useState<string>('');
  const [syncingRepackFormulaRange, setSyncingRepackFormulaRange] = useState(false);
  const [repackFormulaRangeResult, setRepackFormulaRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [repackFormulaStartDate, setRepackFormulaStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [repackFormulaEndDate, setRepackFormulaEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [syncingPromotionRange, setSyncingPromotionRange] = useState(false);
  const [promotionRangeResult, setPromotionRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [promotionStartDate, setPromotionStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [promotionEndDate, setPromotionEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [syncingVoucherIssueRange, setSyncingVoucherIssueRange] = useState(false);
  const [voucherIssueRangeResult, setVoucherIssueRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [voucherIssueStartDate, setVoucherIssueStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [voucherIssueEndDate, setVoucherIssueEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [syncingCashioRange, setSyncingCashioRange] = useState(false);
  const [cashioRangeResult, setCashioRangeResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [cashioStartDate, setCashioStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [cashioEndDate, setCashioEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const handleSyncBrand = async (brandName: string) => {
    const syncDate = getSyncDate();
    if (!syncDate) {
      setResult({
        type: 'error',
        message: 'Vui lòng chọn ngày cần đồng bộ',
      });
      return;
    }

    setSyncingBrand(brandName);
    setResult(null);
    try {
      const response = await syncApi.syncBrand(brandName, syncDate);
      setResult({
        type: 'success',
        message: response.data.message || `Đồng bộ ${brandName} thành công`,
      });
    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.response?.data?.message || error.message || `Lỗi khi đồng bộ ${brandName}`,
      });
    } finally {
      setSyncingBrand(null);
    }
  };

  const isSyncing = syncingBrand !== null;
  const isAnySyncing = isSyncing || syncingSalesRange || syncingShiftEndCashRange || syncingRepackFormulaRange || syncingPromotionRange || syncingVoucherIssueRange || syncingCashioRange;

  const handleSyncSalesByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(salesStartDate);
    const endDate = convertDateToDDMMMYYYY(salesEndDate);
    
    if (!startDate || !endDate) {
      setSalesRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingSalesRange(true);
    setSalesRangeResult(null);
    setResult(null);
    try {
      const response = await salesApi.syncSalesByDateRange(startDate, endDate);
      const data = response.data;
      setSalesRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ sale thành công',
        data: data,
      });
    } catch (error: any) {
      setSalesRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ sale',
      });
    } finally {
      setSyncingSalesRange(false);
    }
  };

  const handleSyncShiftEndCashByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(shiftEndCashStartDate);
    const endDate = convertDateToDDMMMYYYY(shiftEndCashEndDate);
    
    if (!startDate || !endDate) {
      setShiftEndCashRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingShiftEndCashRange(true);
    setShiftEndCashRangeResult(null);
    setResult(null);
    try {
      const brand = shiftEndCashBrand || undefined;
      const response = await syncApi.syncShiftEndCashByDateRange(startDate, endDate, brand);
      const data = response.data;
      setShiftEndCashRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ báo cáo nộp quỹ cuối ca thành công',
        data: data,
      });
    } catch (error: any) {
      setShiftEndCashRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ báo cáo nộp quỹ cuối ca',
      });
    } finally {
      setSyncingShiftEndCashRange(false);
    }
  };

  const handleSyncRepackFormulaByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(repackFormulaStartDate);
    const endDate = convertDateToDDMMMYYYY(repackFormulaEndDate);
    
    if (!startDate || !endDate) {
      setRepackFormulaRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingRepackFormulaRange(true);
    setRepackFormulaRangeResult(null);
    setResult(null);
    try {
      const response = await syncApi.syncRepackFormulaByDateRange(startDate, endDate);
      const data = response.data;
      setRepackFormulaRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ tách gộp BOM thành công',
        data: data,
      });
    } catch (error: any) {
      setRepackFormulaRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ tách gộp BOM',
      });
    } finally {
      setSyncingRepackFormulaRange(false);
    }
  };

  const handleSyncPromotionByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(promotionStartDate);
    const endDate = convertDateToDDMMMYYYY(promotionEndDate);
    
    if (!startDate || !endDate) {
      setPromotionRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingPromotionRange(true);
    setPromotionRangeResult(null);
    setResult(null);
    try {
      const response = await syncApi.syncPromotionByDateRange(startDate, endDate);
      const data = response.data;
      setPromotionRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ danh sách CTKM thành công',
        data: data,
      });
    } catch (error: any) {
      setPromotionRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ danh sách CTKM',
      });
    } finally {
      setSyncingPromotionRange(false);
    }
  };

  const handleSyncVoucherIssueByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(voucherIssueStartDate);
    const endDate = convertDateToDDMMMYYYY(voucherIssueEndDate);
    
    if (!startDate || !endDate) {
      setVoucherIssueRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingVoucherIssueRange(true);
    setVoucherIssueRangeResult(null);
    setResult(null);
    try {
      const response = await syncApi.syncVoucherIssueByDateRange(startDate, endDate);
      const data = response.data;
      setVoucherIssueRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ danh sách Voucher thành công',
        data: data,
      });
    } catch (error: any) {
      setVoucherIssueRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ danh sách Voucher',
      });
    } finally {
      setSyncingVoucherIssueRange(false);
    }
  };

  const handleSyncCashioByDateRange = async () => {
    const startDate = convertDateToDDMMMYYYY(cashioStartDate);
    const endDate = convertDateToDDMMMYYYY(cashioEndDate);
    
    if (!startDate || !endDate) {
      setCashioRangeResult({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ từ ngày và đến ngày',
      });
      return;
    }

    setSyncingCashioRange(true);
    setCashioRangeResult(null);
    setResult(null);
    try {
      const response = await syncApi.syncCashioByDateRange(startDate, endDate);
      const data = response.data;
      setCashioRangeResult({
        type: 'success',
        message: data.message || 'Đồng bộ Cashio thành công',
        data: data,
      });
    } catch (error: any) {
      setCashioRangeResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ Cashio',
      });
    } finally {
      setSyncingCashioRange(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Overlay khi đang đồng bộ */}
      {isAnySyncing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {syncingBrand
                  ? `Đang đồng bộ ${syncingBrand.toUpperCase()}`
                  : syncingSalesRange
                  ? `Đang đồng bộ Sale (${convertDateToDDMMMYYYY(salesStartDate)} - ${convertDateToDDMMMYYYY(salesEndDate)})`
                  : syncingShiftEndCashRange
                  ? `Đang đồng bộ Báo cáo nộp quỹ cuối ca ${shiftEndCashBrand ? `(${shiftEndCashBrand})` : ''} (${convertDateToDDMMMYYYY(shiftEndCashStartDate)} - ${convertDateToDDMMMYYYY(shiftEndCashEndDate)})`
                  : syncingRepackFormulaRange
                  ? `Đang đồng bộ Tách gộp BOM (${convertDateToDDMMMYYYY(repackFormulaStartDate)} - ${convertDateToDDMMMYYYY(repackFormulaEndDate)})`
                  : syncingPromotionRange
                  ? `Đang đồng bộ Danh sách CTKM (${convertDateToDDMMMYYYY(promotionStartDate)} - ${convertDateToDDMMMYYYY(promotionEndDate)})`
                  : syncingVoucherIssueRange
                  ? `Đang đồng bộ Danh sách Voucher (${convertDateToDDMMMYYYY(voucherIssueStartDate)} - ${convertDateToDDMMMYYYY(voucherIssueEndDate)})`
                  : 'Đang xử lý...'}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Vui lòng đợi trong giây lát, không đóng trang này...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-600 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về trang chủ
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Đồng bộ dữ liệu</h1>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ dữ liệu từ Zappy API
              </p>
            </div>
          </div>
        </div>

        {/* Date Input Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label className="block text-sm font-semibold text-gray-700">
              Ngày cần đồng bộ
            </label>
          </div>
          <div className="max-w-xs">
            <input
              type="date"
              value={syncDateInput}
              onChange={(e) => setSyncDateInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
            />
            {syncDateInput && (
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                <span className="font-medium">Format API:</span>
                <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{getSyncDate()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Result Notification */}
        {result && (
          <div
            className={`mb-6 p-4 rounded-xl border-2 shadow-sm ${
              result.type === 'success'
                ? 'bg-gray-50 text-green-800 border-green-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.type === 'success' ? (
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Sync Sales By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Sale theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ sale cho tất cả các nhãn hàng (f3, labhair, yaman, menard)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {salesStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(salesStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {salesEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(salesEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {salesRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{salesRangeResult.data.totalOrdersCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng đơn</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{salesRangeResult.data.totalSalesCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng sale</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{salesRangeResult.data.totalCustomersCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng khách</div>
                  </div>
                </div>
                {salesRangeResult.data.brandResults && salesRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {salesRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.ordersCount} đơn, {brand.salesCount} sale, {brand.customersCount} khách
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncSalesByDateRange}
              disabled={isAnySyncing || !salesStartDate || !salesEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingSalesRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đồng bộ Sale
                </>
              )}
            </button>
          </div>
          {salesRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                salesRangeResult.type === 'success'
                  ? 'bg-gray-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {salesRangeResult.type === 'success' ? (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{salesRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setSalesRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Shift End Cash By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Báo cáo nộp quỹ cuối ca theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ báo cáo nộp quỹ cuối ca {shiftEndCashBrand ? `cho nhãn hàng ${shiftEndCashBrand}` : 'cho tất cả các nhãn hàng (f3, labhair, yaman, menard)'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Nhãn hàng
                </span>
              </label>
              <select
                value={shiftEndCashBrand}
                onChange={(e) => setShiftEndCashBrand(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              >
                <option value="">Tất cả</option>
                {brands.map((brand) => (
                  <option key={brand.name} value={brand.name}>
                    {brand.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={shiftEndCashStartDate}
                onChange={(e) => setShiftEndCashStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {shiftEndCashStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(shiftEndCashStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={shiftEndCashEndDate}
                onChange={(e) => setShiftEndCashEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {shiftEndCashEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(shiftEndCashEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {shiftEndCashRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{shiftEndCashRangeResult.data.totalRecordsCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng báo cáo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{shiftEndCashRangeResult.data.totalSavedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Mới</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{shiftEndCashRangeResult.data.totalUpdatedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Cập nhật</div>
                  </div>
                </div>
                {shiftEndCashRangeResult.data.brandResults && shiftEndCashRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {shiftEndCashRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} báo cáo, {brand.savedCount} mới, {brand.updatedCount} cập nhật
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncShiftEndCashByDateRange}
              disabled={isAnySyncing || !shiftEndCashStartDate || !shiftEndCashEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingShiftEndCashRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đồng bộ
                </>
              )}
            </button>
          </div>
          {shiftEndCashRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                shiftEndCashRangeResult.type === 'success'
                  ? 'bg-gray-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {shiftEndCashRangeResult.type === 'success' ? (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{shiftEndCashRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setShiftEndCashRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Repack Formula By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Tách gộp BOM theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ công thức tách gộp BOM cho tất cả các nhãn hàng (f3, labhair, yaman, menard)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={repackFormulaStartDate}
                onChange={(e) => setRepackFormulaStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {repackFormulaStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(repackFormulaStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={repackFormulaEndDate}
                onChange={(e) => setRepackFormulaEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {repackFormulaEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(repackFormulaEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {repackFormulaRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{repackFormulaRangeResult.data.totalRecordsCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng công thức</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{repackFormulaRangeResult.data.totalSavedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Mới</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{repackFormulaRangeResult.data.totalUpdatedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Cập nhật</div>
                  </div>
                </div>
                {repackFormulaRangeResult.data.brandResults && repackFormulaRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {repackFormulaRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} công thức, {brand.savedCount} mới, {brand.updatedCount} cập nhật
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncRepackFormulaByDateRange}
              disabled={isAnySyncing || !repackFormulaStartDate || !repackFormulaEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingRepackFormulaRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đồng bộ
                </>
              )}
            </button>
          </div>
          {repackFormulaRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                repackFormulaRangeResult.type === 'success'
                  ? 'bg-gray-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {repackFormulaRangeResult.type === 'success' ? (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{repackFormulaRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setRepackFormulaRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Promotion By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Danh sách CTKM theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ chương trình khuyến mãi cho tất cả các nhãn hàng (f3, labhair, yaman, menard)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={promotionStartDate}
                onChange={(e) => setPromotionStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {promotionStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(promotionStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={promotionEndDate}
                onChange={(e) => setPromotionEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {promotionEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(promotionEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {promotionRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{promotionRangeResult.data.totalRecordsCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng CTKM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{promotionRangeResult.data.totalSavedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Mới</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{promotionRangeResult.data.totalUpdatedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Cập nhật</div>
                  </div>
                </div>
                {promotionRangeResult.data.brandResults && promotionRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {promotionRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} CTKM, {brand.savedCount} mới, {brand.updatedCount} cập nhật
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncPromotionByDateRange}
              disabled={isAnySyncing || !promotionStartDate || !promotionEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingPromotionRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đồng bộ
                </>
              )}
            </button>
          </div>
          {promotionRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                promotionRangeResult.type === 'success'
                  ? 'bg-gray-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {promotionRangeResult.type === 'success' ? (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{promotionRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setPromotionRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Voucher Issue By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Danh sách Voucher theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ voucher issue cho tất cả các nhãn hàng (f3, labhair, yaman, menard)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={voucherIssueStartDate}
                onChange={(e) => setVoucherIssueStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {voucherIssueStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(voucherIssueStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={voucherIssueEndDate}
                onChange={(e) => setVoucherIssueEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {voucherIssueEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(voucherIssueEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {voucherIssueRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{voucherIssueRangeResult.data.totalRecordsCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng voucher</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{voucherIssueRangeResult.data.totalSavedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Mới</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{voucherIssueRangeResult.data.totalUpdatedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Cập nhật</div>
                  </div>
                </div>
                {voucherIssueRangeResult.data.brandResults && voucherIssueRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {voucherIssueRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} voucher, {brand.savedCount} mới, {brand.updatedCount} cập nhật
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncVoucherIssueByDateRange}
              disabled={isAnySyncing || !voucherIssueStartDate || !voucherIssueEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingVoucherIssueRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đồng bộ
                </>
              )}
            </button>
          </div>
          {voucherIssueRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                voucherIssueRangeResult.type === 'success'
                  ? 'bg-gray-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {voucherIssueRangeResult.type === 'success' ? (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{voucherIssueRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setVoucherIssueRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Cashio By Date Range */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ Cashio theo khoảng thời gian</h2>
              <p className="text-sm text-gray-600 mt-1">
                Đồng bộ cashio cho tất cả các nhãn hàng (f3, labhair, yaman, menard)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Từ ngày
                </span>
              </label>
              <input
                type="date"
                value={cashioStartDate}
                onChange={(e) => setCashioStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {cashioStartDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(cashioStartDate)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đến ngày
                </span>
              </label>
              <input
                type="date"
                value={cashioEndDate}
                onChange={(e) => setCashioEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              {cashioEndDate && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-mono font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded">{convertDateToDDMMMYYYY(cashioEndDate)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {cashioRangeResult?.data && (
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{cashioRangeResult.data.totalRecordsCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Tổng records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{cashioRangeResult.data.totalSavedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Mới</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{cashioRangeResult.data.totalSkippedCount || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">Đã tồn tại</div>
                  </div>
                </div>
                {cashioRangeResult.data.brandResults && cashioRangeResult.data.brandResults.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết theo nhãn:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {cashioRangeResult.data.brandResults.map((brand: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="font-semibold">{brand.brand}:</span> {brand.recordsCount} records, {brand.savedCount} mới, {brand.skippedCount} đã tồn tại
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSyncCashioByDateRange}
              disabled={isAnySyncing || !cashioStartDate || !cashioEndDate}
              className="px-6 py-3 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[140px]"
            >
              {syncingCashioRange ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đồng bộ
                </>
              )}
            </button>
          </div>
          {cashioRangeResult && (
            <div
              className={`mt-4 p-4 rounded-xl border-2 shadow-sm ${
                cashioRangeResult.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {cashioRangeResult.type === 'success' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">{cashioRangeResult.message}</span>
                </div>
                <button
                  onClick={() => setCashioRangeResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Đồng bộ từng nhãn hàng</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2 ml-11">
              Chọn nhãn hàng cần đồng bộ cho ngày <span className="font-mono font-semibold text-gray-800">{getSyncDate()}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhãn hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{brand.displayName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded inline-block">{brand.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSyncBrand(brand.name)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all"
                      >
                        {syncingBrand === brand.name ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang đồng bộ...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Đồng bộ
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Lưu ý quan trọng</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Đồng bộ dữ liệu từ Zappy API:</strong> Tương tự như trang Đơn hàng, lấy dữ liệu sales, customers, orders</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Format ngày:</strong> Chọn ngày từ lịch, hệ thống tự động convert sang DDMMMYYYY (ví dụ: 02NOV2025)</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Thời gian:</strong> Đồng bộ thủ công có thể mất vài phút tùy vào lượng dữ liệu, vui lòng đợi</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Trùng lặp:</strong> Dữ liệu trùng lặp sẽ được bỏ qua tự động (kiểm tra theo apiId và compositeKey)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

