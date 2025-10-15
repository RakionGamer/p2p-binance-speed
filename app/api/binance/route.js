import { NextResponse } from "next/server";

const API_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

const COUNTRIES = [
  { name: "Chile", fiat: "CLP", amount: null, payType: null },
  { name: "Brasil", fiat: "BRL", amount: null, payType: null },
  { name: "Venezuela", fiat: "VES", amount: 50000, payType: "SpecificBank" },
  { name: "Perú", fiat: "PEN", amount: 450, payType: "CreditBankofPeru" },
  { name: "México", fiat: "MXN", amount: 2500, payType: "OXXO" },
  { name: "Argentina", fiat: "ARS", amount: 200000, payType: "MercadoPagoNew" },
  { name: "Colombia", fiat: "COP", amount: 450000, payType: "BancolombiaSA" },
  { name: "Ecuador", fiat: "USD", amount: 200, payType: "BancoGuayaquil" },
  { name: "Rep. Dominicana", fiat: "DOP", amount: null, payType: null },
];


async function getBinanceP2PAds(
  fiat,
  payType,
  tradeType = "BUY",
  targetAmount = 1000
) {
  const rows = 20;
  let page = 1;
  let allAds = [];

  while (true) {
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
        console.error(
          `HTTP Error ${response.status} para ${fiat} en página ${page}`
        );
        break;
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        console.error(`Respuesta vacía para ${fiat} en página ${page}`);
        break;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(
          `Error parseando JSON para ${fiat} en página ${page}:`,
          parseError.message
        );
        console.error("Respuesta recibida:", text.substring(0, 200));
        break;
      }

      if (!data.success || !data.data || data.data.length === 0) break;

      const filtered = data.data.filter((ad) => {
        if (fiat === "BRL") return true;
        return (
          ad.advertiser.userType === "merchant" ||
          ad.advertiser.userIdentity === "verified"
        );
      });

      allAds = allAds.concat(filtered);

      page++;
      if (page > 100) break;

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error en página ${page} para ${fiat}:`, error.message);
      break;
    }
  }

  return { success: true, data: allAds };
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
    const buyResponse = await getBinanceP2PAds(
      country.fiat,
      country.payType,
      "BUY",
      country.amount
    );

    if (buyResponse.success && buyResponse.data) {
      result.ads.buy = formatAdsData(buyResponse.data, country);
      result.summary.totalBuyAds = result.ads.buy.length;
      if (result.ads.buy.length > 0) {
        result.prices.buy = result.ads.buy[0].ad.price;
      }
    }

    const sellResponse = await getBinanceP2PAds(
      country.fiat,
      country.payType,
      "SELL",
      country.amount
    );

    if (sellResponse.success && sellResponse.data) {
      result.ads.sell = formatAdsData(sellResponse.data, country);
      result.summary.totalSellAds = result.ads.sell.length;
      if (result.ads.sell.length > 0) {
        result.prices.sell = result.ads.sell[0].ad.price;
      }
    }

    if (country.fiat === "BRL" && !result.prices.buy) {
      result.prices.buy = "N/A";
    }

    if (
      typeof result.prices.buy === "number" &&
      typeof result.prices.sell === "number"
    ) {
      result.prices.spread = result.prices.sell - result.prices.buy;
      result.prices.spreadPercentage = (
        (result.prices.spread / result.prices.buy) *
        100
      ).toFixed(2);
    }

    result.success = true;
  } catch (error) {
    result.success = false;
    result.error = error.message;
  }

  return result;
}


export async function GET() {
  try {
    const promises = COUNTRIES.map((country) => processCountry(country));
    const data = await Promise.all(promises);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
