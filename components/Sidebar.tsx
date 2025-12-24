'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

export default function Sidebar({ isOpen, onToggle, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    {
      label: 'Danh mục',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      children: [
        {
          href: '/categories/products',
          label: 'Danh mục hàng hóa vật tư',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          href: '/categories/promotions',
          label: 'Danh mục Km',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
        },
        {
          href: '/categories/warehouses',
          label: 'Danh mục kho hàng',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          href: '/categories/warehouse-code-mappings',
          label: 'Danh mục kho - Mapping mã',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          href: '/categories/customers',
          label: 'Khách hàng',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: 'Chứng từ',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      children: [
        {
          href: '/orders',
          label: 'Đơn hàng',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          href: '/stock-transfer',
          label: 'Dữ liệu xuất kho',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          href: '/fast-api-invoices',
          label: 'Bảng kê hóa đơn',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          href: '/error-orders',
          label: 'Đơn hàng lỗi',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          href: '/giai-trinh-faceid',
          label: 'Giải trình FaceID',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
        },
        {
          href: '/shift-end-cash',
          label: 'Báo cáo nộp quỹ cuối ca',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          href: '/repack-formula',
          label: 'Tách gộp BOM',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
        },
        {
          href: '/promotion',
          label: 'Danh sách CTKM',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          href: '/voucher-issue',
          label: 'Danh sách Voucher',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      ],
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

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.href) {
      return isActive(item.href);
    }
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  // Tự động mở rộng menu item nếu có child đang active
  useEffect(() => {
    const activeParents: string[] = [];
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => {
        if (!child.href) return false;
        if (child.href === '/') {
          return pathname === '/';
        }
        return pathname?.startsWith(child.href);
      })) {
        activeParents.push(item.label);
      }
    });
    // Luôn mở menu "Danh mục" nếu đang ở trang categories
    if (pathname?.startsWith('/categories')) {
      activeParents.push('Danh mục');
    }
    if (activeParents.length > 0) {
      setExpandedItems(activeParents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const active = item.href ? isActive(item.href) : isParentActive(item);

    if (collapsed && level === 0) {
      // Khi sidebar bị thu gọn, chỉ hiển thị icon
      return (
        <div key={item.label} className="relative group">
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.label)}
              className={`flex items-center justify-center w-full px-3 py-2.5 rounded-md transition-all duration-200 ${active
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-blue-50'
                }`}
              title={item.label}
            >
              <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`}>
                {item.icon}
              </span>
            </button>
          ) : (
            <Link
              href={item.href || '#'}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className={`flex items-center justify-center px-3 py-2.5 rounded-md transition-all duration-200 ${active
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-blue-50'
                }`}
              title={item.label}
            >
              <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`}>
                {item.icon}
              </span>
            </Link>
          )}
        </div>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={() => toggleExpand(item.label)}
            className={`flex items-center w-full gap-2.5 px-3 py-2.5 rounded-md transition-all duration-200 ${active
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-50'
              }`}
          >
            <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm whitespace-nowrap flex-1 text-left">
              {item.label}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${active ? 'text-white' : 'text-gray-400'
                }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href || '#'}
        onClick={() => {
          if (window.innerWidth < 1024) {
            onToggle();
          }
        }}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-all duration-200 ${active
          ? 'bg-blue-500 text-white'
          : 'text-gray-700 hover:bg-blue-50'
          }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`}>
          {item.icon}
        </span>
        <span className={`font-medium text-sm ${level > 0 ? '' : 'whitespace-nowrap'}`}>{item.label}</span>
      </Link>
    );
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
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 ${collapsed ? 'w-16' : 'w-64'} shadow-sm`}
      >
        <div className="flex flex-col h-full">
          {/* Logo và header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image
                    src="https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/009f3fa2c79f4b35ae518d568753e59c?ik-sanitizeSvg=true"
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
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
            {menuItems.map((item) => renderMenuItem(item))}
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

