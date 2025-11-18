'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/invoices', label: 'Invoices', icon: '📄' },
    { href: '/clients', label: 'Clients', icon: '👥' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/help', label: 'Help', icon: '❓' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="font-semibold text-gray-900">Recoup</span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow-sm"
              data-tour="create-invoice-button"
            >
              <span className="mr-1">+</span>
              <span>New</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserButton afterSignOutUrl="/" />
              <span className="font-medium text-gray-900">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
              <p className="text-sm font-medium text-indigo-900 mb-2">
                Need help?
              </p>
              <p className="text-xs text-indigo-700 mb-3">
                Check out our help center for guides and tutorials
              </p>
              <Link
                href="/help"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Visit Help Center
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar (Alternative mobile nav) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all min-w-[60px]
                ${isActive(item.href)
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className={`text-xs ${isActive(item.href) ? 'font-medium' : ''}`}>
                {item.label}
              </span>
              {isActive(item.href) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-20" />
    </>
  );
}
