
import React from 'react';
import { Metadata } from "next";
import { Inter } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs"

import "../globals.css";


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Threads',
    description: 'Treads clone application',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider>
            <html lang='en'>
                <body className={`${inter.className} bg-dark-1`}>{children}</body>
            </html>
        </ClerkProvider>
    )
}