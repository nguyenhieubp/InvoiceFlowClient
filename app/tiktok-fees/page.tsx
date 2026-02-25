"use client";

import { useState, useEffect } from "react";
import { tiktokFeesApi, fastApiInvoicesApi, platformFeeImportApi } from "@/lib/api";
import { format, subDays } from "date-fns";
import { TIKTOK_FEE_CONFIG } from "@/lib/fee-config";
import { Toast } from "@/components/Toast";

interface PlatformFeeMap {
  id: string;
  platform: string;
  rawFeeName: string;
  normalizedFeeName: string;
  internalCode: string;
  systemCode: string | null;
  accountCode: string;
  active: boolean;
}

export default function TikTokFeesPage() {
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "-";
    return Number(value).toString();
  };

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [brandFilter, setBrandFilter] = useState("menard");
  const [platformFilter] = useState("tiktok"); // Fixed to TikTok only
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [queryParams, setQueryParams] = useState({
    brand: "menard",
    platform: "tiktok", // Fixed to TikTok
    search: "",
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [feeMaps, setFeeMaps] = useState<PlatformFeeMap[]>([]);

  // Batch Sync
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchDateFrom, setBatchDateFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [batchDateTo, setBatchDateTo] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    success: boolean;
    message: string;
    errors?: any[];
  } | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Fetch fee maps configuration
  useEffect(() => {
    const fetchFeeMaps = async () => {
      try {
        const response = await platformFeeImportApi.getFeeMaps({
          limit: 1000,
          active: true,
        });
        if (response.data && response.data.data) {
          setFeeMaps(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching fee maps:", error);
      }
    };
    fetchFeeMaps();
  }, []);

  const getSystemCode = (
    platform: string,
    rawName: string,
    defaultCode: string,
  ): string => {
    if (!rawName) return defaultCode;
    const map = feeMaps.find(
      (m) =>
        m.platform === platform &&
        m.rawFeeName.toLowerCase().trim() === rawName.toLowerCase().trim(),
    );

    if (map && map.systemCode) {
      return map.systemCode;
    }
    return defaultCode;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await tiktokFeesApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        brand: queryParams.brand || undefined,
        search: queryParams.search || undefined,
        startDate: queryParams.startDate || undefined,
        endDate: queryParams.endDate || undefined,
      });
      setData(response.data.data);
      setPagination((prev) => ({
        ...prev,
        ...response.data.meta,
      }));
    } catch (error) {
      console.error("Error fetching TikTok fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, queryParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setQueryParams({
      brand: brandFilter,
      platform: platformFilter,
      search: search,
      startDate: startDate,
      endDate: endDate,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleBatchProcess = async () => {
    setBatchProcessing(true);
    setBatchResult(null);
    try {
      const response = await fastApiInvoicesApi.batchSyncPOCharges({
        startDate: batchDateFrom,
        endDate: batchDateTo,
        platform: "tiktok",
      });
      setBatchResult(response.data);
      if (response.data.success) {
        showToast("success", "Đã hoàn tất đồng bộ hàng loạt");
        fetchData();
      } else {
        showToast("error", "Đồng bộ có lỗi, vui lòng xem chi tiết");
      }
    } catch (error: any) {
      setBatchResult({
        success: false,
        message: error?.response?.data?.message || "Lỗi khi xử lý đồng bộ",
      });
      showToast("error", "Lỗi khi xử lý đồng bộ");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleSyncPOCharges = async (item: any) => {
    console.log("handleSyncPOCharges", item);
    if (!item) return;

    if (!item.erpOrderCode) {
      showToast("error", "Đơn hàng chưa có ERP Order Code (dh_so)");
      return;
    }

    const master = {
      dh_so: item.erpOrderCode,
      dh_ngay: item.orderCreatedAt
        ? new Date(item.orderCreatedAt).toISOString()
        : new Date().toISOString(),
      dh_dvcs: "TTM",
    };

    const details: any[] = [];

    TIKTOK_FEE_CONFIG.forEach((rule) => {
      const value = Number(item[rule.field]);
      if (value && value !== 0) {
        const code = getSystemCode(
          "tiktok",
          rule.rawName,
          rule.defaultCode
        );

        const detail = {
          dong: rule.row,
          ma_cp: code,
          cp01_nt: 0,
          cp02_nt: 0,
          cp03_nt: 0,
          cp04_nt: 0,
          cp05_nt: 0,
          cp06_nt: 0,
        };

        if (rule.targetCol === "cp02_nt") {
          detail.cp02_nt = value;
        } else {
          detail.cp01_nt = value;
        }
        details.push(detail);
      }
    });

    if (details.length === 0) {
      showToast("info", "Không có dữ liệu phí (TikTok Fees) để đồng bộ");
      return;
    }

    const payload = {
      master,
      detail: details,
    };

    setLoading(true);
    try {
      const res = await fastApiInvoicesApi.syncPOCharges(payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        showToast("success", `Đồng bộ thành công! ${res.data?.message || ""}`);
      } else {
        let errorMessage = res.data?.message || "Đồng bộ thất bại";
        if (Array.isArray(res.data) && res.data.length > 0) {
          errorMessage = res.data[0].message || errorMessage;
        } else if (res.data?.result && Array.isArray(res.data.result) && res.data.result.length > 0) {
          errorMessage = res.data.result[0].message || errorMessage;
        }
        showToast("error", errorMessage);
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "Unknown error";
      if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data) && data.length > 0) {
          errorMessage = data[0].message || errorMessage;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      showToast("error", `Lỗi khi đồng bộ: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi phí TikTok (TikTok Fees)
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi chi phí sàn TikTok
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tự động chạy
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Lọc theo Brand:
            </label>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
              }}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="menard">Menard</option>
              <option value="yaman">Yaman</option>
            </select>
          </div>

          {/* Platform filter removed - TikTok only */}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo ERP Order Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 max-w-sm border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Sàn</th>
                <th className="px-6 py-4">Mã đơn ERP</th>
                <th className="px-6 py-4">Mã đơn hàng</th>
                <th className="px-6 py-4">Ngày tạo đơn</th>
                <th className="px-6 py-4">Ngày đồng bộ</th>
                <th className="px-6 py-4">Thuế</th>
                <th className="px-6 py-4">Tiền tệ</th>
                <th className="px-6 py-4">Tổng phụ</th>
                <th className="px-6 py-4">Phí vận chuyển</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Giảm giá người bán</th>
                <th className="px-6 py-4">Giảm giá sàn</th>
                <th className="px-6 py-4">Phí ship gốc</th>
                <th className="px-6 py-4">Tổng giá sản phẩm gốc</th>
                <th className="px-6 py-4">Giảm giá ship người bán</th>
                <th className="px-6 py-4">Giảm giá ship đồng tài trợ</th>
                <th className="px-6 py-4">Giảm giá ship sàn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={18}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onDoubleClick={() => handleSyncPOCharges(item)}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${item.brand === "menard"
                          ? "bg-red-100 text-red-700"
                          : item.brand === "yaman"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {(item.brand || "N/A").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                        {(item.platform || "TIKTOK").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {item.erpOrderCode}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {item.orderSn || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.orderCreatedAt
                        ? format(
                          new Date(item.orderCreatedAt),
                          "dd/MM/yyyy HH:mm",
                        )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.syncedAt
                        ? format(new Date(item.syncedAt), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.tax)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.currency || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.subTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.shippingFee)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 font-semibold">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.sellerDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.platformDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.originalShippingFee)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.originalTotalProductPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeeSellerDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeeCofundedDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeePlatformDiscount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-medium">
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total,
              )}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{pagination.total}</span> bản ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Batch Process Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Đồng bộ phí hàng loạt — TikTok
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={batchDateFrom}
                  onChange={(e) => setBatchDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={batchDateTo}
                  onChange={(e) => setBatchDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {batchResult && (
                <div className={`p-3 rounded-md text-sm ${batchResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                  <p className="font-medium">{batchResult.message}</p>
                  {batchResult.errors && batchResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto bg-white p-2 border rounded">
                      <p className="font-semibold mb-1">Chi tiết lỗi:</p>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {batchResult.errors.map((err, idx) => (
                          <li key={idx}>
                            <span className="font-medium mr-1">{err.order}:</span>
                            <span className="text-gray-600">{err.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowBatchModal(false); setBatchResult(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={batchProcessing}
              >
                Đóng
              </button>
              <button
                onClick={handleBatchProcess}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                disabled={batchProcessing}
              >
                {batchProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : "Chạy ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
