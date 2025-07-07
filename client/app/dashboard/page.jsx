"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Download, 
  Search, 
  Tag, 
  TrendingUp, 
  Star, 
  Clock, 
  Filter,
  Copy,
  LogOut,
  ChevronDown,
  X,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import WalletAddressButton from "@/components/ui/WalletAddressButton";
import { useAptosSearch } from '@/lib/hooks/useAptosSearch';
import { useAptosEndorse } from '@/lib/hooks/useAptosEndorse';
import { useAptosTip } from '@/lib/hooks/useAptosTip';

// Placeholder tags (could be replaced with dynamic tags from API later)
const popularTags = [
  "react",
  "ui",
  "components",
  "state-management",
  "styling",
  "animation",
  "forms",
  "validation",
  "blockchain",
  "web3",
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Dashboard() {
  const { account, connect, disconnect, connected } = useWallet();
  const { results, search, fetchAll, loading: searchLoading, error: searchError } = useAptosSearch();
  const { endorse, txHash: endorseTx, loading: endorseLoading, error: endorseError } = useAptosEndorse();
  const { tip, txHash: tipTx, loading: tipLoading, error: tipError } = useAptosTip();

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [tipAmount, setTipAmount] = useState('');

  // Dynamic data from API
  const [allPackages, setAllPackages] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [recentPackages, setRecentPackages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({ totalPackages: 0, totalEndorsements: 0, totalDownloads: 0, totalTips: 0 });

  // Redirect to landing if not connected
  useEffect(() => {
    if (!connected) {
      router.replace("/");
    }
  }, [connected, router]);

  // Fetch all packages and calculate stats on mount
  useEffect(() => {
    (async () => {
      const pkgs = await fetchAll();
      setAllPackages(pkgs);
      // Top 5 by endorsements
      const sortedByEndorsements = [...pkgs].sort((a, b) => (b.endorsements?.length || 0) - (a.endorsements?.length || 0));
      setTopPackages(sortedByEndorsements.slice(0, 5));
      setRecentPackages([...pkgs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
      // Calculate stats
      const totalPackages = pkgs.length;
      const totalEndorsements = pkgs.reduce((sum, pkg) => sum + (pkg.endorsements?.length || 0), 0);
      const totalDownloads = pkgs.reduce((sum, pkg) => sum + (pkg.downloadCount || 0), 0);
      const totalTips = pkgs.reduce((sum, pkg) => sum + (pkg.totalTips || 0), 0);
      setStats({ totalPackages, totalEndorsements, totalDownloads, totalTips });
    })();
  }, [fetchAll]);

  // Live search (debounced, client-side)
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q === "") {
        setSearchResults(allPackages);
        return;
      }
      const filtered = allPackages.filter(pkg => {
        const name = (pkg.name || '').toLowerCase();
        const desc = (pkg.description || '').toLowerCase();
        const tags = (pkg.tags || []).join(' ').toLowerCase();
        return name.includes(q) || desc.includes(q) || tags.includes(q);
      });
      setSearchResults(filtered);
    }, 200); // debounce 200ms
    return () => clearTimeout(handler);
  }, [searchQuery, allPackages]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Show overlay when searchQuery is not empty
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  }, [searchQuery]);

  // Filtered results are just searchResults now
  const filteredResults = searchResults;

  const handleSearch = (e) => {
    e.preventDefault();
    search(searchQuery);
  };

  const handleEndorse = async (pkg) => {
    if (!connected) return connect();
    await endorse(account, pkg.name, pkg.version);
    search(searchQuery); // refresh
  };

  const handleTip = async (pkg) => {
    if (!connected) return connect();
    if (!tipAmount) return;
    await tip(account, pkg.name, pkg.version, Number(tipAmount));
    search(searchQuery); // refresh
  };


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[--foreground] relative overflow-hidden" style={{ color: '#FFFFFF' }}>
      <div className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none" style={{
        backgroundImage: 'url(/dash-back.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }} />
      {/* Upload Package Button - Top Left */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <Link href="/upload">
          <Button variant="ghost" className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2">
            <Upload size={18} className="mr-1" /> Upload Package
          </Button>
        </Link>
      </div>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[340px] md:min-h-[400px] px-4 md:px-0 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 w-full h-full" style={{
          background: 'url(/1hero.jpg) center/cover no-repeat',
          opacity: 0.25,
          zIndex: 0
        }} />
        {/* Wallet Address Display - Top Right */}
        <div className="absolute top-6 right-8 z-20">
          <WalletAddressButton account={account} disconnect={disconnect} connected={connected} />
        </div>
        <div className="relative z-10 flex flex-col items-center md:items-start justify-center w-full max-w-5xl mx-auto pt-16 pb-12 text-center md:text-right">
          <span className="tracking-widest text-[#7b8a8e] text-xs md:text-sm mb-4 uppercase" style={{ letterSpacing: '0.2em' }}>MOVR</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans leading-[1.15] pb-2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Package Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-[#b0b0b0] font-normal max-w-2xl " style={{ fontFamily: 'Inter, sans-serif' }}>
            Pick the perfect package for your need
          </p>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-4 md:h-6" style={{
          background: 'linear-gradient(90deg, #eab08a 0%, #a6d6d6 50%, #eab08a 100%)',
          opacity: 0.5
        }} />
      </section>

      {/* Tag Selector Bar */}
      <div className="w-full flex justify-center items-center mt-4 mb-8">
        <div className="w-11/12 max-w-6xl flex flex-wrap gap-2 md:gap-3 items-center justify-start">
          {['All','RPC','Stablecoins','Explorers','Bridges','Wallets','DeFi','NFT','Tooling','Oracles','Analytics','Gaming','NFT Tooling','Security','Marketplaces','Launchpads','Infra','Social','Education','AI','Hardware'].map((tag, idx) => (
            <button
              key={tag}
              className={`px-4 py-2 border border-[#2a3538] rounded-sm font-medium text-base md:text-lg transition-colors duration-150 ${idx === 0 ? 'bg-[#1a2326] text-white border-[#b0b0b0]' : 'bg-transparent text-[#b0b0b0] hover:bg-[#1a2326] hover:text-white'} `}
              style={{ fontFamily: 'Inter, sans-serif', minWidth: '90px', letterSpacing: '0.01em' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full flex justify-center items-center mt-2 mb-8">
        <div className="w-3/4 max-w-5xl flex items-center bg-[#07171b] border border-[#2a3538] rounded-sm px-6 py-3" style={{ minHeight: '60px' }}>
          <Search size={32} className="text-[#b0b0b0] mr-4" />
          <Input
            type="text"
            placeholder={`Search ${stats.totalPackages} packages`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none shadow-none text-xl text-[#b0b0b0] placeholder:text-[#5c6a6e] focus:ring-0 focus:outline-none flex-1 px-0"
            style={{ fontWeight: 400, fontSize: '1.5rem', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Search Overlay Modal */}
      {showSearchOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#07171b]/95 backdrop-blur-sm">
          <div className="flex items-center px-8 py-6 border-b border-[#2a3538] relative">
            <Search size={28} className="text-[#b0b0b0] mr-4" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="flex-1 bg-transparent border-none outline-none text-2xl text-white placeholder:text-[#5c6a6e]"
              style={{ fontWeight: 500 }}
            />
            <button
              className="ml-4 p-2 rounded-full hover:bg-[#1a2326] transition-colors"
              onClick={() => { setSearchQuery(""); setShowSearchOverlay(false); }}
              aria-label="Close search"
            >
              <X size={28} className="text-[#b0b0b0]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResults.length === 0 ? (
                <div className="col-span-2 text-center text-[#b0b0b0] text-lg mt-12">No results found.</div>
              ) : (
                filteredResults.map((pkg, idx) => (
                  <div key={pkg.name + '-' + pkg.version} className="flex items-center gap-6 p-4 bg-[#0A0A0A] rounded-lg border border-[#2a3538] hover:bg-[#1a2326] transition-colors cursor-pointer">
                    <div className="w-16 h-16 flex items-center justify-center bg-[#1a2326] rounded-md overflow-hidden">
                      {/* Replace with <img src={pkg.icon} ... /> if you have icons */}
                      <span className="text-3xl">🧩</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-white mb-1">{pkg.name}</div>
                      <div className="text-[#b0b0b0] text-base leading-snug">{pkg.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-6 md:px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Top Packages */}
          <motion.div 
            className="col-span-1 md:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <TrendingUp className="text-[#4ADE80]" size={20} />
                    Top Packages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pb-6">
                  {topPackages.map((pkg, index) => (
                    <Link key={pkg.name + '-' + pkg.version} href={`/dashboard/package/${pkg.name}`}>
                      <motion.div 
                        className="group flex flex-col gap-2 p-4 rounded-lg transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-white group-hover:bg-gradient-to-r group-hover:from-[#eab08a] group-hover:via-[#a6d6d6] group-hover:to-[#eab08a] group-hover:text-transparent group-hover:bg-clip-text transition-all duration-200">{pkg.name}</h3>
                            <p className="text-[#B0B0B0] text-sm mt-1">{pkg.description}</p>
                          </div>
                          <Badge className="bg-[#3B82F6] text-white">{pkg.version}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[#B0B0B0] text-sm">
                          <Download size={14} />
                          <span>{pkg.downloads}</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </CardContent>
              </div>
            </Card>

            {/* Recent Packages */}
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Clock className="text-[#FB923C]" size={20} />
                    Recent Packages
                  </CardTitle>
               
                </CardHeader>
                <CardContent className="space-y-5 pb-6">
                  {recentPackages.map((pkg, index) => (
                    <Link key={pkg.name + '-' + pkg.version} href={`/dashboard/package/${pkg.name}`}>
                      <motion.div 
                        className="group flex flex-col gap-2 p-4 rounded-lg transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-white group-hover:bg-gradient-to-r group-hover:from-[#eab08a] group-hover:via-[#a6d6d6] group-hover:to-[#eab08a] group-hover:text-transparent group-hover:bg-clip-text transition-all duration-200">{pkg.name}</h3>
                            <p className="text-[#B0B0B0] text-sm mt-1">{pkg.description}</p>
                          </div>
                          <Badge className="bg-[#FB923C] text-white">{pkg.version}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[#B0B0B0] text-sm">
                          <Download size={14} />
                          <span>{pkg.downloads}</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </CardContent>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Popular Tags and Stats */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Popular Tags */}
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Tag className="text-[#A855F7]" size={20} />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag, index) => (
                      <motion.div 
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Badge 
                          variant="outline" 
                          className="bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-colors text-[#B0B0B0] hover:text-white border-[#808080]/20"
                        >
                          {tag}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Package Stats */}
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Package className="text-[#3B82F6]" size={20} />
                    Package Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Total Packages</p>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-5xl font-extrabold text-[#d6ff4b]">{stats.totalPackages}</span>
                      <span className="text-lg font-semibold text-[#b0b0b0]">Packages</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Active</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalEndorsements}</p>
                  </motion.div>
                </CardContent>
              </div>
            </Card>

            {/* Most Endorsements */}
            <Card className="bg-transparent border-none shadow-lg rounded-xl overflow-hidden relative">
              <img src="/dash.jpeg" alt="dash background" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-20" />
              <div className="relative z-30">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2 bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Star className="text-[#FDE047]" size={20} />
                    Most Endorsements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6 space-y-3">
                  {topPackages.slice(0, 3).map((pkg, index) => (
                    <motion.div 
                      key={`endorse-${pkg.name}-${pkg.version}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#3A3A3A] transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <span className="font-medium text-white">{pkg.name}</span>
                      <div className="flex items-center gap-1">
                        <Star className="fill-[#FDE047] text-[#FDE047]" size={14} />
                        <span className="text-[#ffffff]">{pkg.endorsements?.length >= 1000 ? (pkg.endorsements.length / 1000).toFixed(1) + 'K' : pkg.endorsements?.length || 0}</span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
