'use client';

import { useState } from 'react';
import { salesApi } from '@/lib/api';
import { Toast } from '@/components/Toast';

interface StockTransferItem {
  doctype: string;
  doccode: string;
  transdate: string;
  doc_desc: string;
  branch_code: string;
  brand_code: string;
  item_code: string;
  item_name: string;
  stock_code: string;
  related_stock_code: string;
  iotype: string;
  qty: number;
  batchserial: string | null;
  line_info1: string | null;
  line_info2: string | null;
  so_code: string | null;
}

export default function StockTransferPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Parse JSON input
      let data: { data: StockTransferItem[] };
      try {
        const parsed = JSON.parse(jsonInput);
        // Nếu input là array, wrap vào object
        if (Array.isArray(parsed)) {
          data = { data: parsed };
        } else if (parsed.data && Array.isArray(parsed.data)) {
          data = parsed;
        } else {
          throw new Error('Dữ liệu không hợp lệ. Vui lòng nhập array hoặc object có field "data"');
        }
      } catch (error: any) {
        showToast('error', `Lỗi parse JSON: ${error.message}`);
        setLoading(false);
        return;
      }

      // Validate data
      if (!data.data || data.data.length === 0) {
        showToast('error', 'Dữ liệu không được để trống');
        setLoading(false);
        return;
      }

      // Call API
      const response = await salesApi.createStockTransfer(data);
      setResult(response.data);
      
      if (response.data.success) {
        showToast(
          'success',
          `Tạo thành công ${response.data.successCount}/${response.data.total} phiếu xuất kho`,
        );
      } else {
        showToast('error', 'Có lỗi xảy ra khi tạo phiếu xuất kho');
      }
    } catch (error: any) {
      console.error('Error creating stock transfer:', error);
      showToast('error', error?.response?.data?.message || 'Lỗi khi tạo phiếu xuất kho');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    const sample = {
      data: [
        {
          doctype: 'STOCK_TRANSFER',
          doccode: 'TR81.00367396',
          transdate: '2025-11-01T01:40:12Z',
          doc_desc: 'LAS1 - Nhập HL ngày 31/10/2025',
          branch_code: 'HMC01',
          brand_code: 'NH_KH',
          item_code: 'FSSX015',
          item_name: 'Disposable Rectangle Cotton Pad_BTT 5x6 lẻ',
          stock_code: 'BAT2',
          related_stock_code: 'LAS1',
          iotype: 'O',
          qty: -1000,
          batchserial: null,
          line_info1: null,
          line_info2: null,
          so_code: null,
        },
        {
          doctype: 'STOCK_TRANSFER',
          doccode: 'TR81.00367396',
          transdate: '2025-11-01T01:40:12Z',
          doc_desc: 'LAS1 - Nhập HL ngày 31/10/2025',
          branch_code: 'HMC01',
          brand_code: 'NH_KH',
          item_code: 'FSSX016',
          item_name: 'Disposable Rectangle Cotton Pad_BTT 6x8 lẻ',
          stock_code: 'BAT2',
          related_stock_code: 'LAS1',
          iotype: 'O',
          qty: -1000,
          batchserial: null,
          line_info1: null,
          line_info2: null,
          so_code: null,
        },
      ],
    };
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tạo phiếu xuất/nhập kho</h1>
        <p className="text-gray-600">
          Nhập dữ liệu STOCK_TRANSFER dưới dạng JSON để tạo phiếu xuất/nhập kho
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="mb-4 flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dữ liệu JSON
          </label>
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Load mẫu
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 rounded font-mono text-sm"
          placeholder='{"data": [...]}'
        />
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !jsonInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Tạo phiếu xuất kho'}
          </button>
          <button
            onClick={() => {
              setJsonInput('');
              setResult(null);
            }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Kết quả</h2>
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Tổng số</div>
                <div className="text-2xl font-bold text-blue-600">{result.total || 0}</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-600">Thành công</div>
                <div className="text-2xl font-bold text-green-600">
                  {result.successCount || 0}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <div className="text-sm text-gray-600">Thất bại</div>
                <div className="text-2xl font-bold text-red-600">
                  {result.failedCount || 0}
                </div>
              </div>
            </div>
          </div>

          {result.results && result.results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Chi tiết</h3>
              <div className="space-y-2">
                {result.results.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded border ${
                      item.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{item.doccode}</div>
                        {item.success ? (
                          <div className="text-sm text-green-700 mt-1">
                            Tạo thành công
                          </div>
                        ) : (
                          <div className="text-sm text-red-700 mt-1">
                            Lỗi: {item.error || 'Unknown error'}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.success
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {item.success ? 'Thành công' : 'Thất bại'}
                      </span>
                    </div>
                    {item.result && (
                      <div className="mt-2 text-xs text-gray-600">
                        <pre className="bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(item.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

