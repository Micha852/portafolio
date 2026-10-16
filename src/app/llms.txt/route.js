import { llmsText } from "@/lib/site";

// /llms.txt: el portafolio en texto plano para asistentes de IA
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
