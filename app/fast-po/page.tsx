"use client";

import { useState, useEffect } from "react";
import { fastPOApi } from "@/lib/api";
import { format } from "date-fns";
import { Toast } from "@/components/Toast";

export default function FastPOPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [retryingId, setRetryingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteFromDate, setDeleteFromDate] = useState("");
    const [deleteToDate, setDeleteToDate] = useState("");
    const [deleteStatusFilter, setDeleteStatusFilter] = useState("");

    const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

    const [toast, setToast] = useState<{
        type: "success" | "error" | "info";
        message: string;
    } | null>(null);

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fastPOApi.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                status: statusFilter || undefined,
            } as any);
            if (response.data) {
                // If the response is a direct array (as in getAuditLogs), or nested
                const logs = Array.isArray(response.data) ? response.data : response.data.data || [];
                setData(logs);

                // If there's metadata for pagination
                if (response.data.meta) {
                    const meta = response.data.meta;
                    setPagination({
                        page: Number(meta.page),
                        limit: Number(meta.limit),
                        total: Number(meta.total),
                        totalPages: Number(meta.last_page),
                    });
                } else {
                    // No meta from simple getMany() call without pagination logic
                    setPagination(prev => ({ ...prev, total: logs.length, totalPages: 1 }));
                }
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Pagination change triggers fetch
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit]);

    const handleSearch = () => {
        if (pagination.page === 1) {
            fetchData();
        } else {
            setPagination((prev) => ({ ...prev, page: 1 }));
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleRetry = async (id: number) => {
        setRetryingId(id);
        try {
            await fastPOApi.retry(id);
            setToast({
                type: "success",
                message: `Đã gửi yêu cầu chạy lại đồng bộ #${id} thành công!`,
            });
            // Refresh data after a small delay to see the new audit log
            setTimeout(fetchData, 1000);
        } catch (error: any) {
            console.error("Error retrying sync:", error);
            setToast({
                type: "error",
                message: error.response?.data?.message || "Lỗi khi chạy lại đồng bộ",
            });
        } finally {
            setRetryingId(null);
        }
    };

    const handleDeleteLog = async (id: number) => {
        if (!confirm(`Bạn có chắc chắn muốn xoá log #${id}?`)) return;
        setDeletingId(id);
        try {
            await fastPOApi.deleteLog(id);
            setToast({ type: "success", message: `Đã xoá log #${id}` });
            fetchData();
        } catch (error: any) {
            setToast({
                type: "error",
                message: error.response?.data?.message || "Lỗi khi xoá log",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteByDateRange = async () => {
        if (!deleteFromDate || !deleteToDate) {
            setToast({ type: "error", message: "Vui lòng chọn khoảng ngày cần xoá" });
            return;
        }
        if (!confirm(`Xoá tất cả log từ ${deleteFromDate} đến ${deleteToDate}${deleteStatusFilter ? ` (${deleteStatusFilter})` : ""}? Không thể hoàn tác!`)) return;
        setDeletingAll(true);
        try {
            const res = await fastPOApi.deleteLogsByDateRange({
                startDate: deleteFromDate,
                endDate: deleteToDate,
                status: deleteStatusFilter || undefined,
            });
            setToast({ type: "success", message: res.data?.message || "Đã xoá log" });
            setShowDeleteModal(false);
            fetchData();
        } catch (error: any) {
            setToast({
                type: "error",
                message: error.response?.data?.message || "Lỗi khi xoá log",
            });
        } finally {
            setDeletingAll(false);
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

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Lịch sử đồng bộ Fast PO
                </h1>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xoá log theo ngày
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Tìm kiếm mã PO</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchData()}
                            placeholder="Nhập mã đơn hàng..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Từ ngày</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Đến ngày</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="">Tất cả</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setPagination(prev => ({ ...prev, page: 1 }));
                                fetchData();
                            }}
                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:transform active:scale-95"
                        >
                            Lọc
                        </button>

                        <button
                            onClick={() => {
                                setSearch("");
                                setDateFrom("");
                                setDateTo("");
                                setStatusFilter("");
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-6 py-2.5 text-gray-500 hover:text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Mã đơn hàng</th>
                                <th className="px-6 py-3">Ngày đơn hàng</th>
                                <th className="px-6 py-3">Hành động</th>
                                <th className="px-6 py-3">Trạng thái</th>
                                <th className="px-6 py-3">Thời gian log</th>
                                <th className="px-6 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="bg-white border-b hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono text-gray-900">
                                            {item.dh_so || item.orderCode || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {item.dh_ngay ? format(new Date(item.dh_ngay), "dd/MM/yyyy") : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase">
                                                {item.action || "SYNC"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${item.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {format(new Date(item.created_at || item.lastSync), "dd/MM/yyyy HH:mm:ss")}
                                        </td>
                                        <td className="px-6 py-4 space-x-3">
                                            <button
                                                onClick={() => setSelectedAudit(item)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                onClick={() => handleRetry(item.id)}
                                                disabled={retryingId === item.id}
                                                className={`font-medium ${retryingId === item.id
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-orange-600 hover:text-orange-800'
                                                    }`}
                                            >
                                                {retryingId === item.id ? "Đang chạy..." : "Chạy lại"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLog(item.id)}
                                                disabled={deletingId === item.id}
                                                className={`font-medium ${deletingId === item.id
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-red-600 hover:text-red-800'
                                                    }`}
                                            >
                                                {deletingId === item.id ? "Đang xoá..." : "Xoá"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Trang {pagination.page} / {pagination.totalPages} ({pagination.total} dòng)
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Detail Modal */}
            {selectedAudit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Chi tiết Audit</h3>
                                <p className="text-sm text-gray-500">PO: {selectedAudit.dh_so} | ID: #{selectedAudit.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAudit(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {selectedAudit.error && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <h4 className="text-sm font-bold text-red-800 mb-1 uppercase">Lỗi</h4>
                                    <p className="text-sm text-red-700 font-mono whitespace-pre-wrap">{selectedAudit.error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase flex items-center">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                        Payload (Gửi đi)
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-gray-800">
                                            {JSON.stringify(selectedAudit.payload, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase flex items-center">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${selectedAudit.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        Response (Phản hồi)
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-gray-800">
                                            {JSON.stringify(selectedAudit.response, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-xl">
                            <button
                                onClick={() => setSelectedAudit(null)}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete by Date Range Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Xoá log theo khoảng ngày</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày (ngày tạo log)</label>
                                <input
                                    type="date"
                                    value={deleteFromDate}
                                    onChange={(e) => setDeleteFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                <input
                                    type="date"
                                    value={deleteToDate}
                                    onChange={(e) => setDeleteToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái (tuùy chọn)</label>
                                <select
                                    value={deleteStatusFilter}
                                    onChange={(e) => setDeleteStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none bg-white"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="SUCCESS">SUCCESS</option>
                                    <option value="ERROR">ERROR</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deletingAll}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteByDateRange}
                                disabled={deletingAll}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {deletingAll ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Đang xoá...
                                    </>
                                ) : "Xoá log"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
