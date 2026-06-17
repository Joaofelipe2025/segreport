"use client";
import { usePathname } from "next/navigation";
import Ticker from "./Ticker";
import PulseStrip from "./PulseStrip";
import CategoryTabs from "./CategoryTabs";

const PORTAL_PATHS = [
  "/",
  "/noticias",
  "/auto",
  "/vida",
  "/saude",
  "/agro",
  "/resseguros",
  "/regulacao",
  "/tech",
  "/mercado",
  "/dados-susep",
];

export default function PortalNav() {
  const pathname = usePathname();
  const isPortal = PORTAL_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
  );
  if (!isPortal) return null;
  return (
    <>
      <Ticker />
      <PulseStrip />
      <CategoryTabs />
    </>
  );
}
