"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, FileDown, Loader2, AlertCircle, Clock, History, Trash2, RotateCw } from "lucide-react";

interface AnalysisResult {
  ticker: string;
  analysis?: string;
  pdf_url: string;
  report: string;
  oi_chart_url?: string;
  timestamp?: number;
}

interface CachedReport {
  ticker: string;
  report: string;
  pdf_url: string;
  oi_chart_url?: string;
  timestamp: number;
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [recentReports, setRecentReports] = useState<CachedReport[]>([]);
  const [cachedReport, setCachedReport] = useState<CachedReport | null>(null);

  // 从环境变量读取 API 地址
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://liquid-malvina-ouyadi-2b87178a.koyeb.app/analyze";

  // 加载缓存的报告
  useEffect(() => {
    const loadCachedReports = () => {
      try {
        const stored = localStorage.getItem("reports");
        if (stored) {
          const reports: CachedReport[] = JSON.parse(stored);
          // 筛选24小时内的报告
          const now = Date.now();
          const recent = reports.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000);
          setRecentReports(recent.sort((a, b) => b.timestamp - a.timestamp));
          // 保存回去，删除过期的
          localStorage.setItem("reports", JSON.stringify(recent));
        }
      } catch (e) {
        console.error("Failed to load cached reports:", e);
      }
    };
    loadCachedReports();
  }, []);

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

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  // 从缓存加载报告
  const loadCachedAnalysis = (cached: CachedReport) => {
    setResult({
      ticker: cached.ticker,
      report: cached.report,
      pdf_url: cached.pdf_url,
      oi_chart_url: cached.oi_chart_url,
      timestamp: cached.timestamp,
    });
    setTicker(cached.ticker);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 删除缓存报告
  const deleteCachedReport = (tickerToDelete: string) => {
    const updated = recentReports.filter((r) => r.ticker !== tickerToDelete);
    setRecentReports(updated);
    localStorage.setItem("reports", JSON.stringify(updated));
  };

  const handleAnalyze = async (e: React.FormEvent, forceNew = false) => {
    e?.preventDefault();
    if (!ticker) return;

    // 检查缓存
    if (!forceNew) {
      const cached = recentReports.find((r) => r.ticker === ticker);
      if (cached) {
        setCachedReport(cached);
        return;
      }
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCachedReport(null);

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
      console.log("API Response:", data);
      console.log("OI Chart URL:", data.oi_chart_url);
      
      const timestamp = Date.now();
      const newReport: CachedReport = {
        ticker: data.ticker,
        report: data.report,
        pdf_url: data.pdf_url,
        oi_chart_url: data.oi_chart_url,
        timestamp,
      };

      // 保存到缓存
      const updated = [newReport, ...recentReports.filter((r) => r.ticker !== data.ticker)];
      setRecentReports(updated);
      localStorage.setItem("reports", JSON.stringify(updated));

      setResult({ ...data, timestamp });
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
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-3 md:gap-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="输入股票代码 (例如: TSLA, 600519)"
              className="w-full px-6 py-4 text-base md:text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none shadow-sm transition-all pl-14"
              disabled={loading}
            />
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
          </div>
          <button
            type="submit"
            disabled={loading || !ticker}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:rounded-l-none"
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

      {/* Cached Report Dialog */}
      {cachedReport && !result && (
        <div className="max-w-xl mx-auto mb-8">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <History className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  找到 {cachedReport.ticker} 的缓存报告
                </h3>
                <p className="text-gray-700 mb-4">
                  创建于 <span className="font-semibold">{formatTime(cachedReport.timestamp)}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => loadCachedAnalysis(cachedReport)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    使用缓存报告
                  </button>
                  <button
                    onClick={(e) => {
                      setCachedReport(null);
                      handleAnalyze(e, true);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    生成新报告
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                  <span>已耗时: {elapsed}秒 (预计60-80秒)</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>处理进度</span>
                  <span>{Math.min(Math.round((elapsed / 120) * 100), 95)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((elapsed / 120) * 100, 95)}%` }}
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

      {/* Recent Reports */}
      {!loading && !result && recentReports.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              最近24小时的报告
            </h2>
            <p className="text-gray-600">点击快速查看之前的分析结果</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <div
                key={`${report.ticker}-${report.timestamp}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div
                  onClick={() => loadCachedAnalysis(report)}
                  className="flex-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {report.ticker}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(report.timestamp)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {report.report.substring(0, 100)}...
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCachedReport(report.ticker);
                  }}
                  className="mt-3 w-full px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </div>
            ))}
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
              {result.timestamp && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                  <Clock className="w-4 h-4" />
                  生成于 {formatTime(result.timestamp)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setCachedReport(null);
                  setTicker("");
                }}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <RotateCw className="w-5 h-5" />
                新分析
              </button>
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
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800 border-b pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-gray-800" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-4 bg-blue-50 rounded-r italic text-gray-700" {...props} />,
              }}
            >
              {result.report}
            </ReactMarkdown>
          </div>

          {/* OI Chart */}
          {result.oi_chart_url && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📊</span> 持仓量(OI)分析图表
              </h3>
              <div className="flex justify-center bg-gray-50 rounded-lg p-4 min-h-96">
                <img
                  src={result.oi_chart_url}
                  alt="OI Chart - 持仓量分析"
                  className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                  onError={(e) => {
                    console.error("OI chart image failed to load. URL:", result.oi_chart_url);
                    console.error("Error details:", e);
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.parentElement!.innerHTML = `
                      <div class="text-center py-8">
                        <p class="text-red-600 font-semibold mb-2">📊 图表加载失败</p>
                        <p class="text-gray-600 text-sm mb-3">无法加载 OI Chart 图表</p>
                        <p class="text-gray-500 text-xs break-all">${result.oi_chart_url}</p>
                      </div>
                    `;
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                持仓量(OI)是衍生品市场中未平仓合约的数量，反映市场参与者的看涨或看跌态度
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
