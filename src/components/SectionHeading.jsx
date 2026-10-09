import Reveal from "./Reveal";

export default function SectionHeading({ number, title, subtitle }) {
  return (
    <Reveal className="mb-12">
      <p className="font-display text-sm font-semibold text-accent tracking-widest">{number}</p>
      <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-2">{title}</h2>
      {subtitle && <p className="text-muted mt-3 max-w-xl">{subtitle}</p>}
    </Reveal>
  );
}
