"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, FileDown, Loader2, AlertCircle, Clock } from "lucide-react";

interface AnalysisResult {
  ticker: string;
  analysis?: string;
  pdf_url: string;
  report: string;
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // 从环境变量读取 API 地址
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://liquid-malvina-ouyadi-2b87178a.koyeb.app/analyze";

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) {
        throw new Error("分析失败。请检查股票代码或稍后重试。");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "出错了，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12 pt-10">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
          DeepSeek <span className="text-blue-600">股票分析器</span>
        </h1>
        <p className="text-lg text-gray-600">
          AI驱动的机构级投资研究
        </p>
      </div>

      {/* Search Box */}
      <div className="max-w-xl mx-auto mb-12">
        <form onSubmit={handleAnalyze} className="relative flex items-center">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="输入股票代码 (例如: TSLA, 600519)"
            className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none shadow-sm transition-all pl-14"
            disabled={loading}
          />
          <Search className="absolute left-5 text-gray-400 w-6 h-6" />
          <button
            type="submit"
            disabled={loading || !ticker}
            className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 分析中
              </>
            ) : (
              "分析"
            )}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-3">
          支持美股和A股 (例如: 600519)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-8 animate-pulse">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">正在分析 {ticker}...</h3>
                <p className="text-gray-600 mb-3">AI正在生成深度投资研究报告</p>
                <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>已耗时: {elapsed}秒 (预计30-60秒)</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>处理进度</span>
                  <span>{Math.min(Math.round((elapsed / 60) * 100), 90)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((elapsed / 60) * 100, 90)}%` }}
                  ></div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-lg p-4 w-full border border-blue-100">
                <p className="text-sm text-gray-700">
                  💡 <span className="font-semibold">提示:</span> AI正在进行深度财务分析、市场趋势评估和风险评价，请耐心等待...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{result.ticker}</h2>
              <p className="text-green-600 font-medium">分析完成</p>
            </div>
            <a
              href={result.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <FileDown className="w-5 h-5" />
              下载PDF报告
            </a>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.report}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </main>
  );
}
