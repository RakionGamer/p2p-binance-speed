"use client";

import { useState, useEffect, useRef } from "react";
import CountrySection from "@/components/CountrySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import SummaryHeader from "@/components/SummaryHeader";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const isInitialLoad = useRef(true);
  const isMountedRef = useRef(true);
  const cachedDataRef = useRef({});
  const MAX_ATTEMPTS = 30;
  const RETRY_DELAY_MS = 3000;

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const isCountryDataValid = (countryData) => {
    if (!countryData || !countryData.prices) return false;
    if (countryData.fiat === "BRL") {
      return (
        countryData.prices.sell !== null &&
        countryData.prices.sell !== undefined
      );
    }
    return (
      countryData.prices.buy !== null &&
      countryData.prices.buy !== undefined &&
      countryData.prices.sell !== null &&
      countryData.prices.sell !== undefined
    );
  };

  const mergeWithCache = (newData) => {
    if (!Array.isArray(newData)) return [];

    return newData.map((countryData) => {
      const countryKey = countryData.fiat;
      const isValid = isCountryDataValid(countryData);

      if (isValid) {
        cachedDataRef.current[countryKey] = countryData;
        return countryData;
      } else {
        return cachedDataRef.current[countryKey] || countryData;
      }
    });
  };

  const allCountriesHavePrices = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((c) => isCountryDataValid(c));
  };

  const fetchData = async () => {
    if (updating) return;

    try {
      if (isInitialLoad.current) setLoading(true);
      else setUpdating(true);

      setError(null);
      setRetryCount(0);

      let attempts = 0;
      let hasShownPartialData = false;

      while (isMountedRef.current && attempts < MAX_ATTEMPTS) {
        attempts++;
        setRetryCount(attempts);

        try {
          const response = await fetch("/api/binance");
          const result = await response.json();

          if (!result.success) {
            console.warn(
              `Intento ${attempts}: respuesta sin éxito`,
              result.error
            );
          } else if (!result.data || result.data.length === 0) {
            console.warn(`Intento ${attempts}: datos vacíos`);
          } else {
            const mergedData = mergeWithCache(result.data);

            setData(mergedData);
            setLastUpdated(new Date());
            hasShownPartialData = true;

            if (allCountriesHavePrices(mergedData)) {
              console.log(
                `✅ Datos completos obtenidos en intento ${attempts}`
              );
              setError(null);
              break;
            } else {
              console.log(
                `⏳ Intento ${attempts}: mostrando datos parciales, continuando...`
              );
            }
          }
        } catch (err) {
          console.error(`Intento ${attempts}: error fetch`, err);
        }

        if (attempts >= MAX_ATTEMPTS) {
          if (hasShownPartialData) {
            console.log(
              `ℹ️ Mostrando mejor resultado después de ${attempts} intentos`
            );
            setError(null);
          } else {
            const msg = `No se obtuvieron datos completos tras ${attempts} intentos.`;
            console.warn(msg);
            setError(msg);
          }
          break;
        }

        await sleep(RETRY_DELAY_MS);
      }
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      setUpdating(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "Nunca";
    try {
      return new Date(date).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/Caracas",
      });
    } catch {
      return new Date(date).toLocaleTimeString();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Binance P2P Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Precios en tiempo real de USDT en diferentes países
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <button
                onClick={fetchData}
                disabled={updating}
                aria-busy={updating}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                  updating
                    ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {updating ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                      fill="none"
                    />
                    <path
                      d="M22 12a10 10 0 00-10-10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
                    <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
                  </svg>
                )}
                <span>{updating ? "Actualizando..." : "Actualizar"}</span>
              </button>
              <div className="text-sm text-gray-600">
                <div>
                  Última actualización:{" "}
                  <span className="font-semibold text-gray-800">
                    {lastUpdated ? formatTime(lastUpdated) : "—"}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  (zona: America/Caracas)
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            {updating && retryCount > 0 && (
              <div className="text-sm text-black-700 px-3 py-2 rounded-md">
                Actualizando tasas...
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mt-1">
                {error}
                <button
                  onClick={() => {
                    fetchData();
                  }}
                  className="ml-3 text-xs underline"
                >
                  Reintentar ahora
                </button>
              </div>
            )}
          </div>
        </header>
        <SummaryHeader data={data} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {data?.map((countryData, idx) => (
            <CountrySection key={idx} data={countryData} />
          ))}
        </div>
      </div>
    </div>
  );
}
