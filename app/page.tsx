"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Clock, Trash2, GitCompare, History, BarChart3, AlertTriangle, Zap, Shield, Globe, Search, GitBranch, Activity, Network, Lightbulb, Code, Database, Cpu, FileJson, Palette, Terminal, Coffee, Wind, Package, Github, Gitlab, Server, Cloud, Smartphone, Monitor, Keyboard, Mouse, Wifi, HardDrive, MemoryStick, Usb, Bluetooth, Settings, Wrench, Hammer, Layers, FolderOpen, Folder, File, FilePlus, FileMinus, FileX, FileCheck, FileSearch, FileImage, FileVideo, FileAudio, Archive, ArchiveRestore, Send, SendHorizontal, Share, Share2, Download, UploadCloud, DownloadCloud, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, CloudMoon, CloudSun, CloudFog, CloudHail, CloudOff, CloudCog, CloudAlert, CloudCheck, ServerCog, ServerCrash, ServerOff, DatabaseBackup, DatabaseZap, HardDriveDownload, HardDriveUpload, WifiOff, BluetoothOff, MonitorX, MonitorOff, MonitorSpeaker, MonitorCog, MonitorUp, MonitorDown, KeyboardOff, MouseOff, MousePointer, MousePointer2, MousePointerClick, MousePointerBan, X, Brain, CheckCircle } from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useCodeMRIStore } from '@/lib/store';
import 'reactflow/dist/style.css';

export default function Home() {
  // Use global store instead of local state
  const {
    scanResult,
    uploadedFile,
    uploadedFileName,
    githubUrl,
    isScanning,
    error,
    aiInsights,
    isLoadingInsights,
    setScanResult,
    setUploadedFile,
    setUploadedFileName,
    setGithubUrl,
    setIsScanning,
    setError,
    setAiInsights,
    setIsLoadingInsights,
    scanHistory,
    addToHistory,
    removeFromHistory
  } = useCodeMRIStore();
  const [scanDuration, setScanDuration] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [errorVisible, setErrorVisible] = useState(true);

  // Auto-dismiss error after 5 seconds and reset visibility when new error occurs
  useEffect(() => {
    if (error) {
      setErrorVisible(true);
      const timer = setTimeout(() => {
        setErrorVisible(false);
        setTimeout(() => setError(null), 300); // Clear error after fade out
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleCloseError = useCallback(() => {
    setErrorVisible(false);
    setTimeout(() => setError(null), 300); // Clear error after fade out animation
  }, [setError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
      setUploadedFile(files[0]);
      setError(null);
      setGithubUrl(''); // Clear GitHub URL when file is selected
    }
  }, [setUploadedFile, setError, setGithubUrl]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].name.endsWith('.zip')) {
      setUploadedFile(files[0]);
      setError(null);
      setGithubUrl(''); // Clear GitHub URL when file is selected
    } else if (files && files.length > 0) {
      setError('Please upload a valid ZIP file');
    }
  }, [setUploadedFile, setError, setGithubUrl]);

  const handleGithubUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
    setUploadedFile(null); // Clear file when GitHub URL is entered
    setUploadedFileName(''); // Clear file name when GitHub URL is entered
    setError(null);
  }, [setGithubUrl, setUploadedFile, setUploadedFileName, setError]);

  const handleOpenAnalysis = useCallback(() => {
    if (scanResult) {
      // Use Next.js router for SPA navigation
      window.location.href = '/analysis';
    }
  }, [scanResult]);

  const graphData = useMemo(() => {
    if (!scanResult?.dependencyGraph) return { nodes: [], edges: [] };
    
    return {
      nodes: scanResult.dependencyGraph.nodes.map(node => ({
        id: node.id,
        type: node.type
      })),
      edges: scanResult.dependencyGraph.edges.map(edge => ({
        source: edge.source,
        target: edge.target
      }))
    };
  }, [scanResult?.dependencyGraph]);

  const handleScan = useCallback(async () => {
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
  }, [uploadedFile, githubUrl, setIsScanning, setError, setScanResult, setAiInsights, setIsLoadingInsights, addToHistory]);

  // Animated scanning states
  const scanningMessages = [
    "Initializing CodeMRI scanner...",
    "Analyzing file structure...",
    "Detecting programming languages...",
    "Building dependency graph...",
    "Calculating risk metrics...",
    "Finalizing analysis..."
  ];

  const [scanningMessageIndex, setScanningMessageIndex] = useState(0);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanningMessageIndex((prev) => (prev + 1) % scanningMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setScanningMessageIndex(0);
    }
  }, [isScanning, scanningMessages.length]);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden pt-16">
      {/* Premium layered background */}
      <div className="absolute inset-0">
        {/* Radial glow behind hero section */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[900px] bg-gradient-radial from-cyan-500/8 via-blue-500/4 to-transparent blur-[250px]" />
        
        {/* Floating gradient orbs */}
        <div className="absolute w-[1000px] h-[1000px] bg-cyan-500/6 blur-[200px] rounded-full top-[-500px] left-[-400px] animate-pulse" />
        <div className="absolute w-[800px] h-[800px] bg-purple-500/6 blur-[150px] rounded-full bottom-[-200px] right-[-200px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        

        {/* Hero Section */}
        <div className="text-center px-6 py-20 relative">
          {/* Top 20 Programming Languages Floating */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* JavaScript */}
            <motion.div
              className="absolute top-10 left-10 text-yellow-300/20"
              animate={{
                y: [0, -30, 0],
                x: [0, 20, 0],
                rotate: [0, 180, -180, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Code className="h-10 w-10" />
            </motion.div>

            {/* Python */}
            <motion.div
              className="absolute top-20 right-20 text-blue-400/20"
              animate={{
                y: [0, 25, 0],
                x: [0, -15, 0],
                rotate: [0, -120, 120, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              <FileJson className="h-9 w-9" />
            </motion.div>

            {/* Java */}
            <motion.div
              className="absolute top-40 left-1/4 text-red-400/20"
              animate={{
                y: [0, -20, 0],
                x: [0, 30, 0],
                rotate: [0, 90, -90, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            >
              <Coffee className="h-11 w-11" />
            </motion.div>

            {/* TypeScript */}
            <motion.div
              className="absolute top-60 right-1/4 text-blue-500/20"
              animate={{
                y: [0, 35, 0],
                x: [0, -25, 0],
                rotate: [0, -180, 180, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
            >
              <FileText className="h-10 w-10" />
            </motion.div>

            {/* C# */}
            <motion.div
              className="absolute top-80 left-1/5 text-purple-400/20"
              animate={{
                y: [0, -25, 0],
                x: [0, 18, 0],
                rotate: [0, 150, -150, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
            >
              <Terminal className="h-9 w-9" />
            </motion.div>

            {/* C++ */}
            <motion.div
              className="absolute top-32 right-1/5 text-blue-400/20"
              animate={{
                y: [0, 20, 0],
                x: [0, -20, 0],
                rotate: [0, -90, 90, 0],
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5
              }}
            >
              <Terminal className="h-10 w-10" />
            </motion.div>

            {/* PHP */}
            <motion.div
              className="absolute top-52 left-1/3 text-purple-400/20"
              animate={{
                y: [0, -15, 0],
                x: [0, 25, 0],
                rotate: [0, 120, -120, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 6
              }}
            >
              <FileText className="h-8 w-8" />
            </motion.div>

            {/* Ruby */}
            <motion.div
              className="absolute top-72 right-1/3 text-red-400/20"
              animate={{
                y: [0, 30, 0],
                x: [0, -18, 0],
                rotate: [0, -150, 150, 0],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 7
              }}
            >
              <FileText className="h-9 w-9" />
            </motion.div>

            {/* Go */}
            <motion.div
              className="absolute top-16 left-1/6 text-cyan-400/20"
              animate={{
                y: [0, -22, 0],
                x: [0, 22, 0],
                rotate: [0, 100, -100, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 8
              }}
            >
              <Terminal className="h-10 w-10" />
            </motion.div>

            {/* Swift */}
            <motion.div
              className="absolute top-36 right-1/6 text-orange-400/20"
              animate={{
                y: [0, 28, 0],
                x: [0, -22, 0],
                rotate: [0, -110, 110, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 9
              }}
            >
              <FileText className="h-9 w-9" />
            </motion.div>

            {/* Kotlin */}
            <motion.div
              className="absolute top-56 left-1/4 text-purple-400/20"
              animate={{
                y: [0, -18, 0],
                x: [0, 20, 0],
                rotate: [0, 130, -130, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 10
              }}
            >
              <FileText className="h-8 w-8" />
            </motion.div>

            {/* Rust */}
            <motion.div
              className="absolute top-76 right-1/4 text-orange-400/20"
              animate={{
                y: [0, 25, 0],
                x: [0, -15, 0],
                rotate: [0, -140, 140, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 11
              }}
            >
              <Terminal className="h-10 w-10" />
            </motion.div>

            {/* HTML */}
            <motion.div
              className="absolute top-64 left-1/3 text-orange-400/20"
              animate={{
                y: [0, -28, 0],
                x: [0, 18, 0],
                rotate: [0, 70, -70, 0],
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 14
              }}
            >
              <FileText className="h-10 w-10" />
            </motion.div>

            {/* CSS */}
            <motion.div
              className="absolute top-84 right-1/3 text-blue-400/20"
              animate={{
                y: [0, 32, 0],
                x: [0, -25, 0],
                rotate: [0, -170, 170, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 15
              }}
            >
              <Palette className="h-9 w-9" />
            </motion.div>

            {/* SQL */}
            <motion.div
              className="absolute top-12 left-1/6 text-green-400/20"
              animate={{
                y: [0, -25, 0],
                x: [0, 30, 0],
                rotate: [0, 140, -140, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 16
              }}
            >
              <Database className="h-11 w-11" />
            </motion.div>

            {/* Shell */}
            <motion.div
              className="absolute top-48 right-1/6 text-gray-400/20"
              animate={{
                y: [0, 20, 0],
                x: [0, -18, 0],
                rotate: [0, -100, 100, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 17
              }}
            >
              <Terminal className="h-9 w-9" />
            </motion.div>

            {/* R */}
            <motion.div
              className="absolute top-68 left-1/4 text-blue-400/20"
              animate={{
                y: [0, -30, 0],
                x: [0, 22, 0],
                rotate: [0, 110, -110, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 18
              }}
            >
              <BarChart3 className="h-10 w-10" />
            </motion.div>

            {/* React */}
            <motion.div
              className="absolute top-28 left-1/8 text-cyan-400/20"
              animate={{
                y: [0, -18, 0],
                x: [0, 25, 0],
                rotate: [0, 145, -145, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 20
              }}
            >
              <Code className="h-9 w-9" />
            </motion.div>

            {/* Node.js */}
            <motion.div
              className="absolute top-48 right-1/8 text-green-400/20"
              animate={{
                y: [0, 24, 0],
                x: [0, -22, 0],
                rotate: [0, -125, 125, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 21
              }}
            >
              <Database className="h-9 w-9" />
            </motion.div>

            {/* Vue */}
            <motion.div
              className="absolute top-68 left-1/7 text-green-400/20"
              animate={{
                y: [0, -22, 0],
                x: [0, 20, 0],
                rotate: [0, 115, -115, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 22
              }}
            >
              <FileText className="h-10 w-10" />
            </motion.div>

            {/* Angular */}
            <motion.div
              className="absolute top-88 right-1/7 text-red-400/20"
              animate={{
                y: [0, 28, 0],
                x: [0, -18, 0],
                rotate: [0, -135, 135, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 23
              }}
            >
              <FileText className="h-8 w-8" />
            </motion.div>

            {/* Django */}
            <motion.div
              className="absolute top-18 left-1/9 text-green-400/20"
              animate={{
                y: [0, -20, 0],
                x: [0, 24, 0],
                rotate: [0, 155, -155, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 24
              }}
            >
              <FileText className="h-9 w-9" />
            </motion.div>

            {/* Laravel */}
            <motion.div
              className="absolute top-38 right-1/9 text-red-400/20"
              animate={{
                y: [0, 26, 0],
                x: [0, -20, 0],
                rotate: [0, -105, 105, 0],
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 25
              }}
            >
              <FileText className="h-10 w-10" />
            </motion.div>

            {/* Spring */}
            <motion.div
              className="absolute top-58 left-1/10 text-green-400/20"
              animate={{
                y: [0, -24, 0],
                x: [0, 22, 0],
                rotate: [0, 165, -165, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 26
              }}
            >
              <FileText className="h-8 w-8" />
            </motion.div>

            {/* .NET */}
            <motion.div
              className="absolute top-78 right-1/10 text-purple-400/20"
              animate={{
                y: [0, 30, 0],
                x: [0, -24, 0],
                rotate: [0, -95, 95, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 27
              }}
            >
              <FileText className="h-9 w-9" />
            </motion.div>

            {/* Tailwind */}
            <motion.div
              className="absolute top-22 left-1/11 text-cyan-400/20"
              animate={{
                y: [0, -21, 0],
                x: [0, 26, 0],
                rotate: [0, 175, -175, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 28
              }}
            >
              <Wind className="h-10 w-10" />
            </motion.div>

            {/* Bootstrap */}
            <motion.div
              className="absolute top-42 right-1/11 text-purple-400/20"
              animate={{
                y: [0, 27, 0],
                x: [0, -21, 0],
                rotate: [0, -85, 85, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 29
              }}
            >
              <FileText className="h-8 w-8" />
            </motion.div>

            {/* Docker */}
            <motion.div
              className="absolute top-62 left-1/12 text-blue-400/20"
              animate={{
                y: [0, -23, 0],
                x: [0, 23, 0],
                rotate: [0, 185, -185, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 30
              }}
            >
              <Package className="h-10 w-10" />
            </motion.div>

            {/* Kubernetes */}
            <motion.div
              className="absolute top-82 right-1/12 text-blue-400/20"
              animate={{
                y: [0, 29, 0],
                x: [0, -19, 0],
                rotate: [0, -75, 75, 0],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 31
              }}
            >
              <Server className="h-9 w-9" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto relative z-10"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-8 leading-tight tracking-tight">
              CodeMRI
            </h1>
            <motion.p 
              className="text-lg md:text-xl text-gray-300/70 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Advanced AI-Powered Repository Analysis & Intelligence Platform that transforms complex codebases into actionable insights with cutting-edge machine learning algorithms and comprehensive security auditing capabilities.
            </motion.p>

            {/* GitHub Input Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3 justify-center">
                <span className="text-gray-400 text-sm font-medium">GitHub Repository</span>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="flex items-center flex-1 px-8 py-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 focus-within:border-cyan-400/50 transition-all duration-300">
                  <Search className="w-6 h-6 text-gray-400 mr-4" />
                  <input
                    value={githubUrl}
                    onChange={handleGithubUrlChange}
                    placeholder="Enter GitHub repository URL..."
                    className="bg-transparent outline-none w-full text-lg placeholder-gray-500 text-white"
                  />
                </div>
                
                <Button 
                  onClick={handleScan}
                  disabled={isScanning || (!uploadedFile && !githubUrl)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-10 py-5 rounded-2xl text-lg shadow-lg hover:shadow-cyan-500/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-r-2 border-t-2 border-l-2 border-white mr-3"></div>
                      <span className="text-left">
                        {scanningMessages[scanningMessageIndex]}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Scan Repository
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-gray-500 text-sm mt-3">
                Public repos only — add GITHUB_TOKEN to .env.local for higher rate limits
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-600 to-gray-600"></div>
              </div>
              <span className="text-gray-400 text-sm font-medium">OR</span>
              <div className="flex items-center">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-600 to-gray-600"></div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="max-w-3xl mx-auto">
              <div
                className={`border-2 border-dashed rounded-xl p-12 min-h-[220px] text-center transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-900/20'
                    : uploadedFile
                    ? 'border-green-400 bg-green-900/20'
                    : 'border-gray-600 bg-gray-900/10 hover:border-gray-500 hover:bg-gray-800/20'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`h-16 w-16 ${uploadedFile ? 'text-green-400' : 'text-gray-400'}`} />
                <div className="flex flex-col items-center gap-2">
                  <p className="text-gray-300 text-lg">
                    {isDragging ? 'Drop your ZIP file here' : 
                     uploadedFile || uploadedFileName ? `Selected: ${uploadedFileName || uploadedFile?.name || ''}` : 
                     'Drag and drop your repository ZIP file'}
                  </p>
                  {(uploadedFile || uploadedFileName) && (
                    <p className="text-green-400 text-sm">
                      File ready for scanning
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl cursor-pointer transition-colors duration-200 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30"
                >
                  {uploadedFile ? 'Choose Different File' : 'Choose File'}
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        
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
                           <div key={`skel-stat-${i}`} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
                         ))}
                      </div>
                      
                      <div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse mb-8" />
                    </div>
                  </div>
                )}

                 {scanResult && (
                   <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-400 mr-2" />
                    Scan Results
                  </h2>
                  {(uploadedFile || uploadedFileName) && (
                    <motion.div
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FileText className="h-6 w-6 text-blue-400" />
                      <span className="text-white text-lg font-medium">
                        {uploadedFileName}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-300 text-sm font-medium">Total Files</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{scanResult.totalFiles.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      <span className="text-green-300 text-sm font-medium">Analyzed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{scanResult.analyzedFiles.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-300 text-sm font-medium">JS/TS Files</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{scanResult.jsTsFiles.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-400/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-yellow-400" />
                      <span className="text-yellow-300 text-sm font-medium">Folders</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{scanResult.foldersCount.toLocaleString()}</p>
                  </div>

                </div>

                {/* Risk Score Panel */}
                <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Circular Gauge */}
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <motion.circle
                          cx="80" cy="80" r="68"
                          fill="none"
                          stroke={scanResult.simpleRiskScore >= 70 ? '#E24B4A' : scanResult.simpleRiskScore >= 40 ? '#BA7517' : '#1D9E75'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 68}
                          initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - scanResult.simpleRiskScore / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-4xl font-bold ${
                          scanResult.simpleRiskScore >= 70 ? 'text-red-400' :
                          scanResult.simpleRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {scanResult.simpleRiskScore}
                        </span>
                      </div>
                    </div>
                    <div className={`mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${
                      scanResult.simpleRiskScore >= 70
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : scanResult.simpleRiskScore >= 40
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {scanResult.simpleRiskScore >= 70 ? 'High Risk' : scanResult.simpleRiskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                    </div>
                  </div>

                  {/* Risk Breakdown List */}
                  <div className="lg:col-span-2 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      Risk Breakdown
                    </h3>
                    {scanResult.risks && scanResult.risks.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {scanResult.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              risk.severity === 'high'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : risk.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {risk.severity}
                            </span>
                            <div className="flex-1 min-w-0">
                              {risk.file && (
                                <p className="text-cyan-300 text-sm font-mono truncate">{risk.file}</p>
                              )}
                              <p className="text-slate-300 text-sm">{risk.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-slate-500">
                        <Shield className="h-5 w-5 mr-2" />
                        No risks detected
                      </div>
                    )}
                  </div>
                </div>

                {/* External Services */}
                {scanResult.externalServices.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Network className="h-5 w-5 text-purple-400" />
                      External Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.externalServices.map(service => (
                        <span
                          key={service}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-400/30"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Intelligence Panel */}
                {(isLoadingInsights || aiInsights) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mb-8 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">AI Intelligence</h3>
                      </div>
                      {aiInsights && (
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                          aiInsights.verdict === 'Healthy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : aiInsights.verdict === 'Needs Attention'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {aiInsights.verdict}
                        </span>
                      )}
                    </div>

                    {/* Loading State */}
                    {isLoadingInsights && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            <Brain className="h-5 w-5 text-cyan-400" />
                          </motion.div>
                          <span className="text-cyan-300 text-sm font-medium">CodeMRI is analyzing your project...</span>
                        </div>
                        {/* Skeleton loaders */}
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="relative overflow-hidden rounded-xl bg-white/5 h-24">
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Loaded Content */}
                    {aiInsights && !isLoadingInsights && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section 1 — Summary */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="h-5 w-5 text-cyan-400" />
                            <span className="text-cyan-300 text-sm font-semibold uppercase tracking-wide">Overview</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed text-sm">{aiInsights.summary}</p>
                        </motion.div>

                        {/* Section 2 — Top Risks */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            <span className="text-red-300 text-sm font-semibold uppercase tracking-wide">Top Risks</span>
                          </div>
                          <ol className="space-y-2">
                            {aiInsights.topRisks.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                <span>{idx + 1}. {risk}</span>
                              </li>
                            ))}
                          </ol>
                        </motion.div>

                        {/* Section 3 — Quick Wins */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          className="p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            <span className="text-emerald-300 text-sm font-semibold uppercase tracking-wide">Quick Wins</span>
                          </div>
                          <ol className="space-y-2">
                            {aiInsights.quickWins.map((win, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{idx + 1}. {win}</span>
                              </li>
                            ))}
                          </ol>
                        </motion.div>

                        {/* Section 4 — Architecture */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          className="p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Layers className="h-5 w-5 text-purple-400" />
                            <span className="text-purple-300 text-sm font-semibold uppercase tracking-wide">Architecture</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed text-sm">{aiInsights.architectureNote}</p>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                
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

                {/* Stats Footer */}
                {scanDuration !== null && scanResult && (
                  <div className="mt-8 pt-4 border-t border-slate-700/50 text-center text-slate-400 text-sm font-medium">
                    Scanned {scanResult.totalFiles} files across {scanResult.foldersCount} folders in {scanDuration}ms
                  </div>
                )}
                 </>
                )}

              </div>
            </motion.div>
          </div>
        )}
        </div>

        {/* Features Section */}
        <div className="px-6 py-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Advanced Code Analysis Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: GitBranch,
                title: "Structural Dependency Mapping",
                desc: "Deep dependency graph visualization of your entire repository with intelligent risk heat overlay and architectural insights.",
              },
              {
                icon: Activity,
                title: "Failure Prediction Engine",
                desc: "Advanced AI algorithms that analyze code patterns to predict which modules are most likely to break under scale.",
              },
              {
                icon: Shield,
                title: "Security Vulnerability Scanner",
                desc: "Comprehensive security audit that identifies potential vulnerabilities, hardcoded secrets, and unsafe coding practices.",
              },
              {
                icon: BarChart3,
                title: "Performance Profiler",
                desc: "Real-time performance analysis with bottleneck detection and optimization recommendations for your codebase.",
              },
              {
                icon: Network,
                title: "Code Quality Metrics",
                desc: "Detailed code quality assessment including complexity analysis, code duplication detection, and maintainability scoring.",
              },
              {
                icon: Network,
                title: "API Documentation Generator",
                desc: "Automatically generates comprehensive API documentation from your codebase with interactive examples and testing guides.",
              },
              {
                icon: Lightbulb,
                title: "Intelligent Refactor Suggestions",
                desc: "AI-powered recommendations for code improvements, performance optimizations, and architectural best practices.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/20 hover:border-cyan-400/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <img src="/icon.png" alt="CodeMRI" className="h-8 w-8 rounded" />
                <span className="text-lg font-bold text-white">CodeMRI</span>
              </div>
              
              <div className="text-center text-gray-400">
                <p>AI-Powered Repository Analysis & Intelligence</p>
                <p className="text-sm mt-2">© 2024 CodeMRI. Built with cutting-edge technology.</p>
              </div>
              
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Documentation</a>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">GitHub</a>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Dynamic Error Display */}
        {error && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: errorVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 max-w-md mx-auto shadow-2xl relative"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ 
                scale: errorVisible ? [0.8, 1.05, 1] : 0.8,
                opacity: errorVisible ? 1 : 0,
                y: errorVisible ? 0 : 20,
                borderColor: errorVisible ? ["rgb(239 68 68 / 0.5)", "rgb(239 68 68 / 0.8)", "rgb(239 68 68 / 0.5)"] : "rgb(239 68 68 / 0.5)"
              }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.5,
                scale: { duration: 0.3, times: [0, 0.5, 1] },
                borderColor: { duration: 2, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              {/* Close Button */}
              <motion.button
                onClick={handleCloseError}
                className="absolute top-3 right-3 p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-4 w-4 text-red-400" />
              </motion.button>

              {/* Error Icon with Animation */}
              <motion.div
                className="flex items-center gap-3 mb-2"
                initial={{ x: -10 }}
                animate={{ 
                  x: errorVisible ? [0, 5, -5, 0] : -10,
                  rotate: errorVisible ? [0, -5, 5, 0] : 0
                }}
                transition={{ 
                  duration: 0.5,
                  x: { repeat: Infinity, repeatDelay: 3 },
                  rotate: { repeat: Infinity, repeatDelay: 3 }
                }}
              >
                <motion.div
                  animate={{
                    scale: errorVisible ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </motion.div>
                <p className="text-red-300 font-medium">{error}</p>
              </motion.div>

              {/* Progress Bar for Auto-Dismiss */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-red-500 rounded-b-2xl origin-left"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: errorVisible ? [1, 0] : 0 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
