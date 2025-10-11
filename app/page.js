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
  const isInitialLoad = useRef(true);

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

  const fetchData = async () => {
    try {
      if (isInitialLoad.current) setLoading(true);
      else setUpdating(true);

      const response = await fetch("/api/binance");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(result.error || "Error al obtener datos");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
