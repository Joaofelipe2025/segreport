/** Casca compartilhada das páginas institucionais. */
export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="border-l-[4px] border-lime-400 pl-4 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-[40px]">
          {title}
        </h1>
        <p className="mt-3 pl-4 text-base leading-relaxed text-ink-3">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-ink">{section.heading}</h2>
              <p className="mt-2 text-[15px] leading-[1.75] text-ink-2">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-hairline pt-6 text-xs text-ink-4">
          Texto de demonstração. A redação final deve passar por revisão
          jurídica antes da publicação.
        </p>
      </div>
    </div>
  );
}
