/**
 * MTD Upgrade Banner
 * Feature-flagged component promoting MTD-Pro tier
 */

'use client';

import Link from 'next/link';

export function MTDUpgradeBanner() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🇬🇧</span>
            <h3 className="text-2xl font-bold">MTD-Pro: HMRC Quarterly Filing</h3>
          </div>
          <p className="text-lg mb-4 text-purple-100">
            File your quarterly MTD updates directly to HMRC. Coming soon—be first in line!
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              <span className="text-purple-100">Automatic quarterly submissions to HMRC</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              <span className="text-purple-100">VAT filing integration</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              <span className="text-purple-100">Audit-proof digital records</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span>
              <span className="text-purple-100">HMRC-approved software (pending approval)</span>
            </li>
          </ul>
          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold mb-1">📅 MTD Mandatory Dates:</p>
            <ul className="text-sm space-y-1 text-purple-200">
              <li>• April 2026: £50k+ income (mandatory)</li>
              <li>• April 2027: £30k+ income</li>
              <li>• April 2028: £20k+ income</li>
            </ul>
          </div>
          <p className="text-xs text-purple-200">
            ⏳ Status: Awaiting HMRC production approval. Join waitlist to be notified when we launch.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/pricing?plan=mtd-pro"
            className="inline-block bg-white text-purple-700 px-8 py-4 rounded-lg font-bold hover:bg-purple-50 shadow-lg transition text-lg"
          >
            Join Waitlist
          </Link>
          <p className="text-purple-200 text-sm mt-3">
            £20/month when available
          </p>
        </div>
      </div>
    </div>
  );
}
