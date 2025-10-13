import React from "react";
import { TrendingUp, TrendingDown, Percent, Activity } from "lucide-react";
import PriceCard from "./PriceCard";
import MerchantCard from "./MerchantCard";

export default function CountrySection({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header del país */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.country}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Activity className="w-4 h-4" />
            <span>{data.paymentMethod || "Todos los métodos"}</span>
          </div>
        </div>
      </div>

      {/* Cards de mejor precio */}
      <div className="flex gap-3 mb-6">
        <PriceCard
          title="Mejor Compra"
          price={data.prices.buy}
          fiat={data.fiat}
          icon={TrendingUp}
          type="buy"
        />
        <PriceCard
          title="Mejor Venta"
          price={data.prices.sell}
          fiat={data.fiat}
          icon={TrendingDown}
          type="sell"
        />
        <PriceCard
          title="Spread"
          price={
            data.prices.spreadPercentage
              ? parseFloat(data.prices.spreadPercentage)
              : null
          }
          fiat="%"
          icon={Percent}
          type="spread"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Compra ({data.summary.totalBuyAds})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {data.ads.buy.length > 0 ? (
              data.ads.buy.map((item, idx) => (
                <MerchantCard
                  key={idx}
                  merchant={item.merchant}
                  ad={item.ad}
                  type="buy"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay anuncios disponibles
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            Venta ({data.summary.totalSellAds})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {data.ads.sell.length > 0 ? (
              data.ads.sell.map((item, idx) => (
                <MerchantCard
                  key={idx}
                  merchant={item.merchant}
                  ad={item.ad}
                  type="sell"
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay anuncios disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
