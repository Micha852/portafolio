import Image from "next/image";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Muestra la foto del perfil o, si no hay, las iniciales
export default function Avatar({ name, photo, position = "center", className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-line bg-surface ${className}`}>
      {photo ? (
        <Image
          src={photo}
          alt={name}
          fill
          sizes="(max-width: 768px) 80vw, 400px"
          className="object-cover"
          style={{ objectPosition: position }}
          priority
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/25 via-surface to-warm/20">
          <span className="font-display text-7xl font-bold text-accent">{initials(name)}</span>
        </div>
      )}
    </div>
  );
}
