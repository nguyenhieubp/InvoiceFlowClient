"use client";

import { useState, useEffect } from "react";
import { platformFeeImportApi, fastApiInvoicesApi } from "@/lib/api";
import { format } from "date-fns";
import {
  SHOPEE_IMPORT_FEE_CONFIG,
  TIKTOK_IMPORT_FEE_CONFIG,
} from "@/lib/fee-config";
import { Toast } from "@/components/Toast";

type Platform = "shopee" | "tiktok" | "lazada";

type TabType = "import" | "shopee" | "tiktok" | "lazada";

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

export default function PlatformFeeImportPage() {
  const [activeTab, setActiveTab] = useState<TabType>("import");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message?: string;
    total?: number;
    success?: number;
    failed?: number;
    errors?: Array<{ row: number; error: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // List state for each platform
  const [shopeeData, setShopeeData] = useState<any[]>([]);
  const [tiktokData, setTiktokData] = useState<any[]>([]);
  const [lazadaData, setLazadaData] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [shopeePagination, setShopeePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [tiktokPagination, setTiktokPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [lazadaPagination, setLazadaPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [shopeeFilters, setShopeeFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });
  const [tiktokFilters, setTiktokFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });
  const [lazadaFilters, setLazadaFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });

  // Input states (separated from applied filters)
  const [shopeeInputs, setShopeeInputs] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });
  const [tiktokInputs, setTiktokInputs] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });
  const [lazadaInputs, setLazadaInputs] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });

  const [feeMaps, setFeeMaps] = useState<PlatformFeeMap[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatform) {
      setError("Vui lòng chọn nền tảng");
      return;
    }

    if (!file) {
      setError("Vui lòng chọn file để import");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await platformFeeImportApi.import(
        file,
        selectedPlatform as Platform,
      );
      setResult(response.data);
      // Refresh list after successful import
      if (response.data.success && response.data.success > 0) {
        if (selectedPlatform === "shopee") {
          fetchPlatformData("shopee");
        } else if (selectedPlatform === "tiktok") {
          fetchPlatformData("tiktok");
        } else if (selectedPlatform === "lazada") {
          fetchPlatformData("lazada");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Lỗi khi import file. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedPlatform("");
    setResult(null);
    setError(null);
    const fileInput = document.getElementById(
      "file-input",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDownloadTemplate = async (platform: Platform) => {
    let url = "";
    let link: HTMLAnchorElement | null = null;
    try {
      const response = await platformFeeImportApi.downloadTemplate(platform);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      url = window.URL.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = `Mau_Import_Phi_San_${platform.toUpperCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      if (link && document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (url) {
        window.URL.revokeObjectURL(url);
      }
      showToast(
        "error",
        "Lỗi khi tải file mẫu: " + (err.message || "Unknown error"),
      );
    }
  };

  const fetchPlatformData = async (platform: Platform) => {
    setListLoading(true);
    try {
      let filters, pagination, setData, setPagination;

      if (platform === "shopee") {
        filters = shopeeFilters;
        pagination = shopeePagination;
        setData = setShopeeData;
        setPagination = setShopeePagination;
      } else if (platform === "tiktok") {
        filters = tiktokFilters;
        pagination = tiktokPagination;
        setData = setTiktokData;
        setPagination = setTiktokPagination;
      } else {
        filters = lazadaFilters;
        pagination = lazadaPagination;
        setData = setLazadaData;
        setPagination = setLazadaPagination;
      }

      const response = await platformFeeImportApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        platform: platform,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setData(response.data.data);
      setPagination((prev) => ({
        ...prev,
        ...response.data.meta,
      }));
    } catch (err: any) {
      console.error(`Error fetching ${platform} data:`, err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shopee") {
      fetchPlatformData("shopee");
    } else if (activeTab === "tiktok") {
      fetchPlatformData("tiktok");
    } else if (activeTab === "lazada") {
      fetchPlatformData("lazada");
    }
  }, [activeTab, shopeePagination.page, tiktokPagination.page, lazadaPagination.page, shopeeFilters, tiktokFilters, lazadaFilters]);

  const handlePlatformSearch = (e: React.FormEvent, platform: Platform) => {
    e.preventDefault();
    if (platform === "shopee") {
      setShopeeFilters(shopeeInputs);
      setShopeePagination((prev) => ({ ...prev, page: 1 }));
    } else if (platform === "tiktok") {
      setTiktokFilters(tiktokInputs);
      setTiktokPagination((prev) => ({ ...prev, page: 1 }));
    } else {
      setLazadaFilters(lazadaInputs);
      setLazadaPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handleSyncPOCharges = async (item: any, platform: string) => {
    if (!item) return;

    // Construct Payload
    const master = {
      dh_so: item.erpOrderCode || "",
      // Format date to ISO string if exists, else current date or empty?
      // User example: "2026-01-15T06:36:04.292Z"
      dh_ngay: item.orderDate
        ? new Date(item.orderDate).toISOString()
        : item.ngayDoiSoat
          ? new Date(item.ngayDoiSoat).toISOString()
          : new Date().toISOString(),
      dh_dvcs: item.boPhan || "TTM", // Default to TTM if empty as per user example
    };

    const details: any[] = [];

    // Helper to add detail
    const addDetail = (dong: number, code: string, value: number) => {
      if (value && value !== 0) {
        details.push({
          dong: dong,
          ma_cp: code,
          cp01_nt: 0,
          cp02_nt: value, // Lần 2 -> cp02
          cp03_nt: 0,
          cp04_nt: 0,
          cp05_nt: 0,
          cp06_nt: 0,
        });
      }
    };

    if (platform === "shopee") {
      console.log("============= ", item);

      console.log("============= ", item);

      SHOPEE_IMPORT_FEE_CONFIG.forEach((rule) => {
        const value = Number(item[rule.field]);
        if (value && value !== 0) {
          const code = getSystemCode("shopee", rule.rawName, rule.defaultCode);
          if (rule.targetCol === "cp02_nt") {
            // Special case for cp02 (e.g. Shipping Fee Saver)
            details.push({
              dong: rule.row,
              ma_cp: code,
              cp01_nt: 0,
              cp02_nt: value,
              cp03_nt: 0, cp04_nt: 0, cp05_nt: 0, cp06_nt: 0
            });
          } else {
            addDetail(rule.row, code, value);
          }
        }
      });
    } else if (platform === "tiktok") {
      TIKTOK_IMPORT_FEE_CONFIG.forEach((rule) => {
        const value = Number(item[rule.field]);
        if (value && value !== 0) {
          const code = getSystemCode("tiktok", rule.rawName, rule.defaultCode);
          addDetail(rule.row, code, value);
        }
      });

    } else if (platform === "lazada") {
      if (item.maPhiNhanDienHachToan) {
        const rawName = item.tenPhiDoanhThu;
        const systemCode = getSystemCode(
          "lazada",
          rawName,
          item.maPhiNhanDienHachToan || "164020",
        );
        const value = item.soTien || item.phi1 || 0;
        addDetail(1, systemCode, value);
      }
    }

    if (details.length === 0) {
      showToast("info", "Không có dữ liệu phí để đồng bộ (hoặc phí = 0)");
      return;
    }

    const payload = {
      master,
      detail: details,
    };

    // if (
    //   !confirm(
    //     `Bạn có chắc chắn muốn đẩy phí cho đơn ${master.dh_so} sang Fast?`
    //   )
    // ) {
    //   return;
    // }

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

  // Helper function to render platform table
  const renderPlatformTable = (
    platform: Platform,
    data: any[],
    pagination: typeof shopeePagination,
    filters: typeof shopeeFilters,
    setFilters: React.Dispatch<React.SetStateAction<typeof shopeeFilters>>,
    setPagination: React.Dispatch<React.SetStateAction<typeof shopeePagination>>,
  ) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={(e) => handlePlatformSearch(e, platform)} className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Từ:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Đến:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">Mã sàn</th>
                <th className="px-3 py-3 whitespace-nowrap">Mã nội bộ SP</th>
                <th className="px-3 py-3 whitespace-nowrap">Ngày đối soát</th>
                <th className="px-3 py-3 whitespace-nowrap">Mã đơn hàng hoàn</th>
                <th className="px-3 py-3 whitespace-nowrap">Shop phát hành</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Giá trị giảm giá CTKM</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Doanh thu đơn hàng</th>
                {/* Shopee Fees */}
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí cố định</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí Dịch Vụ</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí thanh toán</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí hoa hồng TT</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Shipping Fee Saver</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí Pi Ship</th>
                {/* TikTok Fees */}
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí giao dịch 5%</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí hoa hồng Tiktok 4.54%</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí hoa hồng TT 150050</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí dịch vụ SFP 6%</th>
                {/* Common */}
                <th className="px-3 py-3 whitespace-nowrap">Mã tiếp thị liên kết</th>
                <th className="px-3 py-3 whitespace-nowrap">Sàn TMĐT</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 1</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 2</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 3</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 4</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 5</th>
                <th className="px-3 py-3 whitespace-nowrap">Bộ phận</th>
                {/* Lazada */}
                <th className="px-3 py-3 whitespace-nowrap">Tên phí/doanh thu</th>
                <th className="px-3 py-3 whitespace-nowrap">Quảng cáo TT</th>
                <th className="px-3 py-3 whitespace-nowrap">Mã phí hạch toán</th>
                <th className="px-3 py-3 whitespace-nowrap">Ghi chú</th>
                {/* Generic Fees */}
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 1</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 2</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 3</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 4</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 5</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">Phí 6</th>
                {/* Metadata */}
                <th className="px-3 py-3 whitespace-nowrap">Ngày import</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listLoading ? (
                <tr>
                  <td
                    colSpan={37}
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
                    colSpan={37}
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
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {item.maSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {item.maNoiBoSp ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {item.ngayDoiSoat
                        ? format(new Date(item.ngayDoiSoat), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {item.maDonHangHoan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.shopPhatHanhTrenSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.giaTriGiamGiaCtkm)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.doanhThuDonHang)}
                    </td>
                    {/* Shopee Fees */}
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiCoDinh605MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiDichVu6MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiThanhToan5MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiHoaHongTiepThiLienKet21150050)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.chiPhiDichVuShippingFeeSaver164010)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiPiShipDoMktDangKy164010)}
                    </td>
                    {/* TikTok Fees */}
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiGiaoDichTyLe5164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiHoaHongTraChoTiktok454164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiHoaHongTiepThiLienKet150050)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phiDichVuSfp6164020)}
                    </td>
                    {/* Common */}
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.maCacBenTiepThiLienKet ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.sanTmdt ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.cotChoBsMkt1 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.cotChoBsMkt2 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.cotChoBsMkt3 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.cotChoBsMkt4 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.cotChoBsMkt5 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.boPhan ?? "-"}
                    </td>
                    {/* Lazada */}
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.tenPhiDoanhThu ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.quangCaoTiepThiLienKet ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.maPhiNhanDienHachToan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {item.ghiChu ?? "-"}
                    </td>
                    {/* Generic Fees */}
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi1)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi2)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi3)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi4)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi5)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(item.phi6)}
                    </td>
                    {/* Metadata */}
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {item.createdAt
                        ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")
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
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{pagination.total}</span> bản
            ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    );
  };

  const platformInfo = {
    shopee: {
      name: "Shopee",
      columns: 24,
      description: "Mẫu Shopee bao gồm 21 cột",
    },
    tiktok: {
      name: "TikTok",
      columns: 22,
      description: "Mẫu TikTok bao gồm 19 cột",
    },
    lazada: {
      name: "Lazada",
      columns: 10,
      description: "Mẫu Lazada bao gồm 10 cột",
    },
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  console.log("============ ", shopeeData);

  const renderShopeeFeeTable = () => {
    // Modify to map directly, 1 row per order (horizontal)
    const rows = shopeeData.map((item, idx) => ({
      stt: (shopeePagination.page - 1) * shopeePagination.limit + idx + 1,
      ...item,
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form
            onSubmit={(e) => handlePlatformSearch(e, "shopee")}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Từ:</label>
              <input
                type="date"
                value={shopeeInputs.startDate}
                onChange={(e) =>
                  setShopeeInputs({
                    ...shopeeInputs,
                    startDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Đến:</label>
              <input
                type="date"
                value={shopeeInputs.endDate}
                onChange={(e) =>
                  setShopeeInputs({
                    ...shopeeInputs,
                    endDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={shopeeInputs.search}
                onChange={(e) =>
                  setShopeeInputs({ ...shopeeInputs, search: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">STT</th>
                <th className="px-3 py-3 whitespace-nowrap">Ngày đối soát</th>
                <th className="px-3 py-3 whitespace-nowrap">Mã đơn</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã sản phẩm của đơn hàng
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Mã đơn hàng</th>
                <th className="px-3 py-3 whitespace-nowrap">Ngày đơn hàng</th>
                <th className="px-3 py-3 whitespace-nowrap">Shop phát hành</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Giá trị giảm giá CTKM
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Doanh thu đơn hàng
                </th>
                {/* Shopee Fees */}
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí cố định
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí Dịch Vụ
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí thanh toán
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí hoa hồng TT
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Shipping Fee Saver
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí Pi Ship
                </th>
                {/* Common */}
                <th className="px-3 py-3 whitespace-nowrap">Mã KOL</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã đơn hàng hoàn/trả lại
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Sàn TMĐT</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 1</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 2</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 3</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 4</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 5</th>
                <th className="px-3 py-3 whitespace-nowrap">Bộ phận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listLoading ? (
                <tr>
                  <td
                    colSpan={24}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={24}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr
                    key={`${r.id}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onDoubleClick={() => handleSyncPOCharges(r, "shopee")}
                  >
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.stt}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {r.ngayDoiSoat
                        ? format(new Date(r.ngayDoiSoat), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maNoiBoSp ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-blue-600 font-medium whitespace-nowrap">
                      {r.erpOrderCode ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.orderDate
                        ? format(new Date(r.orderDate), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.shopPhatHanhTrenSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(r.giaTriGiamGiaCtkm)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(r.doanhThuDonHang)}
                    </td>
                    {/* Shopee Fees */}
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiCoDinh605MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiDichVu6MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiThanhToan5MaPhi164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiHoaHongTiepThiLienKet21150050)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.chiPhiDichVuShippingFeeSaver164010)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiPiShipDoMktDangKy164010)}
                    </td>
                    {/* Common */}
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.maCacBenTiepThiLienKet ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.maDonHangHoan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.sanTmdt ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt1 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt2 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt3 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt4 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt5 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.boPhan ?? "-"}
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
                (shopeePagination.page - 1) * shopeePagination.limit + 1,
                shopeePagination.total,
              )}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                shopeePagination.page * shopeePagination.limit,
                shopeePagination.total,
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{shopeePagination.total}</span> bản
            ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setShopeePagination((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
              disabled={shopeePagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setShopeePagination((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
              disabled={shopeePagination.page >= shopeePagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLazadaFeeTable = () => {
    // Lazada data is already in row format (each row = 1 fee), so no need to flatMap
    const rows = lazadaData.map((item, idx) => ({
      stt: (lazadaPagination.page - 1) * lazadaPagination.limit + idx + 1,
      ngayDoiSoat: item.ngayDoiSoat,
      maDon: item.maSan,
      maNoiBoSp: item.maNoiBoSp,
      maPhiNhanDien: item.maPhiNhanDienHachToan,
      loaiPhi: item.tenPhiDoanhThu,
      soTien: item.soTienPhi,
      maKol: item.quangCaoTiepThiLienKet,
      maDonHangHoan: item.maDonHangHoan,
      sanTmdt: item.sanTmdt,
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form
            onSubmit={(e) => handlePlatformSearch(e, "lazada")}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Từ:</label>
              <input
                type="date"
                value={lazadaInputs.startDate}
                onChange={(e) =>
                  setLazadaInputs({
                    ...lazadaInputs,
                    startDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Đến:</label>
              <input
                type="date"
                value={lazadaInputs.endDate}
                onChange={(e) =>
                  setLazadaInputs({
                    ...lazadaInputs,
                    endDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={lazadaInputs.search}
                onChange={(e) =>
                  setLazadaInputs({ ...lazadaInputs, search: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">STT</th>
                <th className="px-3 py-3 whitespace-nowrap">NGÀY ĐỐI SOÁT</th>
                <th className="px-3 py-3 whitespace-nowrap">MÃ ĐƠN</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã sản phẩm của đơn hàng
                </th>
                <th className="px-3 py-3 whitespace-nowrap">
                  MÃ PHÍ ĐỂ NHẬN DIỆN HẠCH TOÁN
                </th>
                <th className="px-3 py-3 whitespace-nowrap">LOẠI PHÍ</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  SỐ TIỀN PHÍ ĐÃ ĐỐI SOÁT
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Mã KOL</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã đơn hàng hoàn/trả lại
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Sàn TMĐT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listLoading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={`${r.stt}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onDoubleClick={() => handleSyncPOCharges(r, "lazada")}
                  >
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.stt}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {r.ngayDoiSoat
                        ? format(new Date(r.ngayDoiSoat), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maDon ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maNoiBoSp ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maPhiNhanDien ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.loaiPhi ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(r.soTien)}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.maKol ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maDonHangHoan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.sanTmdt ?? "-"}
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
                (lazadaPagination.page - 1) * lazadaPagination.limit + 1,
                lazadaPagination.total,
              )}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                lazadaPagination.page * lazadaPagination.limit,
                lazadaPagination.total,
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{lazadaPagination.total}</span> bản ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setLazadaPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={lazadaPagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setLazadaPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={lazadaPagination.page >= lazadaPagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTiktokFeeTable = () => {
    // Modify to map directly, 1 row per order (horizontal)
    const rows = tiktokData.map((item, idx) => ({
      stt: (tiktokPagination.page - 1) * tiktokPagination.limit + idx + 1,
      ...item,
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form
            onSubmit={(e) => handlePlatformSearch(e, "tiktok")}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Từ:</label>
              <input
                type="date"
                value={tiktokInputs.startDate}
                onChange={(e) =>
                  setTiktokInputs({
                    ...tiktokInputs,
                    startDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Đến:</label>
              <input
                type="date"
                value={tiktokInputs.endDate}
                onChange={(e) =>
                  setTiktokInputs({
                    ...tiktokInputs,
                    endDate: e.target.value,
                  })
                }
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={tiktokInputs.search}
                onChange={(e) =>
                  setTiktokInputs({ ...tiktokInputs, search: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">STT</th>
                <th className="px-3 py-3 whitespace-nowrap">Ngày đối soát</th>
                <th className="px-3 py-3 whitespace-nowrap">Mã đơn</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã sản phẩm của đơn hàng
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Mã đơn hàng</th>
                <th className="px-3 py-3 whitespace-nowrap">Ngày đơn hàng</th>
                <th className="px-3 py-3 whitespace-nowrap">Shop phát hành</th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Giá trị giảm giá CTKM
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Doanh thu đơn hàng
                </th>
                {/* TikTok Fees */}
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí giao dịch Tỷ lệ
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí HH trả cho Tiktok
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí HH Tiếp thị liên kết
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-right">
                  Phí dịch vụ SFP
                </th>
                {/* Common */}
                <th className="px-3 py-3 whitespace-nowrap">Mã KOL</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Mã đơn hàng hoàn/trả lại
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Sàn TMĐT</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 1</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 2</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 3</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 4</th>
                <th className="px-3 py-3 whitespace-nowrap">MKT 5</th>
                <th className="px-3 py-3 whitespace-nowrap">Bộ phận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listLoading ? (
                <tr>
                  <td
                    colSpan={22}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={22}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr
                    key={`${r.id}`}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onDoubleClick={() => handleSyncPOCharges(r, "tiktok")}
                  >
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.stt}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {r.ngayDoiSoat
                        ? format(new Date(r.ngayDoiSoat), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-700 whitespace-nowrap">
                      {r.maNoiBoSp ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-mono text-blue-600 font-medium whitespace-nowrap">
                      {r.erpOrderCode ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.orderDate
                        ? format(new Date(r.orderDate), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.shopPhatHanhTrenSan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(r.giaTriGiamGiaCtkm)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(r.doanhThuDonHang)}
                    </td>
                    {/* TikTok Fees */}
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiGiaoDichTyLe5164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiHoaHongTraChoTiktok454164020)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiHoaHongTiepThiLienKet150050)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(r.phiDichVuSfp6164020)}
                    </td>
                    {/* Common */}
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.maCacBenTiepThiLienKet ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.maDonHangHoan ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.sanTmdt ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt1 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt2 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt3 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt4 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.cotChoBsMkt5 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {r.boPhan ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (by imported orders) */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-medium">
              {Math.min(
                (tiktokPagination.page - 1) * tiktokPagination.limit + 1,
                tiktokPagination.total,
              )}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                tiktokPagination.page * tiktokPagination.limit,
                tiktokPagination.total,
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{tiktokPagination.total}</span> bản ghi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setTiktokPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={tiktokPagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setTiktokPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={tiktokPagination.page >= tiktokPagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    );
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Import phí sàn chính thức
        </h1>
        <p className="text-gray-600 mt-1">
          Import dữ liệu phí sàn từ file Excel (Shopee, TikTok, Lazada)
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("import")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "import"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab("shopee")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "shopee"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Shopee
          </button>
          <button
            onClick={() => setActiveTab("tiktok")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "tiktok"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            TikTok
          </button>
          <button
            onClick={() => setActiveTab("lazada")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "lazada"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Lazada
          </button>
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn nền tảng <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["shopee", "tiktok", "lazada"] as Platform[]).map(
                  (platform) => (
                    <div key={platform} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setResult(null);
                          setError(null);
                        }}
                        className={`w-full p-4 border-2 rounded-lg transition-all ${selectedPlatform === platform
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">
                            {platformInfo[platform].name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {platformInfo[platform].description}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTemplate(platform);
                        }}
                        className="absolute top-2 right-2 p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded"
                        title="Tải mẫu file"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Download Template Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Tải mẫu file Excel
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Tải file mẫu để điền dữ liệu trước khi import
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["shopee", "tiktok", "lazada"] as Platform[]).map(
                  (platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleDownloadTemplate(platform)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium text-gray-700"
                    >
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Tải mẫu {platformInfo[platform].name}</span>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file Excel <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8m0-8h8m-8 0H12m16 0v12m0-12l-4-4m4 4l4-4"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-input"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Chọn file</span>
                      <input
                        id="file-input"
                        name="file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">hoặc kéo thả file vào đây</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    XLSX, XLS hoặc CSV (tối đa 10MB)
                  </p>
                  {file && (
                    <p className="text-sm text-gray-900 mt-2">
                      Đã chọn: <span className="font-medium">{file.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Result Message */}
            {result && (
              <div
                className={`border px-4 py-3 rounded ${result.failed && result.failed > 0
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-green-50 border-green-200 text-green-800"
                  }`}
              >
                <div className="font-semibold mb-2">{result.message}</div>
                <div className="text-sm space-y-1">
                  <div>Tổng số: {result.total}</div>
                  <div>Thành công: {result.success}</div>
                  {result.failed && result.failed > 0 && (
                    <div>Thất bại: {result.failed}</div>
                  )}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="font-semibold text-sm mb-2">
                      Chi tiết lỗi:
                    </div>
                    <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                      {result.errors.slice(0, 10).map((err, idx) => (
                        <div key={idx}>
                          Dòng {err.row}: {err.error}
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <div className="text-gray-600 italic">
                          ... và {result.errors.length - 10} lỗi khác
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !file || !selectedPlatform}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Đang import...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Import</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Platform Tabs - Shopee */}
      {activeTab === "shopee" && renderShopeeFeeTable()}

      {/* Platform Tabs - TikTok */}
      {activeTab === "tiktok" && renderTiktokFeeTable()}

      {/* Platform Tabs - Lazada */}
      {activeTab === "lazada" && renderLazadaFeeTable()}
    </div>
  );
}
