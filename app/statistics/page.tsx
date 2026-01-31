"use client";

import React, { useState, useEffect } from "react";
import { salesApi } from "@/lib/api";
import { Toast } from "@/components/Toast";

export default function StatisticsPage() {
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [filters, setFilters] = useState({
    brand: "",
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    typeSale: "ALL",
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  const fetchOrderCount = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getOrderCount({
        brand: filters.brand || undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        typeSale: filters.typeSale === "ALL" ? undefined : filters.typeSale,
      });
      setTotalOrders(response.data);
    } catch (error: any) {
      showToast("error", "Không thể lấy số lượng đơn hàng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderCount();
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Thống kê đơn hàng
          </h1>

          <div className="flex flex-col gap-4">
            {/* Filters Row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Nhãn hàng:
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Tất cả</option>
                  <option value="chando">Chando</option>
                  <option value="f3">F3</option>
                  <option value="labhair">LabHair</option>
                  <option value="yaman">Yaman</option>
                  <option value="menard">Menard</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Loại đơn:
                </label>
                <select
                  value={filters.typeSale}
                  onChange={(e) =>
                    setFilters({ ...filters, typeSale: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                </select>
              </div>

              <button
                onClick={fetchOrderCount}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tổng số đơn hàng
          </h2>

          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="text-4xl font-bold text-gray-300 animate-pulse">
                Đang tải...
              </div>
            ) : (
              <div className="text-7xl font-bold text-gray-900 transition-all">
                {totalOrders?.toLocaleString() ?? "0"}
              </div>
            )}
            <span className="text-xl font-medium text-gray-400">đơn</span>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            * Tính theo số lượng docCode duy nhất trong khoảng thời gian đã chọn
          </p>
        </div>
      </div>
    </div>
  );
}
