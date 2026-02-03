"use client";

import React, { useEffect, useState } from "react";
import { salesApi, stockTransferApi } from "@/lib/api";
// Icons as basic SVGs to avoid dependency
const RotateCwIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const Edit2Icon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const SaveIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const RefreshCwIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// Types
interface ErrorOrder {
  id: string;
  docCode: string;
  docDate: string;
  itemCode: string;
  materialCode?: string; // New field
  branchCode: string;
  customer?: {
    name?: string;
    code?: string;
  };
  itemName?: string;
  type_sale?: string;
  statusAsys: boolean;
}

export default function ErrorOrdersPage() {
  const [data, setData] = useState<ErrorOrder[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // States cho filter
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Applied filters (trigger fetch)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editMaterialCode, setEditMaterialCode] = useState("");
  const [editBranchCode, setEditBranchCode] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API getStatusAsys với statusAsys='false' để lấy đơn lỗi
      const response = await salesApi.getStatusAsys({
        statusAsys: "false",
        page,
        limit: 10,
        search: appliedFilters.search,
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
      });

      if (response.data && response.data.data) {
        setData(response.data.data);
        setMeta({
          totalItems: response.data.total,
          itemCount: response.data.data.length,
          itemsPerPage: response.data.limit,
          totalPages: response.data.totalPages,
          currentPage: response.data.page,
        });
      } else {
        setData([]);
        setMeta(null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch only when page or appliedFilters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  // Handle Search Button Click
  const handleSearch = () => {
    setPage(1); // Reset to page 1
    setAppliedFilters({
      search,
      dateFrom,
      dateTo,
    });
  };

  // Handle Sync All
  const handleSyncAll = async () => {
    if (
      confirm(
        "Bạn có chắc muốn đồng bộ lại toàn bộ đơn lỗi? Quá trình này có thể mất vài phút.",
      )
    ) {
      setSyncing(true);
      try {
        const res = await salesApi.syncErrorOrders();
        const result = res.data;
        alert(
          `Đồng bộ hoàn tất.\nTổng: ${result.total}\nThành công: ${result.success}\nThất bại: ${result.failed}`,
        );
        fetchData();
      } catch (error) {
        console.error("Sync all failed", error);
        alert("Đồng bộ thất bại. Vui lòng thử lại.");
      } finally {
        setSyncing(false);
      }
    }
  };

  // Handle Sync Single
  const handleSyncSingle = async (docCode: string) => {
    setSyncing(true);
    try {
      const res = await salesApi.syncErrorOrderByDocCode(docCode);
      const result = res.data;
      if (result.success) {
        alert(`Đồng bộ thành công đơn ${docCode}`);
        fetchData();
      } else {
        alert(`Đồng bộ thất bại đơn ${docCode}\nChi tiết: ${result.message}`);
      }
    } catch (error) {
      console.error("Sync single failed", error);
      alert("Lỗi khi đồng bộ đơn hàng.");
    } finally {
    }
  };

  const handleEdit = (item: ErrorOrder) => {
    setEditingId(item.id);
    setEditMaterialCode(item.materialCode || "");
    setEditBranchCode(item.branchCode || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditMaterialCode("");
    setEditBranchCode("");
  };

  const handleSave = async (id: string) => {
    try {
      await salesApi.updateErrorOrder(id, {
        materialCode: editMaterialCode,
        branchCode: editBranchCode,
      });
      alert("Cập nhật thành công");
      setEditingId(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Update failed", error);
      alert("Cập nhật thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
            Quản Lý Đơn Hàng Lỗi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Danh sách các đơn hàng chưa đồng bộ thành công (Thiếu Material Code
            hoặc Lỗi DVCS)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCwIcon
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            />
            Đồng bộ tất cả
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
          >
            <RotateCwIcon
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats / Filter Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Mã đơn hàng, Tên KH, Mã KH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Từ ngày:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Đến ngày:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[200px]">
        {loading && data.length > 0 && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <RotateCwIcon className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500 font-medium">
                Đang tải...
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã Chứng Từ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Material Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Chi nhánh / DVCS
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RotateCwIcon className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangleIcon className="w-10 h-10 text-gray-300" />
                      <span>Không tìm thấy đơn hàng lỗi nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                      {item.docDate
                        ? new Date(item.docDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-mono">
                      <div className="font-medium text-blue-600">
                        {item.docCode}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {item.customer?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-mono">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-mono">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editMaterialCode}
                          onChange={(e) => setEditMaterialCode(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          placeholder="Nhập code..."
                        />
                      ) : item.materialCode ? (
                        <span className="text-green-600 font-medium">
                          {item.materialCode}
                        </span>
                      ) : (
                        <span className="text-red-500 italic">Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editBranchCode}
                          onChange={(e) => setEditBranchCode(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Chi nhánh..."
                        />
                      ) : (
                        item.branchCode
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Sync Error
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Lưu"
                          >
                            <SaveIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Hủy"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSyncSingle(item.docCode)}
                            className="px-2 py-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded transition-colors inline-flex items-center gap-1"
                            title="Đồng bộ lại đơn này"
                          >
                            <RefreshCwIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Hiển thị {(page - 1) * 10 + 1} đến{" "}
              {Math.min(page * 10, meta.totalItems)} trong tổng số{" "}
              {meta.totalItems} bản ghi
            </div>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md flex items-center">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
