import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <BreakingTicker />
    <main className="flex-1 pt-24 md:pt-28">{children}</main>
    <Footer />
  </div>
);
