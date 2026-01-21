"use client";

import React, { useEffect, useState } from "react";
import { stockTransferApi, syncApi } from "@/lib/api";

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
  materialCode?: string; // Mã hàng từ Loyalty API
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
  compositeKey?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StockTransferPage() {
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRange, setSyncingRange] = useState(false);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    itemCode?: string;
    soCode?: string;
    docCode?: string;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    branchCode?: string;
    itemCode?: string;
    soCode?: string;
    docCode?: string;
  }>({});
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
  const [processingWarehouse, setProcessingWarehouse] = useState<string | null>(
    null,
  );

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string): string => {
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
  };

  const [syncDateInput, setSyncDateInput] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [syncDateFromInput, setSyncDateFromInput] = useState<string>("");
  const [syncDateToInput, setSyncDateToInput] = useState<string>("");

  const getSyncDate = (): string => {
    if (!syncDateInput) {
      return "";
    }
    return convertDateToDDMMMYYYY(syncDateInput);
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filter.brand) params.brand = filter.brand;
      if (filter.dateFrom)
        params.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      if (filter.dateTo) params.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      if (filter.branchCode) params.branchCode = filter.branchCode;
      if (filter.itemCode) params.itemCode = filter.itemCode;
      if (filter.soCode) params.soCode = filter.soCode;
      if (filter.docCode) params.docCode = filter.docCode;

      const response = await stockTransferApi.getAll(params);
      setStockTransfers(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error: any) {
      showToast("error", "Không thể tải danh sách xuất kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, pagination.page, pagination.limit]);

  const handleSearch = () => {
    setFilter({ ...filterInput });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSyncSingle = async () => {
    if (!syncDateInput) {
      showToast("error", "Vui lòng chọn ngày cần đồng bộ");
      return;
    }

    const syncDate = getSyncDate();
    const brand = filterInput.brand; // undefined nếu không chọn = đồng bộ tất cả

    if (!syncDate) {
      showToast("error", "Ngày không hợp lệ. Vui lòng chọn lại ngày");
      return;
    }

    setSyncing(true);
    try {
      // Validate date format before sending
      if (!syncDate || syncDate.length < 9) {
        showToast(
          "error",
          `Ngày không hợp lệ: "${syncDate}". Vui lòng chọn lại ngày.`,
        );
        setSyncing(false);
        return;
      }

      // Nếu không chọn brand, gọi range sync với cùng ngày để đồng bộ tất cả brands
      let response;
      if (!brand) {
        response = await syncApi.syncStockTransferRange(syncDate, syncDate);
      } else {
        response = await syncApi.syncStockTransfer(brand, syncDate);
      }
      showToast("success", response.data.message || "Đồng bộ thành công");
      loadStockTransfers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi đồng bộ";
      showToast("error", errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncRange = async () => {
    if (!syncDateFromInput || !syncDateToInput) {
      showToast("error", "Vui lòng chọn khoảng ngày");
      return;
    }

    const dateFrom = convertDateToDDMMMYYYY(syncDateFromInput);
    const dateTo = convertDateToDDMMMYYYY(syncDateToInput);
    const brand = filterInput.brand;

    setSyncingRange(true);
    try {
      const response = await syncApi.syncStockTransferRange(
        dateFrom,
        dateTo,
        brand,
      );
      showToast("success", response.data.message || "Đồng bộ thành công");
      loadStockTransfers();
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || error.message || "Lỗi khi đồng bộ",
      );
    } finally {
      setSyncingRange(false);
    }
  };

  const handleRetryMaterialCode = async (soCode: string) => {
    try {
      showToast("info", `Đang retry material code cho ${soCode}...`);
      const response = await syncApi.retryStockTransferMaterialCode(soCode);
      if (response.data.success) {
        showToast(
          "success",
          response.data.message || "Cập nhật material code thành công",
        );
        loadStockTransfers();
      } else {
        showToast("error", response.data.message || "Không thành công");
      }
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || error.message || "Lỗi khi retry",
      );
    }
  };

  const handleDoubleClick = async (stockTransfer: StockTransfer) => {
    // Kiểm tra doctype
    if (stockTransfer.doctype === "STOCK_TRANSFER") {
      // Kiểm tra relatedStockCode phải có
      if (
        !stockTransfer.relatedStockCode ||
        stockTransfer.relatedStockCode.trim() === ""
      ) {
        showToast(
          "error",
          `Không thể xử lý stock transfer điều chuyển kho. relatedStockCode không được để trống.`,
        );
        return;
      }
      // Cho phép xử lý STOCK_TRANSFER với relatedStockCode
    } else if (stockTransfer.doctype !== "STOCK_IO") {
      showToast(
        "error",
        `Không thể xử lý stock transfer có doctype = "${stockTransfer.doctype}". Chỉ chấp nhận doctype = "STOCK_IO" hoặc "STOCK_TRANSFER".`,
      );
      return;
    }

    // Kiểm tra điều kiện cho STOCK_IO
    if (stockTransfer.doctype === "STOCK_IO") {
      // Kiểm tra soCode phải là "null" (string) hoặc null
      if (stockTransfer.soCode !== "null" && stockTransfer.soCode !== null) {
        showToast(
          "error",
          `Không thể xử lý stock transfer có soCode = "${stockTransfer.soCode}". Chỉ chấp nhận soCode = "null" hoặc null.`,
        );
        return;
      }

      // Kiểm tra ioType phải là "I" hoặc "O"
      if (stockTransfer.ioType !== "I" && stockTransfer.ioType !== "O") {
        showToast(
          "error",
          `ioType không hợp lệ: "${stockTransfer.ioType}". Chỉ chấp nhận "I" (nhập) hoặc "O" (xuất).`,
        );
        return;
      }
    }

    setProcessingWarehouse(stockTransfer.id);
    try {
      const response = await stockTransferApi.processWarehouse(
        stockTransfer.id,
      );
      let message = "";
      if (stockTransfer.doctype === "STOCK_TRANSFER") {
        message = `Tạo phiếu điều chuyển kho thành công cho ${stockTransfer.docCode}`;
      } else {
        const ioTypeName = stockTransfer.ioType === "I" ? "nhập" : "xuất";
        message = `Tạo phiếu ${ioTypeName} kho thành công cho ${stockTransfer.docCode}`;
      }
      showToast("success", message);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi tạo phiếu nhập/xuất kho";
      showToast("error", errorMessage);
    } finally {
      setProcessingWarehouse(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="w-full px-4 py-4">
        {/* Header with Filters & Sync */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dữ liệu xuất kho
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quản lý và đồng bộ dữ liệu xuất kho từ Zappy API
                </p>
              </div>
            </div>

            {/* Sync Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Đồng bộ dữ liệu
              </h3>

              {/* Đồng bộ khoảng ngày */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    value={syncDateFromInput}
                    onChange={(e) => setSyncDateFromInput(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={syncing || syncingRange}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    value={syncDateToInput}
                    onChange={(e) => setSyncDateToInput(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={syncing || syncingRange}
                  />
                </div>
                <button
                  onClick={handleSyncRange}
                  disabled={
                    syncing ||
                    syncingRange ||
                    !syncDateFromInput ||
                    !syncDateToInput
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingRange ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang đồng bộ...
                    </>
                  ) : (
                    <>
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Đồng bộ khoảng ngày
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Bộ lọc
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterInput.brand || ""}
                  onChange={(e) =>
                    setFilterInput({
                      ...filterInput,
                      brand: e.target.value || undefined,
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Tất cả nhãn hàng</option>
                  <option value="f3">F3</option>
                  <option value="labhair">LabHair</option>
                  <option value="yaman">Yaman</option>
                  <option value="menard">Menard</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    value={filterInput.dateFrom || ""}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        dateFrom: e.target.value,
                      })
                    }
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    value={filterInput.dateTo || ""}
                    onChange={(e) =>
                      setFilterInput({ ...filterInput, dateTo: e.target.value })
                    }
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <input
                  type="text"
                  value={filterInput.branchCode || ""}
                  onChange={(e) =>
                    setFilterInput({
                      ...filterInput,
                      branchCode: e.target.value || undefined,
                    })
                  }
                  placeholder="Mã chi nhánh (VD: FS07)"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  value={filterInput.itemCode || ""}
                  onChange={(e) =>
                    setFilterInput({
                      ...filterInput,
                      itemCode: e.target.value || undefined,
                    })
                  }
                  placeholder="Mã sản phẩm (VD: F00011)"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  value={filterInput.soCode || ""}
                  onChange={(e) =>
                    setFilterInput({
                      ...filterInput,
                      soCode: e.target.value || undefined,
                    })
                  }
                  placeholder="Mã đơn hàng (VD: SO37.00131367)"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  value={filterInput.docCode || ""}
                  onChange={(e) =>
                    setFilterInput({
                      ...filterInput,
                      docCode: e.target.value || undefined,
                    })
                  }
                  placeholder="Mã xuất kho (VD: ST01.00134507)"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mb-4"></div>
                <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header Info */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Danh sách xuất kho
                  </span>
                  {pagination.total > 0 && (
                    <span className="text-xs text-gray-500">
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
                    className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        Mô tả
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CN
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nhãn
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã SP
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Material Code
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tên SP
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Kho
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Kho liên quan
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Loại I/O
                      </th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        SL
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Batch/Serial
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã nhập xuất
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Line Info 2
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mã ĐH
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Sync Date
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ngày cập nhật
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg
                              className="w-12 h-12 text-gray-400 mb-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                            <p className="text-sm text-gray-500">
                              Không có dữ liệu
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stockTransfers.map((st) => {
                        const isMissingMaterialCode = !st.materialCode;
                        const textColor = isMissingMaterialCode
                          ? "text-red-600"
                          : "text-gray-700";
                        const textDarkColor = isMissingMaterialCode
                          ? "text-red-600"
                          : "text-gray-900";

                        return (
                          <tr
                            key={st.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              processingWarehouse === st.id
                                ? "opacity-50 cursor-wait"
                                : "cursor-pointer"
                            }`}
                            onDoubleClick={() => handleDoubleClick(st)}
                            title="Double-click để tạo phiếu nhập/xuất kho"
                          >
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor}`}
                            >
                              {st.doctype}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textDarkColor}`}
                            >
                              {formatDateOnly(st.transDate)}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textDarkColor} font-mono`}
                            >
                              {st.docCode}
                            </td>
                            <td
                              className={`px-2 py-2.5 text-xs ${textColor} max-w-xs truncate`}
                              title={st.docDesc}
                            >
                              {st.docDesc || "-"}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor}`}
                            >
                              {st.branchCode}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor}`}
                            >
                              {st.brand || st.brandCode}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textDarkColor} font-mono`}
                            >
                              {st.itemCode}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textDarkColor} font-mono`}
                            >
                              {st.materialCode || "-"}
                            </td>
                            <td
                              className={`px-2 py-2.5 text-xs ${textColor} max-w-xs truncate`}
                              title={st.itemName}
                            >
                              {st.itemName}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.stockCode}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.relatedStockCode || "-"}
                            </td>
                            <td className="px-2 py-2.5 whitespace-nowrap text-xs">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  st.ioType === "I"
                                    ? "bg-green-100 text-green-800"
                                    : st.ioType === "O"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {st.ioType}
                              </span>
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textDarkColor} text-right font-medium`}
                            >
                              {formatQty(st.qty)}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.batchSerial || "-"}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.lineInfo1 || "-"}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.lineInfo2 || "-"}
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              <div className="flex items-center gap-1 justify-between">
                                <span>{st.soCode || "-"}</span>
                                {st.soCode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetryMaterialCode(st.soCode!);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Cập nhật Material Code từ Loyalty"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-4 h-4"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td
                              className={`px-2 py-2.5 whitespace-nowrap text-xs ${textColor} font-mono`}
                            >
                              {st.syncDate || "-"}
                            </td>
                            <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-500">
                              {formatDate(st.createdAt)}
                            </td>
                            <td className="px-2 py-2.5 whitespace-nowrap text-xs text-gray-500">
                              {formatDate(st.updatedAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 0 && (
                <div className="bg-white px-4 py-2.5 flex items-center justify-between border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    Trang <span className="font-medium">{pagination.page}</span>{" "}
                    /{" "}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
