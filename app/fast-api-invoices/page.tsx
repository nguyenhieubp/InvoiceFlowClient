"use client";

import { useEffect, useState, useCallback } from "react";
import { fastApiInvoicesApi, salesApi } from "@/lib/api";
import { Toast } from "@/components/Toast";
import { Search, Filter, Calendar, Download, RefreshCw } from "lucide-react";

interface FastApiInvoice {
  id: string;
  docCode: string;
  maDvcs: string | null;
  maKh: string | null;
  tenKh: string | null;
  ngayCt: string | null;
  status: number;
  guid: string | null;
  fastApiResponse: string | null;
  payload: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  xemNhanh: string | null; // [New]
}

export default function FastApiInvoicesPage() {
  const [invoices, setInvoices] = useState<FastApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    status: "",
    docCode: "",
    maKh: "",
    tenKh: "",
    maDvcs: "",
    startDate: "",
    endDate: "",
  });
  // [NEW] tempFilters for UI state (while typing)
  const [tempFilters, setTempFilters] = useState({
    status: "",
    docCode: "",
    maKh: "",
    tenKh: "",
    maDvcs: "",
    startDate: "",
    endDate: "",
  });

  const [statistics, setStatistics] = useState<{
    total: number;
    success: number;
    failed: number;
    successRate: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [viewingPayload, setViewingPayload] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadInvoices = useCallback(async () => {
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
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        hasNext: data.pagination?.hasNext || false,
        hasPrev: data.pagination?.hasPrev || false,
      }));
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      setToast({
        type: "error",
        message:
          error?.response?.data?.message || "Lỗi khi tải danh sách hóa đơn",
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.status,
    filters.docCode,
    filters.maKh,
    filters.tenKh,
    filters.maDvcs,
    filters.startDate,
    filters.endDate,
  ]);

  const loadStatistics = useCallback(async () => {
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;

      const response = await fastApiInvoicesApi.getStatistics(params);
      setStatistics(response.data);
    } catch (error: any) {
      console.error("Error loading statistics:", error);
    }
  }, [filters.startDate, filters.endDate, filters.maDvcs]);

  const handleRetry = async (docCode: string) => {
    try {
      setRetrying((prev) => ({ ...prev, [docCode]: true }));
      const response = await salesApi.createInvoiceViaFastApi(docCode, true);
      const data = response.data;

      console.log("[Retry] Response data:", data);

      if (data.alreadyExists) {
        showToast(
          "info",
          data.message || `Đơn hàng ${docCode} đã được tạo hóa đơn trước đó`,
        );
        // Load lại để cập nhật status nếu cần
        await loadInvoices();
        await loadStatistics();
        return;
      }

      let hasError = false;
      if (Array.isArray(data.result) && data.result.length > 0) {
        hasError = data.result.some((item: any) => item.status === 0);
      } else if (data.result && typeof data.result === "object") {
        hasError = data.result.status === 0;
      }

      // Xác định thông báo lỗi/thành công để cập nhật UI
      let uiMessage = "";
      if (data.success && !hasError) {
        uiMessage = data.message || `Đồng bộ lại ${docCode} thành công`;
        showToast("success", uiMessage);
      } else {
        uiMessage = data.message || `Đồng bộ lại ${docCode} thất bại`;
        if (Array.isArray(data.result) && data.result.length > 0) {
          const firstError = data.result[0];
          if (firstError.message) uiMessage = firstError.message;
        } else if (data.result?.message) {
          uiMessage = data.result.message;
        }
        showToast("error", uiMessage);
      }

      // [NEW] Cập nhật ngay lập tức state local để log hiển thị luôn
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => {
          if (inv.docCode === docCode) {
            return {
              ...inv,
              status: data.success && !hasError ? 1 : 0,
              xemNhanh: uiMessage,
              lastErrorMessage:
                !data.success || hasError ? uiMessage : inv.lastErrorMessage,
              fastApiResponse: JSON.stringify(data.result || {}),
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        }),
      );
    } catch (error: any) {
      console.error("Error retrying invoice:", error);
      let errorMessage = `Lỗi khi đồng bộ lại ${docCode}`;

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showToast("error", errorMessage);

      // Update state to show error
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => {
          if (inv.docCode === docCode) {
            return {
              ...inv,
              status: 0,
              xemNhanh: errorMessage,
              lastErrorMessage: errorMessage,
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        }),
      );
    } finally {
      setRetrying((prev) => ({ ...prev, [docCode]: false }));
      // Reload background để đảm bảo đồng bộ hoàn toàn, kể cả khi lỗi
      loadInvoices();
      loadStatistics();
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    setFilters(tempFilters);
    // loadInvoices & loadStatistics will trigger via useEffect on filters change
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      status: "",
      docCode: "",
      maKh: "",
      tenKh: "",
      maDvcs: "",
      startDate: "",
      endDate: "",
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handleSyncByDateRange = async () => {
    if (!syncDateRange.startDate || !syncDateRange.endDate) {
      showToast("error", "Vui lòng chọn từ ngày và đến ngày");
      return;
    }

    const startDate = new Date(syncDateRange.startDate);
    const endDate = new Date(syncDateRange.endDate);

    if (startDate > endDate) {
      showToast("error", "Từ ngày phải nhỏ hơn hoặc bằng đến ngày");
      return;
    }

    try {
      setSyncingAll(true);
      setShowSyncModal(false);
      showToast(
        "info",
        "Đang đồng bộ invoice thất bại theo khoảng thời gian...",
      );

      // Gọi API backend để xử lý đồng bộ
      const response = await fastApiInvoicesApi.syncByDateRange({
        startDate: syncDateRange.startDate,
        endDate: syncDateRange.endDate,
        maDvcs: filters.maDvcs || undefined,
      });

      const data = response.data;

      // Đợi một chút để đảm bảo database đã được cập nhật
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload data
      await loadInvoices();
      await loadStatistics();

      // Hiển thị kết quả
      if (
        data.successCount > 0 &&
        data.failCount === 0 &&
        data.alreadyExistsCount === 0
      ) {
        showToast(
          "success",
          `Đồng bộ thành công ${data.successCount} invoice trong khoảng ${syncDateRange.startDate} - ${syncDateRange.endDate}`,
        );
      } else if (
        data.successCount > 0 &&
        data.failCount === 0 &&
        data.alreadyExistsCount > 0
      ) {
        showToast(
          "success",
          `Đồng bộ thành công ${data.successCount} invoice, ${data.alreadyExistsCount} invoice đã tồn tại trước đó`,
        );
      } else if (data.successCount > 0 && data.failCount > 0) {
        showToast(
          "info",
          `Đồng bộ thành công ${data.successCount} invoice, thất bại ${data.failCount} invoice${data.alreadyExistsCount > 0 ? `, ${data.alreadyExistsCount} đã tồn tại` : ""}`,
        );
      } else if (data.successCount === 0 && data.failCount > 0) {
        const errorMessages = data.results
          .filter((r: any) => !r.success)
          .slice(0, 3)
          .map(
            (r: any) => `${r.docCode}: ${r.error || r.message || "Thất bại"}`,
          )
          .join("; ");
        showToast(
          "error",
          `Đồng bộ thất bại ${data.failCount} invoice. ${errorMessages}`,
        );
      } else {
        showToast("info", data.message || "Không có invoice nào được xử lý");
      }
    } catch (error: any) {
      console.error("Error syncing invoices by date range:", error);
      showToast(
        "error",
        error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi đồng bộ lại invoice theo khoảng thời gian",
      );
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncAllFailed = async () => {
    try {
      setSyncingAll(true);
      showToast("info", "Đang yêu cầu server đồng bộ lại các invoice lỗi...");

      // Gọi API backend để xử lý đồng bộ
      const response = await salesApi.retryFailedInvoices();
      const data = response.data;

      console.log("[Retry Batch] Result:", data);

      if (data.processed === 0) {
        showToast("info", "Không có invoice thất bại nào để đồng bộ");
        return;
      }

      // Đợi một chút để đảm bảo database đã được cập nhật
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload data
      await loadInvoices();
      await loadStatistics();

      // Hiển thị kết quả
      if (data.success > 0 && data.failed === 0) {
        showToast("success", `Đồng bộ thành công ${data.success} invoice`);
      } else if (data.success > 0 && data.failed > 0) {
        showToast(
          "info",
          `Đồng bộ thành công ${data.success} invoice, thất bại ${data.failed} invoice`,
        );
      } else {
        // Lấy 3 lỗi đầu tiên để hiển thị
        const errors = data.results
          .filter((r: any) => !r.success)
          .slice(0, 3)
          .map((r: any) => `${r.docCode}: ${r.error || r.message}`)
          .join("; ");
        showToast("error", `Đồng bộ thất bại. ${errors}`);
      }
    } catch (error: any) {
      console.error("Error syncing all failed invoices:", error);
      showToast(
        "error",
        error?.message || "Lỗi khi đồng bộ lại tất cả invoice",
      );
    } finally {
      setSyncingAll(false);
    }
  };

  const getQuickView = (invoice: FastApiInvoice) => {
    // [NEW] Prioritize the dedicated xemNhanh column
    if (invoice.xemNhanh) {
      return invoice.xemNhanh;
    }
    if (invoice.lastErrorMessage) {
      return invoice.lastErrorMessage;
    }
    if (invoice.fastApiResponse) {
      try {
        const response = JSON.parse(invoice.fastApiResponse);
        if (Array.isArray(response) && response.length > 0) {
          return (
            response[0].message || response[0].error || "Lỗi không xác định"
          );
        }
        if (typeof response === "object") {
          return response.message || response.error || "Lỗi không xác định";
        }
      } catch (e) {
        // Fallback if not JSON or different structure
        return invoice.fastApiResponse.substring(0, 100) + "...";
      }
    }
    return "-";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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

  // Basic columns for main table
  const basicColumns = [
    { key: "docCode", label: "Mã đơn hàng", width: "w-32" },
    { key: "maKh", label: "Mã KH", width: "w-24" },
    { key: "tenKh", label: "Tên KH", width: "w-40" },
    { key: "maDvcs", label: "Mã ĐVCS", width: "w-20" },
    { key: "ngayCt", label: "Ngày CT", width: "w-24" },
    { key: "status", label: "Trạng thái", width: "w-24" },
    { key: "action", label: "Thao tác", width: "w-40" },
    { key: "payload", label: "Dữ liệu gửi", width: "w-32" },
    { key: "result", label: "Kết quả", width: "w-48" },
    { key: "quickView", label: "Xem nhanh", width: "min-w-[20rem]" },
  ];

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params: any = {};
      if (filters.status) params.status = parseInt(filters.status);
      if (filters.docCode) params.docCode = filters.docCode;
      if (filters.maKh) params.maKh = filters.maKh;
      if (filters.tenKh) params.tenKh = filters.tenKh;
      if (filters.maDvcs) params.maDvcs = filters.maDvcs;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await fastApiInvoicesApi.exportExcel(params);

      // Download file
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `InvoiceLogs_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("success", "Xuất file Excel thành công");
    } catch (error: any) {
      console.error("Error exporting excel:", error);
      showToast(
        "error",
        error?.response?.data?.message || "Lỗi khi xuất file Excel",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Toast - Fixed position at top */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Payload Modal */}
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

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bảng kê hóa đơn
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              Danh sách chi tiết các hóa đơn đã tạo từ Fast API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncingAll ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Đang đồng bộ...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Đồng bộ lại đơn lỗi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal đồng bộ theo ngày */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Đồng bộ đơn lỗi theo ngày
              </h2>
              <button
                onClick={() => setShowSyncModal(false)}
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={syncDateRange.startDate}
                  onChange={(e) =>
                    setSyncDateRange({
                      ...syncDateRange,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={syncDateRange.endDate}
                  onChange={(e) =>
                    setSyncDateRange({
                      ...syncDateRange,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {filters.maDvcs && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Sẽ áp dụng filter Mã ĐVCS:{" "}
                    <strong>{filters.maDvcs}</strong>
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleSyncByDateRange}
                disabled={
                  syncingAll ||
                  !syncDateRange.startDate ||
                  !syncDateRange.endDate
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncingAll ? "Đang đồng bộ..." : "Đồng bộ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <>
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Tổng số</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.total}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Thành công</div>
              <div className="text-2xl font-bold text-green-600">
                {statistics.success}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Thất bại</div>
              <div className="text-2xl font-bold text-red-600">
                {statistics.failed}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.successRate}%
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-5 text-slate-800 font-semibold border-b border-slate-100 pb-3">
            <Filter className="w-5 h-5 text-indigo-500" />
            <h3>Bộ lọc tìm kiếm</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  value={tempFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all shadow-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Thành công</option>
                  <option value="0">Thất bại</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Mã đơn hàng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempFilters.docCode}
                  onChange={(e) =>
                    handleFilterChange("docCode", e.target.value)
                  }
                  placeholder="VD: SO31..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Mã Khách Hàng
              </label>
              <input
                type="text"
                value={tempFilters.maKh}
                onChange={(e) => handleFilterChange("maKh", e.target.value)}
                placeholder="VD: KF25..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Tên Khách Hàng
              </label>
              <input
                type="text"
                value={tempFilters.tenKh}
                onChange={(e) => handleFilterChange("tenKh", e.target.value)}
                placeholder="Tên khách hàng..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Mã Đơn Vị
              </label>
              <input
                type="text"
                value={tempFilters.maDvcs}
                onChange={(e) => handleFilterChange("maDvcs", e.target.value)}
                placeholder="VD: FBV..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Từ ngày
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tempFilters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Đến ngày
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tempFilters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end gap-3 pt-6 lg:pt-0">
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Search className="w-4 h-4" /> Tìm kiếm
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all text-sm shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportExcel}
                disabled={isExporting || loading}
                className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-md shadow-emerald-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Xuất Excel"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Header with Count - Always visible */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                {loading ? (
                  <span>Đang tải...</span>
                ) : (
                  <>
                    Tổng số:{" "}
                    <span className="font-bold text-gray-900">
                      {pagination.total}
                    </span>{" "}
                    đơn hàng
                    {pagination.total > 0 && (
                      <span className="ml-2 text-gray-500">
                        (Hiển thị{" "}
                        {Math.min(
                          (pagination.page - 1) * pagination.limit + 1,
                          pagination.total,
                        )}{" "}
                        -{" "}
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                        )
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Hiển thị:</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setPagination({ ...pagination, limit: newLimit, page: 1 });
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">bản ghi/trang</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có dữ liệu
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {basicColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width || ""}`}
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
                          {invoice.maKh || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.tenKh || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.maDvcs || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateOnly(invoice.ngayCt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRetry(invoice.docCode)}
                            disabled={retrying[invoice.docCode]}
                            className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {retrying[invoice.docCode]
                              ? "Đang xử lý..."
                              : "Đồng bộ lại"}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {invoice.payload ? (
                            <button
                              onClick={() =>
                                setViewingPayload({
                                  title: `Dữ liệu gửi của ${invoice.docCode}`,
                                  content: invoice.payload || "",
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Xem JSON
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-48">
                          <div className="flex flex-col gap-2">
                            {invoice.fastApiResponse ? (
                              <button
                                onClick={() =>
                                  setViewingPayload({
                                    title: `Kết quả trả về của ${invoice.docCode}`,
                                    content: invoice.fastApiResponse || "",
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
                          className="px-6 py-4 text-sm text-gray-600"
                          style={{ minWidth: "20rem", maxWidth: "20rem" }}
                          title={getQuickView(invoice)}
                        >
                          <div className="line-clamp-4 whitespace-normal break-words">
                            {getQuickView(invoice)}
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
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    }
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    }
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị{" "}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{" "}
                      đến{" "}
                      <span className="font-medium">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>{" "}
                      trong tổng số{" "}
                      <span className="font-medium">{pagination.total}</span>{" "}
                      kết quả
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page - 1,
                          })
                        }
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Trang {pagination.page} / {pagination.totalPages || 1}
                      </span>
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                          })
                        }
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
      </>
    </div>
  );
}
