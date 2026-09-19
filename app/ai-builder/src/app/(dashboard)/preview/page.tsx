"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import sdk from "@stackblitz/sdk";
import {
  ArrowLeft,
  Layout,
  Code as CodeIcon,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  FileText,
  Eye,
  FileCode2,
  FolderOpen,
  ChevronRight,
  Copy,
  CheckCircle2,
  Package,
  Box,
  Globe,
  X,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "desktop" | "tablet" | "mobile";

interface GeneratedFile {
  path: string;
  language: string;
  content: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "plan">("preview");
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("");
  const [websiteHtml, setWebsiteHtml] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployingCs, setDeployingCs] = useState(false);

  useEffect(() => {
    setCode(sessionStorage.getItem("lastGeneratedCode") || "");
    setPlan(sessionStorage.getItem("lastGeneratedPlan") || "");
    setWebsiteHtml(sessionStorage.getItem("lastGeneratedWebsite") || "");

    try {
      const storedFiles = sessionStorage.getItem("lastGeneratedFiles");
      if (storedFiles) {
        const parsed = JSON.parse(storedFiles) as GeneratedFile[];
        setFiles(parsed);
        if (parsed.length > 0) setSelectedFile(parsed[0]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const iframeSrc = websiteHtml || null;

  const viewModeWidths: Record<ViewMode, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const handleDownloadHtml = () => {
    if (!websiteHtml) return;
    const blob = new Blob([websiteHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-website.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    
    files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "ai-generated-project.zip");
  };

  const handleStackBlitz = () => {
    if (files.length === 0) return;
    setDeployingCs(true);
    try {
      const projectFiles = files.reduce((acc, file) => {
        acc[file.path] = file.content;
        return acc;
      }, {} as Record<string, string>);

      sdk.openProject({
        title: "AI Generated Project",
        description: "Created with Neural Build",
        template: "node",
        files: projectFiles,
      }, {
        openFile: "src/app/page.tsx",
        view: "editor"
      });
    } catch (err) {
      console.error(err);
      alert("Error deploying to StackBlitz.");
    } finally {
      setDeployingCs(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasWebsite = !!websiteHtml;
  const hasContent = hasWebsite || !!code || !!plan || files.length > 0;

  const getCodeColor = (lang: string) => {
    switch (lang) {
      case "tsx":
      case "jsx": return "text-blue-400";
      case "typescript":
      case "ts": return "text-cyan-400";
      case "css": return "text-pink-400";
      case "json": return "text-amber-400";
      case "html": return "text-orange-400";
      default: return "text-green-400";
    }
  };

  const fileTree = files.reduce(
    (acc, file) => {
      const parts = file.path.split("/");
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "/";
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    },
    {} as Record<string, GeneratedFile[]>
  );

  return (
    <div className="flex flex-col h-full bg-[#030308] animate-in fade-in duration-700 relative">
      <AnimatePresence>
        {deployModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20 relative"
            >
              <button 
                onClick={() => setDeployModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="p-8 border-b border-white/5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <Zap className="text-white w-8 h-8" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Deploy & Export</h2>
                <p className="text-muted-foreground text-sm">Choose how you want to export or deploy your generated project.</p>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {/* 1. Download ZIP */}
                <button
                  onClick={handleDownloadZip}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Package className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Download Source Code (ZIP)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Get the complete Next.js project folder to run locally.</p>
                  </div>
                </button>

                {/* 2. StackBlitz */}
                <button
                  onClick={handleStackBlitz}
                  disabled={deployingCs}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Box className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{deployingCs ? "Exporting..." : "Open in StackBlitz"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">1-click cloud IDE environment with a live URL.</p>
                  </div>
                </button>

                {/* 3. Vercel Guide */}
                <div className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-black/50 text-left">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Globe className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Deploy to Vercel</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      1. Download the ZIP file above.<br/>
                      2. Extract and push to GitHub, OR<br/>
                      3. Drag & drop the folder in Vercel.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <h1 className="font-bold tracking-tight text-white/90">
            Live Preview: <span className="text-primary">Neural Build</span>
          </h1>
          {hasWebsite && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Eye size={10} /> Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mr-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "preview"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <Layout size={14} /> Live Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "code"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <CodeIcon size={14} /> Source Code
              {files.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold">
                  {files.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "plan"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <FileText size={14} /> Plan
            </button>
          </div>

          {/* Viewport Switcher */}
          {activeTab === "preview" && hasWebsite && (
            <div className="flex bg-muted/50 p-1 rounded-xl border border-white/5 mr-2">
              {([
                { mode: "desktop" as ViewMode, icon: Monitor },
                { mode: "tablet" as ViewMode, icon: Tablet },
                { mode: "mobile" as ViewMode, icon: Smartphone },
              ]).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === mode
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          )}

          {hasWebsite && (
            <button
              onClick={() => {
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(websiteHtml);
                  newWindow.document.close();
                }
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-colors"
              title="Preview in New Tab"
            >
              <ExternalLink size={18} />
            </button>
          )}
          {hasWebsite && (
            <button
              onClick={handleDownloadHtml}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-colors"
              title="Download HTML Preview"
            >
              <Download size={18} />
            </button>
          )}
          {files.length > 0 && (
            <button 
              onClick={() => setDeployModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Zap size={16} /> Deploy & Export
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasContent ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 mx-auto">
                <Layout className="text-primary w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-3 gradient-text">
                No Build Generated Yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Head to the Command Center, select &quot;Full Build&quot; mode,
                enter your prompt, and click &quot;Engage&quot; to generate a
                complete website.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl"
              >
                Go to Command Center
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-[#0a0a0f]">
            {/* ── PREVIEW TAB ──────────────────────────── */}
            {activeTab === "preview" && (
              <div className="w-full h-full flex items-start justify-center p-4 overflow-auto custom-scrollbar">
                {hasWebsite ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="h-full border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-all duration-500 shrink-0"
                    style={{
                      width: viewModeWidths[viewMode],
                      maxWidth: "100%",
                      minHeight: "calc(100vh - 120px)"
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      srcDoc={iframeSrc || ""}
                      className="w-full h-full bg-white/0"
                      sandbox="allow-scripts allow-same-origin"
                      title="Generated Website Preview"
                    />
                  </motion.div>
                ) : (
                  <div className="glassmorphism rounded-3xl border border-white/5 p-12 text-center max-w-lg mt-20">
                    <Layout className="text-primary w-10 h-10 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2 gradient-text">
                      Preview Unavailable
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Use &quot;Full Build&quot; mode in the Command Center to
                      generate a complete website with live preview capability.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── CODE TAB: File Tree ──────────────────── */}
            {activeTab === "code" && (
              <div className="w-full h-full flex">
                {/* Sidebar: File Tree */}
                {files.length > 0 ? (
                  <>
                    <div className="w-64 shrink-0 border-r border-white/5 flex flex-col bg-[#08080d] overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                        <FolderOpen size={14} className="text-primary" />
                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                          Project Files
                        </span>
                        <span className="ml-auto text-[10px] text-white/30 font-mono">
                          {files.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                        {Object.entries(fileTree).map(([dir, dirFiles]) => (
                          <div key={dir} className="mb-1">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-white/25 font-mono uppercase tracking-wider">
                              <ChevronRight size={10} />
                              {dir}
                            </div>
                            {dirFiles.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => setSelectedFile(file)}
                                className={cn(
                                  "w-full text-left pl-7 pr-3 py-1.5 flex items-center gap-2 text-xs font-mono transition-all hover:bg-white/5",
                                  selectedFile?.path === file.path
                                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                                    : "text-white/50 border-l-2 border-transparent"
                                )}
                              >
                                <FileCode2
                                  size={12}
                                  className={cn(
                                    selectedFile?.path === file.path
                                      ? "text-primary"
                                      : "text-white/30"
                                  )}
                                />
                                <span className="truncate">
                                  {file.path.split("/").pop()}
                                </span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main: File Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {selectedFile ? (
                        <>
                          <div className="h-10 shrink-0 bg-muted/30 border-b border-white/5 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCode2 size={12} className="text-white/40" />
                              <span className="text-xs font-mono text-white/40">
                                {selectedFile.path}
                              </span>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                                getCodeColor(selectedFile.language),
                                "bg-white/5"
                              )}>
                                {selectedFile.language}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(selectedFile.content)}
                              className="flex items-center gap-1 text-[10px] text-primary hover:underline uppercase tracking-wider"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 size={10} /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={10} /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <pre
                            className={cn(
                              "flex-1 p-6 font-mono text-sm overflow-auto whitespace-pre-wrap leading-relaxed custom-scrollbar",
                              getCodeColor(selectedFile.language)
                            )}
                          >
                            {selectedFile.content}
                          </pre>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                          Select a file to view its contents
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Fallback: raw code view */
                  <div className="flex-1 flex flex-col">
                    <div className="h-10 shrink-0 bg-muted/30 border-b border-white/5 px-4 flex items-center justify-between">
                      <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                        Source Code
                      </span>
                      <button
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => handleCopy(code)}
                      >
                        Copy to clipboard
                      </button>
                    </div>
                    <pre className="flex-1 p-6 font-mono text-sm text-green-400 overflow-auto whitespace-pre-wrap">
                      {code ||
                        "// No source code generated yet. Use Developer or Full Build mode."}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ── PLAN TAB ─────────────────────────────── */}
            {activeTab === "plan" && (
              <div className="w-full h-full flex flex-col">
                <div className="h-10 shrink-0 bg-muted/30 border-b border-white/5 px-4 flex items-center">
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                    Architecture Plan
                  </span>
                </div>
                <div className="flex-1 p-6 font-mono text-sm text-white/60 overflow-auto whitespace-pre-wrap">
                  {plan ||
                    "No architecture plan generated yet. Use Planner or Full Build mode."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
