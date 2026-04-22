'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCodeMRIStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { History, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const router = useRouter();
  const { scanHistory, removeFromHistory, setScanResult, setAiInsights, clearHistory } = useCodeMRIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-24 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                <History className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Scan History</h1>
            </div>
          </div>
          {scanHistory.length > 0 && (
             <Button
               variant="outline"
               onClick={() => {
                 if (confirm('Are you sure you want to clear your entire history?')) {
                   clearHistory();
                 }
               }}
               className="border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 shadow-none transition-colors"
             >
               Clear All
             </Button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl text-center">
            <History className="w-16 h-16 text-slate-500 mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">No History Found</h2>
            <p className="text-slate-400 mb-6 max-w-md">You haven't scanned any projects yet. Go back to the home page to start your first codebase analysis.</p>
            <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-8 py-3 rounded-xl shadow-lg">
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scanHistory.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-xl hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <h4 className="text-white font-semibold truncate text-lg" title={entry.fileName}>
                      {entry.fileName.length > 30 ? entry.fileName.substring(0, 30) + '...' : entry.fileName}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.timestamp))}
                    </p>
                  </div>
                  
                  {entry.scanResult && (
                    <div className={`flex items-center justify-center w-12 h-12 shrink-0 rounded-full border ${
                      entry.scanResult.simpleRiskScore >= 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      entry.scanResult.simpleRiskScore >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <span className="text-base font-bold">{entry.scanResult.simpleRiskScore}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  {entry.aiInsights && entry.aiInsights.verdict ? (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.aiInsights.verdict === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300' :
                      entry.aiInsights.verdict === 'Needs Attention' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {entry.aiInsights.verdict}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                      No AI data
                    </span>
                  )}
                </div>
                
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setScanResult(entry.scanResult);
                      setAiInsights(entry.aiInsights);
                      router.push('/');
                    }}
                    className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors py-2 h-auto"
                  >
                    View Report
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Delete this scan from history?')) {
                        removeFromHistory(entry.id);
                      }
                    }}
                    className="px-4 py-2 h-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
