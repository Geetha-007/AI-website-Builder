"use client";

import { motion } from "framer-motion";
import { CloudRain, Server, FolderGit2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeploymentPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-glow gradient-text">Deployment</h1>
        <p className="text-muted-foreground mt-1">One-click scale and launch your multi-agent applications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Providers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glassmorphism p-8 rounded-3xl border border-white/5 space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <Server className="text-primary w-8 h-8" />
            <h2 className="text-2xl font-semibold">Select Provider</h2>
          </div>
          
          <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-xl">V</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-white group-hover:text-glow">Vercel</h3>
                <p className="text-xs text-muted-foreground">Serverless Next.js edge deployment</p>
              </div>
            </div>
            <CheckCircle2 size={20} className="text-primary/0 group-hover:text-primary transition-colors" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#00C7B7]/20 border border-[#00C7B7] flex items-center justify-center shrink-0">
                <span className="text-[#00C7B7] font-bold text-lg">N</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-white group-hover:text-glow text-[#00C7B7]">Netlify</h3>
                <p className="text-xs text-muted-foreground">Global CDN & Serverless functions</p>
              </div>
            </div>
            <CheckCircle2 size={20} className="text-primary/0 group-hover:text-primary transition-colors" />
          </button>
          
          <button className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 interactive-button shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <CloudRain size={20} />
            Deploy Active Project
          </button>
        </motion.div>
        
        {/* Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Export Options */}
          <div className="glassmorphism p-6 rounded-3xl border border-white/5 h-1/2 flex flex-col justify-center gap-4">
             <h2 className="text-xl font-semibold mb-2">Export Project</h2>
             <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
               <FolderGit2 size={18} />
               Export as ZIP
             </button>
             <button className="w-full py-3 rounded-xl bg-[#1e1e2d] border border-white/10 hover:bg-[#2b2b3e] transition-colors flex items-center justify-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
               Push to GitHub Repo
             </button>
          </div>
          
          {/* Logs */}
          <div className="glassmorphism p-6 rounded-3xl border border-white/5 h-1/2 bg-[#0a0a0f] flex flex-col overflow-hidden relative">
            <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-4">Deployment Logs</h2>
            <div className="flex-1 font-mono text-xs overflow-y-auto text-muted-foreground opacity-50 flex items-center justify-center">
              No active deployments found.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
