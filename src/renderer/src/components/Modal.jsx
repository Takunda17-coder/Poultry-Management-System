import React from 'react';
import { X, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, message, type = 'info', onConfirm }) {
    if (!isOpen) return null;

    const icons = {
        info: <AlertCircle className="text-blue-500" size={32} />,
        success: <CheckCircle className="text-green-500" size={32} />,
        danger: <AlertCircle className="text-red-500" size={32} />,
        warning: <HelpCircle className="text-amber-500" size={32} />
    };

    const buttonStyles = {
        info: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-green-600 hover:bg-green-700',
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {icons[type]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-gray-600">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        {onConfirm ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`px-4 py-2 text-white font-medium rounded shadow transition ${buttonStyles[type]}`}
                                >
                                    Confirm
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-white font-medium rounded shadow transition w-full ${buttonStyles[type]}`}
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
