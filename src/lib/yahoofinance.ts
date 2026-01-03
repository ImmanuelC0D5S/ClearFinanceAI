import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getYahooFinanceData(ticker: string): Promise<any> {
  try {
    let cleanTicker = ticker.trim().replace(/\s+/g, '.').toUpperCase();
    if (!cleanTicker.includes('.')) cleanTicker = `${cleanTicker}.NS`;

    const results: any = await yahooFinance.quoteSummary(cleanTicker, {
      modules: ['financialData', 'summaryDetail', 'defaultKeyStatistics']
    });

    if (!results) return null;

    return {
      currentPrice: results.financialData?.currentPrice,
      totalDebt: results.financialData?.totalDebt,
      revenueGrowth: results.financialData?.revenueGrowth,
      debtToEquity: results.financialData?.debtToEquity,
      beta: results.summaryDetail?.beta,
    };
  } catch (error) {
    console.error("Yahoo Finance Scraper Error:", error);
    return null;
  }
}