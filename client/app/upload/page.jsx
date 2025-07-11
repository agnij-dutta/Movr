"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ArrowLeft, ArrowRight, Image, FileVideo, FileText, CheckCircle } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import WalletAddressButton from "@/components/ui/WalletAddressButton";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { pinJSON, uploadFile, PINATA_JWT } from "@/lib/ipfs";
import { publishPackage } from "@/lib/aptos";

const steps = [
  { label: "Upload file", icon: Upload },
  { label: "Add details", icon: FileText },
  { label: "Review & upload", icon: CheckCircle },
];

const exampleTags = [
  "react", "ui", "components", "state-management", "styling", "animation", "forms", "validation", "blockchain", "web3"
];

function ProgressBar({ progress }) {
  return (
    <div className="w-full h-2 bg-[#e5e7eb] rounded-full mt-4">
      <div
        className="h-2 rounded-full bg-[#d6ff4b] transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed top-8 right-8 z-50 bg-white border border-[#e5e7eb] shadow-lg rounded-lg px-6 py-3 flex items-center gap-3 text-[#222] animate-fade-in">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-[#888] hover:text-[#222]">✕</button>
    </div>
  );
}

function FileUploadDemo({ onFileSelected }) {
  const [files, setFiles] = useState([]);
  const handleFileUpload = (newFiles) => {
    setFiles(newFiles);
    if (newFiles && newFiles.length > 0) {
      onFileSelected(newFiles[0]);
    } else {
      onFileSelected(null);
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-background border-neutral-200 dark:border-neutral-800 rounded-lg">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
}

export default function UploadPage() {
  const fileInputRef = useRef();
  const [step, setStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const { account, disconnect, connected } = useWallet();
  const router = useRouter();

  // Redirect to landing if not connected
  useEffect(() => {
    if (!connected) {
      router.replace("/");
    }
  }, [connected, router]);

  // File upload handlers
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProgress(0);
      // Extract Move.toml and auto-fill name
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const moveTomlFile = zip.file("Move.toml");
        if (moveTomlFile) {
          const moveToml = await moveTomlFile.async("string");
          const nameMatch = moveToml.match(/name\s*=\s*"([^"]+)"/);
          if (nameMatch) setName(nameMatch[1]);
        }
      } catch (err) { /* ignore */ }
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProgress(0);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleSelectClick = () => {
    fileInputRef.current.click();
  };

  // Tag dropdown handlers
  const handleTagToggle = (tag) => {
    setTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Step navigation
  const canGoNext = () => {
    if (step === 0) return !!selectedFile;
    if (step === 1) return name && description && tags.length > 0;
    return true;
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(10);
    try {
      // Upload ZIP to IPFS using helper
      const ipfsHash = await uploadFile(selectedFile, { name, description, tags: tags.join(",") });
      setProgress(50);
      // Publish on-chain (wallet prompt)
      await publishPackage(account, {
        name,
        version: "1.0.0", // TODO: add version field to form if needed
        ipfsHash,
        description,
        homepage: "",
        repository: "",
        license: "",
        tags,
      });
      setProgress(100);
      setUploading(false);
      setToast("Package published successfully!");
      setTimeout(() => {
        setToast(null);
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setUploading(false);
      setToast("Failed to publish: " + (err?.message || err));
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 relative bg-[#0A0A0A] text-[--foreground] overflow-hidden"
      style={{
        minHeight: '100vh',
        fontFamily: "'Inter', 'Poppins', 'Montserrat', 'Space Grotesk', sans-serif",
        color: '#FFFFFF',
      }}
    >
      {/* Wallet Address Display - Top Right */}
      <div className="absolute top-6 right-8 z-20">
        <WalletAddressButton account={account} disconnect={disconnect} connected={connected} />
      </div>
      {/* Dashboard Back Button - Top Left */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2">
            <ArrowLeft size={18} className="mr-1" /> Dashboard
          </Button>
        </Link>
      </div>
      <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none" style={{
        backgroundImage: 'url(/dash-back.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }} />
      {/* Stepper */}
      <section className="w-full max-w-[700px] rounded-xl px-4 py-6 flex flex-col items-center mb-8 relative overflow-hidden" style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none' }}>
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none rounded-xl" style={{
          background: 'url(/1hero.jpg) center/cover no-repeat',
          opacity: 0.25
        }} />
        <div className="text-2xl md:text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          Upload your package
        </div>
        <div className="flex items-center justify-center w-full max-w-[600px] mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 min-w-[120px] relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    idx === step
                      ? 'bg-[#d6ff4b] border-[#d6ff4b] shadow-[0_0_16px_4px_rgba(214,255,75,0.4)]'
                      : 'bg-[#1e293b] border-[#334155]'
                  } mb-2`}
                >
                  <Icon size={24} className={idx === step ? 'text-[#232b3b]' : 'text-[#d1d5db]'} />
                </div>
                <div className={`text-xs text-center font-semibold ${idx === step ? 'text-[#d6ff4b]' : 'text-[#bdbdbd]'}`}>{s.label}</div>
                {idx < 2 && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-[60px] h-0.5 bg-[#334155] z-0" style={{ marginLeft: -30 }}></div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* Step Content */}
      <main className="w-full max-w-[700px] rounded-2xl p-6 md:p-8 flex flex-col gap-8 relative overflow-hidden bg-transparent border-none shadow-lg" style={{ position: 'relative', zIndex: 1 }}>
        <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none rounded-2xl" style={{
          background: 'url(/dash.jpeg) center/cover no-repeat',
          opacity: 0.30
        }} />
        
        {/* Action buttons that are always visible when file is selected */}
        {selectedFile && step === 0 && (
          <div className="flex gap-4 justify-center mb-4 sticky top-0 z-30 bg-[#0A0A0A]/70 py-4 px-6 rounded-xl backdrop-blur-md border border-[#334155]">
            <Button
              onClick={() => setSelectedFile(null)}
              className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2 bg-transparent border border-[#d6ff4b] font-bold rounded-xl shadow-lg px-6 py-2"
            >
              Discard Files
            </Button>
            <Button
              onClick={() => setStep(1)}
              className="text-white hover:bg-[#d6ff4b] hover:text-[#232b3b] hover:shadow-[0_0_16px_4px_rgba(214,255,75,0.4)] transition-all flex items-center gap-2 bg-transparent border border-[#d6ff4b] font-bold rounded-xl shadow-lg px-6 py-2"
            >
              Continue <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        )}
        
        {step === 0 && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="dark w-full" style={{ colorScheme: 'dark' }}>
              <FileUploadDemo onFileSelected={file => { 
                setSelectedFile(file); 
              }} />
            </div>
          </div>
        )}
        {step === 1 && (
          <Card className="bg-transparent border-none shadow-lg rounded-2xl overflow-hidden relative w-full">
            <img src="/dash.jpeg" alt="form bg" className="absolute inset-0 w-full h-full object-cover opacity-30 brightness-125 pointer-events-none select-none z-0 rounded-2xl" />
            <div className="relative z-10">
              <CardHeader className="mb-4">
                <div className="text-xl font-extrabold bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-sans" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                  Package Details
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-[#b0b0b0] text-sm font-semibold">Name</label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Package name"
                      className={`bg-transparent border-[#334155] text-base shadow-md rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#d6ff4b] ${name ? 'bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-bold' : 'text-[#f3f4f6]'}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="text-[#b0b0b0] text-sm font-semibold">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                      placeholder="Describe your package..."
                      rows={4}
                      className={`bg-transparent border border-[#334155] rounded-xl p-4 text-base shadow-md resize-none focus:outline-none focus:ring-2 focus:ring-[#d6ff4b] ${description ? 'bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-bold' : 'text-[#f3f4f6]'}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[#b0b0b0] text-sm font-semibold">Tags</label>
                    <div className="relative">
                      <div
                        className="bg-transparent border border-[#334155] rounded-xl p-4 text-[#f3f4f6] cursor-pointer flex flex-wrap gap-2 min-h-[44px] items-center focus:ring-2 focus:ring-[#d6ff4b] shadow-md"
                        onClick={() => setTagDropdownOpen((open) => !open)}
                        tabIndex={0}
                        onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
                      >
                        {tags.length === 0 && <span className="text-[#bdbdbd]">Select tags...</span>}
                        {tags.map(tag => (
                          <span key={tag} className="bg-[#d6ff4b] text-[#232b3b] rounded-full px-3 py-1 text-xs font-semibold shadow">{tag}</span>
                        ))}
                      </div>
                      {tagDropdownOpen && (
                        <Card className="absolute left-0 bottom-full mb-2 min-w-full z-50 bg-transparent border border-[#334155] rounded-xl shadow-2xl overflow-hidden" style={{backdropFilter: 'blur(8px)'}}>
                          <CardContent className="max-h-48 overflow-y-auto p-0 bg-transparent">
                            {exampleTags.map(tag => (
                              <div
                                key={tag}
                                className={`px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-[#334155]/60 ${tags.includes(tag) ? 'bg-[#334155]/60 text-[#d6ff4b]' : 'text-[#f3f4f6]'}`}
                                onMouseDown={e => { e.preventDefault(); handleTagToggle(tag); }}
                              >
                                {tag} {tags.includes(tag) && <span className="ml-2">✓</span>}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button type="button" onClick={() => setStep(0)} className="bg-[#d6ff4b] text-[#232b3b] font-bold rounded-xl shadow-lg hover:bg-[#eaff7b] transition px-6 py-2"><ArrowLeft size={16} className="mr-1" />Back</Button>
                    <Button type="submit" disabled={!canGoNext()} className="bg-[#d6ff4b] text-[#232b3b] font-bold rounded-xl shadow-lg hover:bg-[#eaff7b] transition px-6 py-2">Next <ArrowRight size={16} className="ml-1" /></Button>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[#888] text-sm">File</span>
              <span className="font-semibold bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-bold">{selectedFile?.name} {selectedFile ? `(${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)` : ""}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888] text-sm">Name</span>
              <span className="font-semibold bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-bold">{name}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888] text-sm">Description</span>
              <span className="bg-gradient-to-r from-[#eab08a] via-[#a6d6d6] to-[#eab08a] text-transparent bg-clip-text font-bold">{description}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#888] text-sm">Tags</span>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-[#d6ff4b] text-[#222] rounded px-2 py-1 text-xs font-medium">{tag}</span>
                ))}
              </div>
            </div>
            {uploading && <ProgressBar progress={progress} />}
            <div className="flex justify-between mt-4">
              <Button type="button" onClick={() => setStep(1)} className="bg-[#d6ff4b] text-[#232b3b] font-bold rounded-xl shadow-lg hover:bg-[#eaff7b] transition px-6 py-2"><ArrowLeft size={16} className="mr-1" />Back</Button>
              <Button type="button" onClick={handleUpload} disabled={uploading} className="bg-[#d6ff4b] text-[#232b3b] font-bold rounded-xl shadow-lg hover:bg-[#eaff7b] transition px-6 py-2">{uploading ? "Uploading..." : "Upload"}</Button>
            </div>
          </div>
        )}
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
