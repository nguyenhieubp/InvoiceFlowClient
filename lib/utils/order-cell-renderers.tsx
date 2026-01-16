import React from "react";
import { Order, SaleItem } from "@/types/order.types";
import { OrderColumn } from "@/lib/constants/order-columns.constants";
import { TAX_CODE, DEBIT_ACCOUNT } from "@/lib/constants/accounting.constants";
import { debug } from "console";

// Helper: Format số với 2 chữ số thập phân hoặc số nguyên
const formatNumber = (value: number | null | undefined): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">-</span>;
  }
  const numValue = Number(value);
  if (numValue % 1 !== 0) {
    return <div className="text-sm text-gray-900">{numValue.toFixed(2)}</div>;
  }
  return <div className="text-sm text-gray-900">{numValue}</div>;
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
  field: OrderColumn
): React.ReactNode => {
  if (
    !sale &&
    field !== "docCode" &&
    field !== "docDate" &&
    field !== "customerName" &&
    field !== "partnerCode"
  ) {
    return <span className="text-gray-400 italic">-</span>;
  }

  switch (field) {
    case "docCode":
      return (
        <div className="text-sm font-semibold text-gray-900">
          {order.docCode}
        </div>
      );

    case "docDate":
      return (
        <div className="text-sm text-gray-900">
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

      return <div className="text-sm text-gray-900">{partnerCode || "-"}</div>;
    }

    case "maCa":
      return <div className="text-sm text-gray-900">{sale?.maCa || "-"}</div>;

    case "svcCode":
      return (
        <div className="text-sm text-gray-900">{sale?.svcCode || "-"}</div>
      );

    case "customerName":
      return (
        <div className="text-sm font-medium text-gray-900">
          {order.customer?.name || "-"}
        </div>
      );

    case "customerMobile":
      return (
        <div className="text-sm text-gray-900">
          {order.customer?.mobile || "-"}
        </div>
      );

    case "customerSexual":
      return (
        <div className="text-sm text-gray-900">
          {order.customer?.sexual || "-"}
        </div>
      );

    case "customerAddress":
      return (
        <div className="text-sm text-gray-900">
          {order.customer?.address || "-"}
        </div>
      );

    case "customerProvince":
      return (
        <div className="text-sm text-gray-900">
          {order.customer?.province_name || "-"}
        </div>
      );

    case "customerGrade":
      return (
        <div className="text-sm text-gray-900">
          {order.customer?.grade_name || "-"}
        </div>
      );

    case "kyHieu":
      return (
        <div className="text-sm text-gray-900">
          {sale?.department?.branchcode || sale?.branchCode || "-"}
        </div>
      );

    case "description":
      return (
        <div className="text-sm text-gray-900">{order.docCode || "-"}</div>
      );

    case "nhanVienBan":
      return (
        <div className="text-sm text-gray-900">
          {sale?.saleperson_id?.toString() || "-"}
        </div>
      );

    case "tenNhanVienBan":
      return (
        <div className="text-sm text-gray-900">
          {sale?.tenNhanVienBan || "-"}
        </div>
      );

    case "itemCode": {
      const itemCode = sale?.product?.maVatTu || sale?.itemCode || "-";
      return (
        <div className="max-w-[120px]">
          <div
            className="text-sm font-semibold text-gray-900 truncate"
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
      return <div className="text-sm text-gray-900">{itemName}</div>;
    }

    case "dvt":
      return (
        <div className="text-sm text-gray-900">
          {sale?.product?.dvt || sale?.dvt || "-"}
        </div>
      );

    case "ordertypeName":
      return (
        <div className="text-sm text-gray-900">
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
      return <div className="text-sm text-gray-900">{productType || "-"}</div>;

    case "promCode": {
      // Sử dụng giá trị từ backend
      if (sale?.promCodeDisplay) {
        return (
          <div className="text-sm text-gray-900">{sale.promCodeDisplay}</div>
        );
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "muaHangGiamGia": {
      // Sử dụng giá trị từ backend
      if (sale?.muaHangGiamGiaDisplay) {
        return (
          <div className="text-sm text-gray-900">
            {sale.muaHangGiamGiaDisplay}
          </div>
        );
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "maCtkmTangHang": {
      // Sử dụng giá trị từ backend
      if (sale?.maCtkmTangHang && sale.maCtkmTangHang.trim() !== "") {
        return (
          <div className="text-sm text-gray-900">{sale.maCtkmTangHang}</div>
        );
      }
      return <div className="text-sm text-gray-400 italic">-</div>;
    }

    case "maKho":
      return <div className="text-sm text-gray-900">{sale?.maKho || "-"}</div>;

    case "maLo": {
      // Sử dụng giá trị từ backend
      if (sale?.maLo && sale.maLo.trim() !== "") {
        return <div className="text-sm text-gray-900">{sale.maLo}</div>;
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
        <div className="text-sm text-gray-900">
          {formatValue(sale?.revenue)}
        </div>
      );

    case "maNt":
      return <div className="text-sm text-gray-900">{sale?.maNt || "-"}</div>;

    case "tyGia":
      return formatNumber(sale?.tyGia ?? 1);

    case "maThue":
      return (
        <div className="text-sm text-gray-900">{sale?.maThue || TAX_CODE}</div>
      );

    case "tkNo":
      return (
        <div className="text-sm text-gray-900">
          {sale?.tkNo || DEBIT_ACCOUNT}
        </div>
      );

    case "tkDoanhThu": {
      // Sử dụng giá trị từ backend
      return (
        <div className="text-sm text-gray-900">
          {sale?.tkDoanhThuDisplay || "-"}
        </div>
      );
    }

    case "tkGiaVon": {
      // Sử dụng giá trị từ backend
      return (
        <div className="text-sm text-gray-900">
          {sale?.tkGiaVonDisplay || "-"}
        </div>
      );
    }

    case "tkChiPhiKhuyenMai":
      return (
        <div className="text-sm text-gray-900">
          {sale?.tkChiPhiKhuyenMai || "-"}
        </div>
      );

    case "tkThueCo":
      return (
        <div className="text-sm text-gray-900">{sale?.tkThueCo || "-"}</div>
      );

    case "cucThue": {
      // Sử dụng giá trị từ backend
      return (
        <div className="text-sm text-gray-900">
          {sale?.cucThueDisplay || "-"}
        </div>
      );
    }

    case "boPhan":
      return (
        <div className="text-sm text-gray-900">
          {sale?.department?.ma_bp || sale?.branchCode || "-"}
        </div>
      );

    case "chietKhauMuaHangGiamGia":
      return formatNumber(sale?.other_discamt ?? 0);

    case "muaHangCkVip": {
      // Sử dụng giá trị từ backend
      if (sale?.muaHangCkVip && sale.muaHangCkVip.trim() !== "") {
        return <div className="text-sm text-gray-900">{sale.muaHangCkVip}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauMuaHangCkVip":
      return (
        <div className="text-sm text-gray-900">
          {formatValue(sale?.grade_discamt ?? sale?.chietKhauMuaHangCkVip ?? 0)}
        </div>
      );

    case "maCkTheoChinhSach": {
      const val = sale?.maCkTheoChinhSach;
      if (val === null || val === undefined || val === "") {
        return <span className="text-gray-400 italic">-</span>;
      }
      return <div className="text-sm text-gray-900">{val}</div>;
    }

    case "ckTheoChinhSach": {
      // Map from disc_tm
      const val = (sale as any)?.disc_tm ?? sale?.chietKhauCkTheoChinhSach;
      // Hiển thị số nguyên không có format
      if (val === null || val === undefined || val === "") {
        return <span className="text-gray-400 italic">-</span>;
      }
      return <div className="text-sm text-gray-900">{Number(val) || 0}</div>;
    }

    case "thanhToanCoupon": {
      // Sử dụng giá trị từ backend
      if (sale?.thanhToanCouponDisplay) {
        return (
          <div className="text-sm text-gray-900">
            {sale.thanhToanCouponDisplay}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanCoupon": {
      // Sử dụng giá trị từ backend
      if (
        sale?.chietKhauThanhToanCouponDisplay != null &&
        sale.chietKhauThanhToanCouponDisplay > 0
      ) {
        return (
          <div className="text-sm text-gray-900">
            {formatValue(sale.chietKhauThanhToanCouponDisplay)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanVoucher": {
      // Sử dụng giá trị từ backend
      if (
        sale?.paid_by_voucher_ecode_ecoin_bp != null &&
        sale.paid_by_voucher_ecode_ecoin_bp > 0
      ) {
        return (
          <div className="text-sm text-gray-900">
            {formatValue(sale.paid_by_voucher_ecode_ecoin_bp)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "thanhToanVoucher": {
      // Sử dụng giá trị từ backend
      if (sale?.thanhToanVoucherDisplay) {
        return (
          <div className="text-sm text-gray-900">
            {sale.thanhToanVoucherDisplay}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "soSerial": {
      // Sử dụng giá trị từ backend
      if (sale?.soSerialDisplay) {
        return (
          <div className="text-sm text-gray-900">{sale.soSerialDisplay}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "voucherDp1": {
      // Sử dụng giá trị từ backend
      if (sale?.voucherDp1Display) {
        return (
          <div className="text-sm text-gray-900">{sale.voucherDp1Display}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauVoucherDp1": {
      // Sử dụng giá trị từ backend
      if (
        sale?.chietKhauVoucherDp1Display != null &&
        sale.chietKhauVoucherDp1Display > 0
      ) {
        return formatNumber(sale.chietKhauVoucherDp1Display);
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "thanhToanTkTienAo": {
      // Sử dụng giá trị từ backend
      if (sale?.thanhToanTkTienAoDisplay) {
        return (
          <div className="text-sm text-gray-900">
            {sale.thanhToanTkTienAoDisplay}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "chietKhauThanhToanTkTienAo": {
      // Sử dụng giá trị từ backend
      if (
        sale?.chietKhauThanhToanTkTienAoDisplay != null &&
        sale.chietKhauThanhToanTkTienAoDisplay > 0
      ) {
        return (
          <div className="text-sm text-gray-900">
            {formatValue(sale.chietKhauThanhToanTkTienAoDisplay)}
          </div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "maThe":
      return <div className="text-sm text-gray-900">{sale?.maThe ?? "-"}</div>;

    // Stock Transfer columns - Sale item level (lấy từ stockTransfer của sale)
    case "stockTransferDoctype": {
      const st = sale?.stockTransfer;
      if (st) {
        return <div className="text-sm text-gray-900">{st.doctype || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferTransDate": {
      const st = sale?.stockTransfer;
      if (st) {
        const transDate = st.transDate;
        if (transDate) {
          return (
            <div className="text-sm text-gray-900">
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
        return <div className="text-sm text-gray-900">{st.docDesc || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferStockCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className="text-sm text-gray-900">{st.stockCode || "-"}</div>
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
        return <div className="text-sm text-gray-900">{st.ioType || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferBatchSerial": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className="text-sm text-gray-900">{st.batchSerial || "-"}</div>
        );
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferSoCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return <div className="text-sm text-gray-900">{st.soCode || "-"}</div>;
      }
      return <span className="text-gray-400 italic">-</span>;
    }

    case "stockTransferDocCode": {
      const st = sale?.stockTransfer;
      if (st) {
        return (
          <div className="text-sm text-gray-900 font-mono">
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
      return <div className="text-sm text-gray-900">{tkChietKhau || "-"}</div>;
    }

    case "tkChiPhi": {
      // Tk chi phí từ creditAdvice (ví dụ: "64191" cho đơn "Đổi vỏ")
      return (
        <div className="text-sm text-gray-900">{sale?.tkChiPhi || "-"}</div>
      );
    }

    case "maPhi": {
      // Mã phí từ creditAdvice (ví dụ: "161010" cho đơn "Đổi vỏ")
      return <div className="text-sm text-gray-900">{sale?.maPhi || "-"}</div>;
    }

    case "tkChiPhiKhuyenMaiProduct":
    case "tkGiaVonBanLe":
    case "tkDoanhThuBanLe":
    case "tkChiPhiKhauHaoCCDC":
    case "tkChiPhiKhauHaoTSDC":
    case "tkDoanhThuHangNo":
    case "tkGiaVonHangNo":
    case "tkVatTuHangNo":
      return <div className="text-sm text-gray-900">-</div>;

    default: {
      const value = sale?.[field as keyof typeof sale];
      return <div className="text-sm text-gray-900">{formatValue(value)}</div>;
    }
  }
};
