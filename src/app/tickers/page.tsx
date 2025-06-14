'use client';

import { useState, useEffect } from 'react';

interface Ticker {
  symbol: string;
  price?: number;
  change?: number;
}

export default function TickersPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [topStocks, setTopStocks] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 티커 목록 가져오기
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch('/api/tickers');
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setTickers(data.tickers);
      } catch (err) {
        setError('Failed to fetch tickers');
      } finally {
        setLoading(false);
      }
    };

    fetchTickers();
  }, []);

  // 검색어에 따른 필터링된 티커
  const filteredTickers = tickers.filter(ticker =>
    ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 상위 10개 주식 데이터 가져오기 (예시 데이터)
  useEffect(() => {
    const mockTopStocks: Ticker[] = [
      { symbol: 'AAPL', price: 175.04, change: 0.86 },
      { symbol: 'MSFT', price: 415.32, change: 1.12 },
      { symbol: 'GOOGL', price: 142.56, change: -0.45 },
      { symbol: 'AMZN', price: 178.75, change: 0.92 },
      { symbol: 'NVDA', price: 903.56, change: 2.34 },
      { symbol: 'META', price: 485.58, change: 1.23 },
      { symbol: 'TSLA', price: 177.77, change: -1.45 },
      { symbol: 'AVGO', price: 1284.50, change: 0.78 },
      { symbol: 'COST', price: 725.56, change: 0.45 },
      { symbol: 'CSCO', price: 48.76, change: -0.23 },
    ];
    setTopStocks(mockTopStocks);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">NASDAQ Stock Explorer</h1>
        
        {/* 검색 박스 */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search tickers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 상위 10개 주식 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 10 Stocks</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topStocks.map((stock) => (
                  <tr key={stock.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${stock.price?.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${stock.change && stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change && stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 검색 결과 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
              {filteredTickers.slice(0, 100).map((ticker) => (
                <div
                  key={ticker}
                  className="p-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                >
                  {ticker}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 