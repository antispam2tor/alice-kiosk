import { Sparkles } from 'lucide-react';

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-mark ${inverse ? 'brand-mark--inverse' : ''}`}>
      <span className="brand-mark__icon"><Sparkles size={18} strokeWidth={2.5} /></span>
      <span>Alice</span>
    </div>
  );
}
