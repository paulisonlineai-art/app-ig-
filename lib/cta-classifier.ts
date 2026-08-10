export type CTAType =
  | 'DASHBOARD'
  | 'VIDEO'
  | 'LLAMA'
  | 'SLIDE'
  | 'GIFT'
  | 'LINK'
  | 'SKILLS'
  | 'FORMATOS'
  | 'CTA'
  | 'GUIA'
  | 'NONE'

const RULES: { type: CTAType; pattern: RegExp }[] = [
  { type: 'LINK', pattern: /\blink\b|\benlace\b|https?:\/\/|www\.\S+/i },
  { type: 'LLAMA', pattern: /\bllama\b|\bagenda\b|\bllamada\b/i },
  { type: 'CTA', pattern: /\bcomenta\b|\bcoment[aá]\b/i },
  { type: 'DASHBOARD', pattern: /\bdashboard\b|\bsoftware\b|\bherramienta\b/i },
  { type: 'VIDEO', pattern: /\bvideo\b|\bmira\b/i },
  { type: 'GIFT', pattern: /\bregalo\b|\bgratis\b|\bfree\b/i },
  { type: 'SLIDE', pattern: /\bslides?\b|\bcarrusel\b/i },
  { type: 'GUIA', pattern: /\bgu[ií]a\b|\bebook\b/i },
]

/** Categorizes a competitor reel's call-to-action from caption keywords. */
export function classifyCTA(caption: string | null | undefined): CTAType {
  if (!caption) return 'NONE'
  for (const { type, pattern } of RULES) {
    if (pattern.test(caption)) return type
  }
  return 'NONE'
}
