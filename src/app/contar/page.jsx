import CountToggle from "@/components/CountToggle";

export const metadata = { title: "Volver a contar mis visitas", robots: { index: false, follow: false } };

export default function ContarPage() {
  return <CountToggle count />;
}
