import React from "react";
import { User, CheckCircle } from "lucide-react";

export default function MerchantCard({ merchant, ad, type }) {
  const priceColor = type === "buy" ? "text-emerald-600" : "text-rose-600";
  const bgHover = type === "buy" ? "hover:bg-emerald-50" : "hover:bg-rose-50";

  return (
    <div
      className={`bg-white rounded-lg p-3 border border-gray-200 ${bgHover} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {merchant.nickName}
              </span>
              {merchant.isVerified && (
                <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{(merchant.monthFinishRate * 100).toFixed(0)}%</span>
              <span>•</span>
              <span>{merchant.monthOrderCount} ops</span>
            </div>
          </div>
        </div>
        <div className={`text-lg font-bold ${priceColor} flex-shrink-0`}>
          {ad.price.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Límites:</span>
          <div className="font-medium text-gray-900 truncate">
            {ad.minAmount.toFixed(0)} - {ad.maxAmount.toFixed(0)}
          </div>
        </div>
        <div>
          <span className="text-gray-500">USDT:</span>
          <div className="font-medium text-gray-900 truncate">
            {ad.availableUSDT.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
