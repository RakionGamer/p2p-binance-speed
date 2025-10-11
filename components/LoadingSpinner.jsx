import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mb-4"></div>
        <p className="text-gray-600 text-lg">
          Cargando precios de Binance P2P...
        </p>
      </div>
    </div>
  );
}
