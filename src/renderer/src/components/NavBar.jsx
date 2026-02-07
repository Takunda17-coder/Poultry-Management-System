import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-blue-700 transition"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition">
              <h1 className="text-2xl font-bold">🐔 Poultry Manager</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <p className="text-sm">Dashboard</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
