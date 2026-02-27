import { useState, useEffect } from "react";
import { format } from "date-fns";
// Actually, I don't know if headlessui is installed. I'll use a simple custom modal to be safe.

interface EditFeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    item: any;
    platform: string;
}

export function EditFeeModal({
    isOpen,
    onClose,
    onSave,
    item,
    platform,
}: EditFeeModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            const defaultDateStr = format(new Date(), "yyyy-MM-dd");
            const newData = { ...item };

            // Default fee dates to today if they are empty
            for (let i = 1; i <= 6; i++) {
                const key = `ngay_phi${i}`;
                if (!newData[key]) {
                    newData[key] = defaultDateStr;
                } else {
                    // Ensure existing dates are also correctly formatted for the input type="date"
                    newData[key] = format(new Date(newData[key]), "yyyy-MM-dd");
                }
            }

            setFormData(newData);
        }
    }, [item]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    const renderField = (
        label: string,
        key: string,
        type: "text" | "number" | "date" = "text",
    ) => (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
                type={type}
                name={key}
                value={
                    type === "date"
                        ? formData[key]
                            ? format(new Date(formData[key]), "yyyy-MM-dd")
                            : ""
                        : formData[key] ?? ""
                }
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );

    const getFields = () => {
        const commonFields = [
            { label: "Mã Sàn", key: "maSan" },
            { label: "Mã Nội Bộ SP", key: "maNoiBoSp" },
            { label: "Ngày Đối Soát", key: "ngayDoiSoat", type: "date" },
            { label: "Mã Đơn Hàng Hoàn", key: "maDonHangHoan" },
        ];

        if (platform === "shopee") {
            return [
                ...commonFields,
                { label: "Shop Phát Hành", key: "shopPhatHanhTrenSan" },
                { label: "Giá Trị Giảm Giá CTKM", key: "giaTriGiamGiaCtkm", type: "number" },
                { label: "Doanh Thu Đơn Hàng", key: "doanhThuDonHang", type: "number" },
                { label: "Phí Cố Định", key: "phiCoDinh605MaPhi164020", type: "number" },
                { label: "Phí Dịch Vụ", key: "phiDichVu6MaPhi164020", type: "number" },
                { label: "Phí Thanh Toán", key: "phiThanhToan5MaPhi164020", type: "number" },
                { label: "Phí Hoa Hồng TT", key: "phiHoaHongTiepThiLienKet21150050", type: "number" },
                { label: "Phí Shipping Fee Saver", key: "chiPhiDichVuShippingFeeSaver164010", type: "number" },
                { label: "Phí Pi Ship", key: "phiPiShipDoMktDangKy164010", type: "number" },
            ];
        } else if (platform === "tiktok") {
            return [
                ...commonFields,
                { label: "Phí Giao Dịch 5%", key: "phiGiaoDichTyLe5164020", type: "number" },
                { label: "Phí HH Tiktok 4.54%", key: "phiHoaHongTraChoTiktok454164020", type: "number" },
                { label: "Phí HH TT 150050", key: "phiHoaHongTiepThiLienKet150050", type: "number" },
                { label: "Phí DV SFP 6%", key: "phiDichVuSfp6164020", type: "number" },
            ];
        } else if (platform === "lazada") {
            return [
                ...commonFields,
                { label: "Tên Phí/Doanh Thu", key: "tenPhiDoanhThu" },
                { label: "Quảng Cáo TT", key: "quangCaoTiepThiLienKet" },
                { label: "Mã Phí Hạch Toán", key: "maPhiNhanDienHachToan" },
                { label: "Số Tiền Phí", key: "soTienPhi", type: "number" },
                { label: "Ghi Chú", key: "ghiChu" },
            ];
        }
        return commonFields;
    };

    const fields = getFields();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Chỉnh sửa phí ({platform.toUpperCase()})
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map((field: any) => (
                            <div key={field.key}>
                                {renderField(field.label, field.key, field.type)}
                            </div>
                        ))}

                        {/* Common MKT Fields */}
                        <div className="col-span-full border-t pt-4 mt-2">
                            <h3 className="font-medium text-gray-700 mb-2">Thông tin MKT</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField("MKT 1", "cotChoBsMkt1")}
                                {renderField("MKT 2", "cotChoBsMkt2")}
                                {renderField("MKT 3", "cotChoBsMkt3")}
                                {renderField("MKT 4", "cotChoBsMkt4")}
                                {renderField("MKT 5", "cotChoBsMkt5")}
                                {renderField("Bộ Phận", "boPhan")}
                            </div>
                        </div>

                        <div className="col-span-full border-t pt-4 mt-2">
                            <h3 className="font-medium text-gray-700 mb-2">Phí Chung</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField("Phí 1", "phi1", "number")}
                                {renderField("Phí 2", "phi2", "number")}
                                {renderField("Phí 3", "phi3", "number")}
                                {renderField("Phí 4", "phi4", "number")}
                                {renderField("Phí 5", "phi5", "number")}
                                {renderField("Phí 6", "phi6", "number")}
                            </div>
                        </div>

                        {/* Fee Dates */}
                        <div className="col-span-full border-t pt-4 mt-2">
                            <h3 className="font-medium text-gray-700 mb-2">Ngày Phí (Dùng khi đẩy Fast)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField("Ngày Phí 1", "ngay_phi1", "date")}
                                {renderField("Ngày Phí 2", "ngay_phi2", "date")}
                                {renderField("Ngày Phí 3", "ngay_phi3", "date")}
                                {renderField("Ngày Phí 4", "ngay_phi4", "date")}
                                {renderField("Ngày Phí 5", "ngay_phi5", "date")}
                                {renderField("Ngày Phí 6", "ngay_phi6", "date")}
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                        disabled={saving}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
