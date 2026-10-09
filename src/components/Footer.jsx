import { Icon } from "./Icons";
import { profile, contact } from "@/data/profile";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {profile.name}. Hecho con Next.js y mucho café.
        </p>
        <div className="flex items-center gap-4 text-muted">
          {contact.socials.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="hover:text-accent transition">
              <Icon name={s.icon} className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
