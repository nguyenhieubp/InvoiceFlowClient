"use client";

import { useState, useEffect } from "react";
import { tiktokFeesApi, fastApiInvoicesApi, platformFeeImportApi } from "@/lib/api";
import { format, subDays } from "date-fns";
import { TIKTOK_FEE_CONFIG } from "@/lib/fee-config";
import { Toast } from "@/components/Toast";

// ─── Modal: Chỉnh sửa ngày phí trước khi đẩy Fast ───────────────────────────
interface NgayPhiRow {
  dong: number;
  label: string;
  ma_cp: string;
  value: number;
  ngay_phi: string;
}

interface SyncModalProps {
  item: any;
  onClose: () => void;
  onConfirm: (rows: NgayPhiRow[], setResult: (r: { ok: boolean; msg: string }) => void) => void;
  syncing: boolean;
}

function SyncModal({ item, onClose, onConfirm, syncing }: SyncModalProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [rows, setRows] = useState<NgayPhiRow[]>([
    { dong: 1, label: "Phí HH TikTok 4.54% (TTCOM454)", ma_cp: "TTCOM454", value: Number(item?.subTotal) || 0, ngay_phi: today },
    { dong: 2, label: "Phí giao dịch 5% (TTPAY5)", ma_cp: "TTPAY5", value: Number(item?.totalAmount) || 0, ngay_phi: today },
    { dong: 3, label: "Phí dịch vụ SFP (TTSFP6)", ma_cp: "TTSFP6", value: Number(item?.sellerDiscount) || 0, ngay_phi: today },
    { dong: 4, label: "Phí Affiliate (TTAFF)", ma_cp: "TTAFF", value: Number(item?.affiliateCommission) || 0, ngay_phi: today },
  ]);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const updateNgay = (dong: number, val: string) =>
    setRows((prev) => prev.map((r) => r.dong === dong ? { ...r, ngay_phi: val } : r));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Đẩy Fast – Chỉnh ngày phí TikTok</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          Đơn: <span className="font-mono font-semibold text-gray-800">{item?.erpOrderCode}</span>
        </p>
        <p className="text-xs text-gray-400 mb-4">Mỗi dòng phí (dong=N) tương ứng với ngay_phiN gửi lên Fast API.</p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.dong} className={`flex items-center gap-3 p-3 rounded-lg border ${r.value === 0 ? "border-gray-100 bg-gray-50 opacity-60" : "border-purple-100 bg-purple-50"}`}>
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{r.dong}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{r.label}</p>
                <p className="text-xs text-gray-500 font-mono">{r.value.toLocaleString("vi-VN")} đ</p>
              </div>
              <input
                type="date"
                value={r.ngay_phi}
                disabled={!!result || syncing}
                onChange={(e) => updateNgay(r.dong, e.target.value)}
                className="shrink-0 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:opacity-50"
              />
            </div>
          ))}
        </div>

        {/* Kết quả trong modal */}
        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            {result.ok
              ? <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              : <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            }
            {result.msg}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={syncing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">{result ? "Đóng" : "Hủy"}</button>
          {!result && (
            <button onClick={() => onConfirm(rows, setResult)} disabled={syncing} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50">
              {syncing ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Đang đẩy...</>) : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Đẩy Fast</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PlatformFeeMap {
  id: string;
  platform: string;
  rawFeeName: string;
  normalizedFeeName: string;
  internalCode: string;
  systemCode: string | null;
  accountCode: string;
  active: boolean;
}

export default function TikTokFeesPage() {
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "-";
    return Number(value).toString();
  };

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [brandFilter, setBrandFilter] = useState("menard");
  const [platformFilter] = useState("tiktok"); // Fixed to TikTok only
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [queryParams, setQueryParams] = useState({
    brand: "menard",
    platform: "tiktok", // Fixed to TikTok
    search: "",
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [feeMaps, setFeeMaps] = useState<PlatformFeeMap[]>([]);
  const [syncingItem, setSyncingItem] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  // Batch Sync
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchDateFrom, setBatchDateFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [batchDateTo, setBatchDateTo] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    success: boolean;
    message: string;
    errors?: any[];
  } | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  // Fetch fee maps configuration
  useEffect(() => {
    const fetchFeeMaps = async () => {
      try {
        const response = await platformFeeImportApi.getFeeMaps({
          limit: 1000,
          active: true,
        });
        if (response.data && response.data.data) {
          setFeeMaps(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching fee maps:", error);
      }
    };
    fetchFeeMaps();
  }, []);

  const getSystemCode = (
    platform: string,
    rawName: string,
    defaultCode: string,
  ): string => {
    if (!rawName) return defaultCode;
    const map = feeMaps.find(
      (m) =>
        m.platform === platform &&
        m.rawFeeName.toLowerCase().trim() === rawName.toLowerCase().trim(),
    );

    if (map && map.systemCode) {
      return map.systemCode;
    }
    return defaultCode;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await tiktokFeesApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        brand: queryParams.brand || undefined,
        search: queryParams.search || undefined,
        startDate: queryParams.startDate || undefined,
        endDate: queryParams.endDate || undefined,
      });
      setData(response.data.data);
      setPagination((prev) => ({
        ...prev,
        ...response.data.meta,
      }));
    } catch (error) {
      console.error("Error fetching TikTok fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, queryParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setQueryParams({
      brand: brandFilter,
      platform: platformFilter,
      search: search,
      startDate: startDate,
      endDate: endDate,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleBatchProcess = async () => {
    setBatchProcessing(true);
    setBatchResult(null);
    try {
      const response = await fastApiInvoicesApi.batchSyncPOCharges({
        startDate: batchDateFrom,
        endDate: batchDateTo,
        platform: "tiktok",
      });
      setBatchResult(response.data);
      if (response.data.success) {
        showToast("success", "Đã hoàn tất đồng bộ hàng loạt");
        fetchData();
      } else {
        showToast("error", "Đồng bộ có lỗi, vui lòng xem chi tiết");
      }
    } catch (error: any) {
      setBatchResult({
        success: false,
        message: error?.response?.data?.message || "Lỗi khi xử lý đồng bộ",
      });
      showToast("error", "Lỗi khi xử lý đồng bộ");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleOpenSyncModal = (item: any) => {
    if (!item?.erpOrderCode) { showToast("error", "Đơn hàng chưa có ERP Order Code"); return; }
    setSyncingItem(item);
  };

  const handleConfirmSync = async (
    rows: NgayPhiRow[],
    setResult: (r: { ok: boolean; msg: string }) => void,
  ) => {
    if (!syncingItem) return;
    const item = syncingItem;
    const dh_ngay = item.orderCreatedAt ? new Date(item.orderCreatedAt).toISOString() : new Date().toISOString();
    const ngayPhiMap: Record<string, string> = {};
    rows.forEach((r) => { if (r.ngay_phi) ngayPhiMap[`ngay_phi${r.dong}`] = new Date(r.ngay_phi).toISOString(); });
    const master = { dh_so: item.erpOrderCode, dh_ngay, dh_dvcs: "TTM", ...ngayPhiMap };
    const details = rows.filter((r) => r.value !== 0).map((r) => ({
      dong: r.dong, ma_cp: r.ma_cp, cp01_nt: r.value,
      cp02_nt: 0, cp03_nt: 0, cp04_nt: 0, cp05_nt: 0, cp06_nt: 0,
    }));
    if (details.length === 0) { setResult({ ok: false, msg: "Tất cả phí đều = 0, không gửi" }); return; }
    setSyncing(true);
    try {
      const res = await fastApiInvoicesApi.syncPOCharges({ master, detail: details });
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setResult({ ok: true, msg: `Đồng bộ thành công! ${res.data?.message || ""}` });
      } else {
        const errMsg = Array.isArray(res.data) ? res.data[0]?.message : res.data?.message || "Đồng bộ thất bại";
        setResult({ ok: false, msg: errMsg });
      }
    } catch (err: any) {
      const data = err.response?.data;
      const errMsg = Array.isArray(data) ? data[0]?.message : data?.message || err.message || "Unknown error";
      setResult({ ok: false, msg: `Lỗi: ${errMsg}` });
    } finally {
      setSyncing(false);
    }
  };

  // Legacy (kept for compat, not used)
  const handleSyncPOCharges = async (item: any) => {
    console.log("handleSyncPOCharges", item);
    if (!item) return;

    if (!item.erpOrderCode) {
      showToast("error", "Đơn hàng chưa có ERP Order Code (dh_so)");
      return;
    }

    const master = {
      dh_so: item.erpOrderCode,
      dh_ngay: item.orderCreatedAt
        ? new Date(item.orderCreatedAt).toISOString()
        : new Date().toISOString(),
      dh_dvcs: "TTM",
    };

    const details: any[] = [];

    TIKTOK_FEE_CONFIG.forEach((rule) => {
      const value = Number(item[rule.field]);
      if (value && value !== 0) {
        const code = getSystemCode(
          "tiktok",
          rule.rawName,
          rule.defaultCode
        );

        const detail = {
          dong: rule.row,
          ma_cp: code,
          cp01_nt: 0,
          cp02_nt: 0,
          cp03_nt: 0,
          cp04_nt: 0,
          cp05_nt: 0,
          cp06_nt: 0,
        };

        if (rule.targetCol === "cp02_nt") {
          detail.cp02_nt = value;
        } else {
          detail.cp01_nt = value;
        }
        details.push(detail);
      }
    });

    if (details.length === 0) {
      showToast("info", "Không có dữ liệu phí (TikTok Fees) để đồng bộ");
      return;
    }

    const payload = {
      master,
      detail: details,
    };

    setLoading(true);
    try {
      const res = await fastApiInvoicesApi.syncPOCharges(payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        showToast("success", `Đồng bộ thành công! ${res.data?.message || ""}`);
      } else {
        let errorMessage = res.data?.message || "Đồng bộ thất bại";
        if (Array.isArray(res.data) && res.data.length > 0) {
          errorMessage = res.data[0].message || errorMessage;
        } else if (res.data?.result && Array.isArray(res.data.result) && res.data.result.length > 0) {
          errorMessage = res.data.result[0].message || errorMessage;
        }
        showToast("error", errorMessage);
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "Unknown error";
      if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data) && data.length > 0) {
          errorMessage = data[0].message || errorMessage;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      showToast("error", `Lỗi khi đồng bộ: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>

      {/* Sync Modal */}
      {syncingItem && (
        <SyncModal item={syncingItem} onClose={() => setSyncingItem(null)} onConfirm={handleConfirmSync} syncing={syncing} />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi phí TikTok (TikTok Fees)
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi chi phí sàn TikTok
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tự động chạy
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Lọc theo Brand:
            </label>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
              }}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="menard">Menard</option>
              <option value="yaman">Yaman</option>
            </select>
          </div>

          {/* Platform filter removed - TikTok only */}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo ERP Order Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 max-w-sm border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-4">Brand</th>
                <th className="px-4 py-4">Sàn</th>
                <th className="px-4 py-4">Mã đơn ERP</th>
                <th className="px-4 py-4">Mã đơn hàng</th>
                <th className="px-4 py-4">Ngày tạo đơn</th>
                <th className="px-4 py-4">Ngày đồng bộ</th>
                <th className="px-4 py-4">Thuế</th>
                <th className="px-4 py-4">Tiền tệ</th>
                <th className="px-4 py-4">Tổng phụ</th>
                <th className="px-4 py-4">Phí vận chuyển</th>
                <th className="px-4 py-4">Tổng tiền</th>
                <th className="px-4 py-4">Giảm giá người bán</th>
                <th className="px-4 py-4">Giảm giá sàn</th>
                <th className="px-4 py-4">Phí ship gốc</th>
                <th className="px-4 py-4">Tổng giá SP gốc</th>
                <th className="px-4 py-4">GG ship người bán</th>
                <th className="px-4 py-4">GG ship đồng tài trợ</th>
                <th className="px-4 py-4">GG ship sàn</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={18}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={18}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${item.brand === "menard"
                          ? "bg-red-100 text-red-700"
                          : item.brand === "yaman"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {(item.brand || "N/A").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                        {(item.platform || "TIKTOK").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {item.erpOrderCode}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {item.orderSn || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.orderCreatedAt
                        ? format(
                          new Date(item.orderCreatedAt),
                          "dd/MM/yyyy HH:mm",
                        )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.syncedAt
                        ? format(new Date(item.syncedAt), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.tax)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.currency || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.subTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.shippingFee)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 font-semibold">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.sellerDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.platformDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.originalShippingFee)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                      {formatCurrency(item.originalTotalProductPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeeSellerDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeeCofundedDiscount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-600">
                      {formatCurrency(item.shippingFeePlatformDiscount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenSyncModal(item)}
                        title="Chỉnh ngày phí rồi đẩy Fast"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1 mx-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Đẩy Fast
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
          <p className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-medium">
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total,
              )}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{pagination.total}</span> bản ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Batch Process Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Đồng bộ phí hàng loạt — TikTok
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={batchDateFrom}
                  onChange={(e) => setBatchDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={batchDateTo}
                  onChange={(e) => setBatchDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {batchResult && (
                <div className={`p-3 rounded-md text-sm ${batchResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                  <p className="font-medium">{batchResult.message}</p>
                  {batchResult.errors && batchResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto bg-white p-2 border rounded">
                      <p className="font-semibold mb-1">Chi tiết lỗi:</p>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {batchResult.errors.map((err, idx) => (
                          <li key={idx}>
                            <span className="font-medium mr-1">{err.order}:</span>
                            <span className="text-gray-600">{err.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowBatchModal(false); setBatchResult(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={batchProcessing}
              >
                Đóng
              </button>
              <button
                onClick={handleBatchProcess}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                disabled={batchProcessing}
              >
                {batchProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : "Chạy ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
