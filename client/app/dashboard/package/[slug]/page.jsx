"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Heart, Code, Package, GitBranch, Clock, ExternalLink, Copy, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Mock data for the package details
const packageData = {
  name: "react",
  version: "18.3.0",
  description: "React is a JavaScript library for building user interfaces.",
  published: "2 months ago",
  license: "MIT",
  weeklyDownloads: "12.4M",
  repository: "https://github.com/facebook/react",
  homepage: "https://react.dev",
  dependencies: [],
  dependents: 142850,
  versions: 87,
  tags: ["ui", "frontend", "javascript", "library", "components"]
};

const codeExample = `import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <h1>Hello, world!</h1>;
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);`;

const readmeContent = `
# React

A JavaScript library for building user interfaces

* **Declarative:** React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

* **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs.

* **Learn Once, Write Anywhere:** You can develop new features in React without rewriting existing code. React can also render on the server using Node and power mobile apps using React Native.
`;

export default function PackageDetails({ params }) {
  const [activeTab, setActiveTab] = useState("readme");
  const { slug } = useParams();
  
  // In a real app, you would fetch the package data based on the slug
  const packageInfo = packageData;
  
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground] relative overflow-hidden" style={{ color: '#FFFFFF' }}>
      <div className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none" style={{
        backgroundImage: 'url(/dash-back.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }} />
      {/* Back Button */}
      <div className="py-6 px-6 md:px-10">
        <Link href="/dashboard">
          <Button variant="ghost" className="flex items-center gap-1 text-[#B0B0B0] hover:text-white">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      {/* Package Header */}
      <motion.header 
        className="px-6 md:px-10 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <Badge className="bg-[#3B82F6] text-white uppercase py-1 px-3">TS</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>{packageInfo.name}</h1>
          <p className="text-[#B0B0B0] text-sm">
            {packageInfo.version} • Public • Published {packageInfo.published}
          </p>
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
            {packageInfo.dependents.toLocaleString()} Dependents
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
                  a JavaScript idiomatic {packageInfo.name}
                </h2>
                <p className="text-xl text-[#B0B0B0] mb-6">
                  interface for inversion-of-control
                </p>
              </div>

              {/* Installation */}
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase mb-4">Installation</h3>
                <div className="bg-[#1A1A1A] rounded-lg p-4 flex justify-between items-center">
                  <code className="text-white font-mono">npm install {packageInfo.name}</code>
                  <Button variant="ghost" size="sm" className="text-[#B0B0B0]">
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* Example Usage */}
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase mb-4">Example Usage</h3>
                <div className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="mb-2 text-[#B0B0B0]">in JavaScript</div>
                  <pre className="text-white font-mono text-sm overflow-x-auto">
                    {codeExample}
                  </pre>
                </div>
              </div>

              {/* README content */}
              <div>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-[#B0B0B0] text-sm">
                    {readmeContent}
                  </pre>
                </div>
              </div>
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
                  <code className="text-white font-mono text-sm">npm i {packageInfo.name}</code>
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
                  <span>{packageInfo.repository.replace("https://", "")}</span>
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
                  <span>{packageInfo.homepage.replace("https://", "")}</span>
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
                  <span className="text-2xl font-bold text-white">{packageInfo.weeklyDownloads}</span>
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
                  <span className="text-xl font-bold text-white">{packageInfo.version}</span>
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
                  <span className="text-xl font-bold text-white">{packageInfo.license}</span>
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
                  {packageInfo.tags.map((tag) => (
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