"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Download, 
  Search, 
  Tag, 
  TrendingUp, 
  Star, 
  Clock, 
  Filter 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock data for packages
const topPackages = [
  { name: "react", description: "React is a JavaScript library for building user interfaces.", downloads: "12.4M", version: "18.3.0" },
  { name: "next", description: "The React Framework for Production", downloads: "8.7M", version: "15.3.0" },
  { name: "tailwindcss", description: "A utility-first CSS framework for rapidly building custom designs", downloads: "6.2M", version: "4.0.0" },
  { name: "framer-motion", description: "Open source, production-ready animation and gesture library for React", downloads: "2.8M", version: "11.0.5" }
];

const recentPackages = [
  { name: "shadcn-ui", description: "Beautifully designed components built with Radix UI and Tailwind CSS", downloads: "950K", version: "0.9.0" },
  { name: "aptos-sdk", description: "SDK for interacting with Aptos blockchain", downloads: "420K", version: "1.39.0" },
  { name: "zod", description: "TypeScript-first schema validation with static type inference", downloads: "4.1M", version: "3.22.4" }
];

// Popular tags
const popularTags = [
  "react", "ui", "components", "state-management", "styling", 
  "animation", "forms", "validation", "blockchain", "web3"
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]" style={{ 
      backgroundColor: "#0A0A0A",  // primary.background from Design.json
      color: "#FFFFFF"  // primary.text from Design.json
    }}>
      {/* Header Section */}
      <motion.header 
        className="py-8 px-6 md:px-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Package Dashboard</h1>
          <p className="text-[#B0B0B0] max-w-3xl">
            Discover, explore and manage packages in your application. Search for packages, view trending ones, and check download statistics.
          </p>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#808080]" size={18} />
              <Input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1A] border-[#808080]/20 focus:border-[#3B82F6] h-12 rounded-xl"
              />
            </div>
            <Button variant="outline" className="gap-2 h-12 bg-[#1A1A1A] border-[#808080]/20">
              <Filter size={18} />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </motion.header>

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
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2">
                  <TrendingUp className="text-[#4ADE80]" size={20} />
                  Top Packages
                </CardTitle>
                <Button variant="ghost" size="sm">View all</Button>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {topPackages.map((pkg, index) => (
                  <Link key={pkg.name} href={`/dashboard/package/${pkg.name}`}>
                    <motion.div 
                      className="flex flex-col gap-2 p-4 rounded-lg hover:bg-[#3A3A3A] transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-white">{pkg.name}</h3>
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
            </Card>

            {/* Recent Packages */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2">
                  <Clock className="text-[#FB923C]" size={20} />
                  Recent Packages
                </CardTitle>
                <Button variant="ghost" size="sm">View all</Button>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {recentPackages.map((pkg, index) => (
                  <Link key={pkg.name} href={`/dashboard/package/${pkg.name}`}>
                    <motion.div 
                      className="flex flex-col gap-2 p-4 rounded-lg hover:bg-[#3A3A3A] transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-white">{pkg.name}</h3>
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
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2">
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
            </Card>

            {/* Package Stats */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2">
                  <Package className="text-[#3B82F6]" size={20} />
                  Package Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Total Packages</p>
                    <p className="text-2xl font-bold text-white mt-1">284</p>
                  </motion.div>
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Downloads</p>
                    <p className="text-2xl font-bold text-white mt-1">42.8M</p>
                  </motion.div>
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Active</p>
                    <p className="text-2xl font-bold text-white mt-1">189</p>
                  </motion.div>
                  <motion.div 
                    className="bg-[#1A1A1A] p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <p className="text-[#B0B0B0] text-sm">Updates</p>
                    <p className="text-2xl font-bold text-white mt-1">56</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Most Starred */}
            <Card className="bg-[#2A2A2A] border-none shadow-lg rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-extrabold text-white uppercase flex items-center gap-2">
                  <Star className="text-[#FDE047]" size={20} />
                  Most Starred
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6 space-y-3">
                {topPackages.slice(0, 3).map((pkg, index) => (
                  <motion.div 
                    key={`star-${pkg.name}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#3A3A3A] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <span className="font-medium">{pkg.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="fill-[#FDE047] text-[#FDE047]" size={14} />
                      <span className="text-[#B0B0B0]">{Math.round(parseInt(pkg.downloads.replace(/[^0-9.]/g, '')) / 100)}K</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
