import { GoogleGenAI } from "@google/genai";
import { getAllPackages, getPackageMetadata } from "@/lib/aptos";
import { marked } from "marked";
import Redis from "ioredis";
import JSZip from "jszip";
import os from "os";
import path from "path";
import fs from "fs/promises";

export const runtime = 'nodejs';

const packageCache = new Map(); // fallback in-memory
const MAX_CACHE = 20;
let redis = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}

async function fetchPackageContext(name, version) {
  try {
    // 1. get metadata to retrieve ipfs hash
    const meta = await getPackageMetadata(name, version);
    const ipfsHash = meta?.ipfsHash || meta?.ipfs_hash;
    if (!ipfsHash) return null;
    // Try Redis first
    if (redis) {
      const cached = await redis.get("pkgsum:" + ipfsHash);
      if (cached) return cached;
    } else if (packageCache.has("sum:" + ipfsHash)) {
      return packageCache.get("sum:" + ipfsHash);
    }
    // 2. fetch zip from gateway as ArrayBuffer
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
    const url = `https://${gateway}/ipfs/${ipfsHash}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    // Extract README.md
    let readme = "";
    if (zip.file("README.md")) {
      readme = await zip.file("README.md").async("string");
    }
    // Extract Move.toml
    let moveToml = "";
    if (zip.file("Move.toml")) {
      moveToml = await zip.file("Move.toml").async("string");
    }
    // Extract all .move files in sources/
    let moveFiles = [];
    const sources = zip.folder("sources");
    if (sources) {
      for (const relPath in zip.files) {
        if (relPath.startsWith("sources/") && relPath.endsWith(".move")) {
          const code = await zip.file(relPath).async("string");
          moveFiles.push({ file: relPath, code });
        }
      }
    }
    // Optionally extract docs
    let docFiles = [];
    const docFolder = zip.folder("doc");
    if (docFolder) {
      for (const relPath in zip.files) {
        if (relPath.startsWith("doc/") && relPath.endsWith(".md")) {
          const doc = await zip.file(relPath).async("string");
          docFiles.push({ file: relPath, doc });
        }
      }
    }
    // Build summary
    let summary = `Package: ${name}@${version}\n`;
    if (readme) summary += `\nREADME.md:\n${readme}\n`;
    if (moveToml) summary += `\nMove.toml:\n${moveToml}\n`;
    if (moveFiles.length) {
      summary += `\nMove source files:\n`;
      for (const mf of moveFiles) {
        summary += `\n${mf.file}:\n${mf.code}\n`;
      }
    }
    if (docFiles.length) {
      summary += `\nDoc files:\n`;
      for (const df of docFiles) {
        summary += `\n${df.file}:\n${df.doc}\n`;
      }
    }
    // Cache summary
    if (redis) {
      await redis.set("pkgsum:" + ipfsHash, summary, "EX", 60 * 60 * 24);
    } else {
      packageCache.set("sum:" + ipfsHash, summary);
      if (packageCache.size > MAX_CACHE) {
        const firstKey = packageCache.keys().next().value;
        packageCache.delete(firstKey);
      }
    }
    return summary;
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  try {
    const { message, history, pkg } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No Gemini API key set' }), { status: 500 });
    }
    // Fetch all Move packages for context
    let packages = [];
    try {
      packages = await getAllPackages();
    } catch (e) {
      // If fetch fails, continue without package context
      packages = [];
    }
    // Summarize package list for the system prompt
    const packageSummary = packages.length
      ? `Available Move packages:\n${packages.map(pkg => `- ${pkg.name} (${pkg.version}): ${pkg.description || 'No description.'}`).join('\n')}`
      : 'No Move packages found.';
    // System instruction for Gemini
    const systemInstruction = `You are a Move package AI assistant. Use the following package list to answer user queries about Move packages, their usage, and code generation.\n${packageSummary}`;
    // Only keep last 16 turns
    const boundedHistory = (Array.isArray(history) ? history.slice(-16) : []);
    // Feed back previous assistant markdown as 'model' role
    const mappedHistory = boundedHistory
      .map(msg => {
        const text = String(msg.markdown || msg.content || '').trim();
        if (!text) return null;
        if (msg.role === 'assistant') {
          return { role: 'model', parts: [{ text }] };
        }
        return { role: 'user', parts: [{ text }] };
      })
      .filter(Boolean);

    const extraContextParts = [];
    if (pkg?.name && pkg?.version) {
      const pkgContext = await fetchPackageContext(pkg.name, pkg.version);
      if (pkgContext) {
        const contextText = `Here is the full code and docs for package ${pkg.name}@${pkg.version}:\n\n${pkgContext}`;
        if (contextText.trim()) {
          extraContextParts.push({ role: 'user', parts: [{ text: contextText }] });
        }
      }
    }

    const systemText = String(systemInstruction || '').trim();
    const messageText = String(message || '').trim();
    const contents = [
      ...(systemText ? [{ role: 'user', parts: [{ text: systemText }] }] : []),
      ...extraContextParts,
      ...mappedHistory,
      ...(messageText ? [{ role: 'user', parts: [{ text: messageText }] }] : [])
    ];
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });
    const markdown = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    // Parse markdown to HTML for frontend rendering
    const html = marked.parse(markdown);
    return new Response(JSON.stringify({ text: markdown, html }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || e.toString() }), { status: 500 });
  }
}
