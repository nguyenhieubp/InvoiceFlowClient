'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import Link from 'next/link';

interface InvoiceItem {
  id: string;
  itemCode: string;
  itemName: string;
  uom: string;
  quantity: number;
  price: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
}

interface Invoice {
  id: string;
  key: string;
  invoiceDate: string;
  customerCode: string;
  customerName: string;
  customerTaxCode: string;
  address: string;
  phoneNumber: string;
  idCardNo: string;
  currency: string;
  exchangeRate: number;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountInWords: string;
  humanName: string;
  voucherBook: string;
  printResponse: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
  fastStatus?: 'printed' | 'pending' | 'missing';
  fastStatusMessage?: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoiceDetail();
    }
  }, [id]);

  useEffect(() => {
    let currentUrl: string | null = null;
    const fetchPdf = async () => {
      if (!invoice) {
        setPdfUrl(null);
        setPdfError(null);
        return;
      }

      if (invoice.fastStatus !== 'printed') {
        if (invoice.fastStatus === 'pending') {
          setPdfError('Hóa đơn đang chờ xử lý trên hệ thống FAST');
        } else {
          setPdfError(
            invoice.fastStatusMessage || 'Không tìm thấy hóa đơn trên hệ thống FAST',
          );
        }
        setPdfUrl(null);
        return;
      }

      try {
        setPdfLoading(true);
        setPdfError(null);
        const response = await invoicesApi.downloadPdf(invoice.id);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
      } catch (err: any) {
        console.error('Error loading invoice PDF:', err);
        setPdfError(err.response?.data?.message || err.message || 'Không thể tải PDF hóa đơn');
        setPdfUrl(null);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [invoice]);

  const loadInvoiceDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoicesApi.getById(id);
      // Backend NestJS thường trả về trực tiếp object, không wrap trong data
      // Nhưng axios sẽ wrap trong response.data
      const invoiceData = response.data;
      if (!invoiceData) {
        throw new Error('Không tìm thấy dữ liệu hóa đơn');
      }
      setInvoice(invoiceData);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không tìm thấy hóa đơn';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-red-400 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-4">{error || 'Không tìm thấy hóa đơn'}</p>
              <Link
                href="/invoices"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách hóa đơn
          </Link>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>Mã hóa đơn: <strong className="text-gray-900">{invoice.key}</strong></span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  invoice.fastStatus === 'printed'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : invoice.fastStatus === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {invoice.fastStatus === 'printed'
                  ? 'Đã in (FAST)'
                  : invoice.fastStatus === 'pending'
                  ? 'Chưa xử lý'
                  : 'Không có trên FAST'}
              </span>
            </div>
        </div>

        {/* PDF Preview */}
        <div className="mt-6">
          <div className="bg-white rounded-md shadow-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Hóa đơn PDF</h3>
              {invoice.fastStatus !== 'printed' && (
                <span className="text-xs text-gray-500 italic">
                  {pdfError || 'Hóa đơn chưa sẵn sàng trên hệ thống FAST'}
                </span>
              )}
            </div>
            <div className="p-6 bg-gray-50">
              {pdfLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600 text-sm">
                  <svg className="w-6 h-6 animate-spin mb-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tải hóa đơn PDF...
                </div>
              )}
              {!pdfLoading && pdfError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  {pdfError}
                </div>
              )}
              {!pdfLoading && !pdfError && pdfUrl && (
                <div className="border border-gray-200 rounded bg-white overflow-hidden">
                  <iframe
                    src={pdfUrl}
                    title="Invoice PDF"
                    className="w-full min-h-[900px]"
                  />
                </div>
              )}
              {!pdfLoading && !pdfError && !pdfUrl && invoice.fastStatus === 'printed' && (
                <div className="text-sm text-gray-600">
                  Không thể hiển thị PDF hóa đơn.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Response (if available) - Collapsible */}
        {invoice.printResponse && invoice.fastStatus === 'printed' && (
          <div className="mt-4 bg-white rounded-sm shadow border border-gray-300 overflow-hidden">
            <details className="group">
              <summary className="cursor-pointer bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Thông tin in hóa đơn</h3>
                <svg className="w-4 h-4 text-gray-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 bg-gray-50">
                <div className="bg-white rounded p-3 border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto font-mono">
                    {JSON.stringify(JSON.parse(invoice.printResponse), null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

