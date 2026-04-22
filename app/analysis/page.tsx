'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCodeMRIStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Search, Folder, FileText, ChevronLeft, ShieldAlert, Download } from 'lucide-react';
import GraphAnalysis from '@/components/GraphAnalysis';

export default function AnalysisPage() {
  const router = useRouter();
  const { scanResult } = useCodeMRIStore();
  const [isLoading, setIsLoading] = useState(true);

  // File Explorer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({'/': true});
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [showImportsCount, setShowImportsCount] = useState(5);

  const handleBackToReport = useCallback(() => {
    router.push('/');
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNodeSelect = useCallback((fileName: string) => {
    setSelectedFile(fileName);
    // Expand the folder containing the file
    const dir = fileName.split('/').slice(0, -1).join('/') || '/';
    setExpandedFolders(prev => ({ ...prev, [dir]: true }));
    // Scroll to file in sidebar
    setTimeout(() => {
      document.getElementById(`file-${fileName}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const toggleFolder = useCallback((dir: string) => {
    setExpandedFolders(prev => ({ ...prev, [dir]: !prev[dir] }));
  }, []);

  const getFileColor = useCallback((name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx'].includes(ext!)) return 'bg-blue-400';
    if (['js', 'jsx'].includes(ext!)) return 'bg-yellow-400';
    if (ext === 'py') return 'bg-green-400';
    if (ext === 'java') return 'bg-orange-400';
    if (['css', 'scss'].includes(ext!)) return 'bg-pink-400';
    if (ext === 'md') return 'bg-gray-400';
    return 'bg-slate-400';
  }, []);

  const getFileRisks = useCallback((path: string) => {
    if (!scanResult?.risks) return [];
    return scanResult.risks.filter(r => r.file === path || path.includes(r.file));
  }, [scanResult]);

  const getRiskDot = useCallback((path: string) => {
    const risks = getFileRisks(path);
    if (!risks || risks.length === 0) return null;
    const hasHigh = risks.some(r => r.severity === 'high');
    const hasMedium = risks.some(r => r.severity === 'medium');
    if (hasHigh) return <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex-shrink-0" />;
    if (hasMedium) return <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex-shrink-0" />;
    return <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />;
  }, [getFileRisks]);

  const groupedFiles = useMemo(() => {
    if (!scanResult?.files) return {};
    const groups: Record<string, typeof scanResult.files> = {};
    const lowerQuery = searchQuery.toLowerCase();
    
    scanResult.files.forEach(file => {
      if (searchQuery && !file.path.toLowerCase().includes(lowerQuery) && !file.name.toLowerCase().includes(lowerQuery)) return;
      
      let dir = file.path.split('/').slice(0, -1).join('/') || '/';
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(file);
    });
    return groups;
  }, [scanResult, searchQuery]);

  const selectedFileData = useMemo(() => {
    if (!selectedFile || !scanResult?.files) return null;
    return scanResult.files.find(f => f.path === selectedFile);
  }, [selectedFile, scanResult]);

  const selectedFileRisks = useMemo(() => {
    if (!selectedFile) return [];
    return getFileRisks(selectedFile);
  }, [selectedFile, getFileRisks]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-l-2 border-cyan-400"></div>
          <p className="text-cyan-300 text-xl">Initializing CodeMRI Visualization...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">No Scan Data Available</h2>
          <button 
            onClick={handleBackToReport}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer transition-colors duration-200"
          >
            ← Back to Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 h-screen overflow-hidden">
      
      {/* Header with back button */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
        <button
          onClick={handleBackToReport}
          className="text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50 transition-all duration-200 px-3 py-2 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" /> Back to Report
        </button>
        
        <motion.h1 
          className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Codebase Graph Intelligence
        </motion.h1>
        
        <div className="w-auto flex justify-end">
          <button
            onClick={() => {
              const state = useCodeMRIStore.getState();
              const report = {
                generatedAt: new Date().toISOString(),
                scanResult: state.scanResult,
                aiInsights: state.aiInsights,
                graphNodes: state.scanResult?.dependencyGraph?.nodes?.length || 0,
                graphEdges: state.scanResult?.dependencyGraph?.edges?.length || 0
              };
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `codemri-report-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 px-3 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay background */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* File Explorer Sidebar */}
        <motion.div
          initial={false}
          animate={{ 
            width: isSidebarOpen ? 'fit-content' : 0,
            opacity: isSidebarOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col z-30
            ${isSidebarOpen ? 'md:w-[280px] w-full max-w-[320px]' : 'w-0 overflow-hidden'}
            md:relative absolute inset-y-0 left-0
          `}
        >
          <div className="md:w-[280px] w-full flex flex-col h-full min-w-[280px]">
            {/* Sidebar Header */}
            <div className="p-4 flex-shrink-0 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5 text-cyan-400" />
                  File Explorer
                </h2>
                <div className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-xs font-semibold border border-cyan-500/30">
                  {scanResult.files.length} files
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            {/* File Tree List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {Object.keys(groupedFiles).length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-8">No files found.</div>
              ) : (
                Object.keys(groupedFiles).sort().map(dir => (
                  <div key={dir} className="mb-1">
                    <button 
                      onClick={() => toggleFolder(dir)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800/50 rounded-md text-left transition-colors"
                    >
                      {expandedFolders[dir] ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <Folder className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-300 text-sm truncate font-medium">{dir}</span>
                    </button>
                    
                    <AnimatePresence>
                      {expandedFolders[dir] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 overflow-hidden"
                        >
                          {groupedFiles[dir].map(file => {
                            const isSelected = selectedFile === file.path;
                            return (
                              <button
                                key={file.path}
                                id={`file-${file.path}`}
                                onClick={() => handleNodeSelect(file.path)}
                                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
                                  isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium' : 'hover:bg-slate-800/50 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${getFileColor(file.name)}`} />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                {getRiskDot(file.path)}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>

            {/* Selected File Panel */}
            <AnimatePresence>
              {selectedFileData && isSidebarOpen && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="flex-shrink-0 border-t border-slate-700 bg-slate-800/80 backdrop-blur-md p-4 flex flex-col gap-3 shadow-[0_-8px_16px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold truncate text-base">{selectedFileData.name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${getFileColor(selectedFileData.name)}`}>
                          {selectedFileData.name.split('.').pop()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate" title={selectedFileData.path}>
                        {selectedFileData.path}
                      </p>
                    </div>
                    <button onClick={() => setSelectedFile(undefined)} className="text-slate-500 hover:text-white">
                      &times;
                    </button>
                  </div>

                  {selectedFileRisks.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {selectedFileRisks.map((risk, idx) => (
                        <div key={idx} className={`text-xs px-2 py-1.5 rounded flex gap-1.5 items-start border ${
                          risk.severity === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="leading-snug">{risk.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFileData.imports && selectedFileData.imports.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1.5 font-medium flex justify-between">
                        <span>Imports ({selectedFileData.imports.length})</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {selectedFileData.imports.slice(0, showImportsCount).map((imp, idx) => (
                          <div key={idx} className="text-xs text-cyan-200 bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-500/20 truncate">
                            {imp}
                          </div>
                        ))}
                      </div>
                      {selectedFileData.imports.length > showImportsCount && (
                        <button 
                          onClick={() => setShowImportsCount(prev => prev + 5)}
                          className="text-[10px] text-cyan-400 mt-2 hover:underline w-full text-center"
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sidebar Toggle Button (floating next to sidebar) */}
        <div className="absolute top-4 left-0 z-40 transition-all duration-300" style={{ transform: `translateX(${isSidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 768 ? 280 : 0}px)` }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`bg-slate-800 border ${isSidebarOpen ? 'border-l-0 rounded-r-lg' : 'border-slate-700 rounded-r-lg'} p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 shadow-md transition-colors`}
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Main Graph Panel */}
        <div className="flex-1 h-full bg-slate-950 relative overflow-hidden">
          <GraphAnalysis 
            className="w-full h-full"
            onNodeSelect={handleNodeSelect}
            selectedNode={selectedFile}
          />
          
          {/* Graph Legend */}
          <div className="absolute bottom-4 left-4 right-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-lg z-10 text-xs pointer-events-none">
            <h4 className="text-slate-300 font-semibold mb-2 ml-1">Graph Legend</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400 shrink-0"></div><span className="text-slate-400 truncate">TS/JS</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400 shrink-0"></div><span className="text-slate-400 truncate">Python/Other</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0"></div><span className="text-slate-400 truncate">High Risk</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0"></div><span className="text-slate-400 truncate">Medium Risk</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500 shrink-0"></div><span className="text-slate-400 truncate">External</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-dashed border-red-400 bg-transparent shrink-0"></div><span className="text-slate-400 truncate">Circular Dep</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
