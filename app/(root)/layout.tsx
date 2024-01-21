import React from "react";
import type { Metadata  } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import "../globals.css";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";
import RightSidebar from "@/components/shared/RightSidebar";
import Topbar from "@/components/shared/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  openGraph: {
    title: 'Threads Clone',
    description: 'A Next.js 13 Meta Threads application',
    url: 'https://threads-clone-sepia.vercel.app/',
    siteName: 'Thread Clone',
    images: [
      {
        url: 'https://utfs.io/f/8e3bf8a8-6f65-4efc-964e-4947f8dde265-k183w6.png', // Must be an absolute URL
        width: 800,
        height: 600,
      },
      {
        url: 'https://utfs.io/f/b13c3888-5072-46b4-bcbf-d0cdf02f3b07-1u09v.png', // Must be an absolute URL
        width: 1800,
        height: 1600,
        alt: 'Desktop image',
      },
    ]
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang='en'>
        <body className={inter.className}>
          <Topbar />

          <main className='flex flex-row'>
            <LeftSidebar />
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            {/* @ts-ignore */}
            <RightSidebar />
          </main>

          <Bottombar />
        </body>
      </html>
    </ClerkProvider>
  );
}
