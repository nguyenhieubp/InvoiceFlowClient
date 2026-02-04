"use client";

import React, { useEffect, useState, useCallback } from "react";
import { warehouseProcessedApi } from "@/lib/api";
import { Toast } from "@/components/Toast";
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Activity,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
} from "lucide-react";

interface WarehouseProcessed {
  id: string;
  docCode: string;
  ioType: string;
  doctype?: string;
  transDate?: string;
  processedDate: string;
  result?: string;
  success: boolean;
  errorMessage?: string;
  payload?: string;
  fastApiResponse?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  success: number;
  failed: number;
  byIoType: {
    I: number;
    O: number;
    T: number;
  };
}

export default function WarehouseStatisticsPage() {
  const [warehouseProcessed, setWarehouseProcessed] = useState<
    WarehouseProcessed[]
  >([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    success: 0,
    failed: 0,
    byIoType: { I: 0, O: 0, T: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Initialize with current date
  const getTodayISO = () => new Date().toISOString().split("T")[0];

  const [filterInput, setFilterInput] = useState<{
    dateFrom?: string;
    dateTo?: string;
    ioType?: string;
    success?: string;
    docCode?: string;
    doctype?: string;
  }>({
    dateFrom: getTodayISO(),
    dateTo: getTodayISO(),
  });

  const [filter, setFilter] = useState<{
    dateFrom?: string;
    dateTo?: string;
    ioType?: string;
    success?: boolean;
    docCode?: string;
    doctype?: string;
  }>({
    dateFrom: getTodayISO(),
    dateTo: getTodayISO(),
  });

  const [retryingDocCode, setRetryingDocCode] = useState<string | null>(null);

  // Batch Retry State
  const [showBatchRetryModal, setShowBatchRetryModal] = useState(false);
  const [batchRetryDateFrom, setBatchRetryDateFrom] = useState<string>("");
  const [batchRetryDateTo, setBatchRetryDateTo] = useState<string>("");
  const [batchRetrying, setBatchRetrying] = useState(false);
  const [batchRetryResult, setBatchRetryResult] = useState<{
    success: boolean;
    message: string;
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [viewingPayload, setViewingPayload] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = useCallback((date: Date | string): string => {
    if (!date) {
      return "";
    }

    let d: Date;
    if (typeof date === "string") {
      // Parse YYYY-MM-DD format (from date input)
      const parts = date.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }

    if (isNaN(d.getTime())) {
      return "";
    }

    const day = d.getDate().toString().padStart(2, "0");
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }, []);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const loadWarehouseProcessed = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filter.dateFrom)
        params.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      if (filter.dateTo) params.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      if (filter.ioType) params.ioType = filter.ioType;
      if (filter.success !== undefined) params.success = filter.success;
      if (filter.docCode) params.docCode = filter.docCode;
      if (filter.doctype) params.doctype = filter.doctype;

      const response = await warehouseProcessedApi.getAll(params);
      setWarehouseProcessed(response.data.data || []);
      setStatistics(
        response.data.statistics || {
          total: 0,
          success: 0,
          failed: 0,
          byIoType: { I: 0, O: 0 },
        },
      );
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error: any) {
      showToast(
        "error",
        error?.response?.data?.message || "Không thể tải thống kê",
      );
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filter,
    convertDateToDDMMMYYYY,
    showToast,
  ]);

  useEffect(() => {
    loadWarehouseProcessed();
  }, [loadWarehouseProcessed]);

  const handleFilter = () => {
    setFilter({
      dateFrom: filterInput.dateFrom,
      dateTo: filterInput.dateTo,
      ioType: filterInput.ioType,
      success: filterInput.success ? filterInput.success === "true" : undefined,
      docCode: filterInput.docCode,
      doctype: filterInput.doctype,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilter = () => {
    const today = getTodayISO();
    setFilterInput({
      dateFrom: today,
      dateTo: today,
      ioType: "",
      success: "",
      docCode: "",
      doctype: "",
    });
    setFilter({
      dateFrom: today,
      dateTo: today,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRetry = async (docCode: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xử lý lại warehouse cho mã chứng từ "${docCode}"?`,
      )
    ) {
      return;
    }

    try {
      setRetryingDocCode(docCode);
      await warehouseProcessedApi.retryByDocCode(docCode);
      showToast("success", `Xử lý lại thành công cho mã chứng từ ${docCode}`);
      // Reload data after retry
      await loadWarehouseProcessed();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi khi xử lý lại warehouse";
      showToast("error", errorMessage);
      // Reload data even on error because the backend saves the error details
      await loadWarehouseProcessed();
    } finally {
      setRetryingDocCode(null);
    }
  };

  const [batchRetryDoctype, setBatchRetryDoctype] = useState<string>("");

  const handleBatchRetry = async () => {
    if (!batchRetryDateFrom || !batchRetryDateTo) {
      showToast("error", "Vui lòng chọn đầy đủ từ ngày và đến ngày");
      return;
    }

    const dateFrom = convertDateToDDMMMYYYY(batchRetryDateFrom);
    const dateTo = convertDateToDDMMMYYYY(batchRetryDateTo);

    if (!dateFrom || !dateTo) {
      showToast("error", "Ngày không hợp lệ. Vui lòng chọn lại ngày");
      return;
    }

    try {
      setBatchRetrying(true);
      setBatchRetryResult(null);
      const response = await warehouseProcessedApi.retryFailedByDateRange(
        dateFrom,
        dateTo,
        batchRetryDoctype || undefined,
      );
      setBatchRetryResult(response.data);
      showToast(
        "success",
        response.data.message || "Xử lý lại batch thành công",
      );
      // Reload data after retry
      await loadWarehouseProcessed();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi khi xử lý lại warehouse batch";
      showToast("error", errorMessage);
      setBatchRetryResult({
        success: false,
        message: errorMessage,
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
      });
      // Reload data even on error
      await loadWarehouseProcessed();
    } finally {
      setBatchRetrying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("info", "Đã sao chép mã chứng từ");
  };

  const getQuickView = (item: WarehouseProcessed) => {
    // If success, show success message
    if (item.success) {
      if (item.fastApiResponse) {
        try {
          const response = JSON.parse(item.fastApiResponse);
          if (Array.isArray(response) && response.length > 0) {
            const firstItem = response[0];
            if (firstItem.guid) {
              return `Thành công - GUID: ${Array.isArray(firstItem.guid) ? firstItem.guid[0] : firstItem.guid}`;
            }
            return firstItem.message || "Thành công";
          }
          if (typeof response === "object") {
            if (response.guid) {
              return `Thành công - GUID: ${Array.isArray(response.guid) ? response.guid[0] : response.guid}`;
            }
            return response.message || "Thành công";
          }
        } catch (e) {
          return "Thành công";
        }
      }
      return "Thành công";
    }

    // If failed, show error message
    if (item.errorMessage) {
      return item.errorMessage;
    }
    if (item.fastApiResponse) {
      try {
        const response = JSON.parse(item.fastApiResponse);
        if (Array.isArray(response) && response.length > 0) {
          return (
            response[0].error || response[0].message || "Lỗi không xác định"
          );
        }
        if (typeof response === "object") {
          return response.error || response.message || "Lỗi không xác định";
        }
      } catch (e) {
        // Fallback if not JSON or different structure
        return item.fastApiResponse.substring(0, 100) + "...";
      }
    }
    return "Lỗi không xác định";
  };

  const handleDeleteBatch = async () => {
    if (!batchRetryDateFrom || !batchRetryDateTo) {
      showToast("error", "Vui lòng chọn đầy đủ từ ngày và đến ngày");
      return;
    }

    const dateFrom = convertDateToDDMMMYYYY(batchRetryDateFrom);
    const dateTo = convertDateToDDMMMYYYY(batchRetryDateTo);

    if (!dateFrom || !dateTo) {
      showToast("error", "Ngày không hợp lệ. Vui lòng chọn lại ngày");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA thống kê trong khoảng thời gian từ ${dateFrom} đến ${dateTo}? Hành động này không thể hoàn tác!`,
      )
    ) {
      return;
    }

    try {
      setBatchRetrying(true);
      setBatchRetryResult(null);
      const response =
        await warehouseProcessedApi.deleteWarehouseTwiceByDateRange(
          dateFrom,
          dateTo,
          batchRetryDoctype || undefined,
        );

      showToast(
        "success",
        response.data.message ||
          `Đã xóa ${response.data.deletedCount} bản ghi thành công`,
      );
      // Reload data after delete
      await loadWarehouseProcessed();
      setShowBatchRetryModal(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi khi xóa thống kê warehouse";
      showToast("error", errorMessage);
    } finally {
      setBatchRetrying(false);
    }
  };

  const openBatchRetryModal = () => {
    setBatchRetryDateFrom(getTodayISO());
    setBatchRetryDateTo(getTodayISO());
    setBatchRetryDoctype("");
    setBatchRetryResult(null);
    setShowBatchRetryModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50/50">
      {/* Toast - Fixed position */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Payload/Response Viewing Modal */}
      {viewingPayload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {viewingPayload.title}
              </h2>
              <button
                onClick={() => setViewingPayload(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-sm bg-gray-50">
              <pre className="whitespace-pre-wrap break-all">
                {(() => {
                  try {
                    return JSON.stringify(
                      JSON.parse(viewingPayload.content),
                      null,
                      2,
                    );
                  } catch (e) {
                    return viewingPayload.content;
                  }
                })()}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setViewingPayload(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Retry Modal */}
      {showBatchRetryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-500" />
                Xử lý lại Batch (Hàng loạt)
              </h2>
              <button
                onClick={() => setShowBatchRetryModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-indigo-50 text-indigo-800 text-sm p-3 rounded-lg border border-indigo-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Hệ thống sẽ tìm các bản ghi bị lỗi trong khoảng thời gian đã
                  chọn tham số &quot;success=false&quot; và thực hiện xử lý lại.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={batchRetryDateFrom}
                    onChange={(e) => setBatchRetryDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={batchRetryDateTo}
                    onChange={(e) => setBatchRetryDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mb-6 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Loại chứng từ
                </label>
                <select
                  value={batchRetryDoctype}
                  onChange={(e) => setBatchRetryDoctype(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Tất cả</option>
                  <option value="STOCK_TRANSFER">
                    Chuyển kho (STOCK_TRANSFER)
                  </option>
                  <option value="STOCK_IO">Xuất nhập khác (STOCK_IO)</option>
                </select>
              </div>

              {batchRetryResult && (
                <div
                  className={`mb-6 p-4 rounded-lg border text-sm ${
                    batchRetryResult.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    {batchRetryResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {batchRetryResult.success ? "Hoàn thành" : "Có lỗi"}
                  </h4>
                  <div className="space-y-1 ml-6">
                    <p>{batchRetryResult.message}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 font-medium">
                      <div>Tổng: {batchRetryResult.totalProcessed}</div>
                      <div className="text-green-700">
                        OK: {batchRetryResult.successCount}
                      </div>
                      <div className="text-red-700">
                        Fail: {batchRetryResult.failedCount}
                      </div>
                    </div>
                    {batchRetryResult.errors &&
                      batchRetryResult.errors.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-200/50 max-h-24 overflow-y-auto custom-scrollbar">
                          <ul className="list-disc pl-4 space-y-0.5">
                            {batchRetryResult.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleDeleteBatch}
                  disabled={batchRetrying}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors mr-auto flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa thống kê
                </button>
                <button
                  onClick={() => setShowBatchRetryModal(false)}
                  disabled={batchRetrying}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={handleBatchRetry}
                  disabled={batchRetrying}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Xử lý ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Thống Kê Warehouse
          </h1>
          <p className="text-slate-500">
            Theo dõi và quản lý quá trình đồng bộ dữ liệu kho vận
          </p>
        </div>
        <div>
          <button
            onClick={openBatchRetryModal}
            className="px-4 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Xử lý lại Batch
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng số
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Thành công
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.success.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
            <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {statistics.total > 0
                ? ((statistics.success / statistics.total) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Thất bại
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.failed.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
            <div className="text-sm font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              {statistics.total > 0
                ? ((statistics.failed / statistics.total) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-sky-50 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-sky-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đầu vào (I)
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.byIoType.I.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đầu ra (O)
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.byIoType.O.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chuyển kho (T)
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {statistics.byIoType.T.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">bản ghi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Filter className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Bộ lọc tìm kiếm</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Từ ngày
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterInput.dateFrom}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, dateFrom: e.target.value })
                }
                className="w-full pl-3 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đến ngày
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterInput.dateTo}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, dateTo: e.target.value })
                }
                className="w-full pl-3 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loại IO
            </label>
            <div className="relative">
              <select
                value={filterInput.ioType || ""}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, ioType: e.target.value })
                }
                className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="">Tất cả</option>
                <option value="I">Nhập (I)</option>
                <option value="O">Xuất (O)</option>
                <option value="T">Chuyển kho (T)</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loại chứng từ
            </label>
            <div className="relative">
              <select
                value={filterInput.doctype || ""}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, doctype: e.target.value })
                }
                className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="">Tất cả</option>
                <option value="STOCK_TRANSFER">
                  Chuyển kho (STOCK_TRANSFER)
                </option>
                <option value="STOCK_IO">Xuất nhập khác (STOCK_IO)</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={filterInput.success || ""}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, success: e.target.value })
                }
                className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="">Tất cả</option>
                <option value="true">Thành công</option>
                <option value="false">Thất bại</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Mã chứng từ
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập mã chứng từ..."
                value={filterInput.docCode || ""}
                onChange={(e) =>
                  setFilterInput({ ...filterInput, docCode: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Đặt lại
          </button>
          <button
            onClick={handleFilter}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Áp dụng bộ lọc
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="max-h-[700px] overflow-auto custom-scrollbar">
          <table className="w-full text-sm">
            <colgroup>
              <col style={{ width: "160px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ minWidth: "300px" }} />
              <col style={{ width: "110px" }} />
            </colgroup>
            <thead className="bg-gray-50 text-gray-700 text-xs font-medium sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Mã chứng từ</th>
                <th className="px-4 py-3 text-left">Loại IO</th>
                <th className="px-4 py-3 text-left">Loại chứng từ</th>
                <th className="px-4 py-3 text-left">Ngày chứng từ</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ngày xử lý</th>
                <th className="px-4 py-3 text-left">Payload</th>
                <th className="px-4 py-3 text-left">Response</th>
                <th className="px-4 py-3 text-left">Quick View</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : warehouseProcessed.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Archive className="w-12 h-12 text-gray-300 mb-3" />
                      Không có dữ liệu
                    </div>
                  </td>
                </tr>
              ) : (
                warehouseProcessed.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {item.docCode}
                        <button
                          onClick={() => copyToClipboard(item.docCode)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-900 transition-all"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.ioType === "I"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : item.ioType === "O"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {item.ioType === "I"
                          ? "Nhập"
                          : item.ioType === "O"
                            ? "Xuất"
                            : "Chuyển kho"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.doctype || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {item.transDate ? formatDate(item.transDate) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.success ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 w-24 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Thành công
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 w-24 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200">
                          Thất bại
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(item.processedDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {item.payload ? (
                          <button
                            onClick={() =>
                              setViewingPayload({
                                title: `Payload của ${item.docCode}`,
                                content: item.payload || "",
                              })
                            }
                            className="text-left text-blue-600 hover:text-blue-800 underline text-xs"
                          >
                            Xem Payload
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {item.fastApiResponse ? (
                          <button
                            onClick={() =>
                              setViewingPayload({
                                title: `Kết quả trả về của ${item.docCode}`,
                                content: item.fastApiResponse || "",
                              })
                            }
                            className="text-left text-green-600 hover:text-green-800 underline text-xs"
                          >
                            Xem Kết quả API
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-600"
                      title={getQuickView(item)}
                    >
                      <div className="line-clamp-3 whitespace-normal break-words">
                        {getQuickView(item)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRetry(item.docCode)}
                        disabled={retryingDocCode === item.docCode}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {retryingDocCode === item.docCode ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-transparent" />
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination in Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Hiển thị trang{" "}
            <span className="font-medium">{pagination.page}</span> /{" "}
            <span className="font-medium">{pagination.totalPages}</span> (Tổng{" "}
            {pagination.total} bản ghi)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
