import React from "react";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";

export default function SummaryHeader({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h2>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-4 gap-4 mb-2 text-sm font-semibold text-gray-600 px-4">
            <div>País</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Compra
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Venta
            </div>
            <div className="flex items-center gap-1">
              <Percent className="w-4 h-4 text-gray-500" />
              Spread
            </div>
          </div>
          <div className="space-y-2">
            {data.map((country, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-semibold text-gray-900">
                  {country.country}
                  <span className="text-xs text-gray-500 ml-2">
                    {country.fiat}
                  </span>
                </div>
                <div className="text-emerald-600 font-semibold">
                  {country.prices.buy
                    ? `${country.prices.buy.toFixed(2)}`
                    : "N/A"}
                </div>
                <div className="text-rose-600 font-semibold">
                  {country.prices.sell
                    ? `${country.prices.sell.toFixed(2)}`
                    : "N/A"}
                </div>
                <div className="font-semibold text-gray-900">
                  {country.prices.spreadPercentage
                    ? `${country.prices.spreadPercentage}%`
                    : "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
