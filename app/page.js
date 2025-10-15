"use client";

import { useState, useEffect, useRef } from "react";
import CountrySection from "@/components/CountrySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import SummaryHeader from "@/components/SummaryHeader";
const STORAGE_KEY = "binance_p2p_cache";
const STORAGE_TIMESTAMP_KEY = "binance_p2p_last_update";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const isInitialLoad = useRef(true);
  const isMountedRef = useRef(true);
  const cachedDataRef = useRef({});
  const MAX_ATTEMPTS = 8;
  const RETRY_DELAY_MS = 3000;
  useEffect(() => {
    isMountedRef.current = true;
    const loadFromStorage = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const savedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setData(parsedData);
          setLoadedFromCache(true);
          setLoading(false); 
          parsedData.forEach((countryData) => {
            cachedDataRef.current[countryData.fiat] = countryData;
          });

          if (savedTimestamp) {
            setLastUpdated(new Date(savedTimestamp));
          }
          console.log("✅ Datos cargados desde localStorage");
        } else {
          fetchData();
        }
      } catch (err) {
        console.error("Error cargando datos del localStorage:", err);
        fetchData();
      }
    };
    loadFromStorage();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && !loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        if (lastUpdated) {
          localStorage.setItem(
            STORAGE_TIMESTAMP_KEY,
            lastUpdated.toISOString()
          );
        }

        console.log("💾 Datos guardados en localStorage");
      } catch (err) {
        console.error("Error guardando en localStorage:", err);
      }
    }
  }, [data, lastUpdated, loading]);
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
      setUpdating(true); 
      setError(null);
      setRetryCount(0);
      setLoadedFromCache(false);
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
            const newTimestamp = new Date();
            setLastUpdated(newTimestamp);
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

  const clearCache = () => {
    if (window.confirm("¿Estás seguro de borrar todos los datos guardados?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      cachedDataRef.current = {};
      setData(null);
      setLastUpdated(null);
      console.log("🗑️ Caché limpiado");
      fetchData();
    }
  };

  if (loading && !data) return <LoadingSpinner />;

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

              <button
                onClick={clearCache}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Limpiar caché
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
            {loadedFromCache && !updating && (
              <div className="flex items-start gap-3 text-sm bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 rounded-lg mb-2 shadow-sm">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-amber-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-amber-900 font-medium mb-1">
                    Datos almacenados en caché
                  </p>
                  <p className="text-amber-700 text-xs">
                    Estás viendo información guardada localmente. Para obtener
                    las tasas más recientes de Binance P2P, presiona el botón
                    "Actualizar".
                  </p>
                </div>
              </div>
            )}
            {updating && retryCount > 0 && (
              <div className="flex items-start gap-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-blue-900 font-medium mb-1">
                    Sincronizando con Binance P2P
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(retryCount / MAX_ATTEMPTS) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-blue-700 text-xs font-medium min-w-fit">
                      {retryCount}/{MAX_ATTEMPTS}
                    </span>
                  </div>
                  <p className="text-blue-600 text-xs mt-1.5">
                    Recopilando precios de {data?.length || 9} países • Esto
                    puede tardar unos segundos
                  </p>
                </div>
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
