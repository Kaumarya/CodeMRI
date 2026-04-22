import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ScanResult {
  totalFiles: number;
  analyzedFiles: number;
  jsTsFiles: number;
  foldersCount: number;
  detectedLanguages: Record<string, number>;
  simpleRiskScore: number;
  dependencyGraph: {
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ source: string; target: string }>;
  };
  externalServices: string[];
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    file: string;
    line?: number;
    description: string;
  }>;
  files: Array<{
    path: string;
    name: string;
    imports?: string[];
  }>;
}

export interface AiInsights {
  verdict: string;
  summary: string;
  topRisks: string[];
  quickWins: string[];
  architectureNote: string;
}

export interface ScanHistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  scanResult: ScanResult;
  aiInsights: AiInsights | null;
}

interface CodeMRIStore {
  // Scan result state
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;
  clearScanResult: () => void;
  
  // Upload state
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  uploadedFileName: string;
  setUploadedFileName: (name: string) => void;
  
  // GitHub URL state
  githubUrl: string;
  setGithubUrl: (url: string) => void;
  
  // Loading states
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  
  // AI Insights state
  aiInsights: AiInsights | null;
  setAiInsights: (insights: AiInsights | null) => void;
  isLoadingInsights: boolean;
  setIsLoadingInsights: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // History state
  scanHistory: ScanHistoryEntry[];
  addToHistory: (entry: ScanHistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const useCodeMRIStore = create<CodeMRIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      scanResult: null,
      uploadedFile: null,
      uploadedFileName: '',
      githubUrl: '',
      isScanning: false,
      aiInsights: null,
      isLoadingInsights: false,
      error: null,
      
      // Actions
      setScanResult: (result) => set({ scanResult: result }),
      clearScanResult: () => set({ scanResult: null, aiInsights: null }),
      
      setUploadedFile: (file) => set({ 
        uploadedFile: file,
        uploadedFileName: file?.name || ''
      }),
      setUploadedFileName: (name) => set({ uploadedFileName: name }),
      setGithubUrl: (url) => set({ githubUrl: url }),
      
      setIsScanning: (scanning) => set({ isScanning: scanning }),
      setAiInsights: (insights) => set({ aiInsights: insights }),
      setIsLoadingInsights: (loading) => set({ isLoadingInsights: loading }),
      setError: (error) => set({ error }),

      // History
      scanHistory: [],
      addToHistory: (entry) => set((state) => {
        const history = [entry, ...state.scanHistory];
        if (history.length > 5) history.pop();
        return { scanHistory: history };
      }),
      removeFromHistory: (id) => set((state) => ({
        scanHistory: state.scanHistory.filter((entry) => entry.id !== id),
      })),
      clearHistory: () => set({ scanHistory: [] }),
    }),
    {
      name: 'codemri-store',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for tab persistence
      partialize: (state) => ({
        scanResult: state.scanResult,
        uploadedFile: null, // Don't persist File objects
        uploadedFileName: state.uploadedFileName, // Persist the file name
        githubUrl: state.githubUrl,
        isScanning: false, // Don't persist scanning state
        aiInsights: state.aiInsights, // We do want to persist AI insights alongside scanResult
        isLoadingInsights: false, // Don't persist loading state
        error: null, // Don't persist errors
        scanHistory: state.scanHistory, // Persist history
      }),
    }
  )
);
