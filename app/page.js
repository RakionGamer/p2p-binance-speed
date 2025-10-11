"use client";

import { useState, useEffect, useRef } from "react";
import CountrySection from "@/components/CountrySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import SummaryHeader from "@/components/SummaryHeader";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const isInitialLoad = useRef(true); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isInitialLoad.current) setLoading(true);

        const response = await fetch("/api/binance");
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
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
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Actualización automática</span>
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
