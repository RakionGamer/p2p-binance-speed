import React from "react";

export default function PriceCard({ title, price, fiat, icon: Icon, type }) {
  const bgColor =
    type === "buy"
      ? "bg-emerald-50"
      : type === "sell"
      ? "bg-rose-50"
      : "bg-gray-50";
  const textColor =
    type === "buy"
      ? "text-emerald-600"
      : type === "sell"
      ? "text-rose-600"
      : "text-gray-900";
  const iconColor =
    type === "buy"
      ? "text-emerald-500"
      : type === "sell"
      ? "text-rose-500"
      : "text-gray-500";

  return (
    <div
      className={`${bgColor} rounded-lg p-4 shadow-sm border border-gray-100 flex-1`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className={`text-xl font-bold ${textColor}`}>
        {price ? `${price.toFixed(2)}` : "N/A"}
      </div>
      <div className="text-xs text-gray-500 mt-1">{fiat}</div>
    </div>
  );
}
