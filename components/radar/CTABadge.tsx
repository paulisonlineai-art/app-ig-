import Badge from '@/components/ui/Badge'
import type { CTAType } from '@/lib/cta-classifier'

const VARIANT: Record<CTAType, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  LINK: 'primary',
  DASHBOARD: 'primary',
  LLAMA: 'warning',
  CTA: 'danger',
  VIDEO: 'success',
  GIFT: 'success',
  SLIDE: 'default',
  GUIA: 'default',
  SKILLS: 'default',
  FORMATOS: 'default',
  NONE: 'default',
}

const LABEL: Record<CTAType, string> = {
  LINK: 'Link',
  DASHBOARD: 'Dashboard',
  LLAMA: 'Llamada',
  CTA: 'Comenta',
  VIDEO: 'Video',
  GIFT: 'Regalo',
  SLIDE: 'Slides',
  GUIA: 'Guía',
  SKILLS: 'Skills',
  FORMATOS: 'Formatos',
  NONE: 'Sin CTA',
}

export default function CTABadge({ type }: { type: CTAType }) {
  return <Badge variant={VARIANT[type]}>{LABEL[type]}</Badge>
}
