import React from 'react';

interface AccessibleTableProps {
    columns: Array<{ key: string; header: string; }>; // column definitions
    data: Array<Record<string, any>>;
    caption?: string;
    ariaLabel?: string;
    className?: string;
}

export default function AccessibleTable({ columns, data, caption, ariaLabel, className = '' }: AccessibleTableProps) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full border border-gray-200 rounded-lg" aria-label={ariaLabel || caption}>
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className="bg-gray-100">
                    <tr>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                scope="col"
                                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-4 text-center text-gray-500">
                                No data available.
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="even:bg-gray-50">
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-2 border-b text-sm text-gray-900">
                                        {row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
