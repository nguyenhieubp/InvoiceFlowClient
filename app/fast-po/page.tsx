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
            });
            if (response.data) {
                setData(response.data.data);
                const meta = response.data.meta;
                setPagination({
                    page: Number(meta.page),
                    limit: Number(meta.limit),
                    total: Number(meta.total),
                    totalPages: Number(meta.last_page),
                });
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
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo Mã đơn hàng..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Mã đơn hàng</th>
                                <th className="px-6 py-3">Lần đồng bộ cuối</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
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
                                            {item.orderCode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {item.lastSync
                                                ? format(new Date(item.lastSync), "dd/MM/yyyy HH:mm:ss")
                                                : "-"}
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
        </div>
    );
}
