"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Shield,
  Code,
  Terminal,
  Globe,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart3,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  ChevronRight,
  Download
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { WalletModal } from "@/components/WalletModal"
import { useRouter } from "next/navigation"
import WalletAddressButton from "@/components/ui/WalletAddressButton"
import React from "react"
import { Compare } from "@/components/ui/compare"

export default function MovrLanding() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { account, disconnect, connected } = useWallet()
  const router = useRouter();
  const tabs = [
    {
      key: "guides",
      label: "Guides",
      icon: BookOpen,
      content: (
        <Card className="mintlify-card rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-teal-700/30 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-300 text-sm">Guides</span>
            </div>
            <div className="p-6">
              <div className="text-white font-bold text-lg mb-2">Getting Started Guide</div>
              <div className="text-teal-300 text-sm mb-4">Learn how to set up and use the documentation platform efficiently.</div>
              <ul className="list-disc pl-5 text-gray-200 text-sm space-y-1">
                <li>Quickstart</li>
                <li>Development</li>
                <li>Global Settings</li>
                <li>Navigation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      key: "ai-chat",
      label: "AI Chat",
      icon: MessageSquare,
      content: (
        <Card className="mintlify-card rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-teal-700/30 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-300 text-sm">Movr</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-4 h-4 text-teal-400" />
                <div className="flex-1 bg-slate-800/70 rounded px-3 py-2 text-white">
                  Give me a list of all the themes
                </div>
                <Badge className="bg-gray-700 text-gray-300">ESC</Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded bg-slate-800/40 mb-6">
                  <div className="mt-1 text-teal-500 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">Can you tell me about Mintlify themes?</div>
                    <div className="text-teal-300 text-sm">Use our AI to find answers to your questions</div>
                  </div>
                  <div className="ml-auto text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="pl-6 space-y-4">
                  <div>
                    <div className="text-teal-400 text-sm">Components › Themes</div>
                    <div className="text-teal-300 text-sm">Themes are the easiest way to customise your docs on Mintli...</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">Getting started with the Prism Theme</div>
                    <div className="text-teal-300 text-sm">Prism is our most versatile theme that combines versatility and elega...</div>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-teal-400 px-2 py-1 bg-slate-800/50 rounded">
                    <span className="bg-teal-900/50 text-teal-400 text-xs px-1 rounded">GET</span>
                    <span>Get a list of themes</span>
                  </div>
                  <div className="text-teal-300 text-sm">Generate a list of themes from mint.json file</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      key: "api-reference",
      label: "API Reference",
      icon: FileText,
      content: (
        <Card className="mintlify-card rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-teal-700/30 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-300 text-sm">API Reference</span>
            </div>
            <div className="p-6">
              <div className="text-white font-bold text-lg mb-2">API Endpoints</div>
              <div className="text-teal-300 text-sm mb-4">Explore the available API endpoints and their usage.</div>
              <ul className="list-disc pl-5 text-gray-200 text-sm space-y-1">
                <li>GET /themes</li>
                <li>POST /docs</li>
                <li>PUT /settings</li>
                <li>DELETE /docs/:id</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      key: "sdk-library",
      label: "SDK Library",
      icon: Code,
      content: (
        <Card className="mintlify-card rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-teal-700/30 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-300 text-sm">SDK Library</span>
            </div>
            <div className="p-6">
              <div className="text-white font-bold text-lg mb-2">SDKs</div>
              <div className="text-teal-300 text-sm mb-4">Download and integrate SDKs for your favorite languages.</div>
              <ul className="list-disc pl-5 text-gray-200 text-sm space-y-1">
                <li>JavaScript SDK</li>
                <li>Python SDK</li>
                <li>Go SDK</li>
                <li>Java SDK</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      key: "changelog",
      label: "Changelog",
      icon: BarChart3,
      content: (
        <Card className="mintlify-card rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-teal-700/30 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-300 text-sm">Changelog</span>
            </div>
            <div className="p-6">
              <div className="text-white font-bold text-lg mb-2">Latest Updates</div>
              <div className="text-teal-300 text-sm mb-4">Stay up to date with the latest changes and improvements.</div>
              <ul className="list-disc pl-5 text-gray-200 text-sm space-y-1">
                <li>v1.2.0 - Added new AI chat features</li>
                <li>v1.1.0 - Improved SDK integration</li>
                <li>v1.0.0 - Initial release</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];
  const [activeTab, setActiveTab] = useState("ai-chat");

  // Redirect to /dashboard if wallet is connected
  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected, router]);

  // OS detection logic
  const userOS = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const ua = window.navigator.userAgent;
    if (/Windows/i.test(ua)) return 'windows';
    if (/Linux/i.test(ua)) return 'linux';
    if (/Mac/i.test(ua)) return 'mac';
    return null;
  }, []);

  // Download handlers
  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen mintlify-bg text-white">
      {/* Header */}
      <header className="fixed w-full z-50 px-6 lg:px-12 h-16 flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="relative z-10 flex items-center w-full">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl logo-font text-white">Movr</div>
          </Link>
          <nav className="ml-auto flex gap-8 text-sm">
            {/* Removed Documentation, Resources, Pricing links */}
          </nav>
          <div className="ml-8 flex gap-3">
            {connected ? (
              <>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  {`${account?.address.toString().slice(0, 6)}...${account?.address.toString().slice(-4)}`}
                </Button>
                <Button onClick={disconnect} className="bg-white text-slate-900 hover:bg-gray-100">
                  Disconnect
                </Button>
              </>
            ) : (
              <>
              
                {!connected && userOS === 'windows' && (
                  <Button
                    size="lg"
                    className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2"
                    onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.bat', 'install.bat')}
                  >
                    <Download size={18} className="mr-1" /> Download for Windows
                  </Button>
                )}
                {!connected && userOS === 'linux' && (
                  <Button
                    size="lg"
                    className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2"
                    onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.sh', 'install.sh')}
                  >
                    <Download size={18} className="mr-1" /> Download for Linux
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <img 
            src="/1hero.jpg" 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 px-6 lg:px-12 pt-32 pb-32">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Build with confidence. Publish with purpose.
              
            </h1>
            <p className="text-xl text-gray-200 mb-12 max-w-2xl leading-relaxed">
            Movr is the trust layer of the Move ecosystem — discover reusable packages, verify audits, and publish your code to the world.
            </p>
            <div className="flex gap-4 mb-16">
              <Button size="lg" className="get-started-btn bg-white text-slate-900 px-8" onClick={() => setIsModalOpen(true)}>
                Get Started
              </Button>
              {!connected && userOS === 'windows' && (
                <Button
                  size="lg"
                  className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2"
                  onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.bat', 'install.bat')}
                >
                  <Download size={18} className="mr-1" /> Download for Windows
                </Button>
              )}
              {!connected && userOS === 'linux' && (
                <Button
                  size="lg"
                  className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2"
                  onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.sh', 'install.sh')}
                >
                  <Download size={18} className="mr-1" /> Download for Linux
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center gap-8 mb-12">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`flex items-center gap-2 px-2 focus:outline-none transition-colors pb-1 ${
                    isActive
                      ? "text-white border-b-2 border-teal-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={isActive ? "page" : undefined}
                  type="button"
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Content Below Tabs */}
          <div className="relative max-w-5xl mx-auto">{tabs.find((t) => t.key === activeTab)?.content}</div>
        </div>
        {/* Gradient overlay to smooth the seam to the next section */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "160px",
            background: "linear-gradient(to bottom, rgba(10,10,10,0), #0A0A0A 100%)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      </section>

      {/* Features Section */}
      <section className="relative px-6 lg:px-12 py-32 mintlify-section-gradient">
        <div className="absolute inset-0 z-0">
          <img 
            src="/1hero.jpg" 
            alt="Features background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-[1]"></div>
        <div className="relative z-10 text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Built for the next generation of Move teams
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Find trusted modules, contribute to the ecosystem, and speed up your dev workflow
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="mintlify-card mintlify-card-hover rounded-xl overflow-hidden border-0">
            <CardContent className="p-8">
              <div className="bg-black/30 rounded-lg p-6 mb-8 h-64 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Effortless, beautiful by default</h3>
            </CardContent>
          </Card>

          <Card className="mintlify-card mintlify-card-hover rounded-xl overflow-hidden border-0">
            <CardContent className="p-8">
              <div className="bg-black/30 rounded-lg p-6 mb-8 h-64 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="bg-slate-800/80 h-16 rounded-md"></div>
                  <div className="col-span-3">
                    <div className="bg-teal-800/30 border border-teal-600/30 h-16 rounded-md flex items-center justify-center">
                      <Button size="sm" className="bg-transparent border border-white/20 text-white text-xs">Add new file</Button>
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700 text-xs">Publish</Button>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Collaboration, reimagined for Web3</h3>
            </CardContent>
          </Card>

          <Card className="mintlify-card mintlify-card-hover rounded-xl overflow-hidden border-0">
            <CardContent className="p-8">
              <div className="bg-black/30 rounded-lg p-6 mb-8 h-64 flex items-center justify-center">
                <div className="flex flex-col w-full space-y-3">
                  <div className="bg-slate-800/80 h-32 rounded-md relative">
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Eye className="w-3 h-3" /> + 95% views
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-slate-800/80 h-16 w-1/3 rounded-md"></div>
                    <div className="bg-slate-800/80 h-16 w-1/3 rounded-md"></div>
                    <div className="bg-slate-800/80 h-16 w-1/3 rounded-md"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Optimized for adoption</h3>
            </CardContent>
          </Card>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "120px",
            background: "linear-gradient(to top, rgba(10,10,10,0), #0A0A0A 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      </section>

      {/* Web Editor Section */}
      <section className="relative px-6 lg:px-12 py-32 bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="/2hero.jpg" 
            alt="Web Editor background" 
            className="w-full h-full object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-[1]"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              We didnt reinvent the wheel
              <br />
              We just gave it power steering.
              </h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Skip the boilerplate, skip the bugs. <br />
              Use Movr and ship smarter.
              </p>
              
            </div>
            
            <div className="relative">
              <Card className="mintlify-card rounded-xl overflow-hidden border-0 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <CardContent className="p-0">
                  <div className="p-4 border rounded-3xl dark:bg-neutral-900 bg-neutral-100  border-neutral-200 dark:border-neutral-800 px-4">
                    <Compare
                      firstImage="https://assets.aceternity.com/code-problem.png"
                      secondImage="https://assets.aceternity.com/code-solution.png"
                      firstImageClassName="object-cover object-left-top"
                      secondImageClassname="object-cover object-left-top"
                      className="h-[250px] w-[200px] md:h-[500px] md:w-[500px]"
                      slideMode="hover"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* Add bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-[1]"></div>
      </section>

      {/* Collaboration Section */}
      <section className="relative px-6 lg:px-12 py-32 mintlify-section-gradient bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="/2hero.jpg" 
            alt="Collaboration background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-[1]"></div>
        {/* Add bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent z-[1]"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <Card className="mintlify-card rounded-xl overflow-hidden border-0">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80 border-b border-teal-800/30">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <img src="/file.svg" alt="File" className="w-4 h-4" />
                      <span>Configurations.mdx</span>
                      <span>×</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-900 font-mono text-sm text-left">
                    <div className="flex items-center text-gray-500 text-xs mb-2">
                      <span>1</span>
                    </div>
                    <div className="text-yellow-400">title: &quot;Configurations&quot;</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>2</span>
                    </div>
                    <div className="text-yellow-400">description: &quot;Sync your docs with a code</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>3</span>
                    </div>
                    <div className="text-yellow-400">(GitHub and GitLab) repo&quot;</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>4</span>
                    </div>
                    <div className="text-yellow-400">---</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>6</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>7</span>
                    </div>
                    <div className="text-teal-400"># GitHub</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>8</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>9</span>
                    </div>
                    <div className="text-white">Movr integrates with the GitHub API,</div>
                    <div className="flex items-center text-gray-500 text-xs my-2">
                      <span>10</span>
                    </div>
                    <div className="text-white">enabling synchronization between your docs</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Secure, global collaboration for Move
              </h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Whether your cofounder is in Berlin or Bangalore, Movr keeps your Move stack verified, versioned, and untouchable.
              </p>

              <div className="space-y-6 mt-12">
                <div className="flex items-center gap-3 text-white font-medium pb-3 border-b border-teal-800/30">
                  <Terminal className="w-5 h-5 text-teal-400" />
                  <span>On-Chain Package Verification</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <span>Composable Move Modules, Instantly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 lg:px-12 py-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="/2hero.jpg" 
            alt="CTA background" 
            className="w-full h-full object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 to-transparent z-[1]"></div>
        <div className="relative z-10">
          <div className="absolute inset-0 bg-[url('/globe.svg')] bg-no-repeat bg-center opacity-5 z-[1]"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-base-100 mb-6 leading-tight">
              The workflow meant for top Aptos teams
              
            </h2>
            <p className="text-xl text-base-50 mb-12 max-w-2xl mx-auto">
              Movr lets your team focus on building breakthrough products, not managing dependencies 
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              {/* Large Download Button for OS */}
              {!connected && userOS === 'windows' && (
                <Button
                  size="lg"
                  className="text-black text-xl py-7 px-10 mt-2 sm:mt-0 bg-[#d6ff4b] hover:bg-[#c0e63e] hover:text-[#232b3b] hover:shadow-[0_0_24px_8px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2 w-full"
                  onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.bat', 'install.bat')}
                >
                  <Download size={24} className="mr-2" /> Download for Windows
                </Button>
              )}
              {!connected && userOS === 'linux' && (
                <Button
                  size="lg"
                  className="text-white text-xl py-7 px-10 mt-2 sm:mt-0 bg-[#d6ff4b] hover:bg-[#c0e63e] hover:text-[#232b3b] hover:shadow-[0_0_24px_8px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2 w-full"
                  onClick={() => handleDownload('https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.sh', 'install.sh')}
                >
                  <Download size={24} className="mr-2" /> Download for Linux
                </Button>
              )}
            </div>
            
            <div className="mt-8 text-base-30 text-sm">
              No credit card required • Free forever for open source • 14-day Pro trial
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-800/30 px-6 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Movr. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <Link href="#" className="text-gray-400 hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              Developer Docs
            </Link>
          </nav>
        </div>
      </footer>
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
