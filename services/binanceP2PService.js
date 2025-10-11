const binanceP2PService = {
  API_URL: "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",

  COUNTRIES: [
    { name: "Venezuela", fiat: "VES", amount: 50000, payType: "SpecificBank" },
    { name: "Perú", fiat: "PEN", amount: 450, payType: "CreditBankofPeru" },
    { name: "México", fiat: "MXN", amount: 2500, payType: "OXXO" },
    {
      name: "Argentina",
      fiat: "ARS",
      amount: 200000,
      payType: "MercadoPagoNew",
    },
    { name: "Colombia", fiat: "COP", amount: 450000, payType: "BancolombiaSA" },
    { name: "Ecuador", fiat: "USD", amount: 200, payType: "BancoGuayaquil" },
    { name: "Chile", fiat: "CLP", amount: null, payType: null },
  ],

  async getBinanceP2PAds(
    fiat,
    payType,
    tradeType = "BUY",
    targetAmount = 1000
  ) {
    const payload = {
      asset: "USDT",
      fiat: fiat,
      merchantCheck: true,
      page: 1,
      payTypes: payType ? [payType] : [],
      publisherType: null,
      rows: 20,
      tradeType: tradeType,
      transAmount: targetAmount || "",
    };

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.data) {
        data.data = data.data.filter((ad) => {
          return (
            ad.advertiser.userType === "merchant" ||
            ad.advertiser.userIdentity === "verified"
          );
        });
      }

      return data;
    } catch (error) {
      console.error("Error al consultar la API:", error.message);
      throw error;
    }
  },

  formatAdsData(ads, country) {
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
  },

  async processCountry(country) {
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
      const buyResponse = await this.getBinanceP2PAds(
        country.fiat,
        country.payType,
        "BUY",
        country.amount
      );

      if (buyResponse.success && buyResponse.data) {
        result.ads.buy = this.formatAdsData(buyResponse.data, country);
        result.summary.totalBuyAds = result.ads.buy.length;
        if (result.ads.buy.length > 0) {
          result.prices.buy = result.ads.buy[0].ad.price;
        }
      }

      const sellResponse = await this.getBinanceP2PAds(
        country.fiat,
        country.payType,
        "SELL",
        country.amount
      );

      if (sellResponse.success && sellResponse.data) {
        result.ads.sell = this.formatAdsData(sellResponse.data, country);
        result.summary.totalSellAds = result.ads.sell.length;
        if (result.ads.sell.length > 0) {
          result.prices.sell = result.ads.sell[0].ad.price;
        }
      }

      if (result.prices.buy && result.prices.sell) {
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
  },

  async getAllCountriesData() {
    const promises = this.COUNTRIES.map((country) =>
      this.processCountry(country)
    );
    
    return await Promise.all(promises);

  },
};

export default binanceP2PService;
