'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCodeMRIStore, ScanHistoryEntry } from '@/lib/store';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, FileText, AlertTriangle, ShieldAlert, CheckCircle, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComparePage() {
  const router = useRouter();
  const { scanHistory } = useCodeMRIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [leftScanId, setLeftScanId] = useState<string>(scanHistory.length > 0 ? scanHistory[0].id : '');
  const [rightScanId, setRightScanId] = useState<string>(scanHistory.length > 1 ? scanHistory[1].id : '');

  const leftScan = useMemo(() => scanHistory.find(s => s.id === leftScanId) || null, [scanHistory, leftScanId]);
  const rightScan = useMemo(() => scanHistory.find(s => s.id === rightScanId) || null, [scanHistory, rightScanId]);

  const winnerId = useMemo(() => {
    if (!leftScan || !rightScan) return null;
    const leftScore = leftScan.scanResult?.simpleRiskScore || 0;
    const rightScore = rightScan.scanResult?.simpleRiskScore || 0;
    if (leftScore < rightScore) return leftScan.id;
    if (rightScore < leftScore) return rightScan.id;
    return null; // Tie
  }, [leftScan, rightScan]);

  if (!mounted) return null;

  if (scanHistory.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <GitCompareIcon className="w-16 h-16 text-cyan-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Not Enough Data</h2>
        <p className="text-slate-400 mb-8 max-w-md">Scan at least 2 projects to compare them side-by-side and see architectural intelligence insights.</p>
        <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-8 py-6 rounded-2xl text-lg shadow-lg">
          Go Scan a Project
        </Button>
      </div>
    );
  }

  const renderLanguageChart = (languages: Record<string, number> | undefined) => {
    if (!languages) return null;
    const total = Object.values(languages).reduce((sum, val) => sum + val, 0);
    const sortedLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3 mt-6">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h4 className="text-white font-semibold">Languages</h4>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {sortedLangs.map(([lang, count], idx) => {
            const colors = ['bg-blue-500', 'bg-cyan-400', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-400'];
            const percent = (count / total) * 100;
            return (
              <div key={lang} style={{ width: `${percent}%` }} className={`h-full ${colors[idx % colors.length]}`} title={`${lang}: ${Math.round(percent)}%`} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
          {sortedLangs.map(([lang, count], idx) => {
            const colors = ['text-blue-500', 'text-cyan-400', 'text-purple-500', 'text-pink-500', 'text-yellow-400'];
            const p = Math.round((count / total) * 100);
            return (
              <div key={lang} className="flex items-center gap-1.5 text-xs font-medium">
                <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length].replace('text-', 'bg-')}`} />
                <span className="text-slate-300">{lang} {p}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderColumn = (scan: ScanHistoryEntry | null, setScanId: (id: string) => void, competitorScan: ScanHistoryEntry | null) => {
    if (!scan) return null;
    
    const isWinner = winnerId === scan.id;
    const isFilesLower = scan.scanResult.totalFiles < (competitorScan?.scanResult.totalFiles || Infinity);
    const isScoreLower = scan.scanResult.simpleRiskScore < (competitorScan?.scanResult.simpleRiskScore || Infinity);

    return (
      <div className="flex-1 flex flex-col gap-6 w-full lg:max-w-[50%]">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative min-h-[140px] flex flex-col justify-end">
          {/* Winner Banner */}
          {isWinner && (
            <div className="absolute -top-3 inset-x-8 flex justify-center">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400/50">
                <Trophy className="w-3.5 h-3.5" />
                Healthier Codebase
              </div>
            </div>
          )}

          <select 
            className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-cyan-500 mb-4 font-semibold text-lg"
            value={scan.id}
            onChange={(e) => setScanId(e.target.value)}
          >
            {scanHistory.map(entry => (
              <option key={entry.id} value={entry.id}>
                {entry.fileName} ({new Date(entry.timestamp).toLocaleDateString()})
              </option>
            ))}
          </select>

          {/* AI Verdict Badge */}
          {scan.aiInsights?.verdict && (
             <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-slate-400" />
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  scan.aiInsights.verdict === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  scan.aiInsights.verdict === 'Needs Attention' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {scan.aiInsights.verdict}
                </span>
             </div>
          )}
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl border flex flex-col ${isFilesLower ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
             <span className={`text-xs font-semibold mb-1 ${isFilesLower ? 'text-emerald-400' : 'text-slate-400'}`}>TOTAL FILES</span>
             <span className={`text-3xl font-black ${isFilesLower ? 'text-emerald-300' : 'text-white'}`}>{scan.scanResult.totalFiles}</span>
          </div>

          <div className={`p-5 rounded-2xl border flex flex-col ${isScoreLower ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
             <span className={`text-xs font-semibold mb-1 ${isScoreLower ? 'text-emerald-400' : 'text-slate-400'}`}>RISK SCORE</span>
             <div className="flex items-end gap-2">
               <span className={`text-3xl font-black ${isScoreLower ? 'text-emerald-300' : 'text-white'}`}>{scan.scanResult.simpleRiskScore}</span>
               <span className="text-sm font-medium text-slate-500 mb-1">/ 100</span>
             </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
           {renderLanguageChart(scan.scanResult.detectedLanguages)}
        </div>

        {/* AI Insights & Risks */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex-1 flex flex-col gap-6">
           {/* Top Risks */}
           <div>
             <div className="flex items-center gap-2 mb-3">
               <AlertTriangle className="h-5 w-5 text-red-400" />
               <h4 className="text-white font-semibold">Top Architectural Risks</h4>
             </div>
             {scan.aiInsights?.topRisks && scan.aiInsights.topRisks.length > 0 ? (
               <ul className="space-y-2">
                 {scan.aiInsights.topRisks.slice(0, 3).map((risk, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                     <span className="text-red-400 font-bold shrink-0">{i+1}.</span>
                     <span className="leading-snug">{risk}</span>
                   </li>
                 ))}
               </ul>
             ) : scan.scanResult.risks && scan.scanResult.risks.length > 0 ? (
                <ul className="space-y-2">
                 {scan.scanResult.risks.slice(0, 3).map((risk, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      <span className="text-amber-400 mt-0.5"><ShieldAlert className="w-4 h-4"/></span>
                      <span className="leading-snug">{risk.description}</span>
                   </li>
                 ))}
                </ul>
             ) : (
                <div className="text-sm text-slate-500 bg-slate-800/30 p-3 rounded-lg flex items-center justify-center">No major risks detected.</div>
             )}
           </div>

           {/* Quick Wins */}
           {scan.aiInsights?.quickWins && scan.aiInsights.quickWins.length > 0 && (
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <CheckCircle className="h-5 w-5 text-emerald-400" />
                 <h4 className="text-white font-semibold">Quick Wins</h4>
               </div>
               <ul className="space-y-2">
                 {scan.aiInsights.quickWins.slice(0, 3).map((win, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                     <span className="text-emerald-400 font-bold shrink-0">{i+1}.</span>
                     <span className="leading-snug">{win}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-24 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl">
               <GitCompareIcon className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl md:text-4xl font-black text-white">Scan Comparison</h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-2">
          {renderColumn(leftScan, setLeftScanId, rightScan)}
          
          <div className="hidden lg:flex flex-col items-center justify-center -mx-4 z-20 pointer-events-none">
            <div className="bg-slate-800 py-3 px-2 rounded-full border border-slate-700 shadow-xl flex flex-col gap-2">
               <div className="w-1 h-8 bg-gradient-to-b from-transparent to-cyan-500/50 mx-auto rounded-full" />
               <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 text-xs">VS</div>
               <div className="w-1 h-8 bg-gradient-to-t from-transparent to-purple-500/50 mx-auto rounded-full" />
            </div>
          </div>
          
          {renderColumn(rightScan, setRightScanId, leftScan)}
        </div>
      </div>
    </main>
  );
}

function GitCompareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}
