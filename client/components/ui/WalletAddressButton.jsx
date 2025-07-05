import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";

export default function WalletAddressButton({ account, disconnect, connected }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!connected || !account?.address) return null;

  return (
    <div className="relative flex flex-col items-end gap-0.5" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="text-white hover:bg-white hover:text-black flex items-center gap-1"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {`${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}`}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div className="mt-1 absolute right-0 top-full w-32 bg-[#181818] border border-[#232D2F] rounded-lg shadow-lg z-50 animate-fade-in">
          <Button
            onClick={disconnect}
            className="w-full bg-transparent text-white hover:bg-[#232D2F] hover:text-[#d6ff4b] rounded-lg justify-start px-4 py-2"
            size="sm"
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
} 