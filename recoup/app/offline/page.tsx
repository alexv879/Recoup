/**
 * Offline Fallback Page
 *
 * Displayed when user is offline and no cached version is available
 */

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-6">
            <WifiOff className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          It looks like you've lost your internet connection. Don't worry, your data is safe
          and will sync when you're back online.
        </p>

        {/* What You Can Do */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What you can do:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">1</span>
              </span>
              <span className="text-gray-700">
                Check your internet connection
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">2</span>
              </span>
              <span className="text-gray-700">
                View your recently accessed invoices and data
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">3</span>
              </span>
              <span className="text-gray-700">
                Any changes you make will sync automatically when you reconnect
              </span>
            </li>
          </ul>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Try Again
        </button>

        {/* Info */}
        <p className="mt-6 text-sm text-gray-500">
          Recoup works offline thanks to Progressive Web App technology
        </p>
      </div>
    </div>
  );
}
