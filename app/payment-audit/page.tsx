"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface PaymentSyncLog {
  id: string;
  docCode: string;
  docDate: string;
  requestPayload: string;
  responsePayload: string;
  status: string; // SUCCESS, ERROR
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

export default function PaymentAuditPage() {
  const [logs, setLogs] = useState<PaymentSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    docCode: "",
    status: "",
  });

  // [NEW] Actual filters applied to API
  const [activeFilters, setActiveFilters] = useState({
    docCode: "",
    status: "",
  });

  const [selectedLog, setSelectedLog] = useState<PaymentSyncLog | null>(null);
  const [retryLoading, setRetryLoading] = useState<string | null>(null); // id of log being retried

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, activeFilters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/payments/audit", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          docCode: activeFilters.docCode || undefined,
          status: activeFilters.status || undefined,
        },
      });

      setLogs(response.data.items || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (log: PaymentSyncLog) => {
    if (!confirm("Bạn có chắc muốn chạy lại giao dịch này?")) return;

    try {
      setRetryLoading(log.id);
      const response = await api.post(`/payments/audit/${log.id}/retry`);

      // Reload logs after retry (a new log will be created)
      alert(
        response.data?.success ? "Retry thành công!" : "Retry thất bại/có lỗi!",
      );
      loadLogs();
    } catch (error: any) {
      console.error("Retry failed:", error);
      alert(
        "Retry thất bại: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setRetryLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActiveFilters(filters);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Lịch sử đồng bộ thanh toán
              </h1>
              <p className="text-sm text-slate-500">
                Theo dõi và kiểm tra các bản ghi đồng bộ giao dịch
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold text-sm uppercase tracking-wide">
            <Filter className="w-4 h-4" />
            Bộ lọc tìm kiếm
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                Mã chứng từ / Đơn hàng
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all outline-none"
                  placeholder="Nhập mã chứng từ..."
                  value={filters.docCode}
                  onChange={(e) =>
                    setFilters({ ...filters, docCode: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="ERROR">Thất bại</option>
                </select>
                <div className="absolute left-3 top-2.5 pointer-events-none text-slate-400">
                  {filters.status === "SUCCESS" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : filters.status === "ERROR" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-md shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 duration-100"
              >
                <Search className="w-4 h-4" />
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-sm text-slate-500 font-medium">
              Tổng số:{" "}
              <span className="text-slate-900 font-bold">
                {pagination.total}
              </span>{" "}
              bản ghi
            </span>
            <div className="text-xs text-slate-400 italic flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated just now
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[180px]">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Mã chứng từ / Payload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[140px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">
                    Thông báo lỗi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[120px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-8 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-400 flex flex-col items-center justify-center"
                    >
                      <div className="p-4 bg-slate-50 rounded-full mb-3">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>Không tìm thấy dữ liệu nào phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="group hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(log.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-indigo-900 font-mono">
                            {log.docCode || "-"}
                          </span>
                          <span
                            className="text-xs text-slate-400 font-mono"
                            title={log.id}
                          >
                            ID: {log.id.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.errorMessage ? (
                          <div
                            className="text-sm text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100 line-clamp-2"
                            title={log.errorMessage}
                          >
                            {log.errorMessage}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm italic">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                            title="Xem chi tiết"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {log.status === "ERROR" && (
                            <button
                              onClick={() => handleRetry(log)}
                              disabled={retryLoading === log.id}
                              className={`p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all ${
                                retryLoading === log.id
                                  ? "opacity-50 cursor-not-allowed animate-spin"
                                  : ""
                              }`}
                              title="Chạy lại (Retry)"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Trang{" "}
              <span className="font-semibold text-slate-700">
                {pagination.page}
              </span>{" "}
              / {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sau <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Chi tiết Log giao dịch
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    ID: {selectedLog.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Trạng thái
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                        selectedLog.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedLog.status}
                    </span>
                    <span className="text-sm text-slate-500">
                      •{" "}
                      {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Thông tin chứng từ
                  </span>
                  <div className="text-sm font-mono text-slate-800 font-medium">
                    {selectedLog.docCode || "N/A"}
                  </div>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Lỗi xảy ra</h4>
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Request Payload
                    </h4>
                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">
                      JSON
                    </span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-50 p-5 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800 shadow-inner max-h-[300px]">
                      {tryFormatJson(selectedLog.requestPayload)}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Response Payload
                    </h4>
                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">
                      JSON
                    </span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-50 p-5 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800 shadow-inner max-h-[300px]">
                      {tryFormatJson(selectedLog.responsePayload)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function tryFormatJson(str: string | null) {
  if (!str) return "null";
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch (e) {
    return str;
  }
}
