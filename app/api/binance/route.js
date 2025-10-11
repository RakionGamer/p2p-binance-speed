import { NextResponse } from "next/server";

const API_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

const COUNTRIES = [
  { name: "Venezuela", fiat: "VES", amount: 50000, payType: "SpecificBank" },
  { name: "Perú", fiat: "PEN", amount: 450, payType: "CreditBankofPeru" },
  { name: "México", fiat: "MXN", amount: 2500, payType: "OXXO" },
  { name: "Argentina", fiat: "ARS", amount: 200000, payType: "MercadoPagoNew" },
  { name: "Colombia", fiat: "COP", amount: 450000, payType: "BancolombiaSA" },
  { name: "Ecuador", fiat: "USD", amount: 200, payType: "BancoGuayaquil" },
  { name: "Chile", fiat: "CLP", amount: null, payType: null },
];

const MAX_RESULTS = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo entre reintentos

// Función auxiliar para esperar
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getBinanceP2PAds(
  fiat,
  payType,
  tradeType = "BUY",
  targetAmount = 1000,
  retryCount = 0
) {
  const rows = 20;
  let page = 1;
  let allAds = [];

  while (allAds.length < MAX_RESULTS) {
    const payload = {
      asset: "USDT",
      fiat: fiat,
      merchantCheck: true,
      page: page,
      payTypes: payType ? [payType] : [],
      publisherType: null,
      rows: rows,
      tradeType: tradeType,
      transAmount: targetAmount || "",
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Si no hay éxito o datos, reintentar
      if (!data.success || !data.data || data.data.length === 0) {
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Reintentando ${fiat} ${tradeType} (intento ${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          await delay(RETRY_DELAY);
          return getBinanceP2PAds(
            fiat,
            payType,
            tradeType,
            targetAmount,
            retryCount + 1
          );
        }
        break;
      }

      const filtered = data.data.filter(
        (ad) =>
          ad.advertiser.userType === "merchant" ||
          ad.advertiser.userIdentity === "verified"
      );
      allAds = allAds.concat(filtered);

      if (allAds.length >= MAX_RESULTS) break;
      page++;
      if (page > 100) break;
    } catch (error) {
      console.error(
        `Error en página ${page} para ${fiat} ${tradeType}:`,
        error.message
      );

      // Reintentar en caso de error
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Reintentando después de error (intento ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );
        await delay(RETRY_DELAY);
        return getBinanceP2PAds(
          fiat,
          payType,
          tradeType,
          targetAmount,
          retryCount + 1
        );
      }
      break;
    }
  }

  return { success: allAds.length > 0, data: allAds.slice(0, MAX_RESULTS) };
}

function formatAdsData(ads, country) {
  if (!ads || ads.length === 0) return [];

  return ads.map((ad) => ({
    merchant: {
      nickName: ad.advertiser.nickName,
      userType: ad.advertiser.userType,
      monthFinishRate: ad.advertiser.monthFinishRate,
      monthOrderCount: ad.advertiser.monthOrderCount,
      isVerified: ad.advertiser.userType === "merchant",
    },
    ad: {
      price: parseFloat(ad.adv.price),
      minAmount: parseFloat(ad.adv.minSingleTransAmount),
      maxAmount: parseFloat(ad.adv.dynamicMaxSingleTransAmount),
      availableUSDT: parseFloat(ad.adv.surplusAmount),
      fiat: country.fiat,
    },
  }));
}

async function processCountry(country) {
  const result = {
    country: country.name,
    fiat: country.fiat,
    paymentMethod: country.payType,
    searchAmount: country.amount,
    timestamp: new Date().toISOString(),
    prices: {
      buy: null,
      sell: null,
      spread: null,
      spreadPercentage: null,
    },
    ads: {
      buy: [],
      sell: [],
    },
    summary: {
      totalBuyAds: 0,
      totalSellAds: 0,
    },
  };

  try {
    // Procesar BUY y SELL en paralelo
    const [buyResponse, sellResponse] = await Promise.all([
      getBinanceP2PAds(country.fiat, country.payType, "BUY", country.amount),
      getBinanceP2PAds(country.fiat, country.payType, "SELL", country.amount),
    ]);

    // Procesar resultados de BUY
    if (
      buyResponse.success &&
      buyResponse.data &&
      buyResponse.data.length > 0
    ) {
      result.ads.buy = formatAdsData(buyResponse.data, country);
      result.summary.totalBuyAds = result.ads.buy.length;
      if (result.ads.buy.length > 0) {
        result.prices.buy = result.ads.buy[0].ad.price;
      }
    }

    // Procesar resultados de SELL
    if (
      sellResponse.success &&
      sellResponse.data &&
      sellResponse.data.length > 0
    ) {
      result.ads.sell = formatAdsData(sellResponse.data, country);
      result.summary.totalSellAds = result.ads.sell.length;
      if (result.ads.sell.length > 0) {
        result.prices.sell = result.ads.sell[0].ad.price;
      }
    }

    // Calcular spread solo si ambos precios existen
    if (result.prices.buy && result.prices.sell) {
      result.prices.spread = result.prices.sell - result.prices.buy;
      result.prices.spreadPercentage = (
        (result.prices.spread / result.prices.buy) *
        100
      ).toFixed(2);
    }

    result.success = true;
  } catch (error) {
    console.error(`Error procesando ${country.name}:`, error);
    result.success = false;
    result.error = error.message;
  }

  return result;
}

export async function GET() {
  try {
    // Procesar todos los países en paralelo
    const promises = COUNTRIES.map((country) => processCountry(country));
    const data = await Promise.all(promises);

    // Verificar que al menos tengamos algunos datos válidos
    const validData = data.filter(
      (d) => d.success && (d.prices.buy || d.prices.sell)
    );

    if (validData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudieron obtener datos de ningún país. Intenta de nuevo.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error general en GET:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
