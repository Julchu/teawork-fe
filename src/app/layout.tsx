import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";
import { PropsWithChildren } from "react";
import { geistMono, montserrat } from "@/components/fonts";
import { Header } from "@/components/header/header";

export const metadata: Metadata = {
  title: "TeaWork",
  description: "Find nice environments to grab tea and work at",
};

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <html lang={"en"} className={"bg-background-grey"}>
      <head>
        {/*<Script*/}
        {/*  src="//unpkg.com/react-scan/dist/auto.global.js"*/}
        {/*  crossOrigin="anonymous"*/}
        {/*  strategy="beforeInteractive"*/}
        {/*/>*/}
      </head>
      <body
        className={`${montserrat.className} ${geistMono.variable} h-full antialiased`}
      >
        <main className="relative h-dvh w-screen">
          <Providers>
            <Header />
            <div className="h-full">{children}</div>
          </Providers>
        </main>
      </body>
    </html>
  );
}