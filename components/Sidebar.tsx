'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onToggle, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/',
      label: 'Trang chủ',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/sales',
      label: 'Đơn hàng',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: '/invoices',
      label: 'Hóa đơn',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/sync',
      label: 'Đồng bộ',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Overlay khi sidebar mở trên mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'w-16' : 'w-48'} shadow-sm`}
      >
        <div className="flex flex-col h-full">
          {/* Logo và header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {!collapsed && (
                  <span className="text-base font-bold text-gray-900 whitespace-nowrap">InvoiceFlow</span>
                )}
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
                  title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {collapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={onToggle}
                  className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Đóng sidebar trên mobile khi click
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-3 py-2.5 rounded-md transition-all duration-200 ${
                    active
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-3 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                © 2025 InvoiceFlow
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

