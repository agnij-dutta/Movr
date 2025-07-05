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
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
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
               
               
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent" onClick={() => setIsModalOpen(true)}>
                  Get Started
                </Button>
              </>
            )}
          </div>
          {/* Wallet Address Display - Top Right */}
          <div className="absolute top-6 right-8 z-30">
            <WalletAddressButton account={account} disconnect={disconnect} connected={connected} />
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
             Discover & compose trusted Move packages  
              
            </h1>
            <p className="text-xl text-gray-200 mb-12 max-w-2xl leading-relaxed">
            Movr is the decentralized registry for Move packages — with onchain metadata, audit trails, reproducible builds, and a growing graph of trusted dependencies
            </p>
            <div className="flex gap-4 mb-16">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 px-8" onClick={() => setIsModalOpen(true)}>
                Get Started
              </Button>
             
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent z-[1]"></div>
        <div className="relative z-10 text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Built for modern teams
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Crafted with customizability and collaboration in mind.
            <br />
            Designed to impress.
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
              <h3 className="text-xl font-bold text-white mb-3">Beautiful out of the box</h3>
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
              <h3 className="text-xl font-bold text-white mb-3">Built for collaboration</h3>
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
              <h3 className="text-xl font-bold text-white mb-3">Designed for conversion</h3>
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
      <section className="relative px-6 lg:px-12 py-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="/2hero.jpg" 
            alt="Web Editor background" 
            className="w-full h-full object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 to-transparent z-[1]"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Web Editor
              </h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Create, edit, and publish documentation with a drag and drop interface. No
                git needed to collaborate with developers.
              </p>
              <Button className="bg-white text-slate-900 hover:bg-gray-100">
                Learn more
              </Button>
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
      </section>

      {/* Collaboration Section */}
      <section className="relative px-6 lg:px-12 py-32 mintlify-section-gradient">
        <div className="absolute inset-0 z-0">
          <img 
            src="/2hero.jpg" 
            alt="Collaboration background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-transparent" />
        </div>
        {/* Add top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 to-transparent z-[1]"></div>
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
                Built for collaboration
              </h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Empower your team with workflows that meet you where you are, whether you
                prefer git sync or a WYSIWYG experience.
              </p>

              <div className="space-y-6 mt-12">
                <div className="flex items-center gap-3 text-white font-medium pb-3 border-b border-teal-800/30">
                  <Terminal className="w-5 h-5 text-teal-400" />
                  <span>Codebase-syncing</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <span>Web editor</span>
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
              Experience the workflow the best
              <br />
              development teams love.
            </h2>
            <p className="text-xl text-base-50 mb-12 max-w-2xl mx-auto">
              Let your team focus on building amazing products instead of managing 
              documentation with our AI-powered platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button size="lg" className="bg-accent-blue hover:bg-accent-blue-dark text-base-100 px-8 w-full transition-all duration-300 font-medium py-6 text-lg">
                Sign Up
              </Button>
              <Button size="lg" variant="outline" className="border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 px-8 w-full transition-all duration-300 bg-transparent font-medium py-6 text-lg">
                Request Demo
              </Button>
            </div>
            
            <div className="mt-8 text-base-30 text-sm">
              No credit card required • Free 14-day trial
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent"></div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-800/30 px-6 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} MPM. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <Link href="#" className="text-gray-400 hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              Privacy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              Documentation
            </Link>
          </nav>
        </div>
      </footer>
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
