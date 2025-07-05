import "./globals.css"
import { WalletProvider } from "./WalletProvider"
import Navigation from "@/components/Navigation"

export const metadata = {
  title: "Movr",
  description: "The Package Manager for Modern Move",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-inter antialiased">
        <WalletProvider>
          <Navigation />
          <div className="pt-16">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}
