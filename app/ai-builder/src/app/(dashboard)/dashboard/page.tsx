"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Send,
  Sparkles,
  Layers,
  Code,
  Cpu,
  MonitorPlay,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileCode2,
  FolderOpen,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Brain,
  Palette,
  PenLine,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────

interface GeneratedFile {
  path: string;
  language: string;
  content: string;
}

interface ValidationResult {
  passed: boolean;
  score: number;
  issues: string[];
  summary: string;
}

interface LogEntry {
  id: number;
  agent: string;
  text: string;
  status: "pending" | "active" | "success" | "error";
}

// ── agent color map ───────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  System: "text-white/40",
  "Prompt Analyzer": "text-cyan-400",
  "Design Architect": "text-pink-400",
  "Content Writer": "text-amber-400",
  "Code Generator": "text-green-400",
  "Website Builder": "text-purple-400",
  "Code Reviewer": "text-yellow-400",
};

const AGENT_ICONS: Record<string, typeof Brain> = {
  "Prompt Analyzer": Brain,
  "Design Architect": Palette,
  "Content Writer": PenLine,
  "Code Generator": Code,
  "Website Builder": MonitorPlay,
  "Code Reviewer": Eye,
};

// ── component ─────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (
    agent: string,
    text: string,
    status: LogEntry["status"] = "active"
  ) => {
    setLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), agent, text, status },
    ]);
  };

  // ── Stream reader for the SSE pipeline ──────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setLogs([]);
    setGeneratedFiles([]);
    setSelectedFile(null);
    setValidation(null);
    setActiveAgent(null);
    sessionStorage.removeItem("lastGeneratedCode");
    sessionStorage.removeItem("lastGeneratedPlan");
    sessionStorage.removeItem("lastGeneratedWebsite");
    sessionStorage.removeItem("lastGeneratedFiles");

    const geminiKey =
      typeof window !== "undefined"
        ? sessionStorage.getItem("gemini_api_key") || ""
        : "";

    addLog("System", "Initializing multi-agent pipeline...");

    try {
      const res = await fetch("/api/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, geminiApiKey: geminiKey }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const collectedFiles: GeneratedFile[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!; // keep incomplete chunk

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(part.slice(6));

            switch (event.type) {
              case "agent_start":
                setActiveAgent(event.agent);
                addLog(event.agent, event.message, "active");
                break;

              case "agent_chat":
                addLog(event.agent, event.message, "active");
                break;

              case "agent_done":
                addLog(event.agent, event.message, "success");
                break;

              case "file": {
                const file = event.data as GeneratedFile;
                collectedFiles.push(file);
                setGeneratedFiles([...collectedFiles]);
                if (collectedFiles.length === 1) setSelectedFile(file);
                break;
              }

              case "website":
                sessionStorage.setItem(
                  "lastGeneratedWebsite",
                  event.data as string
                );
                addLog("Website Builder", "Live preview HTML ready.", "success");
                break;

              case "validation":
                setValidation(event.data as ValidationResult);
                break;

              case "error":
                addLog("System", `Error: ${event.message}`, "error");
                break;

              case "complete":
                addLog(
                  "System",
                  `Pipeline complete. ${event.fileCount || collectedFiles.length} files generated.`,
                  "success"
                );
                setActiveAgent(null);
                break;
            }
          } catch {
            /* skip unparseable */
          }
        }
      }

      // Store files in session for preview page
      if (collectedFiles.length > 0) {
        sessionStorage.setItem(
          "lastGeneratedFiles",
          JSON.stringify(collectedFiles)
        );
        const allCode = collectedFiles
          .map((f) => `// FILE: ${f.path}\n${f.content}`)
          .join(
            "\n\n// ====================================================\n\n"
          );
        sessionStorage.setItem("lastGeneratedCode", allCode);
      }

      // Save project entry
      const existing = JSON.parse(
        sessionStorage.getItem("user_projects") || "[]"
      );
      existing.unshift({
        id: Date.now().toString(),
        name:
          prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt,
        status: "Draft",
        version: "v0.1.0",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
      sessionStorage.setItem("user_projects", JSON.stringify(existing));
    } catch (err) {
      addLog(
        "System",
        `Fatal error: ${err instanceof Error ? err.message : "Pipeline crashed"}`,
        "error"
      );
    } finally {
      setIsGenerating(false);
      setActiveAgent(null);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-8 pt-12 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-glow gradient-text">
          Multi-Agent AI Builder
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          6 AI agents collaborate in real-time to understand your prompt,
          design a unique visual system, write content, and generate production
          code.
        </p>
      </div>

      {/* Prompt Input */}
      <motion.div
        layout
        className="w-full glassmorphism rounded-3xl p-2 relative shadow-[0_0_30px_rgba(139,92,246,0.1)] border-primary/20"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the website you want to build in detail... e.g. 'Build an art gallery ecommerce with dark elegant theme, artist profiles, and shopping cart'"
          className="w-full h-28 md:h-36 bg-transparent text-white placeholder:text-muted-foreground resize-none outline-none p-6 text-lg"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          {/* Agent Pipeline Indicator */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              "Prompt Analyzer",
              "Design Architect",
              "Content Writer",
              "Code Generator",
              "Website Builder",
              "Code Reviewer",
            ].map((agentName) => {
              const Icon = AGENT_ICONS[agentName] || Cpu;
              const isActive = activeAgent === agentName;
              const isDone = logs.some(
                (l) => l.agent === agentName && l.status === "success"
              );
              return (
                <div
                  key={agentName}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                    isActive &&
                      "bg-primary/20 border border-primary/40 text-primary animate-pulse",
                    isDone && "text-green-400/60",
                    !isActive && !isDone && "text-white/20"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <Icon size={10} />
                  )}
                  {agentName.split(" ")[0]}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center gap-2 interactive-button shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 shrink-0 ml-4"
          >
            {isGenerating ? (
              <>
                <Cpu size={16} className="animate-spin" /> Building...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Build
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results: Logs + File Tree */}
      {logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 flex-1 w-full flex gap-4 mb-8 min-h-[500px]"
        >
          {/* Left: Agent Conversation Logs */}
          <div className="flex-1 bg-[#0a0a0f] border border-primary/20 rounded-2xl p-5 font-mono text-sm relative overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.1)] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
              <Terminal size={16} className="text-primary" />
              <span className="text-white/80 font-semibold tracking-widest uppercase text-xs">
                Agent Conversation
              </span>
              {activeAgent && (
                <span className="ml-auto text-[10px] text-primary animate-pulse font-bold">
                  {activeAgent} working...
                </span>
              )}
              <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar pb-4">
              {logs.map((log) => (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className="flex items-start gap-3"
                >
                  <div className="w-28 shrink-0 text-right">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide",
                        AGENT_COLORS[log.agent] || "text-white/30"
                      )}
                    >
                      [{log.agent}]
                    </span>
                  </div>

                  <div className="flex-1 text-white/50 text-xs leading-relaxed">
                    <span className="text-white/30 mr-1">›</span>
                    {log.text}
                  </div>

                  <div className="shrink-0 w-5 flex justify-center mt-0.5">
                    {log.status === "active" && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Cpu size={10} className="text-primary" />
                      </motion.div>
                    )}
                    {log.status === "success" && (
                      <CheckCircle2 size={12} className="text-green-400" />
                    )}
                    {log.status === "error" && (
                      <AlertCircle size={12} className="text-red-400" />
                    )}
                  </div>
                </motion.div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-3 mt-2 pl-[124px]">
                  <div className="w-1.5 h-4 bg-primary animate-pulse rounded-sm" />
                </div>
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Validation Badge */}
            {validation && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-3 p-3 rounded-xl border flex items-start gap-3",
                  validation.passed
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                )}
              >
                {validation.passed ? (
                  <ShieldCheck size={18} className="text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        validation.passed ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {validation.passed
                        ? "Validation Passed"
                        : "Issues Detected"}
                    </span>
                    <span className="text-[10px] text-white/30">
                      Score: {validation.score}/10
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40">
                    {validation.summary}
                  </p>
                  {validation.issues.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {validation.issues.slice(0, 3).map((issue, i) => (
                        <li
                          key={i}
                          className="text-[10px] text-white/30 flex items-start gap-1"
                        >
                          <XCircle
                            size={8}
                            className="text-red-400 shrink-0 mt-0.5"
                          />{" "}
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            {!isGenerating && generatedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-white/10 flex justify-end gap-3"
              >
                <button
                  onClick={() => router.push("/preview")}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/10"
                >
                  View Source Code
                </button>
                <button
                  onClick={() => router.push("/preview")}
                  className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] text-sm"
                >
                  <MonitorPlay size={16} />
                  Live Preview
                </button>
              </motion.div>
            )}
          </div>

          {/* Right: File Tree */}
          <AnimatePresence>
            {generatedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 280 }}
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_20px_rgba(139,92,246,0.05)] shrink-0"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <FolderOpen size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Generated Files
                  </span>
                  <span className="ml-auto text-[9px] text-white/30 font-mono">
                    {generatedFiles.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                  {generatedFiles.map((file, idx) => (
                    <motion.button
                      key={file.path}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono transition-all hover:bg-white/5",
                        selectedFile?.path === file.path
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-white/40 border-l-2 border-transparent"
                      )}
                    >
                      <FileCode2
                        size={10}
                        className={cn(
                          selectedFile?.path === file.path
                            ? "text-primary"
                            : "text-white/20"
                        )}
                      />
                      <span className="truncate">{file.path}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Selected file preview */}
                {selectedFile && (
                  <div className="border-t border-white/10 flex flex-col max-h-52">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02]">
                      <span className="text-[9px] font-mono text-white/30 truncate">
                        {selectedFile.path}
                      </span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(selectedFile.content)
                        }
                        className="text-[8px] text-primary hover:underline uppercase tracking-wider shrink-0 ml-2"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-2 text-[9px] font-mono text-green-400/70 bg-black/40 leading-relaxed whitespace-pre-wrap">
                      {selectedFile.content.substring(0, 1200)}
                      {selectedFile.content.length > 1200 &&
                        "\n\n// ... (truncated)"}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
