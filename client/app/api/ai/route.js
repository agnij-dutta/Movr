import { GoogleGenAI } from "@google/genai";
import { getAllPackages } from "@/lib/aptos";
import { marked } from "marked";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { message, history } = await req.json();
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
    // Map roles for the SDK: 'assistant' -> 'model', 'user' -> 'user'
    const mappedHistory = (Array.isArray(history) ? history : []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: msg.parts || [{ text: msg.content }]
    }));
    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      ...mappedHistory,
      { role: 'user', parts: [{ text: message }] }
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
