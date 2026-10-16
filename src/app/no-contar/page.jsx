import CountToggle from "@/components/CountToggle";

export const metadata = { title: "No contar mis visitas", robots: { index: false, follow: false } };

export default function NoContarPage() {
  return <CountToggle count={false} />;
}
