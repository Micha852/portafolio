import { SITE_URL } from "@/lib/site";
import { profile } from "@/data/profile";

export default function sitemap() {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}${profile.cv}`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/llms.txt`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
