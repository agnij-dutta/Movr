import { ReactNode } from 'react';

export const metadata = {
  title: 'movr CLI API',
  description: 'API backend for movr CLI',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 