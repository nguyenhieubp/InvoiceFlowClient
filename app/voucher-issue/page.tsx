"use client";

import React, { useEffect, useState } from "react";
import { voucherIssueApi } from "@/lib/api";
import { Toast } from "@/components/Toast";

interface VoucherIssue {
  id: string;
  api_id: number;
  code: string | null;
  status_lov: string | null;
  docdate: Date | null;
  description: string | null;
  brand_code: string | null;
  apply_for_branch_types: string | null;
  val: number;
  percent: number;
  max_value: number;
  saletype: string | null;
  enable_precost: string | null;
  supplier_support_fee: number;
  valid_fromdate: Date | null;
  valid_todate: Date | null;
  valid_days_from_so: number;
  check_ownership: string | null;
  allow_cashback: string | null;
  prom_for_employee: string | null;
  bonus_for_sale_employee: string | null;
  so_percent: number | null;
  r_total_scope: string | null;
  ecode_item_code: string | null;
  voucher_item_code: string | null;
  voucher_item_name: string | null;
  cost_for_gl: number;
  buy_items_by_date_range: string | null;
  buy_items_option_name: string | null;
  disable_bonus_point_for_sale: string | null;
  disable_bonus_point: string | null;
  for_mkt_kol: string | null;
  for_mkt_prom: string | null;
  allow_apply_for_promoted_so: string | null;
  campaign_code: string | null;
  sl_max_sudung_cho_1_kh: number;
  is_locked: string | null;
  enteredat: Date | null;
  enteredby: string | null;
  material_type: string | null;
  applyfor_wso: string | null;
  sync_date_from: string | null;
  sync_date_to: string | null;
  brand: string | null;
  partnership: string | null;

  // Flattened fields
  serial: string | null;
  console_code: string | null;
  valid_fromdate_detail: Date | null;
  valid_todate_detail: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export default function VoucherIssuePage() {
  const [voucherIssueList, setVoucherIssueList] = useState<VoucherIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    serial?: string;
    code?: string;
  }>({});
  const [filter, setFilter] = useState<{
    brand?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    serial?: string;
    code?: string;
  }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Tăng limit mặc định lên vì display line
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Hàm convert từ Date object hoặc YYYY-MM-DD sang DDMMMYYYY
  const convertDateToDDMMMYYYY = (date: Date | string | null): string => {
    if (!date) {
      return "";
    }

    let d: Date;
    if (typeof date === "string") {
      const parts = date.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
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

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadVoucherIssue = async () => {
    setLoading(true);
    try {
      // Convert date từ YYYY-MM-DD sang DDMMMYYYY khi gọi API
      const apiParams: any = {
        page: pagination.page,
        limit: pagination.limit,
        ...filter,
      };
      if (filter.dateFrom) {
        apiParams.dateFrom = convertDateToDDMMMYYYY(filter.dateFrom);
      }
      if (filter.dateTo) {
        apiParams.dateTo = convertDateToDDMMMYYYY(filter.dateTo);
      }

      const response = await voucherIssueApi.getAll(apiParams);
      if (response.data.success) {
        setVoucherIssueList(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      } else {
        showToast("error", "Lỗi khi tải dữ liệu");
      }
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || error.message || "Lỗi khi tải dữ liệu",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoucherIssue();
  }, [filter, pagination.page, pagination.limit]);

  const handleSearch = () => {
    setFilter({ ...filterInput });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Danh sách Voucher (Line Detail)
          </h1>
          <p className="text-gray-600">
            Quản lý voucher issue - Dạng chi tiết line
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhãn hàng
              </label>
              <select
                value={filterInput.brand || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    brand: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="menard">Menard</option>
                <option value="f3">F3</option>
                <option value="labhair">Labhair</option>
                <option value="yaman">Yaman</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filterInput.dateFrom || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    dateFrom: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filterInput.dateTo || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    dateTo: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <input
                type="text"
                value={filterInput.status || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    status: e.target.value || undefined,
                  })
                }
                placeholder="Nhập trạng thái"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial
              </label>
              <input
                type="text"
                value={filterInput.serial || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    serial: e.target.value || undefined,
                  })
                }
                placeholder="Nhập serial"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã Voucher
              </label>
              <input
                type="text"
                value={filterInput.code || ""}
                onChange={(e) =>
                  setFilterInput({
                    ...filterInput,
                    code: e.target.value || undefined,
                  })
                }
                placeholder="Nhập mã voucher"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ID nội bộ (UUID) system
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Link chỉnh sửa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Mã Ecode / CTKM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái chương trình
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Ngày chứng từ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Brand / Ngành áp dụng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Phạm vi chi nhánh
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Mã sản phẩm áp dụng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Tên voucher / SP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Mã voucher trả
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Hình thức bán
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Giá trị tiền
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Phần trăm CK
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Giá trị CK tối đa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        NCC hỗ trợ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Ngày bắt đầu hiệu lực
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Ngày kết thúc hiệu lực
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Số ngày hiệu lực từ SO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Kiểm tra sở hữu KH
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Cho hoàn tiền dư
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Thưởng NV sale
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Không cộng điểm sale
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Mô tả CTKM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Giá vốn kế toán
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Kiểu chọn SP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Áp dụng KOL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Áp dụng marketing
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Áp cho đơn KM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Mã chiến dịch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Giới hạn sử dụng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Loại voucher
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Áp CK BB
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái khóa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Ngày nhập dữ liệu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voucherIssueList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={34}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      voucherIssueList.map((voucher) => {
                        return (
                          <tr
                            key={voucher.id}
                            className="hover:bg-gray-50 text-sm"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs">
                              {voucher.id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-blue-600 hover:text-blue-800 cursor-pointer">
                              Edit
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                              {voucher.code || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  voucher.status_lov === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {voucher.status_lov || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {formatDate(voucher.docdate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {voucher.brand}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.apply_for_branch_types}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {voucher.ecode_item_code || "-"}
                            </td>
                            <td
                              className="px-4 py-3 text-gray-900 max-w-xs truncate"
                              title={voucher.voucher_item_name || ""}
                            >
                              {voucher.voucher_item_name || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {voucher.voucher_item_code || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.saletype}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-semibold">
                              {formatCurrency(voucher.val)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.percent}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {formatCurrency(voucher.max_value)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {formatCurrency(voucher.supplier_support_fee)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {formatDateTime(voucher.valid_fromdate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                              {formatDateTime(voucher.valid_todate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.valid_days_from_so}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.check_ownership}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.allow_cashback}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.bonus_for_sale_employee}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.disable_bonus_point_for_sale}
                            </td>
                            <td
                              className="px-4 py-3 text-gray-900 max-w-xs truncate"
                              title={voucher.description || ""}
                            >
                              {voucher.description || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {formatCurrency(voucher.cost_for_gl)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.buy_items_option_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.for_mkt_kol}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.for_mkt_prom}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.allow_apply_for_promoted_so}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.campaign_code}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.sl_max_sudung_cho_1_kh}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.material_type}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {voucher.enable_precost}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  voucher.is_locked === "Y"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {voucher.is_locked || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                              {formatDateTime(voucher.enteredat)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  của {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
