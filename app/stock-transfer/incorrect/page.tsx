"use client";

import React, { useEffect, useState } from "react";
import { stockTransferApi } from "@/lib/api";

interface StockTransfer {
  id: string;
  doctype: string;
  docCode: string;
  transDate: string;
  docDesc?: string;
  branchCode: string;
  brandCode: string;
  itemCode: string;
  itemName: string;
  materialCode?: string;
  stockCode: string;
  relatedStockCode?: string;
  ioType: string;
  qty: number | string;
  batchSerial?: string;
  lineInfo1?: string;
  lineInfo2?: string;
  soCode?: string;
  syncDate?: string;
  brand?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncorrectStockTransferPage() {
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatQty = (qty: number | string) => {
    const numValue = typeof qty === "string" ? parseFloat(qty) : qty;
    return (
      numValue?.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "0.00"
    );
  };

  const loadStockTransfers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };

      const response = await stockTransferApi.getIncorrect(params);
      setStockTransfers(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
      }));
    } catch (error: any) {
      console.error("Failed to load incorrect stock transfers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]); // Trigger on pagination change

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
    loadStockTransfers();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-red-600">
                Danh sách xuất kho lỗi (Thiếu Material Code)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Các bản ghi Stock Transfer thiếu mã vật tư (materialCode) cần
                được kiểm tra.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tìm theo Mã CT, Mã SP..."
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-64"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      // Optional: Trigger search immediately on clear? Or let user click search.
                      // Let's just clear for now.
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-red-600 mb-4"></div>
                <p className="text-sm text-gray-500">Đang tải dữ liệu lỗi...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-800">
                    Danh sách lỗi
                  </span>
                  {pagination.total > 0 && (
                    <span className="text-xs text-red-600">
                      ({pagination.total} bản ghi)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Hiển thị:</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setPagination((prev) => ({
                        ...prev,
                        limit: newLimit,
                        page: 1,
                      }));
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Loại CT
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã CT
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CN
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã SP
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50">
                        Material Code
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tên SP
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Kho
                      </th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        SL
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã ĐH
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center">
                          <p className="text-sm text-gray-500">
                            Tuyệt vời! Không có bản ghi lỗi nào.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      stockTransfers.map((st) => (
                        <tr
                          key={st.id}
                          className="hover:bg-red-50 transition-colors cursor-pointer"
                          onDoubleClick={() => loadStockTransfers()}
                          title="Double-click để làm mới"
                        >
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-700">
                            {st.doctype}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-900">
                            {formatDateOnly(st.transDate)}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-900 font-mono">
                            {st.docCode}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-700">
                            {st.branchCode}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-900 font-mono">
                            {st.itemCode}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-red-600 font-mono font-bold bg-red-50">
                            {st.materialCode || "MISSING"}
                          </td>
                          <td
                            className="px-2 py-2.5 text-xs text-gray-700 max-w-xs truncate"
                            title={st.itemName}
                          >
                            {st.itemName}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-700 font-mono">
                            {st.stockCode}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-900 text-right font-medium">
                            {formatQty(st.qty)}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-700 font-mono">
                            {st.soCode || "-"}
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(st.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="text-xs text-gray-600">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
