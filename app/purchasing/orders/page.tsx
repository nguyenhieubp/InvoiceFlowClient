"use client";

import React, { useState, useEffect } from "react";
import { getPurchaseOrders } from "@/lib/api";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Helper for currency format
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function PurchaseOrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPurchaseOrders({
        page,
        limit,
        startDate: dateFrom,
        endDate: dateTo,
        search,
      });
      setData(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotal(res.data.meta.total);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch purchase orders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Handle Search Button Click
  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  // Define columns based on Receipts page style
  const columns = [
    {
      label: "Ngày PO",
      key: "poDate",
      format: (v: any) => (v ? format(new Date(v), "dd/MM/yyyy") : "-"),
      className: "whitespace-nowrap",
    },
    {
      label: "Mã PO",
      key: "poCode",
      className: "font-medium text-blue-600 whitespace-nowrap",
    },
    { label: "Mã hàng", key: "itemCode", className: "whitespace-nowrap" },
    {
      label: "Tên hàng",
      key: "itemName",
      className: "max-w-[300px] truncate min-w-[200px]",
    },
    { label: "Ngành hàng", key: "catName", className: "whitespace-nowrap" },
    {
      label: "Mã NCC",
      key: "supplierItemCode",
      className: "whitespace-nowrap",
    },
    {
      label: "Tên NCC",
      key: "supplierItemName",
      className: "max-w-[200px] truncate",
    },
    {
      label: "Loại quản lý",
      key: "manageType",
      className: "whitespace-nowrap",
    },
    {
      label: "SL Đặt",
      key: "qty",
      align: "right",
      format: (v: any) => Number(v).toLocaleString(),
    },
    {
      label: "SL Nhận",
      key: "receivedQty",
      align: "right",
      format: (v: any) => Number(v).toLocaleString(),
    },
    {
      label: "SL Trả",
      key: "returnedQty",
      align: "right",
      format: (v: any) => Number(v).toLocaleString(),
    },
    {
      label: "Đơn giá",
      key: "price",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Giá bán",
      key: "salePrice",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "VAT %",
      key: "vatPct",
      align: "right",
      format: (v: any) => (v ? `${Number(v)}%` : "-"),
    },
    {
      label: "Tiền VAT",
      key: "vatTotal",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Thuế NK %",
      key: "importTaxPct",
      align: "right",
      format: (v: any) => (v ? `${Number(v)}%` : "-"),
    },
    {
      label: "Tiền Thuế NK",
      key: "importTaxTotal",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Chiết khấu %",
      key: "discPct",
      align: "right",
      format: (v: any) => (v ? `${Number(v)}%` : "-"),
    },
    {
      label: "Tiền Chiết khấu",
      key: "discTotal",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Tiền KM",
      key: "promAmount",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Thành tiền",
      key: "amount",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Tổng tiền",
      key: "lineTotal",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Ghi chú Cat",
      key: "noteCategory",
      className: "max-w-[150px] truncate",
    },
    {
      label: "Ghi chú Chi tiết",
      key: "noteDetail",
      className: "max-w-[200px] truncate",
    },
    {
      label: "CN Nhận (Mã)",
      key: "shipToBranchCode",
      className: "whitespace-nowrap",
    },
    {
      label: "CN Nhận (Tên)",
      key: "shipToBranchName",
      className: "max-w-[150px] truncate",
    },
    {
      label: "Chi phí item",
      key: "itemCost",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Chi phí PO",
      key: "poCost",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Chi phí trước GR",
      key: "onGrCost",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Chi phí sau GR",
      key: "afterGrCost",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Hàng NCC KM",
      key: "isSupplierPromotionItem",
      align: "center",
      render: (item: any) => (
        <span
          className={
            item.isSupplierPromotionItem === "Y"
              ? "text-green-600 font-bold"
              : "text-gray-400"
          }
        >
          {item.isSupplierPromotionItem === "Y" ? "Có" : "-"}
        </span>
      ),
    },
    {
      label: "Hàng KM",
      key: "isPromotionProd",
      align: "center",
      render: (item: any) => (
        <span
          className={
            item.isPromotionProd === "Y"
              ? "text-green-600 font-bold"
              : "text-gray-400"
          }
        >
          {item.isPromotionProd === "Y" ? "Có" : "-"}
        </span>
      ),
    },
    {
      label: "Loại mua hàng",
      key: "purchaseTypeName",
      className: "whitespace-nowrap",
    },
    { label: "Mã giá", key: "priceCode", className: "whitespace-nowrap" },
    {
      label: "Mã giá bán",
      key: "salePriceCode",
      className: "whitespace-nowrap",
    },
    {
      label: "Giá Saved",
      key: "savedPriceForPromItem",
      align: "right",
      format: (v: any) => formatCurrency(v),
    },
    {
      label: "Mã lô hàng",
      key: "shipmentCode",
      className: "whitespace-nowrap",
    },
    {
      label: "Tên lô hàng",
      key: "shipmentName",
      className: "max-w-[150px] truncate",
    },
    {
      label: "Ngày dự kiến",
      key: "shipmentPlanDate",
      format: (v: any) => (v ? format(new Date(v), "dd/MM/yyyy") : "-"),
      className: "whitespace-nowrap",
    },
    {
      label: "Vận chuyển",
      key: "shipmentTransMethod",
      className: "whitespace-nowrap",
    },
    {
      label: "Trạng thái",
      key: "status",
      align: "center",
      className: "whitespace-nowrap",
      render: (item: any) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            item.receivedQty >= item.qty
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {item.receivedQty >= item.qty ? "Completed" : "Pending"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mua hàng (Purchase Orders)
          </h1>
          <p className="text-gray-600">
            Quản lý và đồng bộ danh sách đơn đặt hàng
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Date From */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Search */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mã PO, Tên hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Tìm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                  STT
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-gray-900 border-r">
                      {(page - 1) * limit + index + 1}
                    </td>
                    {columns.map((col: any, idx) => (
                      <td
                        key={idx}
                        className={`px-4 py-3 text-sm text-gray-900 whitespace-nowrap ${col.className || ""} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                      >
                        {col.render
                          ? col.render(item)
                          : col.format
                            ? col.format(item[col.key])
                            : item[col.key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{" "}
                  <span className="font-medium">{(page - 1) * limit + 1}</span>{" "}
                  đến{" "}
                  <span className="font-medium">
                    {Math.min(page * limit, total)}
                  </span>{" "}
                  trong <span className="font-medium">{total}</span> kết quả
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
