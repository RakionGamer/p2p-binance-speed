"use client";

import React from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";

// 🏦 Mapeo de bancos → logo con tamaños personalizados
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

export default function SummaryHeader({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      {/* 🔹 Encabezado con logo Binance P2P */}
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
          {/* Header - oculto en móvil */}
          <div className="hidden sm:grid grid-cols-5 gap-4 mb-3 text-base font-semibold text-gray-600 px-4">
            <div>País</div>

     
            <div className="flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-green-500" />
              Compra
            </div>

            <div className="flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              Venta
            </div>
            <div className="flex items-center gap-1">
              <Percent className="w-5 h-5 text-gray-500" />
              Spread
            </div>
            <div className="flex items-center gap-1">Metodo de Pago</div>
          </div>

          <div className="space-y-3">
            {data.map((country, idx) => {
              // 🧠 Lógica de detección del logo
              let paymentMethod = country.paymentMethod;

              // Si el país es Chile y no tiene método, usar Banco Santander
              if (!paymentMethod && country.country === "Chile") {
                paymentMethod = "BancoSantander";
              }

              const bankInfo = BANK_LOGOS[paymentMethod] || null;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {/* 🏦 Logo del banco - AHORA A LA IZQUIERDA */}

                  {/* 🇨🇱 País */}
                  <div className="font-semibold text-gray-900 text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      País
                    </span>
                    {country.country}
                  </div>

                  {/* 💰 Compra */}
                  <div className="text-emerald-600 font-semibold text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Compra
                    </span>
                    {country.prices.buy
                      ? `${country.prices.buy.toFixed(2)}`
                      : "N/A"}
                  </div>

                  {/* 💸 Venta */}
                  <div className="text-rose-600 font-semibold text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Venta
                    </span>
                    {country.prices.sell
                      ? `${country.prices.sell.toFixed(2)}`
                      : "N/A"}
                  </div>

                  {/* 📊 Spread */}
                  <div className="font-semibold text-gray-900 text-lg text-center sm:text-left">
                    <span className="sm:hidden text-xs text-gray-500 block mb-1">
                      Spread
                    </span>
                    {country.prices.spreadPercentage
                      ? `${country.prices.spreadPercentage}%`
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
