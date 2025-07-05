"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Home } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", text: "Home", icon: <Home size={18} /> },
    { href: "/dashboard", text: "Dashboard", icon: <Package size={18} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-[#2A2A2A] py-4 px-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-white font-bold text-xl flex items-center gap-2">
          <Package size={24} className="text-[#3B82F6]" />
          MPM
        </Link>
        
        <div className="flex items-center gap-6">
          {links.map(link => {
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium ${
                  isActive ? "text-white" : "text-[#B0B0B0] hover:text-white transition-colors"
                }`}
              >
                {link.icon}
                {link.text}
                {isActive && (
                  <motion.div
                    layoutId="navigation-underline"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3B82F6]"
                    initial={false}
                    animate={{}}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 