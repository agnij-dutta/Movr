"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Heart, Code, Package, GitBranch, Clock, ExternalLink, Copy, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAptosEndorse } from "@/lib/hooks/useAptosEndorse";
import { useAptosTip } from "@/lib/hooks/useAptosTip";
import { downloadFile } from "@/lib/ipfs";
import { getAllPackages } from "@/lib/aptos";
import JSZip from "jszip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { getEndorserInfo, registerEndorser } from "@/lib/aptos";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Custom heading components for consistent dark/shadcn UI
const markdownComponents = {
  h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-2 text-white" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-5 mb-2 text-white" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2 text-white" {...props} />,
  h4: ({node, ...props}) => <h4 className="text-lg font-semibold mt-3 mb-1 text-white" {...props} />,
  h5: ({node, ...props}) => <h5 className="text-base font-semibold mt-2 mb-1 text-white" {...props} />,
  h6: ({node, ...props}) => <h6 className="text-sm font-semibold mt-2 mb-1 text-white" {...props} />,
};

export default function PackageDetails() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState("readme");
  const [showLogout, setShowLogout] = useState(false);
  const { account, disconnect, connected } = useWallet();
  const router = useRouter();

  // Hooks for on-chain and IPFS
  const { endorse, txHash: endorseTx, loading: endorseLoading } = useAptosEndorse();
  const { tip, txHash: tipTx, loading: tipLoading } = useAptosTip();
  const [resolvedVersion, setResolvedVersion] = useState(null);
  const [versionError, setVersionError] = useState(null);

  // IPFS content
  const [readmeContent, setReadmeContent] = useState("");
  const [codeExample, setCodeExample] = useState("");
  const [ipfsLoading, setIpfsLoading] = useState(false);
  const [ipfsError, setIpfsError] = useState(null);

  // Removed useAptosGetMetadata, using local state for metadata
  const [metadata, setMetadata] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);

  // Add state for Move source code
  const [moveSourceCode, setMoveSourceCode] = useState("");

  // Add state for endorsement
  const [endorseSuccess, setEndorseSuccess] = useState(false);
  const [endorseErrorMsg, setEndorseErrorMsg] = useState("");

  // Add state for endorser check and registration
  const [isEndorser, setIsEndorser] = useState(null); // null = unknown, true/false = checked
  const [endorserLoading, setEndorserLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Redirect to landing if not connected
  useEffect(() => {
    if (!connected) {
      router.replace("/");
    }
  }, [connected, router]);

  // Fetch package metadata and IPFS content
  useEffect(() => {
    if (!slug) return;
    setMetaLoading(true);
    (async () => {
      setVersionError(null);
      setResolvedVersion(null);
      try {
        // Fetch all packages and find the latest version for this slug
        const all = await getAllPackages();
        console.log('[slug] getAllPackages result:', all);
        const pkgs = all.filter(pkg => pkg.name === slug);
        console.log('[slug] filtered packages for', slug, pkgs);
        if (!pkgs.length) {
          setVersionError("No versions found for this package.");
          setMetaLoading(false);
          return;
        }
        // Sort by timestamp descending (latest first)
        pkgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const latest = pkgs[0];
        setResolvedVersion(latest.version);
        setMetadata(latest);
      } catch (e) {
        setVersionError("Failed to resolve latest version");
        setMetaError(e);
        console.error('[slug] Error resolving latest version:', e);
      } finally {
        setMetaLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!metadata || !metadata.ipfsHash) return;
    setIpfsLoading(true);
    setIpfsError(null);
    (async () => {
      try {
        // Download the ZIP as an ArrayBuffer from IPFS
        const res = await fetch(`https://aquamarine-defiant-woodpecker-351.mypinata.cloud/ipfs/${metadata.ipfsHash}`);
        if (!res.ok) throw new Error("Failed to fetch ZIP from IPFS");
        const arrayBuffer = await res.arrayBuffer();
        // Load the ZIP
        const zip = await JSZip.loadAsync(arrayBuffer);
        // Extract README.md
        let readmeText = "";
        try {
          readmeText = await zip.file("README.md").async("string");
        } catch { readmeText = ""; }
        setReadmeContent(readmeText);
        // Try to extract Move source file (e.g., sources/<package>.move)
        let moveText = "";
        try {
          const moveFileName = `sources/${metadata.name}.move`;
          if (zip.file(moveFileName)) {
            moveText = await zip.file(moveFileName).async("string");
          }
        } catch { moveText = ""; }
        setMoveSourceCode(moveText);
        // Extract code example (optional)
        let codeText = "";
        try {
          codeText = await zip.file("example.js").async("string");
        } catch { codeText = ""; }
        setCodeExample(codeText);
      } catch (e) {
        setIpfsError(e);
        setReadmeContent("");
        setCodeExample("");
      } finally {
        setIpfsLoading(false);
      }
    })();
  }, [metadata]);

  useEffect(() => {
    if (!account?.address) {
      setIsEndorser(null);
      return;
    }
    setEndorserLoading(true);
    getEndorserInfo(account.address)
      .then(info => setIsEndorser(!!(info && info.is_active !== false)))
      .catch(() => setIsEndorser(false))
      .finally(() => setEndorserLoading(false));
  }, [account]);

  // Fallbacks for UI
  const packageInfo = metadata || {};
  const userAddressStr = account?.address?.toString?.() || "";
  const userHasEndorsed = !!(
    userAddressStr &&
    Array.isArray(packageInfo.endorsements) &&
    packageInfo.endorsements.map(e => (e || "").toLowerCase()).includes(userAddressStr.toLowerCase())
  );

  // Endorse/tip handlers (example usage)
  const handleEndorse = async () => {
    console.log('[Endorse] Button clicked');
    setEndorseSuccess(false);
    setEndorseErrorMsg("");
    try {
      console.log('[Endorse] account:', account);
      console.log('[Endorse] packageInfo:', packageInfo);
      if (!account) {
        setEndorseErrorMsg('Wallet not connected');
        console.error('[Endorse] No account found');
        return;
      }
      const result = await endorse(account, packageInfo.name, packageInfo.version);
      console.log('[Endorse] Transaction result:', result);
      setEndorseSuccess(true);
      // Optionally, refresh metadata to update endorsement count
      setMetadata({ ...metadata, endorsements: [...(metadata.endorsements || []), account?.address] });
    } catch (e) {
      setEndorseErrorMsg(e?.message || "Failed to endorse");
      console.error('[Endorse] Error:', e);
    }
  };

  const handleRegisterEndorser = async () => {
    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess(false);
    try {
      const stakeAmount = 100000000; // You can prompt for this if needed
      await registerEndorser(account, stakeAmount);
      setRegisterSuccess(true);
      setIsEndorser(true);
    } catch (e) {
      setRegisterError(e?.message || "Failed to register as endorser");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Loading and error states
  if (metaLoading || ipfsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18181b] relative">
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none" style={{
          backgroundImage: 'url(/dash-back.jpeg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.7)',
        }} />
        <Card className="bg-[#232b3b]/80 border-none shadow-xl p-8 flex flex-col items-center gap-4 z-10">
          <Loader2 className="animate-spin text-[#d6ff4b] w-10 h-10 mb-2" />
          <span className="text-lg text-white font-semibold">Loading package...</span>
        </Card>
      </div>
    );
  }
  if (metaError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18181b] relative">
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none" style={{
          backgroundImage: 'url(/dash-back.jpeg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.7)',
        }} />
        <Card className="bg-[#232b3b]/80 border-none shadow-xl p-8 flex flex-col items-center gap-4 z-10">
          <span className="text-2xl font-bold text-red-400 mb-2">Error loading package</span>
          <span className="text-white text-base mb-4">{metaError.message}</span>
          <Link href="/dashboard">
            <Button variant="secondary" className="bg-[#d6ff4b] text-[#232b3b] font-bold">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }
  if (versionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18181b] relative">
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none" style={{
          backgroundImage: 'url(/dash-back.jpeg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.7)',
        }} />
        <Card className="bg-[#232b3b]/80 border-none shadow-xl p-8 flex flex-col items-center gap-4 z-10">
          <span className="text-2xl font-bold text-white mb-2">{versionError}</span>
          <Link href="/dashboard">
            <Button variant="secondary" className="bg-[#d6ff4b] text-[#232b3b] font-bold">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }
  if (!packageInfo.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18181b] relative">
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none" style={{
          backgroundImage: 'url(/dash-back.jpeg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.7)',
        }} />
        <Card className="bg-[#232b3b]/80 border-none shadow-xl p-8 flex flex-col items-center gap-4 z-10">
          <span className="text-2xl font-bold text-white mb-2">Package not found.</span>
          <Link href="/dashboard">
            <Button variant="secondary" className="bg-[#d6ff4b] text-[#232b3b] font-bold">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground] relative overflow-hidden" style={{ color: '#FFFFFF' }}>
      <div className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none" style={{
        backgroundImage: 'url(/dash-back.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }} />
      {/* Wallet Address Display - Top Right */}
      {connected && account?.address && (
        <div className="absolute top-6 right-8 z-30 flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white hover:text-black"
            onClick={() => setShowLogout((prev) => !prev)}
          >
            {`${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}`}
          </Button>
          {showLogout && (
            <Button onClick={disconnect} className="bg-white text-slate-900 hover:bg-white hover:text-black" size="sm">
              Logout
            </Button>
          )}
        </div>
      )}
      {/* Back Button */}
      <div className="py-6 px-6 md:px-10">
        <Link href="/dashboard">
          <Button variant="ghost" className="flex items-center gap-1 text-[#B0B0B0] hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all">
            <ArrowLeft size={16} />
            <span className="transition-colors duration-150">Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      {/* Package Header */}
      <motion.header 
        className="px-6 md:px-10 pt-8 pb-6 flex flex-col items-start gap-4 bg-transparent rounded-xl mt-4 mb-8 shadow-lg border border-[#232D2F]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Package Name */}
        <h1 className="text-4xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans tracking-tight" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          {packageInfo.name} <span className="align-super text-lg font-bold text-[#b0b0b0] ml-2">{packageInfo.version || ""}</span>
          {endorserLoading ? (
            <button className="ml-4 px-3 py-1 text-sm bg-[#b0b0b0] text-[#232b3b] rounded font-semibold" style={{ minWidth: 90 }} disabled>
              Checking...
            </button>
          ) : isEndorser ? (
            <button
              className="ml-4 px-3 py-1 text-sm bg-[#d6ff4b] text-[#232b3b] rounded font-semibold border border-[#b0b0b0]/30 shadow-sm"
              style={{ minWidth: 90 }}
              onClick={handleEndorse}
              disabled={endorseLoading || userHasEndorsed}
            >
              {userHasEndorsed ? "Already Endorsed" : (endorseLoading ? "Endorsing..." : "Endorse")}
            </button>
          ) : userHasEndorsed ? (
            <button className="ml-4 px-3 py-1 text-sm bg-[#b0b0b0] text-[#232b3b] rounded font-semibold border border-[#b0b0b0]/30 shadow-sm" style={{ minWidth: 160 }} disabled>
              Already Endorsed
            </button>
          ) : (
            <button
              className="ml-4 px-3 py-1 text-sm bg-[#3B82F6] text-white rounded font-semibold hover:bg-[#b0b0b0] transition border border-[#b0b0b0]/30 shadow-sm"
              style={{ minWidth: 160 }}
              onClick={handleRegisterEndorser}
              disabled={registerLoading}
            >
              {registerLoading ? "Registering..." : "Register as Endorser"}
            </button>
          )}
          {registerSuccess && <span className="ml-2 text-green-400">Registered!</span>}
          {registerError && <span className="ml-2 text-red-400">{registerError}</span>}
          <span className="ml-2 text-[#b0b0b0] text-base">{Array.isArray(packageInfo.endorsements) ? packageInfo.endorsements.length : 0} endorsements</span>
          {endorseSuccess && <span className="ml-2 text-green-400">Endorsed!</span>}
          {endorseErrorMsg && <span className="ml-2 text-red-400">{endorseErrorMsg}</span>}
        </h1>
        {/* Short Description */}
        <p className="text-lg md:text-2xl text-[#b0b0b0] font-normal max-w-2xl mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {packageInfo.description || "No description provided."}
        </p>
        {/* Links Row */}
        <div className="flex flex-wrap gap-4 mb-2">
          {/* Website */}
          <a href={packageInfo.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-[#b0b0b0] bg-[#232b3b] text-white font-semibold text-base rounded-[8px] shadow-lg min-w-[180px] justify-between transition-all duration-200 hover:border-[#d6ff4b] hover:text-[#d6ff4b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] focus:border-[#d6ff4b] focus:text-[#d6ff4b] focus:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)]">
            <span className="flex items-center gap-2 text-white group-hover:text-[#d6ff4b] group-focus:text-[#d6ff4b]">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M2 12h20M12 2c2.5 3.5 2.5 14.5 0 20M4.93 4.93c4.5 2.5 9.64 2.5 14.14 0M4.93 19.07c4.5-2.5 9.64-2.5 14.14 0" stroke="currentColor" strokeWidth="2"/></svg> Website
            </span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white group-hover:text-[#d6ff4b] group-focus:text-[#d6ff4b]">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          {/* Discord */}
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-white bg-transparent text-white font-semibold text-base rounded-[3px] min-w-[180px] justify-between hover:bg-white hover:text-black transition-colors duration-150">
            <span className="flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.2a.112.112 0 0 0-.119.056c-.516.909-1.095 2.096-1.504 3.037a18.524 18.524 0 0 0-5.524 0A12.76 12.76 0 0 0 8.24 3.256a.115.115 0 0 0-.12-.056A19.736 19.736 0 0 0 3.683 4.369a.104.104 0 0 0-.047.041C.533 9.09-.32 13.578.099 18.021a.117.117 0 0 0 .045.082c1.89 1.39 3.73 2.23 5.527 2.785a.112.112 0 0 0 .123-.042c.426-.586.805-1.204 1.13-1.857a.112.112 0 0 0-.062-.155c-.602-.228-1.175-.51-1.73-.832a.112.112 0 0 1-.011-.186c.116-.087.232-.176.343-.267a.112.112 0 0 1 .117-.013c3.619 1.66 7.523 1.66 11.09 0a.112.112 0 0 1 .118.012c.111.09.227.18.344.267a.112.112 0 0 1-.01.186c-.555.322-1.128.604-1.73.832a.112.112 0 0 0-.062.155c.33.653.708 1.271 1.13 1.857a.112.112 0 0 0 .123.042c1.799-.555 3.638-1.395 5.528-2.785a.115.115 0 0 0 .045-.082c.5-5.177-.838-9.637-3.27-13.611a.104.104 0 0 0-.047-.041ZM8.02 15.331c-1.085 0-1.977-.993-1.977-2.215 0-1.221.876-2.215 1.977-2.215 1.108 0 1.99.994 1.977 2.215 0 1.222-.876 2.215-1.977 2.215Zm7.96 0c-1.085 0-1.977-.993-1.977-2.215 0-1.221.876-2.215 1.977-2.215 1.108 0 1.99.994 1.977 2.215 0 1.222-.876 2.215-1.977 2.215Z" fill="#111"/></svg> Discord</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          {/* Github */}
          <a href={packageInfo.repository} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-white bg-transparent text-white font-semibold text-base rounded-[3px] min-w-[180px] justify-between hover:bg-white hover:text-black transition-colors duration-150">
            <span className="flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z" fill="#111"/></svg> Github</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          {/* Telegram */}
          <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-white bg-transparent text-white font-semibold text-base rounded-[3px] min-w-[180px] justify-between hover:bg-white hover:text-black transition-colors duration-150">
            <span className="flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M21.426 4.337c-.242-.2-.59-.23-.87-.08L3.7 13.6c-.28.15-.44.46-.39.77.05.31.29.54.6.57l4.13.37 1.6 4.04c.11.28.38.46.68.46h.02c.31-.01.58-.21.67-.51l2.01-6.36 4.13 3.62c.16.14.37.2.57.2.13 0 .26-.03.38-.09.29-.14.47-.44.44-.77l-1.01-9.13c-.03-.28-.19-.53-.44-.67ZM9.7 17.13l-1.19-3.01 2.7 2.37-1.51.64Zm2.13-1.01-2.98-2.61 7.13-6.25-4.15 8.86Zm1.13 2.7-.01-.01.01.01Zm5.13-2.13-3.47-3.04 2.47-5.28 1 8.32Z" fill="#111"/></svg> Telegram</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          {/* X (Twitter) */}
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-white bg-transparent text-white font-semibold text-base rounded-[3px] min-w-[180px] justify-between hover:bg-white hover:text-white transition-colors duration-150">
            <span className="flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M17.53 6.47a.75.75 0 0 0-1.06 0l-4.72 4.72-4.72-4.72a.75.75 0 1 0-1.06 1.06l4.72 4.72-4.72 4.72a.75.75 0 1 0 1.06 1.06l4.72-4.72 4.72 4.72a.75.75 0 1 0 1.06-1.06l-4.72-4.72 4.72-4.72a.75.75 0 0 0 0-1.06Z" fill="#111"/></svg> X (Twitter)</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
        {/* Platforms Section */}
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-xs tracking-widest text-[#7b8a8e] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>PLATFORMS</span>
          <div className="flex items-center gap-2 text-base text-[#b0b0b0] font-medium">
            <span className="inline-block"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#b0b0b0" strokeWidth="2"/><path d="M2 12h20M12 2c2.5 3.5 2.5 14.5 0 20M4.93 4.93c4.5 2.5 9.64 2.5 14.14 0M4.93 19.07c4.5-2.5 9.64-2.5 14.14 0" stroke="#b0b0b0" strokeWidth="2"/></svg></span> Web
          </div>
        </div>
      </motion.header>
      
      {/* Navigation Tabs */}
      <div className="border-b border-[#2A2A2A] px-6 md:px-10">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 -mb-px">
          <Button 
            variant="ghost" 
            className={`px-4 py-2 border-b-2 rounded-none ${activeTab === 'readme' ? 'border-[#3B82F6] text-white' : 'border-transparent text-[#B0B0B0]'}`}
            onClick={() => setActiveTab('readme')}
          >
            <Package size={16} className="mr-2" />
            Readme
          </Button>
          <Button 
            variant="ghost" 
            className={`px-4 py-2 border-b-2 rounded-none ${activeTab === 'code' ? 'border-[#3B82F6] text-white' : 'border-transparent text-[#B0B0B0]'}`}
            onClick={() => setActiveTab('code')}
          >
            <Code size={16} className="mr-2" />
            Code
            <Badge className="ml-2 bg-[#2A2A2A] text-[#B0B0B0]">Beta</Badge>
          </Button>
          <Button 
            variant="ghost" 
            className={`px-4 py-2 border-b-2 rounded-none ${activeTab === 'dependencies' ? 'border-[#3B82F6] text-white' : 'border-transparent text-[#B0B0B0]'}`}
            onClick={() => setActiveTab('dependencies')}
          >
            <Package size={16} className="mr-2" />
            0 Dependencies
          </Button>
          <Button 
            variant="ghost" 
            className={`px-4 py-2 border-b-2 rounded-none ${activeTab === 'dependents' ? 'border-[#3B82F6] text-white' : 'border-transparent text-[#B0B0B0]'}`}
            onClick={() => setActiveTab('dependents')}
          >
            <Package size={16} className="mr-2" />
            {packageInfo.dependents?.toLocaleString()} Dependents
          </Button>
          <Button 
            variant="ghost" 
            className={`px-4 py-2 border-b-2 rounded-none ${activeTab === 'versions' ? 'border-[#3B82F6] text-white' : 'border-transparent text-[#B0B0B0]'}`}
            onClick={() => setActiveTab('versions')}
          >
            <Clock size={16} className="mr-2" />
            {packageInfo.versions} Versions
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <motion.div 
          className="col-span-1 md:col-span-2 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30 space-y-8 p-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                 {packageInfo.name}
                </h2>
                <p className="text-xl text-[#B0B0B0] mb-6">
                  {packageInfo.description}
                </p>
              </div>

              {/* Installation */}
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase mb-4">Installation</h3>
                <div className="bg-[#1A1A1A] rounded-lg p-4 flex justify-between items-center">
                  <code className="text-white font-mono">movr install {packageInfo.name}</code>
                  <Button variant="ghost" size="sm" className="text-[#B0B0B0]">
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* Example Usage */}
              {activeTab === "code" && (
                <div className="bg-[#1A1A1A] rounded-lg p-4 overflow-x-auto">
                  <div className="prose prose-invert max-w-none text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents}
                    >
                      {moveSourceCode || codeExample || "No Move source or code example found."}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* README content */}
              {activeTab === "readme" && (
                <div className="prose prose-invert max-w-none text-[#B0B0B0] text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {readmeContent || "No README found."}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right Column - Metadata */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Install Card */}
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Install
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="bg-[#1A1A1A] rounded-lg p-3 flex justify-between items-center">
                  <code className="text-white font-mono text-sm">movr install {packageInfo.name}</code>
                  <Button variant="ghost" size="sm" className="text-[#B0B0B0]">
                    <Copy size={16} />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Repository Card */}
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Repository
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <a href={packageInfo.repository} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#3B82F6] hover:underline">
                  <GitBranch size={16} />
                  <span>{(packageInfo.repository || '').replace("https://", "")}</span>
                </a>
              </CardContent>
            </div>
          </Card>

          {/* Homepage Card */}
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Homepage
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <a href={packageInfo.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#3B82F6] hover:underline">
                  <ExternalLink size={16} />
                  <span>{(packageInfo.homepage || '').replace("https://", "")}</span>
                </a>
              </CardContent>
            </div>
          </Card>

          {/* Weekly Downloads */}
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Weekly Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">{packageInfo.downloadCount || 0}</span>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Version & License */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Version
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <span className="text-xl font-bold text-white">{packageInfo.version || ""}</span>
                </CardContent>
              </div>
            </Card>
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    License
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <span className="text-xl font-bold text-white">{packageInfo.license || ""}</span>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Tags */}
          <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
            <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
            <div className="relative z-30">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold uppercase bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex flex-wrap gap-2">
                  {(packageInfo.tags || []).map((tag) => (
                    <Badge 
                      key={tag}
                      variant="outline" 
                      className="bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-colors text-[#B0B0B0] hover:text-white border-[#808080]/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 