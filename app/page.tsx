import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 p-4">
        <p className="text-lg text-gray-600">
          Hệ thống quản lý và in hóa đơn tự động
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        <Link
          href="/sales"
          className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Đơn hàng</h2>
          <p className="text-gray-600">
            Xem và quản lý đơn hàng từ các nhãn hàng
          </p>
        </Link>

        <Link
          href="/invoices"
          className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:border-purple-300 hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Hóa đơn</h2>
          <p className="text-gray-600">
            Tạo và quản lý hóa đơn, in hóa đơn tự động
          </p>
        </Link>

        <Link
          href="/sync"
          className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 hover:border-green-300 hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Đồng bộ</h2>
          <p className="text-gray-600">
            Đồng bộ dữ liệu từ các nhãn hàng
          </p>
        </Link>
      </div>
    </div>
  );
}
