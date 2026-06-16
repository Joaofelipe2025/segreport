import type { Metadata } from "next";
import CircularesFilterList from "./CircularesFilterList";

export const metadata: Metadata = {
  title: "Regulação | Segreport",
  description:
    "Acompanhe circulares SUSEP, resoluções CNSP e cartas circulares que regulam o mercado segurador brasileiro.",
};

export default function RegulacaoPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-6">
      <header className="mb-10 max-w-[760px]">
        <h1 className="font-sans text-[32px] font-extrabold leading-tight text-[#1A1A18] md:text-[44px]">
          Regulação
        </h1>
        <p className="mt-3 font-sans text-base font-light leading-relaxed text-[#3D3D3A]">
          Acompanhamento de circulares SUSEP, resoluções CNSP e demais normas que
          impactam o mercado segurador brasileiro, com filtros por ano e por tipo
          de norma.
        </p>
      </header>

      <section aria-label="Circulares e normas SUSEP/CNSP">
        <CircularesFilterList />
      </section>
    </main>
  );
}
