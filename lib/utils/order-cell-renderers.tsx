import React from "react";
import { Order, SaleItem } from "@/types/order.types";
import { OrderColumn } from "@/lib/constants/order-columns.constants";
import { TAX_CODE, DEBIT_ACCOUNT } from "@/lib/constants/accounting.constants";
import { debug } from "console";

// Helper: Format số với 2 chữ số thập phân hoặc số nguyên
const formatNumber = (
  value: number | null | undefined,
  className: string = "text-gray-900",
): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">-</span>;
  }
  const numValue = Number(value);
  if (numValue % 1 !== 0) {
    return <div className={`text-sm ${className}`}>{numValue.toFixed(2)}</div>;
  }
  return <div className={`text-sm ${className}`}>{numValue}</div>;
};

// Helper: Format giá trị chung
export const formatValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400 italic">-</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
        }`}
      >
        {value ? "Có" : "Không"}
      </span>
    );
  }
  if (typeof value === "string" && value.trim() !== "") {
    let numValue = parseFloat(value);
    if (
      isNaN(numValue) ||
      String(numValue).replace(".", "") !== value.replace(/[^\d]/g, "")
    ) {
      let cleanedValue = value;
      if (/,(\d{1,3})$/.test(value)) {
        cleanedValue = value.replace(/\./g, "").replace(",", ".");
      } else {
        cleanedValue = value.replace(/,/g, "");
      }
      numValue = parseFloat(cleanedValue);
    }
    if (!isNaN(numValue)) {
      return numValue.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  if (typeof value === "number") {
    return value.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(value);
};

// Helper: Tính giá bán (sử dụng giá trị từ backend)
const calculateGiaBan = (sale: SaleItem | null): number => {
  return Number(sale?.giaBan) || 0 * Number(sale?.qty) || 0;
};

// Render cell value
export const renderCellValue = (
  order: Order,
  sale: SaleItem | null,
  field: OrderColumn,
): React.ReactNode => {
  const isMissingCucThue = !sale?.cucThueDisplay;
  const textClass = isMissingCucThue
    ? "text-red-600 font-bold"
    : "text-gray-900";

  if (
    !sale &&
    field !== "docCode" &&
    field !== "docDate" &&
    field !== "customerName" &&
    field !== "partnerCode"
  ) {
    return <span className="text-gray-400 italic">-</span>;
  }

  // ... rest of the function using textClass instead of "${textClass}"
  // Note: I will use multi_replace for the specific switch cases to be safer and cleaner than replacing the whole function.
  // Wait, replace_file_content does not support multiple non-contiguous blocks.
  // I should use multi_replace_file_content for this.
  // But wait, allowMultiple is true here.
  // So I can replace all instances of "${textClass}" with "${textClass}".
  // But I need to also insert the definition of textClass.

  // Strategy:
  // 1. Insert the definition of textClass at the start of the function.
  // 2. Replace "${textClass}" with "${textClass}" throughout the switch statement.

  // Let's use multi_replace_file_content.

  switch (field) {
    case "docCode":
      return (
        <div className={`text-sm font-semibold ${textClass}`}>
          {order.docCode}
        </div>
      );

    case "docDate":
      return (
        <div className={`text-sm ${textClass}`}>
          {new Date(order.docDate).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      );

    case "partnerCode": {
      // Với đơn "08. Tách thẻ": ưu tiên issuePartnerCode (từ API get_card)
      const ordertypeName = sale?.ordertypeName || sale?.ordertype || "";
      const isTachThe =
        ordertypeName.includes("08. Tách thẻ") ||
        ordertypeName.includes("08.Tách thẻ") ||
        ordertypeName.includes("08.  Tách thẻ");

      const partnerCode =
        isTachThe && sale?.issuePartnerCode
          ? sale.issuePartnerCode
          : sale?.partnerCode;

      return <div className={`text-sm ${textClass}`}>{partnerCode || "-"}</div>;
    }

    case "maCa":
      return <div className={`text-sm ${textClass}`}>{sale?.maCa || "-"}</div>;

    case "svcCode":
      return (
        <div className={`text-sm ${textClass}`}>{sale?.svcCode || "-"}</div>
      );

    case "customerName":
      return (
        <div className={`text-sm font-medium ${textClass}`}>
          {order.customer?.name || "-"}
        </div>
      );

    case "customerMobile":
      return (
        <div className={`text-sm ${textClass}`}>
          {order.customer?.mobile || "-"}
        </div>
      );

    case "customerSexual":
      return (
        <div className={`text-sm ${textClass}`}>
          {order.customer?.sexual || "-"}
        </div>
      );

    case "customerAddress":
      return (
        <div className={`text-sm ${textClass}`}>
          {order.customer?.address || "-"}
        </div>
      );

    case "customerProvince":
      return (
        <div className={`text-sm ${textClass}`}>
          {order.customer?.province_name || "-"}
        </div>
      );

    case "customerGrade":
      return (
        <div className={`text-sm ${textClass}`}>
          {order.customer?.grade_name || "-"}
        </div>
      );

    case "kyHieu":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.department?.branchcode || sale?.branchCode || "-"}
        </div>
      );

    case "description":
      return (
        <div className={`text-sm ${textClass}`}>{order.docCode || "-"}</div>
      );

    case "nhanVienBan":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.saleperson_id?.toString() || "-"}
        </div>
      );

    case "tenNhanVienBan":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.tenNhanVienBan || "-"}
        </div>
      );

    case "itemCode": {
      const itemCode = sale?.product?.maVatTu || sale?.itemCode || "-";
      return (
        <div className="max-w-[120px]">
          <div
            className={`text-sm font-semibold ${textClass} truncate`}
            title={itemCode}
          >
            {itemCode}
          </div>
        </div>
      );
    }

    case "itemName": {
      const itemName = sale?.product?.tenVatTu || sale?.itemName;
      if (!itemName) return null;
      return <div className={`text-sm ${textClass}`}>{itemName}</div>;
    }

    case "dvt":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.product?.dvt || sale?.dvt || "-"}
        </div>
      );

    case "ordertypeName":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.ordertypeName || "-"}
        </div>
      );

    case "productType":
      // Hiển thị productType từ sale hoặc product
      const productType =
        sale?.productType ||
        sale?.product?.productType ||
        sale?.product?.producttype ||
        null;
      return <div className={`text-sm ${textClass}`}>{productType || "-"}</div>;

    case "promCode": {
      // User requested: promCode is sale.km_yn
      const val = sale?.km_yn;

      if (val !== null && val !== undefined) {
        return <div className={`text-sm ${textClass}`}>{val}</div>;
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "maCtkmTangHang": {
      // Sử dụng giá trị từ backend
      if (sale?.maCtkmTangHang && sale.maCtkmTangHang.trim() !== "") {
        return (
          <div className={`text-sm ${textClass}`}>{sale.maCtkmTangHang}</div>
        );
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "maKho":
      return <div className={`text-sm ${textClass}`}>{sale?.maKho || "-"}</div>;

    case "maLo": {
      // Sử dụng giá trị từ backend
      if (sale?.maLo && sale.maLo.trim() !== "") {
        return <div className={`text-sm ${textClass}`}>{sale.maLo}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "qty":
      return formatNumber(sale?.qty ?? null);

    case "giaBan":
      return formatNumber(calculateGiaBan(sale));

    case "tienHang": {
      const tienHangValue = sale?.tienHang;
      return formatNumber(tienHangValue ?? null);
    }

    case "revenue":
      return (
        <div className={`text-sm ${textClass}`}>
          {formatValue(sale?.revenue)}
        </div>
      );

    case "maNt":
      return <div className={`text-sm ${textClass}`}>{sale?.maNt || "-"}</div>;

    case "tyGia":
      return formatNumber(sale?.tyGia ?? 1);

    case "maThue":
      return (
        <div className={`text-sm ${textClass}`}>{sale?.maThue || TAX_CODE}</div>
      );

    case "tkNo":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.tkNo || DEBIT_ACCOUNT}
        </div>
      );

    case "tkDoanhThu": {
      // Sử dụng giá trị từ backend
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.tkDoanhThuDisplay || "-"}
        </div>
      );
    }

    case "tkGiaVon": {
      // Sử dụng giá trị từ backend
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.tkGiaVonDisplay || "-"}
        </div>
      );
    }

    case "tkChiPhiKhuyenMai":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.tkChiPhiKhuyenMai || "-"}
        </div>
      );

    case "tkThueCo":
      return (
        <div className={`text-sm ${textClass}`}>{sale?.tkThueCo || "-"}</div>
      );

    case "cucThue": {
      // Sử dụng giá trị từ backend
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.cucThueDisplay || "-"}
        </div>
      );
    }

    case "boPhan":
      return (
        <div className={`text-sm ${textClass}`}>
          {sale?.department?.ma_bp || sale?.branchCode || "-"}
        </div>
      );

    case "muaHangGiamGia": {
      // ma_ck01
      if (sale?.ma_ck01) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck01}</div>;
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "chietKhauMuaHangGiamGia": {
      // ck01_nt
      if (sale?.ck01_nt != null && sale.ck01_nt > 0) {
        return (
          <div className={`text-sm ${textClass}`}>
            {formatValue(sale.ck01_nt)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "muaHangCkVip": {
      // ma_ck03
      if (sale?.ma_ck03) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck03}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauMuaHangCkVip":
      // ck03_nt
      if (sale?.ck03_nt != null && sale.ck03_nt > 0) {
        return (
          <div className={`text-sm ${textClass}`}>
            {formatValue(sale.ck03_nt)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;

    case "maCkTheoChinhSach": {
      // ma_ck02
      const val = sale?.ma_ck02;
      if (val === null || val === undefined || val === "") {
        return <span className="text-gray-400 italic">-</span>;
      }
      return <div className={`text-sm ${textClass}`}>{val}</div>;
    }

    case "ckTheoChinhSach": {
      // ck02_nt
      const val = sale?.ck02_nt;
      if (val === null || val === undefined) {
        return <span className="text-gray-400 italic">-</span>;
      }
      return <div className={`text-sm ${textClass}`}>{Number(val) || 0}</div>;
    }

    case "thanhToanCoupon": {
      // ma_ck04
      if (sale?.ma_ck04) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck04}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanCoupon": {
      // ck04_nt
      if (sale?.ck04_nt != null && sale.ck04_nt > 0) {
        return (
          <div className={`text-sm ${textClass}`}>
            {formatValue(sale.ck04_nt)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanVoucher": {
      // ck05_nt
      if (sale?.ck05_nt != null && sale.ck05_nt > 0) {
        return (
          <div className={`text-sm ${textClass}`}>
            {formatValue(sale.ck05_nt)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "thanhToanVoucher": {
      // ma_ck05
      if (sale?.ma_ck05) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck05}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "soSerial": {
      // Use maSerial as single source of truth (unified with backend)
      const val = sale?.maSerial || "";
      if (val) {
        return <div className={`text-sm ${textClass}`}>{val}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "voucherDp1": {
      // ma_ck06
      if (sale?.ma_ck06) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck06}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauVoucherDp1": {
      // ck06_nt
      if (sale?.ck06_nt != null && sale.ck06_nt > 0) {
        return formatNumber(sale.ck06_nt);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "voucherDp2": {
      // ma_ck07
      if (sale?.ma_ck07) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck07}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauVoucherDp2": {
      // ck07_nt
      if (sale?.ck07_nt != null && sale.ck07_nt > 0) {
        return formatNumber(sale.ck07_nt);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "voucherDp3": {
      // ma_ck08
      if (sale?.ma_ck08) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck08}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauVoucherDp3": {
      // ck08_nt
      if (sale?.ck08_nt != null && sale.ck08_nt > 0) {
        return formatNumber(sale.ck08_nt);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "hang": {
      // ma_ck09
      if (sale?.ma_ck09) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck09}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauHang": {
      // ck09_nt
      if (sale?.ck09_nt != null && sale.ck09_nt > 0) {
        return formatNumber(sale.ck09_nt);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "thuongBangHang": {
      // ma_ck10
      if (sale?.ma_ck10) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck10}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThuongMuaBangHang": {
      // ck10_nt
      if (sale?.ck10_nt != null && sale.ck10_nt > 0) {
        return formatNumber(sale.ck10_nt);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "thanhToanTkTienAo": {
      // ma_ck11
      if (sale?.ma_ck11) {
        return <div className={`text-sm ${textClass}`}>{sale.ma_ck11}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanTkTienAo": {
      // ck11_nt
      if (sale?.ck11_nt != null && sale.ck11_nt > 0) {
        return (
          <div className={`text-sm ${textClass}`}>
            {formatValue(sale.ck11_nt)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "maThe":
      return <div className={`text-sm ${textClass}`}>{sale?.maThe ?? "-"}</div>;

    // Stock Transfer columns - Sale item level (lấy từ stockTransfer của sale)
    case "stockTransferDoctype": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className={`text-sm ${textClass}`}>{st.doctype || "-"}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferTransDate": {
      const st = sale?.stockTransfer;
      if (st) {
        const transDate = st.transDate;
        if (transDate) {
          return (
            <div className={`text-sm ${textClass}`}>
              {new Date(transDate).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          );
        }
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferDocDesc": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className={`text-sm ${textClass}`}>{st.docDesc || "-"}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferStockCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className={`text-sm ${textClass}`}>{st.stockCode || "-"}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferQty": {
      const st = sale?.stockTransfer;
      if (st) {
        const qty = Math.abs(Number(st.qty || 0));
        return formatNumber(qty);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferIoType": {
      const st = sale?.stockTransfer;
      if (st) {
        return <div className={`text-sm ${textClass}`}>{st.ioType || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferBatchSerial": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className={`text-sm ${textClass}`}>{st.batchSerial || "-"}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferSoCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return <div className={`text-sm ${textClass}`}>{st.soCode || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferDocCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className={`text-sm ${textClass} font-mono`}>
            {st.docCode || "-"}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    // Các field trả về "-"
    case "tkVatTu":
    case "suaTkVatTu":
    case "tkGiaVonBanBuon":
    case "tkDoanhThuBanBuon":
    case "tkDoanhThuNoiBo":
    case "tkHangBanTraLai":
    case "tkDaiLy":
    case "tkSanPhamDoDang":
    case "tkChenhLechGiaVon":
    case "tkChietKhau": {
      // Lấy từ product hoặc sale
      const tkChietKhau = sale?.product?.tkChietKhau || sale?.tkChietKhau;
      return <div className={`text-sm ${textClass}`}>{tkChietKhau || "-"}</div>;
    }

    case "tkChiPhi": {
      // Tk chi phí từ creditAdvice (ví dụ: "64191" cho đơn "Đổi vỏ")
      return (
        <div className={`text-sm ${textClass}`}>{sale?.tkChiPhi || "-"}</div>
      );
    }

    case "maPhi": {
      // Mã phí từ creditAdvice (ví dụ: "161010" cho đơn "Đổi vỏ")
      return <div className={`text-sm ${textClass}`}>{sale?.maPhi || "-"}</div>;
    }

    case "ma_vt_ref":
      return (
        <div className={`text-sm ${textClass}`}>
          {(sale as any)?.ma_vt_ref || "-"}
        </div>
      );

    case "tkChiPhiKhuyenMaiProduct":
    case "tkGiaVonBanLe":
    case "tkDoanhThuBanLe":
    case "tkChiPhiKhauHaoCCDC":
    case "tkChiPhiKhauHaoTSDC":
    case "tkDoanhThuHangNo":
    case "tkGiaVonHangNo":
    case "tkVatTuHangNo":
      return <div className={`text-sm ${textClass}`}>-</div>;

    default: {
      const value = sale?.[field as keyof typeof sale];
      return <div className={`text-sm ${textClass}`}>{formatValue(value)}</div>;
    }
  }
};
