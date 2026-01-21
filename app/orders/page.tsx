"use client";

import React, { useEffect, useState, useRef } from "react";
import { salesApi } from "@/lib/api";
import { Toast } from "@/components/Toast";
import { Order, SaleItem } from "@/types/order.types";
import {
  OrderColumn,
  FIELD_LABELS,
  MAIN_COLUMNS,
} from "@/lib/constants/order-columns.constants";
import { normalizeOrderData } from "@/lib/utils/order-mapper.utils";
import { renderCellValue } from "@/lib/utils/order-cell-renderers";

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [enrichedDisplayedOrders, setEnrichedDisplayedOrders] = useState<
    Order[]
  >([]);
  const [loading, setLoading] = useState(true);
  // Track searchQuery và filter trước đó để chỉ reset page khi chúng thay đổi
  const prevSearchQueryRef = useRef<string>("");
  const prevFilterRef = useRef<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    typeSale?: string;
  }>({});
  // Filter input values (không trigger API)
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    typeSale?: string;
  }>(() => {
    // Default date = today
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    return {
      dateFrom: today,
      dateTo: today,
    };
  });
  // Filter thực tế (trigger API)
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    typeSale?: string;
  }>(() => {
    // Default date = today
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    return {
      dateFrom: today,
      dateTo: today,
    };
  });
  const [searchInputValue, setSearchInputValue] = useState(""); // Giá trị trong input (không trigger API)
  const [searchQuery, setSearchQuery] = useState(""); // Giá trị search thực tế (trigger API)
  const [typeSaleInput, setTypeSaleInput] = useState<string>("ALL"); // Giá trị input của typeSale
  const [selectedColumns, setSelectedColumns] = useState<OrderColumn[]>([
    ...MAIN_COLUMNS,
  ]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
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
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
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
    // Format ngày hiện tại thành YYYY-MM-DD cho date picker
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Convert syncDateInput sang DDMMMYYYY khi gọi API
  const getSyncDate = (): string => {
    return convertDateToDDMMMYYYY(syncDateInput);
  };
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Bỏ cache - chỉ dùng data trực tiếp từ backend order API

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Backend đã enrich đầy đủ, frontend chỉ cần hiển thị data

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Khi có search query, backend đã filter rồi, vẫn cần gửi page để backend trả về đúng trang
      // Chỉ reset về page 1 khi searchQuery thay đổi (xử lý ở useEffect khác)

      // Lấy orders từ backend API - chỉ lấy basic data (backend đã tối ưu)
      // Nếu có search query, gửi lên backend để search trực tiếp trên database
      // Khi có search query, gửi dateFrom/dateTo để search trong date range
      // Khi không có search query, có thể dùng date (single day) để lấy từ Zappy API
      const response = await salesApi.getAllOrders({
        typeSale: filter.typeSale,
        brand: filter.brand,
        page: pagination.page,
        limit: pagination.limit,
        // Nếu có search query, dùng dateFrom/dateTo (date range)
        // Nếu không có search query, dùng date (single day) để lấy từ Zappy API
        date:
          !searchQuery.trim() && filter.dateFrom && !filter.dateTo
            ? convertDateToDDMMMYYYY(filter.dateFrom)
            : undefined,
        dateFrom:
          searchQuery.trim() || filter.dateTo ? filter.dateFrom : undefined,
        dateTo: filter.dateTo || undefined,
        search: searchQuery.trim() || undefined, // Gửi search query lên backend
      });
      const rawData = response.data.data || [];
      const backendTotal = response.data.total || 0;

      // Normalize dữ liệu - hỗ trợ cả format cũ và format mới từ ERP
      const ordersData = normalizeOrderData(rawData);

      setAllOrders(ordersData);
      // Cập nhật pagination từ backend response
      // Backend trả về total là tổng số rows (sale items) trong database
      // Frontend sẽ paginate lại sau khi flatten, nên dùng total từ backend
      const calculatedTotalPages =
        backendTotal > 0 ? Math.ceil(backendTotal / pagination.limit) : 0;
      setPagination((prev) => ({
        ...prev,
        total: backendTotal,
        totalPages: calculatedTotalPages,
        // Đảm bảo page không vượt quá totalPages, reset về 1 nếu vượt quá
        page:
          calculatedTotalPages > 0 && prev.page > calculatedTotalPages
            ? 1
            : calculatedTotalPages === 0
              ? 1
              : prev.page,
      }));
    } catch (error: any) {
      showToast("error", "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Reset về trang 1 khi search query hoặc filter thay đổi
  useEffect(() => {
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery;
    const filterChanged =
      prevFilterRef.current.brand !== filter.brand ||
      prevFilterRef.current.dateFrom !== filter.dateFrom ||
      prevFilterRef.current.dateTo !== filter.dateTo ||
      prevFilterRef.current.typeSale !== filter.typeSale;

    if (searchQueryChanged || filterChanged) {
      prevSearchQueryRef.current = searchQuery;
      prevFilterRef.current = { ...filter };
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [
    searchQuery,
    filter.brand,
    filter.dateFrom,
    filter.dateTo,
    filter.typeSale,
  ]);

  // Load orders khi pagination hoặc filter thay đổi
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filter.brand,
    filter.dateFrom,
    filter.dateTo,
    filter.typeSale,
    pagination.page,
    pagination.limit,
    searchQuery,
  ]);

  // Hàm xử lý search/filter khi click nút Tìm kiếm
  const handleSearch = () => {
    // Validate date range: không được quá 31 ngày
    if (filterInput.dateFrom && filterInput.dateTo) {
      const fromDate = new Date(filterInput.dateFrom);
      const toDate = new Date(filterInput.dateTo);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        showToast(
          "error",
          "Khoảng thời gian tìm kiếm không được vượt quá 31 ngày (1 tháng)",
        );
        return;
      }
    }

    setSearchQuery(searchInputValue);
    setFilter({ ...filterInput }); // Áp dụng filter input vào filter thực tế
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  // Hàm xử lý Enter key trong input search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Backend đã enrich đầy đủ, frontend chỉ cần hiển thị data từ backend
  useEffect(() => {
    setDisplayedOrders(allOrders);
    setEnrichedDisplayedOrders(allOrders);
  }, [allOrders]);

  const toggleColumn = (field: OrderColumn) => {
    setSelectedColumns((prev) => {
      const index = prev.indexOf(field);
      if (index > -1) {
        return prev.filter((col) => col !== field);
      } else {
        const allFields = Object.keys(FIELD_LABELS) as OrderColumn[];
        const fieldIndex = allFields.indexOf(field);

        let insertIndex = prev.length;
        for (let i = 0; i < prev.length; i++) {
          const currentIndex = allFields.indexOf(prev[i]);
          if (currentIndex > fieldIndex) {
            insertIndex = i;
            break;
          }
        }

        const newSelected = [...prev];
        newSelected.splice(insertIndex, 0, field);
        return newSelected;
      }
    });
  };

  // Hàm xử lý double click - gọi backend API để tạo hóa đơn
  const handleRowDoubleClick = async (order: Order, sale: SaleItem | null) => {
    if (!sale) {
      showToast("error", "Không có dữ liệu bán hàng cho dòng này");
      return;
    }

    if (submittingInvoice) {
      return;
    }

    try {
      setSubmittingInvoice(true);

      // Gọi backend API để tạo hóa đơn với forceRetry = true để cho phép retry nếu đã tồn tại
      const response = await salesApi.createInvoiceViaFastApi(
        order.docCode,
        true,
      );
      const result = response.data;

      // Nếu đã tồn tại (alreadyExists = true), vẫn coi như thành công
      if (result.alreadyExists) {
        showToast(
          "info",
          result.message || "Đơn hàng đã được tạo hóa đơn trước đó",
        );
        return;
      }

      // Check success flag và status trong result (status === 0 là lỗi)
      const hasError = Array.isArray(result.result)
        ? result.result.some((item: any) => item.status === 0)
        : result.result?.status === 0;

      if (result.success && !hasError) {
        showToast("success", result.message || "Tạo hóa đơn thành công");
        // Reload invoice statuses sau khi tạo thành công
      } else {
        // Xử lý lỗi chi tiết hơn
        let errorMessage = result.message || "Tạo hóa đơn thất bại";

        if (Array.isArray(result.result) && result.result.length > 0) {
          const firstError = result.result[0];
          if (firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (result.result?.message) {
          errorMessage = result.result.message;
        }

        showToast("error", errorMessage);
      }
    } catch (error: any) {
      // Xử lý lỗi từ response hoặc error object
      let errorMessage = "Lỗi không xác định";

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

      showToast("error", `Lỗi: ${errorMessage}`);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Flatten enrichedDisplayedOrders thành rows để hiển thị
  // Backend đã paginate theo rows rồi, nhưng sau khi fetch full data, số rows có thể thay đổi
  // Cần giới hạn lại để đảm bảo không vượt quá limit
  const flattenedRows: Array<{ order: Order; sale: SaleItem | null }> = [];
  const maxRows = pagination.limit; // Giới hạn số rows theo pagination limit

  for (const order of enrichedDisplayedOrders) {
    if (flattenedRows.length >= maxRows) {
      break; // Đã đủ rows, dừng lại
    }

    if (order.sales && order.sales.length > 0) {
      for (const sale of order.sales) {
        if (flattenedRows.length >= maxRows) {
          break; // Đã đủ rows, dừng lại
        }
        flattenedRows.push({ order, sale });
      }
    } else {
      // Nếu order không có sales, dùng totalItems để tạo rows
      const rowCount = order.totalItems > 0 ? order.totalItems : 1;
      for (let i = 0; i < rowCount; i++) {
        if (flattenedRows.length >= maxRows) {
          break; // Đã đủ rows, dừng lại
        }
        flattenedRows.push({ order, sale: null });
      }
    }
  }

  const filteredColumns = Object.entries(FIELD_LABELS).filter(
    ([key]) =>
      columnSearchQuery.trim() === "" ||
      FIELD_LABELS[key as OrderColumn]
        .toLowerCase()
        .includes(columnSearchQuery.toLowerCase()) ||
      key.toLowerCase().includes(columnSearchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white relative overflow-auto">
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

      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sync from Zappy */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={syncDateInput}
                    onChange={(e) => setSyncDateInput(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={syncing}
                  />
                </div>
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Chọn cột hiển thị
                </button>
              </div>
            </div>

            {/* Column Selector */}
            {showColumnSelector && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Chọn cột hiển thị
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedColumns([...MAIN_COLUMNS])}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Mặc định
                    </button>
                    <button
                      onClick={() => {
                        const allFields = Object.keys(
                          FIELD_LABELS,
                        ) as OrderColumn[];
                        setSelectedColumns(allFields);
                      }}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>
                {/* Search input for columns */}
                <div className="mb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
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
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm cột..."
                      value={columnSearchQuery}
                      onChange={(e) => setColumnSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {filteredColumns.map(([key, label]) => {
                    const isSelected = selectedColumns.includes(
                      key as OrderColumn,
                    );
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleColumn(key as OrderColumn)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Filters */}
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
                <option value="chando">Chando</option>
                <option value="f3">F3</option>
                <option value="labhair">LabHair</option>
                <option value="yaman">Yaman</option>
                <option value="menard">Menard</option>
              </select>
              <select
                value={typeSaleInput}
                onChange={(e) => {
                  const newValue = e.target.value || "ALL";
                  setTypeSaleInput(newValue);
                  setFilterInput({ ...filterInput, typeSale: newValue });
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="ALL">Tất cả</option>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">WholeSale</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={filterInput.dateFrom || ""}
                  onChange={(e) =>
                    setFilterInput({ ...filterInput, dateFrom: e.target.value })
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
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {selectedColumns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {FIELD_LABELS[column]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedColumns.length}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    flattenedRows.map((row, index) => {
                      const rowKey = `${row.order.docCode}-${
                        row.sale?.id || index
                      }`;
                      const isSelected = selectedRowKey === rowKey;
                      // Kiểm tra statusAsys: nếu false thì bôi đỏ dòng
                      // Chú ý: statusAsys có thể là undefined, null, true, hoặc false
                      // Chỉ bôi đỏ khi statusAsys === false (không phải undefined hoặc null)
                      const isStatusAsysFalse = row.sale?.statusAsys === false;
                      const isMissingCucThue = !row.sale?.cucThue;

                      return (
                        <tr
                          key={rowKey}
                          onDoubleClick={() => {
                            setSelectedRowKey(isSelected ? null : rowKey);
                            handleRowDoubleClick(row.order, row.sale);
                          }}
                          className={`transition-colors cursor-pointer ${
                            isStatusAsysFalse
                              ? "bg-red-100 hover:bg-red-200" // Bôi đỏ nếu statusAsys = false
                              : isSelected
                                ? "bg-blue-100 hover:bg-blue-200"
                                : "hover:bg-gray-50"
                          } ${
                            submittingInvoice ? "opacity-50 cursor-wait" : ""
                          } ${isMissingCucThue ? "text-red-600 font-medium" : ""}`}
                        >
                          {selectedColumns.map((column) => (
                            <td
                              key={column}
                              className="px-4 py-3 whitespace-nowrap"
                            >
                              {renderCellValue(row.order, row.sale, column)}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
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
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-700">bản ghi/trang</span>
                  </div>

                  <div className="flex items-center gap-3">
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
                      bản ghi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <span className="text-sm text-gray-700 font-medium">
                    Trang {pagination.page}/{pagination.totalPages || 1}
                  </span>

                  <button
                    onClick={() =>
                      setPagination((prev) => {
                        const maxPage = Math.max(1, prev.totalPages);
                        return {
                          ...prev,
                          page: Math.min(maxPage, prev.page + 1),
                        };
                      })
                    }
                    disabled={
                      pagination.page >= Math.max(1, pagination.totalPages) ||
                      pagination.totalPages === 0
                    }
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
