import logoImg from './imports/image-62.png'

export function FortinetLogo() {
  return (
    <svg width="250" height="64" viewBox="0 0 554 142" role="img" aria-label="Fortinet SEO Intelligence" className="block text-slate-600">
      <svg x="4" y="8" width="154" height="126" viewBox="92 52 276 226" preserveAspectRatio="xMidYMid meet">
        <image href={logoImg} width="459" height="325" className="mix-blend-multiply" />
      </svg>
      <text x="188" y="82" className="font-mono" fontWeight="500" fontSize="22" letterSpacing="4" fill="currentColor">SEO INTELLIGENCE</text>
      <line x1="550" y1="36" x2="550" y2="108" className="stroke-slate-200" strokeWidth="3" />
    </svg>
  )
}
