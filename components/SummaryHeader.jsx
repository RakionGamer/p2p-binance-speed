"use client";

import React from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";

const BANK_LOGOS = {
  BancoGuayaquil: {
    src: "/banco-guayaquil.svg",
    width: 72,
    height: 72,
  },
  BancoSantander: {
    src: "/banco-santander.svg",
    width: 80,
    height: 80,
  },
  BancolombiaSA: {
    src: "/bancolombia.svg",
    width: 80,
    height: 80,
  },
  SpecificBank: {
    src: "/bdv.svg",
    width: 100,
    height: 100,
  },
  MercadoPagoNew: {
    src: "/mercadopago.svg",
    width: 85,
    height: 85,
  },
  OXXO: {
    src: "/oxxo.svg",
    width: 38,
    height: 38,
  },
  CreditBankofPeru: {
    src: "/bcp.svg",
    width: 45,
    height: 45,
  },
};

const PRICE_INDEX = 4; 

export default function SummaryHeader({ data }) {
  if (!data || data.length === 0) return null;

  const get5thPrice = (ads) => {
    if (!ads || ads.length === 0) return null;
    if (ads.length > PRICE_INDEX) {
      return ads[PRICE_INDEX].ad.price;
    }
    return ads[ads.length - 1].ad.price;
  };

  const countriesWithPrices = data.map((country) => {
    const buyPrice = get5thPrice(country.ads.buy);
    const sellPrice = get5thPrice(country.ads.sell);

    let spread = null;
    let spreadPercentage = null;

    if (buyPrice && sellPrice) {
      spread = sellPrice - buyPrice;
    }

    return {
      ...country,
      calculatedPrices: {
        buy: buyPrice,
        sell: sellPrice,
        spread: spread,
      },
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Image
          src="/speed-logo.png"
          alt="Binance P2P"
          width={52}
          height={52}
          className="rounded-lg w-10 h-10 sm:w-12 sm:h-12"
        />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Binance P2P
        </h2>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-max px-4 sm:px-0">
          <div className="hidden sm:grid grid-cols-5 gap-4 mb-3 text-base font-semibold text-gray-600 px-4">
            <div>País</div>

            <div className="flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              Venta
            </div>

            <div className="flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Compra
            </div>
            <div className="flex items-center gap-1">
              <Percent className="w-5 h-5 text-gray-500" />
              Diferencia
            </div>
            <div className="flex items-center gap-1">Método de Pago</div>
          </div>

          <div className="space-y-3">
            {countriesWithPrices.map((country, idx) => {
              let paymentMethod = country.paymentMethod;
              if (!paymentMethod && country.country === "Chile") {
                paymentMethod = "BancoSantander";
              }

              const bankInfo = BANK_LOGOS[paymentMethod] || null;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="font-semibold text-gray-900 text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      País
                    </span>
                    {country.country}
                  </div>

                  <div className="text-rose-600 font-semibold text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Venta
                    </span>
                    {country.calculatedPrices.sell
                      ? `${country.calculatedPrices.sell.toFixed(2)}`
                      : "N/A"}
                  </div>

                  <div className="text-emerald-600 font-semibold text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Compra
                    </span>
                    {country.calculatedPrices.buy
                      ? `${country.calculatedPrices.buy.toFixed(2)}`
                      : "N/A"}
                  </div>

                  <div className="font-semibold text-gray-900 text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Spread
                    </span>
                    {country.calculatedPrices.spread
                      ? `${country.calculatedPrices.spread.toFixed(2)}`
                      : "N/A"}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    {bankInfo ? (
                      <Image
                        src={bankInfo.src}
                        alt={paymentMethod}
                        width={bankInfo.width}
                        height={bankInfo.height}
                        className="rounded-md object-contain max-w-[80px] max-h-[80px]"
                      />
                    ) : (
                      <span className="text-base text-gray-800">
                        {paymentMethod || "N/A"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
