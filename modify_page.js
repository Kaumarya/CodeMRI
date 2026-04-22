const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add lucide icons
code = code.replace(
  'import { Upload, FileText,', 
  'import { Upload, FileText, Clock, Trash2, GitCompare, History,'
);

// 2. Add Zustand handles
code = code.replace(
  /setAiInsights,\n\s+setIsLoadingInsights\n\s+\} = useCodeMRIStore\(\);/,
  `setAiInsights,
    setIsLoadingInsights,
    scanHistory,
    addToHistory,
    removeFromHistory
  } = useCodeMRIStore();
  const [scanDuration, setScanDuration] = useState<number | null>(null);`
);

// 3. Update handleScan
const handleScanRegex = /const handleScan = useCallback\(async \(\) => \{[\s\S]*?\}, \[uploadedFile, githubUrl, setIsScanning, setError, setScanResult, setAiInsights, setIsLoadingInsights\]\);/;
code = code.replace(handleScanRegex, `const handleScan = useCallback(async () => {
    if (!uploadedFile && !githubUrl) {
      setError('Please upload a ZIP file or enter a GitHub URL to scan');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanDuration(null);
    const startTime = Date.now();

    try {
      let response;
      
      if (githubUrl) {
        response = await fetch('/api/scan-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: githubUrl })
        });
      } else {
        const formData = new FormData();
        formData.append('file', uploadedFile!);
        response = await fetch('/api/scan', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Scan failed');
      }

      const result = await response.json();
      setScanResult(result);
      setScanDuration(Date.now() - startTime);

      // Auto-fetch AI insights after successful scan
      setIsLoadingInsights(true);
      setAiInsights(null);
      let insightsData = null;
      try {
        const aiResponse = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (!aiData.error) {
            setAiInsights(aiData);
            insightsData = aiData;
          }
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingInsights(false);
        const repoName = githubUrl ? (githubUrl.split('/').pop()?.replace('.git', '') || githubUrl) : '';
        addToHistory({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          fileName: uploadedFile ? uploadedFile.name : repoName,
          scanResult: result,
          aiInsights: insightsData
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
    } finally {
      setIsScanning(false);
    }
  }, [uploadedFile, githubUrl, setIsScanning, setError, setScanResult, setAiInsights, setIsLoadingInsights, addToHistory]);`);

// 4. Add History Panel above Hero Section
const historyPanelCode = `
      {/* History Section */}
      {scanHistory.length > 0 && (
        <div id="history" className="max-w-7xl mx-auto px-6 pt-12 pb-6 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
              <History className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Recent Scans</h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {scanHistory.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="snap-center shrink-0 w-80 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4 shadow-xl hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-semibold truncate w-48 text-base" title={entry.fileName}>
                      {entry.fileName.length > 20 ? entry.fileName.substring(0, 20) + '...' : entry.fileName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.timestamp))}
                    </p>
                  </div>
                  
                  {entry.scanResult && (
                    <div className={\`flex items-center justify-center w-10 h-10 rounded-full border \${
                      entry.scanResult.simpleRiskScore >= 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      entry.scanResult.simpleRiskScore >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }\`}>
                      <span className="text-sm font-bold">{entry.scanResult.simpleRiskScore}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  {entry.aiInsights && entry.aiInsights.verdict ? (
                    <span className={\`inline-block px-3 py-1 rounded-full text-xs font-semibold \${
                      entry.aiInsights.verdict === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300' :
                      entry.aiInsights.verdict === 'Needs Attention' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }\`}>
                      {entry.aiInsights.verdict}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                      No AI data
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setScanResult(entry.scanResult);
                      setAiInsights(entry.aiInsights);
                      window.scrollTo({ top: document.getElementById('results')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors"
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Delete this scan from history?')) {
                        removeFromHistory(entry.id);
                      }
                    }}
                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(
  '{/* Hero Section */}',
  historyPanelCode + '\n        {/* Hero Section */}'
);

// 5. Add Empty state improvements & Skeleton
const resultsAreaReplacement = `
        {/* Empty State Demo Cards */}
        {!scanResult && !isScanning && scanHistory.length === 0 && (
          <div className="px-6 mt-12 max-w-5xl mx-auto relative z-10 opacity-60">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-3xl">
               <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-md">
                 <p className="text-cyan-300 font-semibold text-lg flex items-center gap-2">
                   <Zap className="w-5 h-5" /> 
                   Upload a project to see real analysis
                 </p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-none filter blur-[4px]">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800/20 border border-white/5 rounded-3xl p-6 h-64 flex flex-col gap-4">
                  <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-16 w-16 rounded-full bg-slate-700/50 mx-auto mt-4 animate-pulse" />
                  <div className="h-20 w-full bg-slate-700/50 rounded mt-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Results / Skeletons Wrapper */}
        <div id="results">
        {(scanResult || isScanning) && (
          <div className="px-6 mt-8 relative z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {isScanning && !scanResult && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-30 flex flex-col items-center justify-center">
                    <div className="w-full max-w-2xl px-8">
                      <div className="flex items-center gap-4 mb-8 justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-cyan-400" />
                        <h3 className="text-2xl text-cyan-300 font-bold">{scanningMessages[scanningMessageIndex]}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                         {[1, 2, 3, 4].map(i => (
                           <div key={\`skel-stat-\${i}\`} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
                         ))}
                      </div>
                      
                      <div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse mb-8" />
                    </div>
                  </div>
                )}
`;

code = code.replace(
  /\{\/\* Scan Results Section - MOVED HERE \*\/\}\s*\{scanResult && \(/,
  resultsAreaReplacement + '\n' + '                 {scanResult && ('
);

// 6. Action Buttons
const compareAndAnalysisButtons = `
                {/* Action Buttons */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleOpenAnalysis}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-6 py-6 rounded-2xl text-lg shadow-lg hover:shadow-cyan-500/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Network className="h-6 w-6 mr-3" />
                    View Architecture Analysis
                  </Button>
                  
                  {scanHistory.length >= 2 && (
                    <Button 
                      onClick={() => window.location.href = '/compare'}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold px-6 py-6 rounded-2xl text-lg shadow-lg hover:shadow-purple-500/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <GitCompare className="h-6 w-6 mr-3" />
                      Compare Scans
                    </Button>
                  )}
                </div>
`;

code = code.replace(
  /\{\/\* Analysis Button \*\/\}\s*<div className="mt-8">\s*<Button[\s\S]*?View Architecture Analysis\n\s*<\/Button>\s*<\/div>/,
  compareAndAnalysisButtons
);

// 7. Footer Stats
const scanFooterStr = `
                {/* Stats Footer */}
                {scanDuration !== null && scanResult && (
                  <div className="mt-8 pt-4 border-t border-slate-700/50 text-center text-slate-400 text-sm font-medium">
                    Scanned {scanResult.totalFiles} files across {scanResult.foldersCount} folders in {scanDuration}ms
                  </div>
                )}
`;

code = code.replace(
  /<\/div>\n\s*<\/motion\.div>\n\s*<\/div>\n\s*\)}/,
  scanFooterStr + '\n              </div>\n            </motion.div>\n          </div>\n        )}\n        </div>'
); // Extra `</div>` matches `<div id="results">`

fs.writeFileSync('app/page.tsx', code);
console.log('Successfully modified app/page.tsx');
