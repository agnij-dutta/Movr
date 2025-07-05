import "./globals.css"
import { WalletProvider } from "./WalletProvider"

export const metadata = {
  title: "Movr",
  description: "The Package Manager for Modern Move",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-inter antialiased">
        <WalletProvider>
          <div >
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}
