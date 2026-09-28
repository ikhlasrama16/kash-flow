"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safe inline parser that transforms inline markdown into React nodes.
 * Avoids any dangerous innerHTML injections and sanitizes links.
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code first to preserve code contents
  const parts: React.ReactNode[] = [];
  const codeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderFormattedText(text.slice(lastIndex, match.index), `txt-${lastIndex}`));
    }
    parts.push(
      <code
        key={`code-${match.index}`}
        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[#0066d6] dark:text-[#3894ff] font-mono text-xs font-semibold"
      >
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderFormattedText(text.slice(lastIndex), `txt-${lastIndex}`));
  }

  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Formats bold, italic, strikethrough, and sanitized links
 */
function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  // Parse links: [label](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkParts: React.ReactNode[] = [];
  let lastIndex = 0;
  let linkMatch: RegExpExecArray | null;

  while ((linkMatch = linkRegex.exec(text)) !== null) {
    if (linkMatch.index > lastIndex) {
      linkParts.push(parseStyles(text.slice(lastIndex, linkMatch.index), `${keyPrefix}-pre-${lastIndex}`));
    }
    const label = linkMatch[1];
    const rawUrl = linkMatch[2].trim();
    // Sanitize link URL (only allow http, https, mailto, or relative)
    const isSafeUrl = /^(https?:\/\/|mailto:|\/|#)/i.test(rawUrl);
    const safeUrl = isSafeUrl ? rawUrl : "#";

    linkParts.push(
      <a
        key={`${keyPrefix}-link-${linkMatch.index}`}
        href={safeUrl}
        target={safeUrl.startsWith("http") ? "_blank" : undefined}
        rel={safeUrl.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-[#0066d6] dark:text-[#3894ff] font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        {label}
      </a>
    );
    lastIndex = linkMatch.index + linkMatch[0].length;
  }

  if (lastIndex < text.length) {
    linkParts.push(parseStyles(text.slice(lastIndex), `${keyPrefix}-post-${lastIndex}`));
  }

  return <React.Fragment key={keyPrefix}>{linkParts}</React.Fragment>;
}

function parseStyles(text: string, keyPrefix: string): React.ReactNode {
  // Parse Bold-Italic (***text*** or ___text___)
  // Parse Bold (**text** or __text__)
  // Parse Italic (*text* or _text_)
  // Parse Strikethrough (~~text~~)
  const tokens = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|~~.*?~~)/g);

  return tokens.map((token, i) => {
    if (token.startsWith("***") && token.endsWith("***") && token.length >= 6) {
      return (
        <strong key={`${keyPrefix}-bi-${i}`} className="font-bold italic text-slate-900 dark:text-white">
          {token.slice(3, -3)}
        </strong>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      return (
        <em key={`${keyPrefix}-i-${i}`} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("~~") && token.endsWith("~~") && token.length >= 4) {
      return (
        <del key={`${keyPrefix}-del-${i}`} className="line-through text-slate-400 dark:text-slate-500">
          {token.slice(2, -2)}
        </del>
      );
    }
    return token;
  });
}

export function Markdown({ content, className }: MarkdownProps) {
  const blocks = useMemo(() => {
    if (!content) return [];
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const result: React.ReactNode[] = [];

    let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];

    const flushList = (key: string) => {
      if (!currentList) return;
      if (currentList.type === "ul") {
        result.push(
          <ul key={key} className="my-3 space-y-1.5 pl-5 list-disc text-slate-700 dark:text-slate-300 marker:text-[#0066d6] text-sm">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(it)}
              </li>
            ))}
          </ul>
        );
      } else {
        result.push(
          <ol key={key} className="my-3 space-y-1.5 pl-5 list-decimal text-slate-700 dark:text-slate-300 marker:font-semibold marker:text-[#0066d6] text-sm">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(it)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    };

    const flushTable = (key: string) => {
      if (!inTable || tableLines.length === 0) return;
      const rows = tableLines.map((row) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim())
      );

      if (rows.length > 0) {
        const headerRow = rows[0];
        const isDivider = (r: string[]) => r.every((c) => /^[-:\s]+$/.test(c));
        const bodyRows = rows.slice(1).filter((r) => !isDivider(r));

        result.push(
          <div key={key} className="my-4 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 font-semibold">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="py-2.5 px-3">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {bodyRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code Block Fence
      if (trimmed.startsWith("```")) {
        flushList(`flush-list-${i}`);
        flushTable(`flush-table-${i}`);

        if (inCodeBlock) {
          // Closing code block
          result.push(
            <div key={`codeblock-${i}`} className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 text-xs">
              {codeLanguage && (
                <div className="bg-slate-800/80 px-3 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-700">
                  {codeLanguage}
                </div>
              )}
              <pre className="p-3.5 overflow-x-auto text-slate-200 font-mono leading-relaxed">
                <code>{codeLines.join("\n")}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeLines = [];
          codeLanguage = "";
        } else {
          inCodeBlock = true;
          codeLanguage = trimmed.slice(3).trim();
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // 2. Table lines
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList(`flush-list-${i}`);
        inTable = true;
        tableLines.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable(`flush-table-${i}`);
      }

      // 3. Lists
      const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
      if (ulMatch) {
        if (!currentList || currentList.type !== "ul") {
          flushList(`flush-prev-${i}`);
          currentList = { type: "ul", items: [] };
        }
        currentList.items.push(ulMatch[1]);
        continue;
      }

      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (!currentList || currentList.type !== "ol") {
          flushList(`flush-prev-${i}`);
          currentList = { type: "ol", items: [] };
        }
        currentList.items.push(olMatch[2]);
        continue;
      }

      // If not in list anymore, flush
      flushList(`flush-after-${i}`);

      // 4. Empty line
      if (!trimmed) {
        continue;
      }

      // 5. Horizontal Rule
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
        result.push(<hr key={`hr-${i}`} className="my-4 border-slate-200/80 dark:border-white/10" />);
        continue;
      }

      // 6. Headers
      if (trimmed.startsWith("# ")) {
        result.push(
          <h1 key={`h1-${i}`} className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2 flex items-center gap-2">
            {renderInline(trimmed.slice(2))}
          </h1>
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        result.push(
          <h2 key={`h2-${i}`} className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-white/5">
            {renderInline(trimmed.slice(3))}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith("### ")) {
        result.push(
          <h3 key={`h3-${i}`} className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mt-3 mb-1.5">
            {renderInline(trimmed.slice(4))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith("#### ")) {
        result.push(
          <h4 key={`h4-${i}`} className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white mt-2.5 mb-1">
            {renderInline(trimmed.slice(5))}
          </h4>
        );
        continue;
      }

      // 7. Blockquote / Callout
      if (trimmed.startsWith("> ")) {
        const quoteContent = trimmed.slice(2);
        result.push(
          <div
            key={`quote-${i}`}
            className="my-3 pl-3.5 py-1.5 border-l-2 border-[#0066d6] bg-blue-500/[0.04] dark:bg-blue-500/[0.08] rounded-r-xl text-xs md:text-sm text-slate-700 dark:text-slate-300 italic"
          >
            {renderInline(quoteContent)}
          </div>
        );
        continue;
      }

      // 8. Regular Paragraph
      result.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 my-2">
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList("flush-final-list");
    flushTable("flush-final-table");

    return result;
  }, [content]);

  return <div className={cn("markdown-content space-y-1 text-sm", className)}>{blocks}</div>;
}
