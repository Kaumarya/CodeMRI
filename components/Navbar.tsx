"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileCode, BarChart3, Clock, GitCompare } from "lucide-react";
import { useCodeMRIStore } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const { scanHistory } = useCodeMRIStore();

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-200 shadow-lg group-hover:shadow-cyan-500/30">
              <img src="/icon.png" alt="CodeMRI" className="h-8 w-8 rounded" />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-200">
              CodeMRI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-lg"
              }`}
            >
              <FileCode className="h-4 w-4" />
              Home
            </Link>

            {scanHistory.length > 0 && (
              <>
                <Link
                  href="/history"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === "/history"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-lg"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  History
                </Link>
                
                <Link
                  href="/compare"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === "/compare"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-lg"
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                  Compare
                </Link>
              </>
            )}

            <Link
              href="/analysis"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/analysis"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-lg"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
            </Link>          </div>
        </div>
      </div>
    </nav>
  );
}
