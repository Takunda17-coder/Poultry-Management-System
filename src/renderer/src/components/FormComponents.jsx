import React from 'react';

export function FormInput({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function FormSelect({ label, options, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormTextarea({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function FormButton({ children, variant = 'primary', ...props }) {
  const baseClasses = 'font-bold py-2 px-4 rounded transition';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-400 hover:bg-gray-500 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  return (
    <button
      {...props}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, title, icon: Icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
          {Icon && <Icon className="text-blue-600" size={24} />}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

export function Table({ headers, rows, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                {header}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length + (actions ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {Object.values(row).map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-6 py-4 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm space-x-2">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
