'use client';

import { useState } from 'react';
import { syncApi } from '@/lib/api';
import Link from 'next/link';

const brands = [
  { name: 'chando', displayName: 'Chando' },
  { name: 'f3', displayName: 'F3' },
  { name: 'labhair', displayName: 'LabHair' },
  { name: 'yaman', displayName: 'Yaman' },
  { name: 'menard', displayName: 'Menard' },
];

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
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
  const [rangeSyncing, setRangeSyncing] = useState(false);
  const [faceIdSyncing, setFaceIdSyncing] = useState(false);
  const [faceIdResult, setFaceIdResult] = useState<{
    savedCount?: number;
    skippedCount?: number;
  } | null>(null);

  const handleSyncAll = async () => {
    const syncDate = getSyncDate();
    if (!syncDate) {
      setResult({
        type: 'error',
        message: 'Vui lòng chọn ngày cần đồng bộ',
      });
      return;
    }

    setLoading(true);
    setSyncingBrand(null);
    setResult(null);
    try {
      const response = await syncApi.syncAll(syncDate);
      setResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ tất cả nhãn hàng thành công',
      });
    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ',
      });
    } finally {
      setLoading(false);
      setSyncingBrand(null);
    }
  };

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
    setLoading(false);
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

  const isSyncing = loading || syncingBrand !== null;
  const isAnySyncing = isSyncing || rangeSyncing || faceIdSyncing;

  const handleSyncFaceId = async () => {
    const syncDate = getSyncDate();
    if (!syncDate) {
      setResult({
        type: 'error',
        message: 'Vui lòng chọn ngày cần đồng bộ',
      });
      return;
    }

    setFaceIdSyncing(true);
    setResult(null);
    setFaceIdResult(null);
    try {
      const response = await syncApi.syncFaceId(syncDate);
      setResult({
        type: 'success',
        message: response.data.message || 'Đồng bộ FaceID thành công',
      });
      setFaceIdResult({
        savedCount: response.data.savedCount,
        skippedCount: response.data.skippedCount,
      });
    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Lỗi khi đồng bộ FaceID',
      });
    } finally {
      setFaceIdSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay khi đang đồng bộ */}
      {isAnySyncing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {syncingBrand
                  ? `Đang đồng bộ ${syncingBrand.toUpperCase()}`
                  : rangeSyncing
                  ? 'Đang đồng bộ 01/10/2025 - 30/11/2025'
                  : faceIdSyncing
                  ? 'Đang đồng bộ FaceID'
                  : 'Đang đồng bộ dữ liệu'}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Vui lòng đợi trong giây lát...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về trang chủ
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Đồng bộ dữ liệu</h1>
          <p className="text-sm text-gray-600 mt-1">
            Đồng bộ dữ liệu từ Zappy API (giống như trang Đơn hàng)
          </p>
        </div>

        {/* Date Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày cần đồng bộ
          </label>
          <input
            type="date"
            value={syncDateInput}
            onChange={(e) => setSyncDateInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {syncDateInput && (
            <p className="mt-2 text-xs text-gray-500">
              Format gửi lên API: <span className="font-mono font-semibold">{getSyncDate()}</span>
            </p>
          )}
        </div>

        {/* Result Notification */}
        {result && (
          <div
            className={`mb-4 p-3 rounded border text-sm ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.type === 'success' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{result.message}</span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Sync All */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Đồng bộ tất cả nhãn hàng</h2>
              <p className="text-sm text-gray-600">
                Đồng bộ dữ liệu từ tất cả 5 nhãn hàng cho <span className="font-mono">{getSyncDate()}</span>
              </p>
            </div>
            <button
              onClick={handleSyncAll}
              disabled={isAnySyncing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                'Đồng bộ tất cả'
              )}
            </button>
          </div>
        </div>

        {/* Sync FaceID */}
        <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Đồng bộ FaceID</h2>
              <p className="text-sm text-gray-600">
                Đồng bộ dữ liệu FaceID từ API inout-customer cho ngày <span className="font-mono">{getSyncDate()}</span>
              </p>
              {faceIdResult && (
                <p className="text-xs text-gray-500 mt-1">
                  Đã lưu: <span className="font-semibold text-green-600">{faceIdResult.savedCount || 0}</span> records mới, 
                  bỏ qua: <span className="font-semibold text-gray-600">{faceIdResult.skippedCount || 0}</span> records đã tồn tại
                </p>
              )}
            </div>
            <button
              onClick={handleSyncFaceId}
              disabled={isAnySyncing}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {faceIdSyncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đồng bộ...
                </>
              ) : (
                'Đồng bộ FaceID'
              )}
            </button>
          </div>
        </div>

        {/* Backfill fixed range */}
        <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Đồng bộ toàn bộ 01/10/2025 - 30/11/2025</h2>
              <p className="text-sm text-gray-600">
                Chạy đồng bộ tất cả brand cho từng ngày trong khoảng <span className="font-mono">01OCT2025 → 30NOV2025</span>
              </p>
            </div>
            <button
              onClick={async () => {
                setResult(null);
                setRangeSyncing(true);
                try {
                  const response = await syncApi.syncAllRangeOctNov2025();
                  setResult({
                    type: 'success',
                    message:
                      response.data?.message ||
                      'Đã kích hoạt đồng bộ toàn bộ 01/10/2025 - 30/11/2025. Vui lòng xem log server để theo dõi tiến trình.',
                  });
                } catch (error: any) {
                  setResult({
                    type: 'error',
                    message:
                      error.response?.data?.message ||
                      error.message ||
                      'Lỗi khi đồng bộ khoảng 01/10/2025 - 30/11/2025',
                  });
                } finally {
                  setRangeSyncing(false);
                }
              }}
              disabled={isAnySyncing}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {rangeSyncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang chạy backfill...
                </>
              ) : (
                'Đồng bộ khoảng 01/10 - 30/11/2025'
              )}
            </button>
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Đồng bộ từng nhãn hàng</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhãn hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{brand.displayName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">{brand.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSyncBrand(brand.name)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syncingBrand === brand.name ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang đồng bộ...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Lưu ý</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Đồng bộ dữ liệu từ Zappy API (giống như trang Đơn hàng)</li>
            <li>• Đồng bộ FaceID từ API inout-customer (https://vmt.ipchello.com/api/inout-customer/)</li>
            <li>• Chọn ngày từ lịch, hệ thống sẽ tự động convert sang format DDMMMYYYY</li>
            <li>• Đồng bộ thủ công có thể mất vài phút tùy vào lượng dữ liệu</li>
            <li>• Dữ liệu trùng lặp sẽ được bỏ qua tự động (kiểm tra theo apiId)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

