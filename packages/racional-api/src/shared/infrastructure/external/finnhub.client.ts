export interface IStockPriceProvider {
  getCurrentPrice(ticker: string): Promise<number>
  searchSymbols(query: string): Promise<StockSearchResult[]>
}

export interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
}

interface FinnhubQuote {
  c: number // current price
  h: number // high
  l: number // low
  o: number // open
  pc: number // previous close
}

interface FinnhubSymbolSearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

interface FinnhubSymbolLookup {
  count: number
  result: FinnhubSymbolSearchResult[]
}

export class FinnhubClient implements IStockPriceProvider {
  private readonly baseUrl = 'https://finnhub.io/api/v1'

  constructor(private readonly apiKey: string) {}

  async getCurrentPrice(ticker: string): Promise<number> {
    const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(ticker)}&token=${this.apiKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Finnhub quote error: ${res.status}`)
    const data = (await res.json()) as FinnhubQuote
    if (data.c === 0) throw new Error(`No price data for ticker: ${ticker}`)
    return data.c
  }

  async searchSymbols(query: string): Promise<StockSearchResult[]> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&token=${this.apiKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Finnhub search error: ${res.status}`)
    const data = (await res.json()) as FinnhubSymbolLookup
    return data.result.slice(0, 10).map((item) => ({
      ticker: item.symbol,
      name: item.description,
      exchange: item.type,
    }))
  }
}
