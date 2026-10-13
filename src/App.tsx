import { useState, useRef, useCallback, useEffect, type MouseEvent as RMouseEvent } from 'react'
import {
  WEEKS, SECTIONS, CWV_DESKTOP, CWV_MOBILE,
  CG_CATS, CG_METRIC_PCT, ART_METRIC_PCT,
  keyTakeawaysCards, KEY_TAKEAWAYS_PRIORITIES,
} from './dashboardData'
import type { Metric, CgKw, OKKw } from './dashboardData'

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#f3f5fb', surface: '#ffffff', surface2: '#eef1f8',
  line: '#dde1ed', lineSoft: '#e8ebf4',
  red: '#e8291c', redSoft: 'rgba(232,41,28,0.08)',
  teal: '#0891b2', text: '#111827', textMid: '#374151', textDim: '#6b7280',
  mono: "'JetBrains Mono','Courier New',monospace",
  sans: "'Inter',-apple-system,sans-serif",
}
const PALETTE = ['#ee3124','#0891b2','#d97706','#6366f1','#a21caf','#16a34a','#ea580c','#0284c7','#0f766e']

// ─── SOURCE LOGOS (inline SVG paths) ─────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; color: string; bg: string }> = {
  'Semrush':               { label: 'Semrush',               color: '#ff642d', bg: '#fff4f0' },
  'Bing Webmaster Tools':  { label: 'Bing Webmaster Tools',  color: '#008373', bg: '#f0faf9' },
  'Google Search Console': { label: 'Google Search Console', color: '#1a73e8', bg: '#f0f6ff' },
  'Semrush & Ahrefs':      { label: 'Semrush & Ahrefs',      color: '#ff642d', bg: '#fff4f0' },
  'Google PageSpeed':      { label: 'Google PageSpeed',      color: '#34a853', bg: '#f0faf3' },
  'Google Analytics':      { label: 'Google Analytics',      color: '#e37400', bg: '#fff8f0' },
  'Profound':              { label: 'Profound',              color: '#7c3aed', bg: '#f5f3ff' },
}

function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? { label: source, color: '#6366f1', bg: '#f5f3ff' }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: C.mono, fontSize: 12, fontWeight: 600,
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}28`,
      padding: '4px 10px', borderRadius: 6, letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
      {meta.label}
    </div>
  )
}

// ─── SLIDE GROUPS ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'keywords', label: 'Keywords', color: '#ee3124',
    subtitle: 'Page-1 ranking performance across all keyword sets — Google & Bing',
    pages: [
      { title: 'Ranking Insights — Overall Keywords',                     short: 'Overall Keywords',          sub: '(Semrush)', source: 'Semrush' },
      { title: 'Ranking Insights — Bing (Overall Keywords)',              short: 'Overall Keywords',          sub: '(Bing)',     source: 'Bing Webmaster Tools' },
      { title: 'Ranking Insights — Cyberglossary (Overall Keywords)',     short: 'Cyberglossary Keywords',    sub: '(Semrush)', source: 'Semrush' },
      { title: 'Ranking Insights — Cyberglossary (Priority Keywords)',    short: 'Cyberglossary (Primary)',   source: 'GSC' },
      { title: 'Cyberglossary (Category)',                               short: 'Cyberglossary (Category)',  source: 'Semrush' },
      { title: 'Position Trackers & Movers',                             short: 'Keyword Ranking Insights',  source: 'GSC' },
      { title: 'Ranking Insights — Articles (Priority Keywords)',         short: 'Articles (Primary)',        source: 'GSC' },
      { title: 'Featured Snippets',                                       short: 'Featured Snippets',         source: 'Semrush' },
    ],
  },
  {
    key: 'traffic', label: 'Traffic', color: '#2dd4bf',
    subtitle: 'Week-over-week organic, direct, and Bing traffic across all channels',
    pages: [
      { title: 'Traffic Growth',      short: 'Organic Traffic',       source: 'Google Analytics' },
      { title: 'Direct Traffic',      short: 'Direct Traffic',        source: 'Google Analytics' },
      { title: 'GSC Click Growth',    short: 'Search Metrics – GSC',  source: 'Google Search Console' },
      { title: 'Bing Traffic Growth', short: 'Search Metrics – Bing', source: 'Bing Webmaster Tools' },
    ],
  },
  {
    key: 'llms', label: 'LLMs & AI', color: '#7c9cff',
    subtitle: 'AI assistant citation share and AI Overview keyword visibility across platforms',
    pages: [
      { title: 'Search-Generated Engagement (AI Overviews)', short: 'Google AIO',              source: 'Semrush & Ahrefs' },
      { title: 'AIO Competition',                            short: 'Google AIO – Competitions', source: 'Semrush' },
      { title: 'Bing AI Performance',                        short: 'Bing AI Citations',        source: 'Bing Webmaster Tools' },
      { title: 'LLM Traffic',                                short: 'AI Engines Traffic',       source: 'GA' },
    ],
  },
  {
    key: 'llm_metrics', label: 'LLM Metrics', color: '#7c3aed',
    subtitle: 'AI Visibility, Share of Voice, and Citation Rate trends across 9 competitor brands',
    pages: [
      { title: 'AI Visibility %',  short: 'AI Visibility',  source: 'Profound' },
      { title: 'Share of Voice %', short: 'Share of Voice', source: 'Profound' },
      { title: 'Citation Rate %',  short: 'Citation Rate',  source: 'Profound' },
    ],
  },
  {
    key: 'focused_cat', label: 'Focused Category', color: '#059669',
    subtitle: 'Brand AI Visibility % within key cybersecurity product categories',
    pages: [
      { title: 'SASE',             short: 'SASE',             source: 'Profound' },
      { title: 'OT Security',      short: 'OT Security',      source: 'Profound' },
      { title: 'ZTNA',             short: 'ZTNA',             source: 'Profound' },
      { title: 'Cloud Security',   short: 'Cloud Security',   source: 'Profound' },
      { title: 'SecOps',           short: 'SecOps',           source: 'Profound' },
      { title: 'Firewall',         short: 'Firewall',         source: 'Profound' },
      { title: 'Quantum Security', short: 'Quantum Security', source: 'Profound' },
      { title: 'AI Cybersecurity', short: 'AI Cybersecurity', source: 'Profound' },
    ],
  },
  {
    key: 'performance', label: 'Website Score', color: '#f5a524',
    subtitle: 'Technical health, PageSpeed scores, and Core Web Vitals pass/fail history',
    pages: [
      { title: 'Website Performance Score', short: 'Performance Score', source: 'Google PageSpeed' },
      { title: 'Core Web Vitals',           short: 'Core Web Vitals',   source: 'Google Search Console' },
    ],
  },
  {
    key: 'overall_kw', label: 'Primary Keywords', color: '#7c3aed',
    subtitle: 'Full keyword database — Cyberglossary & Articles with 40-week ranking history',
    pages: [
      { title: 'Primary Keywords Explorer', short: 'Primary Keywords', source: 'Semrush' },
    ],
  },
  {
    key: 'gain_loss', label: 'Gain & Loss', color: '#22c55e',
    subtitle: 'AIO traffic gains and top GSC keyword performance',
    pages: [
      { title: 'GL — Gain 2',        short: 'Gain',               source: 'Google Analytics / SEMrush' },
      { title: 'GL — GSC Keywords', short: 'GSC Top 10 Keywords', source: 'Google Search Console' },
    ],
  },
  {
    key: 'key_takeaways', label: 'Key Takeaways', color: '#0f172a',
    subtitle: 'Strategic summary — biggest wins, gaps, and action priorities across the dashboard',
    pages: [
      { title: 'Key Takeaways', short: 'Key Takeaways', source: 'All Sources' },
    ],
  },
] as const

// ─── DATA (imported from ./dashboardData) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// CWV_DESKTOP, CWV_MOBILE, NARR imported from ./dashboardData

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function lastValid(arr: (number|null)[]) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return { val: arr[i] as number, idx: i }
  return { val: null as number|null, idx: -1 }
}
function prevValid(arr: (number|null)[], before: number): number|null {
  for (let i = before - 1; i >= 0; i--) if (arr[i] !== null) return arr[i] as number
  return null
}
function pct(a: number|null, b: number|null) {
  if (a === null || b === null || b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}
function fmtNum(n: number|null, isPctFlag = false): string {
  if (n === null || n === undefined || isNaN(n)) return '—'
  if (isPctFlag) return (n * 100).toFixed(2) + '%'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toFixed(2)
}
const isPct = (name: string) => /%|CTR/i.test(name)
const isLower = (name: string) => /Avg\. Position|Category Rank/i.test(name)
function deltaClass(d: number|null, lb: boolean) {
  if (d === null || Math.abs(d) < 0.05) return 'flat'
  return lb ? (d < 0 ? 'up' : 'down') : (d > 0 ? 'up' : 'down')
}
const arrow = (cls: string) => cls === 'up' ? '▲' : cls === 'down' ? '▼' : '—'
const dColor = (cls: string) => cls === 'up' ? C.teal : cls === 'down' ? C.red : C.textDim

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: (number|null)[]; color: string }) {
  const W = 220, H = 48, p = 3
  const valid = values.map((v,i)=>({v,i})).filter(o=>o.v!==null) as {v:number;i:number}[]
  if (!valid.length) return null
  const vmin = Math.min(...valid.map(o=>o.v))
  const vmax = Math.max(...valid.map(o=>o.v))
  const rng = vmax - vmin || 1
  const n = values.length
  const xAt = (i:number) => p + (n===1?0:(i/(n-1))*(W-2*p))
  const yAt = (v:number) => H - p - ((v-vmin)/rng)*(H-2*p)
  const d = valid.map((o,j)=>`${j===0?'M':'L'}${xAt(o.i).toFixed(1)},${yAt(o.v).toFixed(1)}`).join(' ')
  const area = `${d} L${xAt(valid[valid.length-1].i).toFixed(1)},${H} L${xAt(valid[0].i).toFixed(1)},${H} Z`
  const gid = `g${color.replace('#','')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block',width:'100%',height:H}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} stroke="none"/>
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── SECTION CHART ────────────────────────────────────────────────────────────
type Hover = { idx: number; x: number; y: number } | null

function SectionChart({ metrics, startIdx = 0 }: { metrics: Metric[], startIdx?: number }) {
  const defaultVis = metrics.length <= 6 ? metrics.length : 5
  const [vis, setVis] = useState<boolean[]>(() => metrics.map((_,i)=>i<defaultVis))
  const [hover, setHover] = useState<Hover>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef  = useRef<SVGSVGElement>(null)

  const VW=900, VH=260, pl=56, pr=14, pt=12, pb=28
  const plotW = VW-pl-pr, plotH = VH-pt-pb
  const weeks = WEEKS.slice(startIdx)
  const n = weeks.length

  // ← only count VISIBLE series so the scale recomputes when legend is toggled
  const allV: number[] = []
  metrics.forEach((m, idx) => {
    if (!vis[idx]) return
    m.values.slice(startIdx).forEach(v => { if (v !== null) allV.push(v) })
  })
  const hasData = allV.length > 0
  let vmin = hasData ? Math.min(...allV) : 0
  let vmax = hasData ? Math.max(...allV) : 1
  if (vmin === vmax) { vmin -= 1; vmax += 1 }
  const r0 = vmax - vmin
  vmin -= r0 * 0.1; vmax += r0 * 0.1
  if (vmin > 0 && vmin / (vmax - vmin) < 0.12) vmin = 0

  const xAt = (i: number) => pl + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yAt = (v: number) => pt + plotH - ((v - vmin) / (vmax - vmin)) * plotH
  const firstVisibleIdx = metrics.findIndex((_, i) => vis[i])
  const mainPct = firstVisibleIdx >= 0 ? isPct(metrics[firstVisibleIdx].name) : false

  const onMove = useCallback((e: RMouseEvent<SVGRectElement>) => {
    const svg = svgRef.current, wrap = wrapRef.current; if (!svg || !wrap) return
    const sr = svg.getBoundingClientRect()
    const mx = (e.clientX - sr.left) * (VW / sr.width)
    let i = Math.round(((mx - pl) / plotW) * (n - 1)); i = Math.max(0, Math.min(n - 1, i))
    const wr = wrap.getBoundingClientRect()
    let tx = e.clientX - wr.left + 14, ty = e.clientY - wr.top - 10
    if (tx + 200 > wr.width) tx = e.clientX - wr.left - 214
    setHover({ idx: i, x: Math.max(0, tx), y: Math.max(0, ty) })
  }, [n, plotW])

  const numGridLines = 5
  const gridLines = Array.from({ length: numGridLines }, (_, g) => {
    const yVal = vmin + (vmax - vmin) * (g / (numGridLines - 1))
    return { y: yAt(yVal), label: fmtNum(yVal, mainPct) }
  })
  const step = Math.max(1, Math.ceil(n / 7))

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none"
        style={{ width: '100%', height: 260, display: 'block', overflow: 'visible' }}>
        {/* y-axis labels only — no grid lines */}
        {gridLines.map((g, i) => (
          <text key={i} x={pl - 8} y={g.y + 3.5} textAnchor="end" fontSize={10} fill={C.textDim} fontFamily={C.mono} fontWeight="500">{g.label}</text>
        ))}
        {/* x labels */}
        {Array.from({ length: n }, (_, i) => i).filter(i => i % step === 0).map(i => (
          <text key={i} x={xAt(i)} y={VH - 4} textAnchor="middle" fontSize={10} fill={C.textDim} fontFamily={C.mono}>{weeks[i]}</text>
        ))}
        {/* series lines */}
        {metrics.map((m, idx) => {
          if (!vis[idx]) return null
          const color = PALETTE[idx % PALETTE.length]
          const pts: string[] = []
          m.values.slice(startIdx).forEach((v, i) => { if (v !== null) pts.push(`${pts.length === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`) })
          if (!pts.length) return null
          return <path key={idx} d={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        })}
        {/* hover guide + dots */}
        {hover !== null && (
          <>
            <line x1={xAt(hover.idx)} x2={xAt(hover.idx)} y1={pt} y2={VH - pb}
              stroke={C.textDim} strokeWidth={1} strokeDasharray="3,3" />
            {metrics.map((m, idx) => {
              if (!vis[idx]) return null
              const v = m.values[hover!.idx]; if (v === null || v === undefined) return null
              return <circle key={idx} cx={xAt(hover!.idx)} cy={yAt(v)} r={4} fill={PALETTE[idx % PALETTE.length]} stroke="#fff" strokeWidth={2} />
            })}
          </>
        )}
        <rect x={pl} y={pt} width={Math.max(plotW, 1)} height={Math.max(plotH, 1)}
          fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }} />
      </svg>

      {/* tooltip */}
      {hover !== null && (
        <div style={{
          position: 'absolute', left: hover.x, top: hover.y,
          background: '#fff', border: `1px solid ${C.line}`,
          borderRadius: 10, padding: '10px 14px', fontSize: 13.5,
          pointerEvents: 'none', zIndex: 20, minWidth: 160,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}>
          <div style={{ fontFamily: C.mono, fontSize: 12.5, color: C.textDim, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{weeks[hover.idx]}</div>
          {metrics.map((m, idx) => {
            if (!vis[idx]) return null
            const v = m.values[startIdx + hover!.idx]; if (v === null || v === undefined) return null
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '3px 0', justifyContent: 'space-between' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[idx % PALETTE.length], display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: C.textMid, flex: 1, marginRight: 10, whiteSpace: 'nowrap', fontSize: 13 }}>{m.name}</span>
                <span style={{ fontFamily: C.mono, fontWeight: 700, color: C.text, fontSize: 13 }}>{fmtNum(v, isPct(m.name))}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
        {metrics.map((m, idx) => {
          const on = vis[idx]
          const color = PALETTE[idx % PALETTE.length]
          return (
            <div key={idx} onClick={() => setVis(v => { const nv = [...v]; nv[idx] = !nv[idx]; return nv })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontFamily: C.sans, fontWeight: on ? 500 : 400,
                color: on ? C.textMid : C.textDim,
                border: `1px solid ${on ? color+'55' : C.line}`,
                background: on ? `${color}10` : 'transparent',
                padding: '5px 12px', borderRadius: 20,
                cursor: 'pointer', userSelect: 'none' as const, transition: 'all .15s',
                textDecoration: on ? 'none' : 'line-through',
              }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? color : C.textDim, display: 'inline-block', flexShrink: 0 }} />
              {m.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── KEYWORD DRAWER — DYNAMIC Wk40 FILTERING ───────────────────────────────
// Derives VIEW LIST content from CG_KW_DATA/ART_KW_DATA filtered by wk40 position.
// No static per-bucket lists — position data is always current-week.
function toCgKw(kws: OKKw[]): CgKw[] {
  return kws.map(k => ({
    kw: k.kw,
    url: k.url,
    sv: k.sv,
    kd: k.kd,
    pos: k.wk40 !== null ? String(k.wk40) : '-',
  }))
}


// ─── CYBERGLOSSARY P1 DRAWER ─────────────────────────────────────────────────

// ─── GENERIC CYBERGLOSSARY DRAWER ────────────────────────────────────────────
function CyberglossaryDrawer({ title, color, keywords, onClose, sectionLabel, source }: {
  title: string; color: string;
  keywords: readonly CgKw[]; onClose: () => void;
  sectionLabel?: string; source?: string;
}) {
  const sorted = [...keywords].sort((a, b) => {
    const sa = typeof a.sv === 'number' ? a.sv : (a.sv ? parseInt(String(a.sv)) : -1)
    const sb = typeof b.sv === 'number' ? b.sv : (b.sv ? parseInt(String(b.sv)) : -1)
    return (isNaN(sb) ? -1 : sb) - (isNaN(sa) ? -1 : sa)
  })
  const thStyle: React.CSSProperties = {
    fontFamily: C.sans, fontSize: 13.5, fontWeight: 800, color: C.textMid,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${C.line}`, background: '#ffffff', position: 'sticky', top: 0, zIndex: 1,
  }
  const tdBase: React.CSSProperties = {
    padding: '10px 12px', fontSize: 14.5, fontFamily: C.sans, verticalAlign: 'middle',
  }
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(17,24,39,0.32)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 880,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column',
        maxHeight: '84vh', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: 12, color: C.red, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>
                {sectionLabel ?? 'Cyberglossary — Priority Keywords'}
              </div>
              <div style={{ fontFamily: C.sans, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{title}</div>
              <div style={{ fontFamily: C.mono, fontSize: 13, color: C.textDim, marginTop: 4 }}>
                {keywords.length} keywords · Source: {source ?? 'GSC'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: '#fff', background: color, padding: '5px 14px', borderRadius: 20 }}>
                {keywords.length} Keywords
              </div>
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: '50%', border: `1px solid ${C.line}`,
                background: C.surface2, cursor: 'pointer', fontSize: 16, color: C.textMid,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
              }}>×</button>
            </div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '32%' }} />
              <col style={{ width: '38%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Keywords</th>
                <th style={thStyle}>URLs</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>SV</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>KD</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const slug = row.url.split('/').pop() ?? ''
                const even = i % 2 === 0
                const posStr = (row as any).pos ?? '1'
                const posNum = parseInt(posStr)
                const posColor = isNaN(posNum) ? C.textDim
                  : posNum === 1 ? '#16a34a'
                  : posNum <= 3 ? '#1d4ed8'
                  : posNum <= 10 ? '#ea580c'
                  : C.textMid
                return (
                  <tr key={i} style={{ background: even ? '#ffffff' : '#f8f9fc', borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td style={{ ...tdBase, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.kw}>{row.kw}</td>
                    <td style={{ ...tdBase, overflow: 'hidden' }}>
                      <a href={row.url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none', fontSize: 13.5, fontFamily: C.mono, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>/cyberglossary/{slug}</span>
                        <span style={{ fontSize: 12, opacity: 0.6, flexShrink: 0 }}>↗</span>
                      </a>
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center', fontFamily: C.mono, color: C.textMid, fontSize: 14 }}>{row.sv == null || row.sv === '—' ? '—' : row.sv}</td>
                    <td style={{ ...tdBase, textAlign: 'center', fontFamily: C.mono, color: C.textMid, fontSize: 14 }}>{row.kd == null || row.kd === '—' ? '—' : row.kd}</td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: '#fff', background: posColor, borderRadius: 5, padding: '2px 8px' }}>{posStr}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.line}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
          <span style={{ fontFamily: C.mono, fontSize: 12.5, color: C.textDim }}>
            Scroll to view all {keywords.length} keywords · Click outside to close
          </span>
          <button onClick={onClose} style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 700, color: C.textMid, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: '6px 16px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── STAT MINI ────────────────────────────────────────────────────────────────
function StatMini({ m, badge, metricPct }: { m: Metric; badge?: { label: string; color: string }; metricPct?: string | null }) {
  const ip=isPct(m.name), lb=isLower(m.name)
  const {val:latest,idx:li}=lastValid(m.values)
  const wow=pct(latest,prevValid(m.values,li))
  const cls=deltaClass(wow,lb)

  const hasGoal = m.goal !== null && m.baseline !== null && latest !== null
  const goalExceeded = hasGoal && (lb ? latest! <= m.goal! : latest! >= m.goal!)
  const goalPct = hasGoal
    ? Math.min(100, Math.max(0, lb
        ? ((m.baseline! - latest!) / (m.baseline! - m.goal!)) * 100
        : ((latest! - m.baseline!) / (m.goal! - m.baseline!)) * 100))
    : null

  const goalColor = goalExceeded ? '#16a34a' : '#d97706'

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: '13px 15px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 90,
    }}>
      {/* Row 1: label + optional badge */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,gap:6}}>
        <div style={{fontSize:12.5,color:C.textDim,fontWeight:600,lineHeight:1.3,letterSpacing:'0.025em',textTransform:'uppercase' as const,flex:1,minWidth:0}}>{m.name}</div>
        {badge && (
          <div style={{fontFamily:C.mono,fontSize:11,fontWeight:700,color:'#fff',background:badge.color,borderRadius:5,padding:'2px 7px',letterSpacing:'0.05em',whiteSpace:'nowrap' as const,flexShrink:0}}>
            {badge.label}
          </div>
        )}
      </div>
      {/* Row 2: value + WoW */}
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8,flex:1}}>
        <span style={{fontFamily:C.mono,fontWeight:700,fontSize:16,letterSpacing:'-0.02em',color:C.text}}>{fmtNum(latest,ip)}</span>
        <span style={{fontFamily:C.mono,fontSize:14.5,fontWeight:700,letterSpacing:'-0.01em',color:dColor(cls)}}>{arrow(cls)} {wow===null?'—':Math.abs(wow).toFixed(1)+'% WoW'}</span>
      </div>
      {/* Row 3: baseline / goal — always rendered to lock height */}
      <div style={{marginTop:6}}>
        {hasGoal ? (
          <>
            <div style={{height:4,borderRadius:2,background:C.lineSoft,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${goalPct}%`,borderRadius:2,transition:'width .3s',
                background: goalExceeded ? '#16a34a' : '#d97706'}} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4,fontFamily:C.mono,fontSize:11.5}}>
              <span style={{color:C.textDim}}>Base: {fmtNum(m.baseline,ip)}</span>
              <span style={{color:goalColor,fontWeight:700,fontSize:12,
                background: goalExceeded ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                borderRadius:4,padding:'1px 5px'}}>
                Goal: {fmtNum(m.goal,ip)}{goalExceeded ? ' ✓' : ''}
              </span>
            </div>
          </>
        ) : (
          <div style={{fontSize:12,color:C.textDim,lineHeight:1.4,minHeight:14}}>
            {m.baseline !== null ? `Baseline: ${fmtNum(m.baseline,ip)}` : ''}
            {m.baseline !== null && m.avg6mo !== null ? ' · ' : ''}
            {m.avg6mo !== null ? `6-mo: ${fmtNum(m.avg6mo,ip)}` : ''}
          </div>
        )}
      </div>
      {metricPct && (
        <div style={{textAlign:'center',marginTop:6,fontFamily:C.mono,fontSize:11,color:C.textDim,letterSpacing:'0.03em'}}>
          {metricPct} of all tracked
        </div>
      )}
    </div>
  )
}

// ─── CWV PANEL ────────────────────────────────────────────────────────────────
function CWVPanel() {
  const n = WEEKS.length
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(238,49,36,0.06)',
        border:'1px solid rgba(238,49,36,0.25)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:15,color:'#991b1b'}}>
        ⚠ <strong style={{color:'#7f1d1d'}}>{n} of {n} weeks Failed on Desktop and Mobile</strong> — a confirmed Google ranking signal. This is a ceiling on ranking gains.
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {(['Desktop','Mobile'] as const).map(device=>(
          <div key={device} style={{background:C.surface,border:`1px solid ${C.line}`,borderRadius:12,padding:18}}>
            <div style={{fontFamily:C.mono,fontSize:13,color:C.textDim,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:12}}>
              {device} — Weekly Status
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {(device==='Desktop'?CWV_DESKTOP:CWV_MOBILE).map((v,i)=>(
                <div key={i} title={`${WEEKS[i]}: ${v}`} style={{
                  width:18,height:18,borderRadius:4,
                  background:v==='Pass'?'rgba(45,212,191,0.18)':'rgba(238,49,36,0.18)',
                  border:`1px solid ${v==='Pass'?'rgba(45,212,191,0.45)':'rgba(238,49,36,0.38)'}`,
                }}/>
              ))}
            </div>
            <div style={{fontFamily:C.mono,fontSize:12,color:C.textDim,marginTop:10}}>
              {n} WEEKS · 0 PASSED · {n} FAILED
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CHART CARD ───────────────────────────────────────────────────────────────
function ChartCard({ label, source, metrics }: { label: string; source: string; metrics: Metric[] }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: '20px 20px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: C.sans, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{label}</span>
          <SourceBadge source={source} />
        </div>
        <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, letterSpacing: '0.02em' }}>Hover for values · click legend to toggle</span>
      </div>
      <SectionChart metrics={metrics} />
    </div>
  )
}

// ─── GAIN & LOSS SLIDES ───────────────────────────────────────────────────────
const GL = {
  green: '#16a34a', greenBg: 'rgba(22,163,74,0.07)', greenBorder: 'rgba(22,163,74,0.2)',
  red: '#dc2626',   redBg: 'rgba(220,38,38,0.07)',   redBorder: 'rgba(220,38,38,0.2)',
  blue: '#1d4ed8',  blueBg: 'rgba(29,78,216,0.07)',  blueBorder: 'rgba(29,78,216,0.2)',
}



function GLTable({ cols, rows, nowrap = false }: { cols: string[]; rows: (string|number)[]; nowrap?: boolean }) {
  const colCount = cols.length
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{
        width: '100%',
        tableLayout: 'auto',
        borderCollapse: 'collapse',
        fontFamily: C.mono,
        fontSize: 12,
      }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.line}` }}>
            {cols.map((c, i) => (
              <th key={i} style={{
                padding: nowrap ? '5px 8px' : '6px 10px',
                textAlign: i === 0 ? 'left' as const : 'center' as const,
                color: C.textMid, fontWeight: 700, letterSpacing: '0.03em',
                textTransform: 'uppercase' as const, fontSize: 11,
                whiteSpace: 'nowrap',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows.length / colCount }, (_, ri) => {
            const rowData = rows.slice(ri * colCount, (ri + 1) * colCount)
            const isTotal = String(rowData[0]).toLowerCase() === 'total'
            return (
              <tr key={ri} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: isTotal ? C.surface2 : 'transparent' }}>
                {rowData.map((cell, ci) => {
                  const s = String(cell)
                  const isChange = ci >= colCount - 2
                  const isNeg = isChange && s.startsWith('-')
                  const isPos = isChange && (s.startsWith('+') || (!s.startsWith('-') && ci === colCount - 1 && s !== '0'))
                  return (
                    <td key={ci} style={{
                      padding: nowrap ? '5px 8px' : '7px 10px',
                      textAlign: ci === 0 ? 'left' as const : 'center' as const,
                      color: isNeg ? GL.red : isPos ? GL.green : isTotal ? C.text : C.textMid,
                      fontWeight: isTotal ? 700 : isNeg || isPos ? 600 : 400,
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                    }}>{cell}</td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// shared section-label banner
function GLSectionBanner({ label, title, color, source }: { label: string; title: string; color: string; source: string }) {
  const rgb = color === '#16a34a' ? '22,163,74' : color === '#dc2626' ? '220,38,38' : '29,78,216'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 4, height: 34, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: C.mono, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color, marginBottom: 3, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</div>
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 12, color, background: `rgba(${rgb},0.08)`, border: `1px solid ${color}30`, borderRadius: 5, padding: '4px 10px', fontWeight: 600, letterSpacing: '0.04em' }}>
        Source: {source}
      </div>
    </div>
  )
}

// overall stat pill
function GLStatPill({ label, before, after, change, changePct, color, bgColor, borderColor }: {
  label: string; before: string; after: string; change: string; changePct: string;
  color: string; bgColor: string; borderColor: string;
}) {
  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12, marginBottom: 16 }}>
      <div>
        <div style={{ fontFamily: C.mono, fontSize: 11.5, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color, marginBottom: 5, fontWeight: 700 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{after}</span>
          <span style={{ fontFamily: C.mono, fontSize: 13, color: C.textDim }}>from {before}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{changePct}</div>
        <div style={{ fontFamily: C.mono, fontSize: 13, color: C.textDim, marginTop: 3 }}>{change} sessions</div>
      </div>
    </div>
  )
}

// ── CYBERGLOSSARY CATEGORY SLIDE ──────────────────────────────────────────────
// CatMover, CatData, CG_CATS imported from ./dashboardData

function CGCatSlide() {
  const green  = '#16a34a'
  const red    = '#dc2626'
  const performanceOrder = (cat: CatData) => {
    const page1Pct = cat.total > 0 ? (cat.page1 / cat.total) * 100 : 0
    if (page1Pct >= 90 && cat.avgRank <= 3.0) return 0
    if (page1Pct >= 85 && cat.avgRank <= 4.0) return 1
    if (page1Pct >= 70 && cat.avgRank <= 6.0) return 2
    return 3
  }
  const orderedCategories = [...CG_CATS].sort(
    (a, b) => performanceOrder(a) - performanceOrder(b),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ width: 4, height: 40, borderRadius: 2, background: '#ee3124', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: C.mono, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#ee3124', marginBottom: 3, fontWeight: 700 }}>Cyberglossary — 18 Categories</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Category Performance — Sep 28 → Oct 05</div>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 12, color: '#ee3124', background: '#ee312412', border: '1px solid #ee312430', borderRadius: 5, padding: '4px 10px', fontWeight: 600, letterSpacing: '0.04em' }}>
          Source: GSC, Semrush (AIO)
        </div>
      </div>

      {/* 18-card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {orderedCategories.map((cat) => {
          const pct = cat.total > 0 ? Math.round((cat.page1 / cat.total) * 100) : 0
          const rank1Pct = cat.total > 0 ? Math.round((cat.rank1 / cat.total) * 100) : 0
          const page1Pct = cat.total > 0 ? Math.round((cat.page1 / cat.total) * 100) : 0
          const aioPct  = cat.total > 0 ? Math.round((cat.aio   / cat.total) * 100) : 0

          const statBox = (val: number | string, sub: string, subColor?: string) => (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px', borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</div>
              {sub && <div style={{ fontFamily: C.mono, fontSize: 9.5, color: subColor ?? C.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
            </div>
          )
          const moveBox = (val: number, label: string, color: string, arrow: string) => (
            <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px', borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color, marginTop: 4, fontWeight: 700 }}>{arrow} {label}</div>
            </div>
          )

          return (
            <div key={cat.cat} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Card header strip */}
              <div style={{ borderTop: `4px solid ${cat.color}`, padding: '14px 16px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontFamily: C.sans, fontSize: 16, fontWeight: 800, color: cat.color, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{cat.cat}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30`, borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap' as const, letterSpacing: '0.06em' }}>
                    {cat.page1}/{cat.total} on Pg 1
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 5, borderRadius: 3, background: C.lineSoft, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
              </div>

              {/* Metric rows */}
              <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, display: 'flex' }}>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{cat.total}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginTop: 4, fontWeight: 600 }}>Total KWs</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: cat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{cat.rank1}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginTop: 4, fontWeight: 600 }}>{rank1Pct}% Rank #1</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: cat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{cat.page1}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginTop: 4, fontWeight: 600 }}>{page1Pct}% Page 1</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '10px 4px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em', lineHeight: 1 }}>{cat.aio}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginTop: 4, fontWeight: 600 }}>{aioPct}% AIO</div>
                </div>
              </div>

              {/* Movement row */}
              <div style={{ borderBottom: `1px solid ${C.line}`, display: 'flex' }}>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '9px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: green, lineHeight: 1 }}>{cat.gaining}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: green, marginTop: 4, fontWeight: 700 }}>↑ Gaining</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '9px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: red, lineHeight: 1 }}>{cat.declining}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: red, marginTop: 4, fontWeight: 700 }}>↓ Declining</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '9px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.textMid, lineHeight: 1 }}>{cat.stable}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.textMid, marginTop: 4, fontWeight: 700 }}>— Stable</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '9px 4px', borderRight: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.textDim, lineHeight: 1 }}>{cat.notRanking}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.textDim, marginTop: 4, fontWeight: 700 }}>Not Ranking</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' as const, padding: '9px 4px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>#{cat.avgRank}</div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#d97706', marginTop: 4, fontWeight: 700 }}>Avg Rank</div>
                </div>
              </div>

              {/* Top Movers */}
              <div style={{ padding: '10px 14px 14px' }}>
                <div style={{ fontFamily: C.mono, fontSize: 9.5, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.textDim, fontWeight: 700, marginBottom: 8 }}>
                  Top Movers — Sep 28 → Oct 05
</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Keyword', 'SV', 'Pos Prev→Curr'].map((h, i) => (
                        <th key={i} style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: C.textDim, fontWeight: 700, padding: '3px 4px', textAlign: i === 0 ? 'left' as const : 'center' as const, borderBottom: `1px solid ${C.lineSoft}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.topGain.map((g, i) => (
                      <tr key={`g${i}`}>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', color: C.text, whiteSpace: 'nowrap' as const, overflow: 'hidden', maxWidth: 150, textOverflow: 'ellipsis' }}>
                          <span style={{ color: green, fontWeight: 700, marginRight: 4 }}>↑</span>{g.kw}
                        </td>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', color: C.textMid, textAlign: 'center' as const }}>{g.sv}</td>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', textAlign: 'center' as const }}>
                          <span style={{ background: `${green}15`, color: green, borderRadius: 4, padding: '1px 6px', fontWeight: 700, fontSize: 10.5 }}>#{g.from}→#{g.to}</span>
                        </td>
                      </tr>
                    ))}
                    {cat.topDecl.map((d, i) => (
                      <tr key={`d${i}`}>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', color: C.text, whiteSpace: 'nowrap' as const, overflow: 'hidden', maxWidth: 150, textOverflow: 'ellipsis' }}>
                          <span style={{ color: red, fontWeight: 700, marginRight: 4 }}>↓</span>{d.kw}
                        </td>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', color: C.textMid, textAlign: 'center' as const }}>{d.sv}</td>
                        <td style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 4px', textAlign: 'center' as const }}>
                          <span style={{ background: `${red}15`, color: red, borderRadius: 4, padding: '1px 6px', fontWeight: 700, fontSize: 10.5 }}>#{d.from}→#{d.to}</span>
                        </td>
                      </tr>
                    ))}
                    {cat.topGain.length === 0 && cat.topDecl.length === 0 && (
                      <tr><td colSpan={3} style={{ fontFamily: C.mono, fontSize: 10.5, color: C.textDim, textAlign: 'center' as const, padding: '8px 0' }}>No movement this week</td></tr>
                    )}
                  </tbody>
                </table>

                {/* ── Performance Indicator ── */}
                {(() => {
                  const p1Pct = cat.total > 0 ? (cat.page1 / cat.total) * 100 : 0
                  const ar    = cat.avgRank
                  const level = p1Pct >= 90 && ar <= 3.0 ? 'veryhigh'
                              : p1Pct >= 85 && ar <= 4.0 ? 'high'
                              : p1Pct >= 70 && ar <= 6.0 ? 'attention'
                              : 'low'
                  const cfg = level === 'veryhigh'  ? { label: 'Very High',        color: '#16a34a', icon: '●' }
                            : level === 'high'       ? { label: 'High',             color: '#2563eb', icon: '●' }
                            : level === 'attention'  ? { label: 'Needs Attention',  color: '#d97706', icon: '●' }
                            :                         { label: 'Low Performance',   color: '#dc2626', icon: '●' }
                  return (
                    <div style={{ marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.lineSoft}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 7, color: cfg.color, lineHeight: 1, flexShrink: 0 }}>{cfg.icon}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 10.5, fontWeight: 700, color: cfg.color,
                          background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`,
                          borderRadius: 5, padding: '2px 8px', letterSpacing: '0.04em' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, letterSpacing: '0.02em' }}>
                        Pg1 {Math.round(p1Pct)}% · Avg #{ar}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── POSITION TRACKERS & MOVERS ────────────────────────────────────────────────
function PTSlide() {
  const blue   = '#1d4ed8'
  const orange = '#ea580c'
  const green  = '#16a34a'
  const red    = '#dc2626'
  const purple = '#7c3aed'

  const cardStyle: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22,
    display: 'flex', flexDirection: 'column', gap: 0,
  }
  const headingStyle = (color: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
  })
  const dot = (color: string) => (
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
  )
  const sectionTitle = (color: string, label: string, sub: string) => (
    <div style={headingStyle(color)}>
      {dot(color)}
      <div>
        <div style={{ fontFamily: C.mono, fontSize: 13.5, fontWeight: 800, color: C.text, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, marginTop: 3, letterSpacing: '0.02em' }}>{sub}</div>
      </div>
    </div>
  )

  const thStyle: React.CSSProperties = {
    fontFamily: C.mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: C.textDim, fontWeight: 700, padding: '6px 10px', textAlign: 'left',
    borderBottom: `2px solid ${C.line}`, whiteSpace: 'nowrap',
  }
  const tdBase: React.CSSProperties = {
    fontFamily: C.mono, fontSize: 12.5, padding: '7px 10px', whiteSpace: 'nowrap',
    borderBottom: `1px solid ${C.lineSoft}`,
  }

  // ── Section 1: Rock-Solid Rank #1 ──────────────────────────────────────────
const rockSolid = [
    { kw: 'What Is An Ip Address', sv: '135K', weeks: '35/40', wkData: [4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Machine Learning', sv: '60.5K', weeks: '22/40', wkData: [6,2,1,1,1,1,1,1,5,10,1,1,2,7,3,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,null,null] },
    { kw: 'Hacking', sv: '18.1K', weeks: '38/40', wkData: [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'SASE', sv: '14.8K', weeks: '25/40', wkData: [1,1,1,1,1,1,2,2,3,4,3,4,6,4,4,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'CIA Triad', sv: '9.9K', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Vulnerability Assessment', sv: '9.9K', weeks: '25/40', wkData: [2,2,2,2,3,3,2,3,4,5,6,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,3] },
    { kw: 'Firewall Configuration', sv: '5.4K', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6] },
    { kw: 'How Does A VPN Work', sv: '5.4K', weeks: '31/40', wkData: [2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,3,3,2] },
    { kw: 'Unified Threat Management', sv: '4.4K', weeks: '38/40', wkData: [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'P2P VPN', sv: '3.6K', weeks: '15/40', wkData: [1,1,1,1,1,1,1,1,1,2,4,6,7,4,4,5,3,3,3,4,4,3,3,3,3,5,5,4,11,2,1,1,1,1,1,1,7,8,11,14] },
    { kw: 'Colocation Data Center', sv: '3.6K', weeks: '36/40', wkData: [2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Recent Cyber Attacks', sv: '3.6K', weeks: '16/40', wkData: [8,8,4,6,3,4,3,2,3,3,3,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,29,28,31,27,2,2,2,2] },
    { kw: "Shor's Algorithm", sv: '3.6K', weeks: '25/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,6,6,8,6,10,8,9,6,2,2,3,5,1,2,4] },
    { kw: 'End Of Life Firewall', sv: '2.9K', weeks: '17/40', wkData: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Types Of Cyber Attacks', sv: '2.9K', weeks: '38/40', wkData: [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Trojan Horse Virus', sv: '2.9K', weeks: '36/40', wkData: [1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'What Is Internet Security', sv: '2.9K', weeks: '34/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,2,4,5,2,1,1,1] },
    { kw: 'Content Filtering', sv: '2.4K', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'What Is A Pst File', sv: '2.4K', weeks: '17/40', wkData: [6,3,2,3,2,3,3,3,5,5,4,2,2,2,2,5,5,2,2,3,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Data Center Security', sv: '2.4K', weeks: '24/40', wkData: [11,16,13,13,12,13,9,8,7,5,7,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Sandboxing', sv: '1.9K', weeks: '20/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,5,6,5,5,7,6,6,2,6,6,6,5,4,5,4,4,4,4] },
    { kw: 'Http Proxy', sv: '1.9K', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Nist Compliance', sv: '1.9K', weeks: '33/40', wkData: [1,1,1,1,1,1,1,1,1,1,3,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Radius Protocol', sv: '1.9K', weeks: '17/40', wkData: [3,2,1,2,3,2,2,2,4,2,3,2,2,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1] },
    { kw: 'Keyloggers', sv: '1.9K', weeks: '36/40', wkData: [3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'What Does A Firewall Do', sv: '1.6K', weeks: '24/40', wkData: [8,8,6,6,7,6,7,5,3,3,3,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Tailgating Attack', sv: '1.6K', weeks: '17/40', wkData: [1,1,1,1,1,1,1,1,1,1,3,3,2,2,2,2,3,2,2,2,3,2,2,3,2,2,3,2,2,3,2,1,1,1,1,1,1,1,2,2] },
    { kw: 'Advanced Threat Protection', sv: '1.6K', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3] },
    { kw: 'Service Set Identifier', sv: '1.3K', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: '802.1X Authentication', sv: '1.3K', weeks: '28/40', wkData: [2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Login Credentials', sv: '1.3K', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Static Vs Dynamic Ip Address', sv: '1.3K', weeks: '28/40', wkData: [3,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Firewall As A Service', sv: '1K', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Stateful Vs Stateless Firewall', sv: '1K', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'ZTNA Vs VPN', sv: '1K', weeks: '24/40', wkData: [9,3,12,8,5,5,2,2,2,4,3,5,2,4,5,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'SAML Vs OAUTH', sv: '1K', weeks: '28/40', wkData: [2,5,9,9,5,5,4,3,2,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Compliance Automation', sv: '1K', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Digital Certificates', sv: '1K', weeks: '33/40', wkData: [1,1,1,1,1,1,2,2,2,4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Types Of Phishing Attacks', sv: '1K', weeks: '32/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,null,3,4,3,3,2,2,1,1,1] },
    { kw: 'LDAP Authentication', sv: '880', weeks: '19/40', wkData: [6,6,9,11,7,7,4,5,5,3,2,4,3,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,3,2,2] },
    { kw: 'Tcp Ip Model Vs Osi Model', sv: '880', weeks: '36/40', wkData: [1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'DOS Vs DDOS', sv: '880', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Shift Left Security', sv: '880', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Network Security Threats', sv: '720', weeks: '39/40', wkData: [5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Network Traffic', sv: '720', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'It Security Policy', sv: '720', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'DNS Protection', sv: '590', weeks: '19/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2,2,2,5,11,10,10,9,12,4,4,4,7,9,7,13,9,4,5,13] },
    { kw: 'How Does A Firewall Work', sv: '590', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Proxy Firewall', sv: '590', weeks: '36/40', wkData: [1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'SD WAN As A Service', sv: '590', weeks: '37/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,2,34,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Authentication Token', sv: '590', weeks: '24/40', wkData: [3,3,4,4,3,3,4,4,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,9,9,2,2,1,1] },
    { kw: 'Healthcare Data Security', sv: '590', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Cyber Extortion', sv: '590', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'SPAM Filtering', sv: '590', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Emailsecurity Best Practices', sv: '590', weeks: '25/40', wkData: [10,9,6,9,10,10,2,3,3,2,2,2,3,2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Soc 1 Compliance', sv: '590', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Pos Security', sv: '480', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Network Access Control List', sv: '480', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1] },
    { kw: 'Transparent Proxy', sv: '480', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Network EDGE', sv: '480', weeks: '36/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,7,3,3,2] },
    { kw: 'Vulnerability Scanning Vs Penetration Testing', sv: '390', weeks: '19/40', wkData: [4,3,3,3,3,3,3,3,3,5,2,3,3,2,5,2,1,1,1,1,1,1,1,2,2,1,1,1,2,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'SD WAN Benefits', sv: '390', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,1,1,1,1,1,1,1,1,1,1,1,5,1,1,1] },
    { kw: 'What Is Traceroute', sv: '390', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2] },
    { kw: 'Solarwinds Cyber Attack', sv: '390', weeks: '32/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Deception Technology', sv: '390', weeks: '21/40', wkData: [2,3,3,3,3,4,3,4,4,4,3,4,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Enterprise VPN Solutions', sv: '390', weeks: '17/40', wkData: [8,5,4,4,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,3,20,25,29,23,10,6,8,4,3,3,2] },
    { kw: 'Waf Vs Firewall', sv: '320', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Data Egress', sv: '320', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Honey Tokens', sv: '320', weeks: '29/40', wkData: [2,2,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Network DLP', sv: '320', weeks: '37/40', wkData: [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Signs Of Malware', sv: '260', weeks: '28/40', wkData: [3,2,5,3,3,6,6,2,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,1,1,6] },
    { kw: 'SDN Vs SD WAN', sv: '210', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'IOT Security Best Practices', sv: '210', weeks: '22/40', wkData: [5,5,15,16,16,22,16,18,22,22,3,2,4,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3] },
    { kw: 'Cybersecurity Mesh', sv: '210', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'URL Phishing', sv: '210', weeks: '37/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,28,1,1,1,1,1,1,1,1,1,1,4,4] },
    { kw: 'What Is Remote Access', sv: '210', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Perimeter Firewall', sv: '170', weeks: '37/40', wkData: [1,1,1,1,1,1,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'NGFW Vs UTM', sv: '170', weeks: '23/40', wkData: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Network Security Vulnerability', sv: '110', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2] },
    { kw: 'Universal ZTNA', sv: '110', weeks: '34/40', wkData: [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,41,19,17,28] },
    { kw: 'Web Security Threats', sv: '110', weeks: '25/40', wkData: [3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,5,3,5,4,3,2,2,2,2,2,2,2,1,1,1,1] },
    { kw: 'Types Of Endpoint Security', sv: '110', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'What Is An Open Proxy', sv: '110', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'DLP Monitoring', sv: '110', weeks: '32/40', wkData: [null,null,null,2,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Network Security Vs Cybersecurity', sv: '90', weeks: '37/40', wkData: [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'DDOS Mitigation', sv: '90', weeks: '24/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,11,11,9,8,9,9,13,11,10,6,4,11,9,5,9] },
    { kw: 'IT Vs OT Security', sv: '70', weeks: '34/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,5,3,3,2,2,1,1] },
    { kw: 'Quantum Safe Security', sv: '70', weeks: '28/40', wkData: [3,3,1,1,1,1,3,2,2,2,2,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'SD WAN Vs SASE', sv: '70', weeks: '25/40', wkData: [2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,2,2,2,2,2,3,3,1,1] },
    { kw: 'Eavesdropping Attack', sv: '70', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
    { kw: 'Diy Vs Managed SD WAN', sv: '70', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'IOT Device Vulnerabilities', sv: '70', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Transparent Firewall', sv: '50', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4] },
    { kw: 'Firewall Benefits', sv: '50', weeks: '35/40', wkData: [2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5] },
    { kw: 'Security-As-A-Service', sv: '50', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Phishing Email Analysis', sv: '50', weeks: '36/40', wkData: [1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,2,1,1] },
    { kw: 'Branch Networking', sv: '50', weeks: '15/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,3,2,2,2,2,3,3,3,3,3,2,2,2,3,2,2,5,4,5,5] },
    { kw: 'DLP As A Service', sv: '50', weeks: '35/40', wkData: [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Sovereign SASE', sv: '40', weeks: '28/40', wkData: [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,4,2,2,3,2,2,1,1,15,11,1,1] },
    { kw: 'Canary In Cybersecurity', sv: '40', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Ransomware Settlement', sv: '40', weeks: '20/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,2,2,2,2,2,2,2,2,2,12,12,16,13,10,10,10,1,2,1,1] },
    { kw: 'Fabric Of Security', sv: '40', weeks: '25/40', wkData: [1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,14,1] },
    { kw: 'File Sharing Security', sv: '40', weeks: '34/40', wkData: [null,null,null,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Secops Metrics', sv: '30', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Does Firewall Slow Down Internet Speed', sv: '20', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Hybrid Firewall', sv: '20', weeks: '34/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2,2,2,2,1,1,1,1] },
    { kw: 'Endpoint Security For Mobile Devices', sv: '20', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,1,1] },
    { kw: 'Malware Vs Virus Vs Worm', sv: '20', weeks: '38/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2] },
    { kw: 'Proxy Server Vs Packet Filtering Firewall', sv: '10', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Cybersecurity Tools For Small Business', sv: '10', weeks: '33/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,3,3,3,1,1,1,2] },
    { kw: 'Ransomware Jargon', sv: '10', weeks: '40/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Cyber Attacks On Small Business', sv: '0', weeks: '24/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,7,3,3,4,25,27,19,17,28,40,22,2,4,5,5] },
    { kw: 'Web Application Firewall For Enterprise', sv: '0', weeks: '15/40', wkData: [2,2,1,2,2,2,1,1,1,1,1,2,3,2,4,1,2,2,1,1,1,2,3,3,39,1,1,1,1,1,3,6,3,6,7,5,21,2,2,18] },
    { kw: 'Virtual Firewall For Zero Trust', sv: '0', weeks: '39/40', wkData: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3] },
    { kw: 'Private 5G Warehousing', sv: '0', weeks: '27/40', wkData: [null,null,null,3,3,3,2,2,1,3,2,1,1,2,3,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Active Defense', sv: '170', weeks: '16/40', wkData: [4,2,2,4,3,2,3,3,3,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,2,4,3,1,1,1,1,1,2,7,7,9,1,1,1,1] },
    { kw: 'Rise Of Cybersecurity Mesh', sv: '170', weeks: '16/40', wkData: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,27,29,29,24,20,19,56,56,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Remote Work Cybersecurity', sv: '40', weeks: '16/40', wkData: [5,7,2,7,8,8,8,8,3,3,3,5,5,4,5,4,4,4,4,4,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kw: 'Kerberos Authentication', sv: '1.9K', weeks: '15/40', wkData: [2,2,3,2,2,1,1,1,1,2,2,3,2,1,1,1,2,3,1,1,3,4,3,1,2,1,1,1,2,14,5,14,14,10,7,13,3,2,1,1] },
  ]

// ── Section 2: Volatile Keywords ───────────────────────────────────────────
  const volatile = [
    { kw: 'GDPR', sv: '49.5K', wk34: 43, weeks: [null,null,null,1,1,13,13,13,13,48,39,39,39,39,39,57,79,79,79,78,1,1,42,42,40,41,40,42,41,71,68,44,2,2,48,1,44,44,42,43] },
    { kw: 'Phishing', sv: '49.5K', wk34: 7, weeks: [7,8,15,9,12,17,9,14,10,11,10,7,7,11,8,8,10,10,9,5,11,9,9,9,7,9,8,9,8,22,19,15,32,35,29,30,8,7,8,7] },
    { kw: 'Virtual Machine', sv: '40.5K', wk34: 9, weeks: [null,null,32,37,37,32,36,16,14,7,4,5,6,4,7,19,10,20,20,24,3,9,7,4,14,1,2,5,3,48,47,45,45,47,48,55,30,9,9,9] },
    { kw: 'OSI Model', sv: '33.1K', wk34: 1, weeks: [15,13,13,11,11,17,13,8,10,6,8,3,16,4,4,3,8,20,2,17,13,11,16,14,7,13,11,10,17,2,2,2,22,26,24,23,36,36,35,1] },
    { kw: 'Identity Theft', sv: '22.2K', wk34: 8, weeks: [42,55,54,40,49,58,56,9,9,5,10,14,8,5,3,9,19,11,10,16,32,20,11,21,15,15,15,17,13,1,11,7,5,3,7,7,14,28,8,8] },
    { kw: 'Data Governance', sv: '12.1K', wk34: 30, weeks: [22,21,25,24,24,23,24,20,19,19,17,15,12,14,9,16,24,25,26,18,17,23,23,22,24,27,29,28,35,5,6,5,4,6,5,5,44,31,35,30] },
    { kw: 'Personally Identifiable Information', sv: '12.1K', wk34: 27, weeks: [23,13,30,9,11,24,13,13,10,5,6,6,13,12,7,18,16,26,26,23,21,25,25,28,29,25,23,24,26,8,6,6,6,6,4,3,25,25,31,27] },
    { kw: 'RBAC', sv: '9.9K', wk34: 2, weeks: [11,19,18,21,21,14,13,7,13,12,11,12,13,9,9,10,8,8,9,15,4,7,12,8,14,12,24,8,14,34,34,21,32,20,18,11,15,6,3,2] },
    { kw: 'Zero Trust', sv: '9.9K', wk34: 76, weeks: [null,null,null,null,null,null,null,null,null,null,null,54,67,66,56,60,63,57,null,24,24,24,24,24,null,null,null,57,57,3,4,3,2,5,4,3,76,72,78,76] },
    { kw: 'OIDC', sv: '9.9K', wk34: 14, weeks: [7,3,4,5,3,4,3,4,5,6,7,5,6,8,4,7,10,10,3,7,9,15,12,8,6,14,11,16,16,9,6,9,9,68,68,68,18,19,17,14] },
    { kw: 'Zero Trust Architecture', sv: '6.6K', wk34: 55, weeks: [42,45,45,39,34,24,32,4,19,17,14,15,13,8,9,13,14,35,46,24,22,32,36,51,53,55,53,42,50,6,6,6,4,4,3,3,42,26,26,55] },
    { kw: 'Common Vulnerabilities And Exposures', sv: '6.6K', wk34: 22, weeks: [18,19,8,22,25,22,18,12,15,19,10,9,19,14,9,10,13,20,18,19,13,14,26,21,18,19,18,20,22,21,20,21,2,2,19,19,26,28,17,22] },
    { kw: 'Sarbanes-Oxley Act', sv: '6.6K', wk34: null, weeks: [6,7,6,2,7,11,8,6,6,5,8,8,2,2,2,2,1,4,3,56,3,2,1,5,4,4,5,5,3,9,19,17,18,17,17,20,null,null,null,null] },
    { kw: 'Principle Of Least Privilege', sv: '5.4K', wk34: 11, weeks: [null,null,null,13,11,14,13,4,3,5,6,4,5,4,8,18,14,19,20,13,20,18,23,25,25,19,24,23,24,2,3,4,3,4,5,5,30,25,14,11] },
    { kw: 'CNapp', sv: '5.4K', wk34: 12, weeks: [21,31,38,30,20,27,27,12,10,13,13,11,20,18,11,12,14,28,16,12,15,27,14,12,13,21,12,10,18,25,29,29,28,33,29,29,15,14,10,12] },
    { kw: 'Identity And Access Management', sv: '5.4K', wk34: 9, weeks: [11,11,14,17,14,12,15,14,8,11,9,9,8,9,13,8,9,9,7,8,13,9,10,9,7,7,25,10,24,2,4,4,4,4,4,2,19,7,9,9] },
    { kw: 'CSPM', sv: '5.4K', wk34: 7, weeks: [15,11,20,28,29,16,11,6,3,4,5,4,6,6,4,11,18,22,14,7,7,10,6,5,23,26,19,12,13,5,7,8,7,6,6,7,27,15,8,7] },
    { kw: 'NGFW', sv: '4.4K', wk34: 45, weeks: [null,null,null,null,null,null,null,null,null,null,null,null,71,11,1,3,5,5,3,12,7,9,24,29,26,22,30,32,13,21,18,20,19,2,18,24,28,40,30,45] },
    { kw: 'Application Security', sv: '4.4K', wk34: 15, weeks: [17,19,31,18,18,25,17,11,12,22,21,16,14,17,16,15,14,18,22,20,11,13,21,21,21,18,19,15,22,22,29,20,26,16,5,35,29,27,8,15] },
    { kw: 'Enterprise Architecture', sv: '3.6K', wk34: 6, weeks: [19,26,19,19,21,18,17,14,16,7,15,13,13,11,7,32,15,12,13,9,10,11,14,12,15,23,12,24,30,3,4,3,3,4,3,3,9,5,6,6] },
    { kw: 'Shadow It', sv: '3.6K', wk34: 9, weeks: [8,11,11,12,6,13,10,8,12,11,7,8,7,10,5,13,10,12,12,8,13,19,22,17,23,21,15,19,23,21,22,17,18,14,5,7,10,8,8,9] },
    { kw: 'Post Quantum Cryptography', sv: '3.6K', wk34: 10, weeks: [17,2,1,1,2,2,2,2,4,9,4,9,5,2,20,3,3,2,2,2,2,3,10,2,19,18,2,17,10,18,22,21,11,12,9,7,9,10,12,10] },
    { kw: 'EDGE Computing', sv: '3.6K', wk34: 34, weeks: [22,20,16,19,21,20,20,12,11,11,8,8,9,9,12,15,18,21,22,19,11,21,19,7,20,23,16,23,28,29,30,19,25,2,28,28,33,13,36,34] },
    { kw: 'Cloud NATive', sv: '2.9K', wk34: 24, weeks: [41,34,35,46,42,27,32,14,5,3,22,9,33,28,32,16,26,35,35,30,30,38,41,44,36,38,42,40,43,8,10,9,6,7,8,12,42,41,39,24] },
    { kw: 'Business Email Compromise', sv: '2.9K', wk34: 19, weeks: [19,15,10,6,11,13,10,13,17,13,18,16,19,13,10,24,25,27,25,23,15,23,23,25,25,23,24,24,23,25,28,2,5,9,7,7,25,22,20,19] },
    { kw: 'Bring Your Own Device', sv: '2.4K', wk34: 7, weeks: [5,10,7,7,8,11,9,6,7,8,7,8,8,7,9,8,9,11,10,13,24,23,30,17,48,10,5,21,13,28,27,28,28,26,25,26,68,6,6,7] },
    { kw: 'Data Discovery', sv: '1.9K', wk34: 51, weeks: [null,null,null,53,54,51,52,54,67,45,59,52,54,53,54,53,87,81,76,78,78,57,58,58,58,58,48,48,48,79,2,2,72,2,78,51,23,30,21,51] },
    { kw: 'Web Application Security', sv: '1.9K', wk34: 18, weeks: [14,19,35,18,16,16,16,12,9,3,5,8,4,6,2,7,8,10,21,14,20,8,10,5,5,5,26,27,26,6,2,6,5,9,7,11,25,28,31,18] },
    { kw: 'Virtual Desktop Infrastructure', sv: '1.9K', wk34: 27, weeks: [6,7,17,20,10,19,15,15,23,19,16,19,15,9,9,19,21,27,28,22,22,25,24,20,27,31,29,31,24,7,7,6,5,2,18,15,29,28,28,27] },
    { kw: 'CTEM', sv: '1.6K', wk34: 6, weeks: [null,null,null,5,4,9,5,6,6,11,16,6,5,11,9,10,8,13,15,19,16,14,19,17,23,21,22,26,24,35,33,31,20,18,21,18,17,7,7,6] },
    { kw: 'AIOPS', sv: '1.3K', wk34: 22, weeks: [16,16,17,17,18,13,14,16,23,13,8,16,15,17,17,19,16,23,27,21,19,25,24,21,17,18,13,17,24,20,23,25,26,24,12,28,34,22,18,22] },
    { kw: 'Information Security', sv: '1K', wk34: 24, weeks: [10,12,17,13,9,12,13,17,19,10,11,11,10,10,10,15,19,14,23,26,21,25,21,32,29,25,31,27,30,25,25,28,27,13,7,18,29,29,36,24] },
    { kw: 'Infrastructure As Code', sv: '880', wk34: 12, weeks: [38,41,39,41,29,37,34,12,4,7,5,8,14,5,3,14,7,15,21,19,18,21,25,14,19,16,25,23,23,6,4,4,8,9,7,6,26,22,22,12] },
    { kw: 'Best Virtual Firwall', sv: '590', wk34: 1, weeks: [null,null,null,9,9,9,5,9,9,74,1,4,3,12,6,4,4,8,10,16,9,15,12,8,null,4,8,null,null,46,4,3,4,5,5,5,15,15,1,1] },
    { kw: 'Ransomware Statistics', sv: '590', wk34: 20, weeks: [1,1,1,14,6,7,4,6,4,4,10,5,8,8,9,16,18,5,9,11,15,10,9,21,20,18,6,9,20,41,46,39,18,13,20,29,20,7,6,20] },
    { kw: 'Quantum Safe Encryption', sv: '390', wk34: 26, weeks: [1,1,1,2,3,4,4,6,7,31,33,3,36,22,43,41,21,32,32,28,9,9,9,9,8,8,8,8,5,28,2,2,25,2,43,23,55,23,65,26] },
    { kw: 'Zero Trust Cloud', sv: '390', wk34: 6, weeks: [null,null,null,11,9,10,10,14,15,2,8,6,6,6,3,10,11,9,9,7,6,17,11,22,21,19,36,26,36,5,3,4,6,4,5,11,9,9,9,6] },
    { kw: 'DNS Firewall', sv: '320', wk34: 2, weeks: [4,3,14,4,3,3,5,3,2,16,3,15,18,18,5,20,20,1,3,13,10,5,10,6,3,6,10,9,10,10,7,9,7,6,6,6,9,11,3,2] },
    { kw: 'Digital Operational Resilience Act', sv: '140', wk34: 33, weeks: [null,null,null,null,null,17,21,8,20,23,19,18,20,19,16,16,16,16,27,15,16,19,18,21,19,36,30,43,31,14,17,16,15,17,21,16,17,19,18,33] },
    { kw: 'Cloud Native Firewall', sv: '50', wk34: 8, weeks: [1,1,1,41,41,41,41,28,28,28,28,41,43,43,14,43,77,61,69,69,69,69,51,52,60,40,45,5,7,20,17,23,17,22,18,18,16,17,8,8] },
  ]

// ── Section 3: Top Gainers (Wk39 → Wk40) ──────────────────────────────────
  const gainers = [
    { kw: 'CI/CD Pipelines', cat: 'Cyber Security', sv: '3.6K', from: 99, to: 2, gain: 97 },
    { kw: 'Quantum Safe Encryption', cat: 'Quantum Security', sv: '390', from: 65, to: 26, gain: 39 },
    { kw: 'OSI Model', cat: 'Network Security', sv: '33.1K', from: 35, to: 1, gain: 34 },
    { kw: 'Prompt Injection Attack', cat: 'Data Security', sv: '1.0K', from: 25, to: 3, gain: 22 },
    { kw: 'Secret Management', cat: 'Data Security', sv: '590', from: 27, to: 9, gain: 18 },
    { kw: 'Cloud NATive', cat: 'Cloud Security', sv: '2.9K', from: 39, to: 24, gain: 15 },
    { kw: 'Threat Hunting', cat: 'Cyber Threats', sv: '4.4K', from: 25, to: 12, gain: 13 },
    { kw: 'Border Gateway Protocol', cat: 'Network Security', sv: '2.4K', from: 21, to: 8, gain: 13 },
    { kw: 'Fabric Of Security', cat: 'Cyber Security', sv: '40', from: 14, to: 1, gain: 13 },
    { kw: 'Web Application Security', cat: 'Security Operations (SecOps)', sv: '1.9K', from: 31, to: 18, gain: 13 },
    { kw: 'Information Security', cat: 'Cyber Security', sv: '1.0K', from: 36, to: 24, gain: 12 },
    { kw: 'Infrastructure As Code', cat: 'Cloud Security', sv: '880', from: 22, to: 12, gain: 10 },
    { kw: 'SOC', cat: 'Security Operations (SecOps)', sv: '40.5K', from: 23, to: 13, gain: 10 },
    { kw: 'Cloud Security Architecture', cat: 'Cloud Security', sv: '2.4K', from: 11, to: 2, gain: 9 },
    { kw: 'Supply Chain Attacks', cat: 'Cyber Threats', sv: '720', from: 16, to: 8, gain: 8 },
  ]

// ── Section 4: Top Decliners (Wk39 → Wk40) ─────────────────────────────────
  const decliners = [
    { kw: 'Data Discovery', cat: 'Data Security', sv: '1.9K', from: 21, to: 51, drop: 30 },
    { kw: 'Zero Trust Architecture', cat: 'ZTNA', sv: '6.6K', from: 26, to: 55, drop: 29 },
    { kw: 'Web Application Firewall For Enterprise', cat: 'NGFW/firewall', sv: '0', from: 2, to: 18, drop: 16 },
    { kw: 'NGFW', cat: 'NGFW/firewall', sv: '4.4K', from: 30, to: 45, drop: 15 },
    { kw: 'Digital Operational Resilience Act', cat: 'Cyber Compliance', sv: '140', from: 18, to: 33, drop: 15 },
    { kw: 'Ransomware Statistics', cat: 'Cyber Threats', sv: '590', from: 6, to: 20, drop: 14 },
    { kw: 'OT Security Best Practices', cat: 'OT Security', sv: '140', from: 9, to: 20, drop: 11 },
    { kw: 'Virtual Firewall', cat: 'NGFW/firewall', sv: '1.0K', from: 1, to: 12, drop: 11 },
    { kw: 'Universal ZTNA', cat: 'ZTNA', sv: '110', from: 17, to: 28, drop: 11 },
    { kw: 'Intrusion Detection System', cat: 'Network Security', sv: '5.4K', from: 8, to: 18, drop: 10 },
    { kw: 'Zero Trust EDGE', cat: 'ZTNA', sv: '260', from: 5, to: 14, drop: 9 },
    { kw: 'DNS Protection', cat: 'Network Security', sv: '590', from: 5, to: 13, drop: 8 },
    { kw: 'Application Performance Monitoring', cat: 'Network Security', sv: '6.6K', from: 18, to: 26, drop: 8 },
    { kw: 'SAML Vs OAUTH Vs Open Id', cat: 'Access Control', sv: '20', from: 12, to: 19, drop: 7 },
    { kw: 'Application Security', cat: 'Network Security', sv: '4.4K', from: 8, to: 15, drop: 7 },
  ]

  const VolSparkline = ({ weeks, color }: { weeks: (number | null)[]; color: string }) => {
    const W = 120, H = 34, pad = 4
    const valid = weeks.filter((w): w is number => w !== null)
    if (valid.length < 2) return <span style={{ color: '#aaa', fontSize: 11 }}>—</span>
    const maxV = Math.max(...valid), minV = Math.min(...valid)
    const range = maxV - minV || 1
    const pts = weeks.map((w, i) => {
      if (w === null) return null
      const x = pad + (i / (weeks.length - 1)) * (W - pad * 2)
      const y = pad + ((w - minV) / range) * (H - pad * 2)
      return { x, y }
    })
    const segs: string[] = []
    let seg: string[] = []
    for (let i = 0; i < pts.length; i++) {
      if (pts[i] === null) { if (seg.length > 1) segs.push(seg.join(' ')); seg = [] }
      else { seg.push(`${pts[i]!.x.toFixed(1)},${pts[i]!.y.toFixed(1)}`) }
    }
    if (seg.length > 1) segs.push(seg.join(' '))
    return (
      <div style={{ width: W, height: H, flexShrink: 0, margin: '0 auto' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible" style={{ display: 'block' }}>
          {segs.map((s, i) => <polyline key={i} points={s} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />)}
        </svg>
      </div>
    )
  }

  const accentBg = (color: string) => `${color}12`
  const accentBorder = (color: string) => `${color}30`

  const summaryPill = (color: string, label: string, value: string) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: accentBg(color), border: `1px solid ${accentBorder(color)}`,
      borderRadius: 8, padding: '5px 12px', marginBottom: 14,
    }}>
      <span style={{ fontFamily: C.mono, fontSize: 11, color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</span>
      <span style={{ fontFamily: C.mono, fontSize: 12.5, color: C.text, fontWeight: 700 }}>{value}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Page banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ width: 4, height: 40, borderRadius: 2, background: blue, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: C.mono, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: blue, marginBottom: 3, fontWeight: 700 }}>Cyberglossary — Priority Keywords</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Keyword Ranking Insights — Wk1 → Wk40 (40 weeks)</div>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 12, color: blue, background: accentBg(blue), border: `1px solid ${accentBorder(blue)}`, borderRadius: 5, padding: '4px 10px', fontWeight: 600, letterSpacing: '0.04em' }}>
          Source: GSC
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* ── Card 1: Rock-Solid Rank #1 ─────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(green, 'Rock-Solid Rank #1 — Consistent Holders', 'Rank #1 in 15+ of 40 tracked weeks')}
          {summaryPill(green, 'Qualifiers', `${rockSolid.length} keywords`)}
          <div style={{ overflowY: 'auto', maxHeight: 420, overflowX: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col />
                <col style={{ width: 52 }} />
                <col style={{ width: 74 }} />
                <col style={{ width: 46 }} />
                <col style={{ width: 132 }} />
              </colgroup>
              <thead>
                <tr>
                  {['Keyword', 'SV', '#1 Wks', 'Pos', 'Trend'].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rockSolid.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: i % 2 === 0 ? 'transparent' : C.surface2 }}>
                    <td style={{ ...tdBase, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.kw}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid }}>{r.sv}</td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ background: `${green}18`, color: green, borderRadius: 5, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{r.weeks} wks</span>
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ background: `${green}18`, color: green, borderRadius: 5, padding: '2px 8px', fontWeight: 800, fontSize: 12.5 }}>#1</span>
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center', padding: '4px 6px' }}>
                      <VolSparkline weeks={r.wkData} color={green} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Card 2: Volatile Keywords ───────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(purple, 'Volatile Keywords — High SERP Instability', 'Wide rank variance across tracked weeks')}
          {summaryPill(purple, 'Tracked', `${volatile.length} keywords`)}
          <div style={{ overflowY: 'auto', maxHeight: 420 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Keyword', 'SV', 'Curr Position', 'Trend'].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {volatile.map((v, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: i % 2 === 0 ? 'transparent' : C.surface2 }}>
                    <td style={{ ...tdBase, color: C.text, fontWeight: 500 }}>{v.kw}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid }}>{v.sv}</td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ background: `${purple}14`, color: purple, borderRadius: 5, padding: '2px 8px', fontWeight: 600, fontSize: 12 }}>{v.wk34 != null ? `#${v.wk34}` : '—'}</span>
                    </td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <VolSparkline weeks={v.weeks} color={purple} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Card 3: Top Gainers ─────────────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(green, 'Top Gainers — Biggest Rank Improvements', 'Wk39 → Wk40 · sorted by positions gained')}
          {summaryPill(green, 'Top gainers', '15 keywords')}
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Keyword', 'Category', 'SV', 'Wk39 → Wk40', '↑ Gained'].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gainers.map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: i % 2 === 0 ? 'transparent' : C.surface2 }}>
                    <td style={{ ...tdBase, color: C.text, fontWeight: 500 }}>{g.kw}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid, fontSize: 11.5 }}>{g.cat}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid }}>{g.sv}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textDim, fontSize: 11.5 }}>#{g.from} → #{g.to}</td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ background: `${green}18`, color: green, borderRadius: 5, padding: '2px 8px', fontWeight: 800, fontSize: 12.5 }}>↑{g.gain}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Card 4: Top Decliners ───────────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(red, 'Top Decliners — Biggest Rank Drops', 'Wk39 → Wk40 · sorted by positions lost')}
          {summaryPill(red, 'Top decliners', '15 keywords')}
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Keyword', 'Category', 'SV', 'Wk39 → Wk40', '↓ Lost'].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decliners.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}`, background: i % 2 === 0 ? 'transparent' : C.surface2 }}>
                    <td style={{ ...tdBase, color: C.text, fontWeight: 500 }}>{d.kw}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid, fontSize: 11.5 }}>{d.cat}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textMid }}>{d.sv}</td>
                    <td style={{ ...tdBase, textAlign: 'center', color: C.textDim, fontSize: 11.5 }}>#{d.from} → #{d.to}</td>
                    <td style={{ ...tdBase, textAlign: 'center' }}>
                      <span style={{ background: `${red}18`, color: red, borderRadius: 5, padding: '2px 8px', fontWeight: 800, fontSize: 12.5 }}>↓{d.drop}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── SLIDE 1: GAIN ─────────────────────────────────────────────────────────────
function GLGainCard({ brand, before, after, change, changePct, tableRows }: {
  brand: string; before: string; after: string; change: string; changePct: string;
  tableRows: (string|number)[];
}) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL.green }} />
        <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.text }}>{brand}</span>
      </div>
      {/* Stat pill */}
      <div style={{ background: GL.greenBg, border: `1px solid ${GL.greenBorder}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: GL.green, fontWeight: 700, marginBottom: 4 }}>AIO Overall Traffic</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{after}</span>
            <span style={{ fontFamily: C.mono, fontSize: 13, color: C.textDim }}>from {before}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 800, color: GL.green, letterSpacing: '-0.02em', lineHeight: 1 }}>{changePct}</div>
          <div style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, marginTop: 3 }}>{change} sessions</div>
        </div>
      </div>
      {/* Table */}
      <div style={{ fontFamily: C.mono, fontSize: 11.5, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: C.textDim, marginBottom: 8, fontWeight: 700 }}>Top 10 Keywords by Traffic Gain</div>
      <GLTable
        cols={['Keyword', 'SV', 'KD', 'Pos Aug 17', 'Pos Aug 24', 'Traffic Aug 17', 'Traffic Aug 24', 'Change', 'Change %']}
        rows={tableRows}
        nowrap
      />
    </div>
  )
}

function GLGainSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <GLSectionBanner label="Gain" title="Organic Traffic & AIO Expansion" color={GL.green} source="GA / SEMrush" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(480px,1fr))', gap: 18 }}>

        {/* Organic Traffic (Gain) */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL.green }} />
            <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.text }}>Organic Traffic</span>
          </div>
          <GLStatPill label="Overall Organic Traffic" before="426K" after="432K" change="+5.7K" changePct="+1.3%" color={GL.green} bgColor={GL.greenBg} borderColor={GL.greenBorder} />
          <div style={{ fontFamily: C.mono, fontSize: 11.5, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: C.textDim, marginBottom: 8, fontWeight: 700 }}>Top 10 Gaining Pages · Aug 10 → Aug 17</div>
          <GLTable
            cols={['Page', 'Aug 10', 'Aug 17', 'Change', '%']}
            rows={[
              '/resources/data-sheets/fortiswitch-secure-access-series',         '2,558', '2,988', '+430', '+17%',
              '/resources/data-sheets/fortigate-120g-series',                     '4,849', '5,261', '+412', '+8%',
              '/corporate/about-us/newsroom/press-releases/2026/fortinet-adv…',  '0',     '408',   '+408', 'N/A',
              '/resources/data-sheets/fortigate-200g-series',                     '3,432', '3,788', '+356', '+10%',
              '/resources/data-sheets/fortigate-fortiwifi-70g-series',            '1,858', '2,207', '+349', '+19%',
              '/resources/data-sheets/fortiap-series',                            '3,199', '3,517', '+318', '+10%',
              '/corporate/about-us/events/events/sase-summit',                    '149',   '466',   '+317', '+213%',
              '/resources/data-sheets/fortigate-fortiwifi-50g-series',            '2,339', '2,648', '+309', '+13%',
              '/resources/data-sheets/fortigate-400f-series',                     '1,459', '1,709', '+250', '+17%',
              '/products/ethernet-switches',                                       '3,493', '3,716', '+223', '+6%',
              'Total',                                                             '23,336','26,708','+3,372','+14%',
            ]}
          />
        </div>

        {/* AIO Overall Traffic — Fortinet (Gain) */}
        <GLGainCard
          brand="Fortinet"
          before="169.9K" after="216.6K" change="+46,702" changePct="+27%"
          tableRows={[
            'what is 5g',             '673,000', 76, '—', '1', '0',      '41,590', '+41,590', '+41,590%',
            'what is a dns',          '550,000', 77, '—', '1', '0',      '19,096', '+19,096', '+19,096%',
            'radius',                 '90,500',  78, '—', '1', '0',      '10,439', '+10,439', '+10,439%',
            'what is a data breach',  '110,000', 61, '—', '1', '0',      '6,797',  '+6,797',  '+6,797%',
            'dns',                    '74,000',  83, '—', '1', '0',      '2,645',  '+2,645',  '+2,645%',
            'doxing meaning',         '27,100',  59, '1', '1', '28',     '1,674',  '+1,646',  '+5,879%',
            'fortinet news today',    '4,400',   68, '1', '1', '52',     '1,455',  '+1,403',  '+2,698%',
            'what does doxxed mean',  '22,200',  42, '—', '1', '0',      '1,371',  '+1,371',  '+1,371%',
            'eavesdropping',          '33,100',  56, '1', '1', '203',    '1,149',  '+946',    '+466%',
            'latency',                '33,100',  78, '1', '1', '1,183',  '2,045',  '+862',    '+73%',
            'Total',                  '',        '', '',  '',  '1,466',  '88,261', '+86,795', '+5,921%',
          ]}
        />

      </div>
    </div>
  )
}

// ── SLIDE 2: LOSS ─────────────────────────────────────────────────────────────
function GLLossSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <GLSectionBanner label="Loss" title="AIO Traffic Loss" color={GL.red} source="SEMrush" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* AIO Overall Traffic Loss */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL.red }} />
            <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.text }}>AIO Overall Traffic — Fortinet</span>
          </div>
          <GLStatPill label="AIO Overall Traffic" before="215.3K" after="192.8K" change="-22,444" changePct="-10.4%" color={GL.red} bgColor={GL.redBg} borderColor={GL.redBorder} />
          <div style={{ fontFamily: C.mono, fontSize: 11.5, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: C.textDim, marginBottom: 8, fontWeight: 700 }}>Top Keywords Losing AIO Traffic · Sep 28 → Oct 05</div>
          <GLTable
            cols={['Keyword', 'SV', 'KD', 'Pos Sep 28', 'Pos Oct 05', 'Traffic Sep 28', 'Traffic Oct 05', 'Change', 'Change %']}
            rows={[
              'what is a dns',            '550,000',  73,  '1', '1',  '19,668',  '2,860', '-16,808',  '-85%',
              'what is a keylogger',      '110,000',  54,  '1', '—',   '6,797',      '0',  '-6,797', '-100%',
              'what is a vpn router',     '135,000',  62,  '1', '1',   '5,389',    '702',  '-4,687',  '-87%',
              'what is a ddos attack',    '110,000',  71,  '1', '1',   '3,933',    '572',  '-3,361',  '-85%',
              'firewall configuration',   '110,000',  28,  '1', '1',   '3,933',    '686',  '-3,247',  '-83%',
              'ddos',                      '33,100',  80,  '1', '1',   '2,217',    '172',  '-2,045',  '-92%',
              'hackers hackers hackers',   '33,100',  80,  '1', '—',   '2,045',      '0',  '-2,045', '-100%',
              'dns and',                   '33,100',  71,  '1', '1',   '2,045',     '91',  '-1,954',  '-96%',
              'proxy server',              '60,500',  82,  '1', '1',   '2,100',    '376',  '-1,724',  '-82%',
              'wans',                       '5,400',  43,  '1', '—',   '1,680',      '0',  '-1,680', '-100%',
              'Total',                           '',   '',  '',  '',  '49,807',  '5,459', '-44,348',  '-89%',
            ]}
          />
        </div>

      </div>
    </div>
  )
}

// ── SLIDE 3: GSC TOP KEYWORDS ─────────────────────────────────────────────────
function GLGSCSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <GLSectionBanner label="GSC Top 10 Keywords" title="Branded & Non-Branded KWs" color={GL.blue} source="Google Search Console" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 18 }}>

        {/* Branded */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL.blue }} />
            <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.text }}>Branded Keywords</span>
          </div>
          <GLTable
            cols={['Keyword', 'Clicks', 'Impressions', 'Avg Rank']}
            rows={[
              'fortinet',                 '43,292', '241,293', '1.2',
              'fortigate',                '6,812', '56,137', '2.9',
              'fortinet vpn',             '5,804', '10,397', '1.6',
              'fortinet careers',         '3,815', '4,634', '1.4',
              'fortinet product matrix',  '3,323', '4,013', '2.2',
              'fortinet vpn client',      '2,063', '3,170', '1.4',
              'fortigate 120g',           '1,828', '6,104', '1.1',
              'fortigate matrix',         '1,822', '2,313', '2.2',
              'fortinet download',        '1,744', '3,493', '1.5',
              'forti vpn',                '1,729', '3,199', '1.7',
            ]}
          />
          <div style={{ marginTop: 14, padding: '10px 14px', background: GL.blueBg, border: `1px solid ${GL.blueBorder}`, borderRadius: 8 }}>
            <div style={{ fontFamily: C.mono, fontSize: 11.5, color: GL.blue, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Branded — Oct 05</div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div><span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 800, color: C.text }}>72.2K</span><div style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, marginTop: 2 }}>Total clicks (top 10)</div></div>
              <div><span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 800, color: C.text }}>1.2</span><div style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, marginTop: 2 }}>Avg rank (top brand KW)</div></div>
            </div>
          </div>
        </div>

        {/* Non-Branded */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL.blue }} />
            <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.text }}>Non-Branded Keywords</span>
          </div>
          <GLTable
            cols={['Keyword', 'Clicks', 'Impressions', 'Avg Rank']}
            rows={[
              'proxy server',        '20,236', '1,042,642', '4.0',
              'proxy',               '12,040', '7,889,913', '5.2',
              'hacking',             '5,259', '98,178', '2.7',
              'ip address',          '2,123', '409,494', '5.6',
              'firewall',            '2,105', '155,577', '3.4',
              'ip',                  '1,998', '1,075,209', '6.6',
              'cia triad',           '1,147', '29,945', '1.2',
              'ai cybersecurity',    '1,127', '9,010', '4.1',
              'vpn',                 '1,105', '499,641', '9.4',
              'what is ip address',  '1,097', '35,233', '1.9',
            ]}
          />
          <div style={{ marginTop: 14, padding: '10px 14px', background: GL.blueBg, border: `1px solid ${GL.blueBorder}`, borderRadius: 8 }}>
            <div style={{ fontFamily: C.mono, fontSize: 11.5, color: GL.blue, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Non-Branded — Oct 05</div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div><span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 800, color: C.text }}>48.2K</span><div style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, marginTop: 2 }}>Total clicks (top 10)</div></div>
              <div><span style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 800, color: C.text }}>4.0</span><div style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, marginTop: 2 }}>Avg rank (top non-brand KW)</div></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}


// ─── SLIDE CONTENT ────────────────────────────────────────────────────────────
const CG_PRIORITY = 'Ranking Insights — Cyberglossary (Priority Keywords)'
const ART_PRIORITY = 'Ranking Insights — Articles (Priority Keywords)'
// CG_METRIC_PCT, ART_METRIC_PCT imported from ./dashboardData (Wk40 values)
// ─── KEY TAKEAWAYS SLIDE ────────────────────────────────────────────────────
function KeyTakeawaysSlide() {
  type Status = 'win' | 'warn' | 'critical' | 'neutral'
  const statusIcon = (s: Status) => {
    if (s === 'win')      return <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>▲</span>
    if (s === 'warn')     return <span style={{ color: '#d97706', fontWeight: 700, fontSize: 13 }}>◆</span>
    if (s === 'critical') return <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>▼</span>
    return                       <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 13 }}>●</span>
  }

  const cards = keyTakeawaysCards
  const priorities = KEY_TAKEAWAYS_PRIORITIES

  const C2 = C

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid #334155`,
      }}>
        <div>
          <div style={{ fontFamily: C2.mono, fontSize: 10, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            WEEK 40 · STRATEGIC OVERVIEW
          </div>
          <div style={{ fontFamily: C2.sans, fontSize: 18, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            SEO Performance Key Takeaways
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {([['▲', '#16a34a', 'Win'], ['◆', '#d97706', 'Watch'], ['▼', '#dc2626', 'Critical']] as const).map(([icon, color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color, fontWeight: 700, fontSize: 11 }}>{icon}</span>
              <span style={{ fontFamily: C2.mono, fontSize: 9.5, color: '#94a3b8', letterSpacing: '0.04em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3×2 insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cards.map(card => (
          <div key={card.title} style={{
            background: C2.surface,
            border: `1px solid ${C2.line}`,
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* colored top bar */}
            <div style={{ height: 4, background: card.accentColor }} />

            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{card.icon}</span>
                <span style={{ fontFamily: C2.sans, fontSize: 12.5, fontWeight: 700, color: C2.text, letterSpacing: '-0.01em' }}>
                  {card.title}
                </span>
              </div>

              {/* summary line */}
              <div style={{
                fontFamily: C2.mono,
                fontSize: 10,
                color: card.summaryStatus === 'critical' ? '#dc2626'
                     : card.summaryStatus === 'warn'     ? '#b45309'
                     : card.summaryStatus === 'win'      ? '#16a34a'
                     : C2.textDim,
                background: card.summaryStatus === 'critical' ? '#fef2f2'
                           : card.summaryStatus === 'warn'     ? '#fffbeb'
                           : card.summaryStatus === 'win'      ? '#f0fdf4'
                           : C2.surface2,
                borderRadius: 6,
                padding: '5px 8px',
                lineHeight: 1.4,
                letterSpacing: '0.01em',
              }}>
                {card.summary}
              </div>

              {/* bullet list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {card.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>{statusIcon(b.status)}</span>
                    <span style={{
                      fontFamily: C2.mono,
                      fontSize: 10,
                      color: C2.textDim,
                      lineHeight: 1.5,
                      letterSpacing: '0.01em',
                    }}>
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 Action Priorities */}
      <div style={{
        background: C2.surface,
        border: `1px solid ${C2.line}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{
          background: '#0f172a',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 14 }}>🎯</span>
          <span style={{ fontFamily: C2.sans, fontSize: 12.5, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Top 3 Action Priorities
          </span>
          <span style={{ fontFamily: C2.mono, fontSize: 9.5, color: '#475569', marginLeft: 'auto', letterSpacing: '0.06em' }}>
            WEEK 40 · DATA-DRIVEN
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {priorities.map((p, idx) => (
            <div key={p.rank} style={{
              padding: '16px 18px',
              borderRight: idx < 2 ? `1px solid ${C2.line}` : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: C2.mono, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                    {p.rank}
                  </span>
                </div>
                <span style={{ fontFamily: C2.sans, fontSize: 12, fontWeight: 700, color: C2.text, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {p.label}
                </span>
              </div>
              <p style={{
                fontFamily: C2.mono,
                fontSize: 10,
                color: C2.textDim,
                lineHeight: 1.55,
                margin: 0,
                letterSpacing: '0.01em',
              }}>
                {p.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SlideContent({ sectionTitle, source }: { sectionTitle: string; source: string }) {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null)

  if (sectionTitle === 'Cyberglossary (Category)')    return <CGCatSlide />
  if (sectionTitle === 'Position Trackers & Movers') return <PTSlide />
  if (sectionTitle === 'Primary Keywords Explorer') return <OKSlide />
  if (sectionTitle === 'GL — Gain 2')       return <GLLossSlide />
  if (sectionTitle === 'GL — GSC Keywords') return <GLGSCSlide />
  if (sectionTitle === 'Key Takeaways')     return <KeyTakeawaysSlide />

  if (sectionTitle === 'Core Web Vitals') {
    return (
      <div>
        <div style={{ marginBottom: 16 }}><SourceBadge source={source} /></div>
        <CWVPanel />
      </div>
    )
  }

  const sec = SECTIONS.find(s => s.title === sectionTitle)
  if (!sec) return null

  // AIO Competition: split into two sub-sections
  if (sectionTitle === 'AIO Competition') {
    const kwMetrics = sec.metrics.filter(m => m.name.includes('Keywords'))
    const trMetrics = sec.metrics.filter(m => m.name.includes('Traffic'))
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 9, marginBottom: 14, alignItems: 'stretch' }}>
          {kwMetrics.map((m, i) => <StatMini key={i} m={m} />)}
        </div>
        <ChartCard label="AIO Keywords" source={source} metrics={kwMetrics} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 9, marginBottom: 14, marginTop: 18, alignItems: 'stretch' }}>
          {trMetrics.map((m, i) => <StatMini key={i} m={m} />)}
        </div>
        <ChartCard label="AIO Traffic" source={source} metrics={trMetrics} />
      </div>
    )
  }

  {
    // Compute start index: first week where any metric has data
    const si = (() => {
      for (let i = 0; i < WEEKS.length; i++) {
        if (sec.metrics.some(m => m.values[i] !== null && m.values[i] !== undefined)) return i
      }
      return 0
    })()
    const startLabel = WEEKS[si]
    const endLabel = WEEKS[WEEKS.length - 1]
    const activeDrawerCfgMap = sectionTitle === ART_PRIORITY ? ART_DRAWER_CFG : CG_DRAWER_CFG
    const drawerCfg = activeDrawer ? activeDrawerCfgMap[activeDrawer] : null
    const isClickableSection = sectionTitle === CG_PRIORITY || sectionTitle === ART_PRIORITY
    return (
      <div>
        {drawerCfg && (
          <CyberglossaryDrawer
            title={drawerCfg.title}
            color={drawerCfg.color}
            keywords={drawerCfg.keywords}
            onClose={() => setActiveDrawer(null)}
            sectionLabel={sectionTitle === ART_PRIORITY ? 'Articles — Priority Keywords' : 'Cyberglossary — Priority Keywords'}
            source={drawerCfg.source ?? 'GSC'}
          />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 9, marginBottom: 14, alignItems: 'stretch' }}>
          {sec.metrics.map((m, i) => {
            const cfgMap = sectionTitle === ART_PRIORITY ? ART_DRAWER_CFG : CG_DRAWER_CFG
            const isClickable = isClickableSection && m.name in cfgMap
            const cfg = isClickable ? cfgMap[m.name] : null
            const pctMap = sectionTitle === ART_PRIORITY ? ART_METRIC_PCT : sectionTitle === CG_PRIORITY ? CG_METRIC_PCT : null
            const metricPct = pctMap ? (pctMap[m.name] ?? null) : null
            return (
              <div key={i} onClick={isClickable ? () => setActiveDrawer(m.name) : undefined}
                style={{ display: 'flex', flexDirection: 'column' as const, cursor: isClickable ? 'pointer' : 'default' }}>
                <StatMini m={m} badge={cfg ? { label: 'VIEW LIST', color: cfg.color } : undefined} metricPct={metricPct} />
              </div>
            )
          })}
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: C.sans, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Weekly Trend — {startLabel} → {endLabel}</span>
              <SourceBadge source={source} />
            </div>
            <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textDim, letterSpacing: '0.02em' }}>Hover for values · click legend to toggle</span>
          </div>
          <SectionChart metrics={sec.metrics} startIdx={si} />
        </div>
      </div>
    )
  }
}

// ─── OVERALL KEYWORDS TAB DATA ──────────────────────────────────────────────
const CG_KW_DATA:OKKw[]=[
  {kw:"AIOPS",url:"https://www.fortinet.com/resources/cyberglossary/aiops-future-of-it-operations",sv:1300,kd:69,wk36:28,wk37:34,wk38:22,wk39:18,wk40:22,aio:false,trend:[16,16,17,17,18,13,14,16,23,13,8,16,15,17,17,19,16,23,27,21,19,25,24,21,17,18,13,17,24,20,23,25,26,24,12,28,34,22,18,22],cat:"AI Security"},
  {kw:"AI Data Center",url:"https://www.fortinet.com/resources/cyberglossary/ai-data-centers",sv:2900,kd:36,wk36:2,wk37:26,wk38:24,wk39:14,wk40:17,aio:false,trend:[65,65,70,72,58,58,58,58,58,52,61,61,61,19,6,22,23,20,23,21,14,12,11,28,20,13,13,15,24,2,2,2,2,2,2,2,26,24,14,17],cat:"AI Security"},
  {kw:"AWS Compliance",url:"https://www.fortinet.com/resources/cyberglossary/aws-compliance",sv:590,kd:69,wk36:2,wk37:16,wk38:9,wk39:8,wk40:8,aio:false,trend:[15,12,11,11,23,19,23,13,8,7,10,11,13,10,9,6,5,5,5,6,8,5,5,5,5,7,8,6,8,2,3,4,3,3,2,2,16,9,8,8],cat:"Cloud Security"},
  {kw:"Virtual Cloud Network",url:"https://www.fortinet.com/resources/cyberglossary/virtual-cloud-network",sv:70,kd:49,wk36:13,wk37:1,wk38:1,wk39:4,wk40:2,aio:false,trend:[2,6,2,4,4,4,4,2,2,4,4,4,4,3,3,2,3,3,3,2,1,1,1,1,2,2,4,2,4,10,11,12,10,12,10,13,1,1,4,2],cat:"Cloud Security"},
  {kw:"Cloud Infrastructure",url:"https://www.fortinet.com/resources/cyberglossary/cloud-infrastructure",sv:3600,kd:57,wk36:20,wk37:17,wk38:19,wk39:17,wk40:16,aio:false,trend:[2,6,6,7,7,7,7,8,5,7,7,7,5,8,4,8,9,11,12,14,11,13,14,17,16,16,17,15,23,17,17,13,7,18,17,20,17,19,17,16],cat:"Cloud Security"},
  {kw:"Hybrid Cloud",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hybrid-cloud",sv:4400,kd:62,wk36:28,wk37:17,wk38:16,wk39:15,wk40:15,aio:false,trend:[13,20,21,18,18,16,14,11,11,13,13,11,16,13,9,12,15,14,13,13,13,17,12,14,16,18,18,18,20,17,22,24,23,22,21,28,17,16,15,15],cat:"Cloud Security"},
  {kw:"Hybrid Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-cloud-security",sv:1300,kd:31,wk36:10,wk37:6,wk38:7,wk39:12,wk40:13,aio:true,trend:[4,3,1,2,6,4,4,5,5,5,8,7,10,8,2,4,6,3,2,3,10,10,5,5,4,2,6,4,6,11,10,10,10,10,10,10,6,7,12,13],cat:"Cloud Security"},
  {kw:"CSPM",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-posture-management",sv:5400,kd:26,wk36:7,wk37:27,wk38:15,wk39:8,wk40:7,aio:false,trend:[15,11,20,28,29,16,11,6,3,4,5,4,6,6,4,11,18,22,14,7,7,10,6,5,23,26,19,12,13,5,7,8,7,6,6,7,27,15,8,7],cat:"Cloud Security"},
  {kw:"Cloud NATive",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cloud-native",sv:2900,kd:81,wk36:12,wk37:42,wk38:41,wk39:39,wk40:24,aio:false,trend:[41,34,35,46,42,27,32,14,5,3,22,9,33,28,32,16,26,35,35,30,30,38,41,44,36,38,42,40,43,8,10,9,6,7,8,12,42,41,39,24],cat:"Cloud Security"},
  {kw:"Secure Web Gateway",url:"https://www.fortinet.com/resources/cyberglossary/secure-web-gateways",sv:4400,kd:60,wk36:4,wk37:6,wk38:6,wk39:5,wk40:6,aio:false,trend:[5,7,9,6,5,10,4,7,6,10,7,5,2,6,7,8,10,7,8,7,8,8,8,8,8,7,7,6,9,4,4,4,5,6,6,4,6,6,5,6],cat:"Cloud Security"},
  {kw:"Cloud Security Tools",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-tools",sv:2900,kd:23,wk36:7,wk37:3,wk38:2,wk39:1,wk40:1,aio:true,trend:[5,7,2,4,3,5,4,3,2,6,5,4,3,1,3,4,3,4,2,4,3,4,4,4,3,4,5,3,4,6,6,6,5,6,6,7,3,2,1,1],cat:"Cloud Security"},
  {kw:"Cloud Security Architecture",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-architecture",sv:2400,kd:33,wk36:8,wk37:11,wk38:8,wk39:11,wk40:2,aio:true,trend:[7,6,6,6,9,11,8,9,8,6,5,6,7,5,6,8,8,9,9,10,9,10,14,15,11,10,16,11,12,6,5,5,7,7,8,8,11,8,11,2],cat:"Cloud Security"},
  {kw:"Cloud Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-best-practices",sv:3600,kd:50,wk36:21,wk37:16,wk38:20,wk39:20,wk40:19,aio:false,trend:[6,8,8,12,17,14,14,8,4,3,4,10,4,4,8,4,6,20,18,18,18,21,20,13,8,5,22,10,18,17,17,14,16,19,18,21,16,20,20,19],cat:"Cloud Security"},
  {kw:"Multi Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/multi-cloud-security",sv:320,kd:27,wk36:16,wk37:8,wk38:8,wk39:3,wk40:6,aio:false,trend:[9,6,11,11,9,8,9,8,4,5,4,3,2,5,5,4,9,10,12,9,10,9,10,11,3,3,2,4,5,18,18,17,17,18,16,16,8,8,3,6],cat:"Cloud Security"},
  {kw:"Cloud Native Firewall",url:"https://www.fortinet.com/resources/cyberglossary/cloud-native-firewalls",sv:50,kd:38,wk36:18,wk37:16,wk38:17,wk39:8,wk40:8,aio:false,trend:[1,1,1,41,41,41,41,28,28,28,28,41,43,43,14,43,77,61,69,69,69,69,51,52,60,40,45,5,7,20,17,23,17,22,18,18,16,17,8,8],cat:"NGFW"},
  {kw:"Cloud Application Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-application-security",sv:1000,kd:20,wk36:4,wk37:3,wk38:2,wk39:2,wk40:3,aio:false,trend:[null,null,null,1,1,1,1,1,2,3,3,2,3,3,3,2,2,2,2,2,3,2,3,3,3,5,6,5,7,8,6,10,6,8,4,4,3,2,2,3],cat:"Cloud Security"},
  {kw:"Private Cloud Vs Public Cloud",url:"https://www.fortinet.com/resources/cyberglossary/public-vs-private-cloud",sv:3600,kd:28,wk36:15,wk37:10,wk38:11,wk39:12,wk40:18,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,38,32,33,22,24,21,18,9,23,20,11,15,10,11,12,18],cat:"Cloud Security"},
  {kw:"Distributed Firewall",url:"https://www.fortinet.com/resources/cyberglossary/distributed-firewall",sv:50,kd:22,wk36:26,wk37:1,wk38:1,wk39:6,wk40:6,aio:true,trend:[2,2,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,1,2,3,2,2,2,2,2,2,4,3,6,22,23,27,26,27,24,26,1,1,6,6],cat:"NGFW"},
  {kw:"Stateful Firewall",url:"https://www.fortinet.com/resources/cyberglossary/stateful-firewall",sv:1600,kd:31,wk36:37,wk37:4,wk38:2,wk39:4,wk40:3,aio:true,trend:[2,2,1,1,1,2,2,4,5,4,4,3,4,6,3,3,3,2,3,4,3,3,3,3,5,5,7,4,6,34,38,42,44,45,41,37,4,2,4,3],cat:"NGFW"},
  {kw:"DNS Firewall",url:"https://www.fortinet.com/resources/cyberglossary/dns-firewall",sv:320,kd:30,wk36:6,wk37:9,wk38:11,wk39:3,wk40:2,aio:false,trend:[4,3,14,4,3,3,5,3,2,16,3,15,18,18,5,20,20,1,3,13,10,5,10,6,3,6,10,9,10,10,7,9,7,6,6,6,9,11,3,2],cat:"NGFW"},
  {kw:"Firewall Design Principles",url:"https://www.fortinet.com/resources/cyberglossary/firewall-design-principles",sv:20,kd:21,wk36:9,wk37:6,wk38:7,wk39:2,wk40:2,aio:false,trend:[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,7,5,3,8,5,7,6,3,6,2,2,2,19,9,9,15,12,12,11,9,6,7,2,2],cat:"NGFW"},
  {kw:"Network Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-network-security",sv:1300,kd:48,wk36:2,wk37:7,wk38:6,wk39:8,wk40:9,aio:false,trend:[6,9,10,11,13,14,6,5,3,4,5,3,3,3,2,3,2,3,2,2,2,2,3,7,11,8,5,11,14,2,2,4,4,3,8,2,7,6,8,9],cat:"Network Security"},
  {kw:"OT Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/ot-security-best-practices",sv:140,kd:19,wk36:4,wk37:11,wk38:9,wk39:9,wk40:20,aio:false,trend:[7,7,8,1,1,1,1,2,2,2,5,1,2,2,2,2,1,2,1,1,1,1,1,1,1,1,2,8,19,3,3,2,2,3,3,4,11,9,9,20],cat:"OT Security"},
  {kw:"OT Network Segmentation",url:"https://www.fortinet.com/resources/cyberglossary/ot-network-segmentation-and-microsegmentation",sv:140,kd:6,wk36:4,wk37:2,wk38:1,wk39:2,wk40:2,aio:false,trend:[1,1,1,13,6,6,3,3,4,4,3,3,3,2,2,2,2,2,2,2,3,25,2,2,2,2,2,2,3,8,14,10,13,11,10,4,2,1,2,2],cat:"Cyber Compliance"},
  {kw:"ICS SCADA",url:"https://www.fortinet.com/resources/cyberglossary/ics-scada",sv:90,kd:14,wk36:23,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[4,5,1,1,1,1,1,1,1,1,1,1,2,7,7,7,3,5,4,2,4,4,4,5,3,3,3,3,5,9,19,21,25,24,25,23,1,1,1,2],cat:"OT Security"},
  {kw:"Quantum Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-security",sv:720,kd:41,wk36:7,wk37:6,wk38:4,wk39:6,wk40:6,aio:true,trend:[7,6,7,8,8,8,8,6,6,5,6,5,5,6,6,4,5,4,3,4,4,3,2,2,2,3,6,4,6,5,4,4,4,6,7,7,6,4,6,6],cat:"Quantum Security"},
  {kw:"SASE Benefits",url:"https://www.fortinet.com/resources/cyberglossary/sase-benefits",sv:720,kd:17,wk36:1,wk37:6,wk38:3,wk39:1,wk40:4,aio:true,trend:[6,5,8,8,6,2,3,3,2,1,1,1,1,2,3,4,11,3,2,2,2,2,2,2,2,2,8,5,7,1,1,1,1,1,1,1,6,3,1,4],cat:"SASE"},
  {kw:"SD WAN Architecture",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-architecture",sv:320,kd:19,wk36:5,wk37:5,wk38:4,wk39:5,wk40:6,aio:true,trend:[7,6,1,2,2,2,2,5,10,4,2,2,5,6,1,1,1,2,2,1,1,1,1,1,4,4,2,4,5,6,6,24,11,6,11,5,5,4,5,6],cat:"SASE"},
  {kw:"SD WAN Cost",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-costs",sv:110,kd:9,wk36:11,wk37:6,wk38:2,wk39:1,wk40:3,aio:true,trend:[3,3,1,1,1,1,1,2,3,5,7,8,8,8,7,4,4,5,4,3,3,4,14,14,6,1,4,3,7,5,7,7,4,7,7,11,6,2,1,3],cat:"SASE"},
  {kw:"Zero Trust Architecture",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-architecture",sv:6600,kd:78,wk36:3,wk37:42,wk38:26,wk39:26,wk40:55,aio:false,trend:[42,45,45,39,34,24,32,4,19,17,14,15,13,8,9,13,14,35,46,24,22,32,36,51,53,55,53,42,50,6,6,6,4,4,3,3,42,26,26,55],cat:"ZTNA"},
  {kw:"Zero Trust Cloud",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-for-the-cloud",sv:390,kd:48,wk36:11,wk37:9,wk38:9,wk39:9,wk40:6,aio:false,trend:[null,null,null,11,9,10,10,14,15,2,8,6,6,6,3,10,11,9,9,7,6,17,11,22,21,19,36,26,36,5,3,4,6,4,5,11,9,9,9,6],cat:"ZTNA"},
  {kw:"Public Wifi",url:"https://www.fortinet.com/resources/cyberglossary/vpn-wifi",sv:1000,kd:52,wk36:11,wk37:6,wk38:5,wk39:6,wk40:7,aio:false,trend:[6,12,9,9,7,9,6,3,5,3,5,4,4,4,5,5,6,7,5,3,4,3,4,4,6,7,7,7,9,6,3,4,7,10,9,11,6,5,6,7],cat:"VPN"},
  {kw:"Threat Hunting",url:"https://www.fortinet.com/resources/cyberglossary/threat-hunting",sv:4400,kd:40,wk36:20,wk37:27,wk38:21,wk39:25,wk40:12,aio:false,trend:[19,22,23,26,25,17,20,18,20,21,20,19,18,19,14,8,7,7,12,19,24,13,9,12,11,15,12,14,17,4,4,20,19,16,17,20,27,21,25,12],cat:"Cyber Threats"},
  {kw:"Information Security",url:"https://www.fortinet.com/resources/cyberglossary/information-security",sv:1000,kd:52,wk36:18,wk37:29,wk38:29,wk39:36,wk40:24,aio:false,trend:[10,12,17,13,9,12,13,17,19,10,11,11,10,10,10,15,19,14,23,26,21,25,21,32,29,25,31,27,30,25,25,28,27,13,7,18,29,29,36,24],cat:"Cyber Security"},
  {kw:"OAUTH",url:"https://www.fortinet.com/resources/cyberglossary/oauth",sv:12100,kd:71,wk36:17,wk37:12,wk38:7,wk39:4,wk40:7,aio:false,trend:[6,5,4,7,4,5,3,4,5,5,7,8,5,6,5,5,7,8,6,8,3,7,3,4,4,4,5,6,22,2,13,2,2,2,2,17,12,7,4,7],cat:"Access Control"},
  {kw:"Credential Stuffing",url:"https://www.fortinet.com/resources/cyberglossary/credential-stuffing",sv:3600,kd:55,wk36:4,wk37:5,wk38:5,wk39:3,wk40:3,aio:true,trend:[5,8,5,8,7,4,6,3,5,5,2,3,5,2,4,5,4,5,7,9,5,6,4,6,4,5,5,4,6,4,3,4,4,2,4,4,5,5,3,3],cat:"Cyber Security"},
  {kw:"Malvertising",url:"https://www.fortinet.com/resources/cyberglossary/malvertising",sv:1900,kd:53,wk36:5,wk37:10,wk38:10,wk39:9,wk40:9,aio:false,trend:[11,11,10,11,15,9,4,5,5,2,5,3,4,2,2,2,3,2,1,2,4,6,7,9,10,9,11,9,10,2,6,5,5,5,5,5,10,10,9,9],cat:"Cyber Threats"},
  {kw:"EDGE Computing",url:"https://www.fortinet.com/resources/cyberglossary/edge-computing",sv:3600,kd:67,wk36:28,wk37:33,wk38:13,wk39:36,wk40:34,aio:false,trend:[22,20,16,19,21,20,20,12,11,11,8,8,9,9,12,15,18,21,22,19,11,21,19,7,20,23,16,23,28,29,30,19,25,2,28,28,33,13,36,34],cat:"OT Security"},
  {kw:"Wannacry Ransomware Attack",url:"https://www.fortinet.com/resources/cyberglossary/wannacry-ransomware-attack",sv:2900,kd:65,wk36:1,wk37:9,wk38:5,wk39:8,wk40:6,aio:false,trend:[6,8,8,8,8,8,7,7,8,6,6,6,8,8,8,9,9,10,9,9,9,10,9,10,10,10,10,8,9,12,7,8,2,1,1,1,9,5,8,6],cat:"Cyber Threats"},
  {kw:"Authentication Vs Authorization",url:"https://www.fortinet.com/resources/cyberglossary/authentication-vs-authorization",sv:3600,kd:47,wk36:3,wk37:7,wk38:6,wk39:7,wk40:5,aio:false,trend:[7,4,10,10,6,4,3,5,4,6,3,3,2,2,4,3,4,5,5,3,7,10,7,5,8,7,5,7,9,15,6,3,3,2,3,3,7,6,7,5],cat:"Access Control"},
  {kw:"Email Spoofing",url:"https://www.fortinet.com/resources/cyberglossary/email-spoofing",sv:2400,kd:56,wk36:2,wk37:7,wk38:6,wk39:6,wk40:4,aio:true,trend:[10,10,12,8,7,9,7,6,5,5,5,5,2,2,4,5,3,5,5,5,7,7,7,7,6,8,5,6,7,2,2,2,1,2,2,2,7,6,6,4],cat:"Email Security"},
  {kw:"Cybersecurity Analytics",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-analytics",sv:480,kd:28,wk36:1,wk37:6,wk38:8,wk39:12,wk40:9,aio:true,trend:[16,20,21,20,10,8,17,10,10,4,3,6,2,4,2,2,2,3,4,5,2,5,5,7,8,14,11,4,6,2,2,2,1,1,1,1,6,8,12,9],cat:"Data Security"},
  {kw:"Worm Virus",url:"https://www.fortinet.com/resources/cyberglossary/worm-virus",sv:1300,kd:38,wk36:3,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[3,3,1,1,1,2,1,2,2,2,3,2,3,3,2,2,2,2,2,2,2,2,2,3,2,2,2,2,3,3,3,3,3,6,4,3,2,2,2,2],cat:"Cyber Threats"},
  {kw:"Computer Viruses",url:"https://www.fortinet.com/resources/cyberglossary/computer-virus",sv:2400,kd:49,wk36:7,wk37:5,wk38:4,wk39:4,wk40:4,aio:true,trend:[4,4,3,4,5,3,3,2,5,4,4,3,5,5,2,2,2,3,3,3,3,3,4,4,5,4,4,3,5,6,31,12,6,3,6,7,5,4,4,4],cat:"Cyber Threats"},
  {kw:"VPN Blocker",url:"https://www.fortinet.com/resources/cyberglossary/vpn-blocker",sv:2900,kd:68,wk36:3,wk37:6,wk38:3,wk39:3,wk40:2,aio:true,trend:[2,4,5,5,5,4,3,3,5,7,4,2,2,3,4,3,2,4,2,2,3,3,3,3,3,4,5,4,5,6,5,4,3,3,2,3,6,3,3,2],cat:"VPN"},
  {kw:"DNS Poisioning",url:"https://www.fortinet.com/resources/cyberglossary/dns-poisoning",sv:20,kd:42,wk36:5,wk37:2,wk38:2,wk39:4,wk40:4,aio:false,trend:[2,3,2,3,2,2,1,2,3,2,3,2,2,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,4,2,2,2,4,4,4,5,2,2,4,4],cat:"Cyber Threats"},
  {kw:"Cyberwarfare",url:"https://www.fortinet.com/resources/cyberglossary/cyber-warfare",sv:1600,kd:55,wk36:3,wk37:3,wk38:4,wk39:4,wk40:4,aio:true,trend:[5,7,5,4,6,6,5,6,7,5,4,6,4,5,4,3,3,3,3,2,2,2,3,4,6,5,6,4,5,2,2,2,2,4,4,3,3,4,4,4],cat:"Cyber Threats"},
  {kw:"Indicators Of Compromise",url:"https://www.fortinet.com/resources/cyberglossary/indicators-of-compromise",sv:4400,kd:51,wk36:2,wk37:3,wk38:4,wk39:3,wk40:3,aio:false,trend:[2,1,1,2,2,3,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,3,3,2,1,1,1,2,1,2,2,2,3,2,2,3,4,3,3],cat:"Cyber Threats"},
  {kw:"File Transfer Protocol",url:"https://www.fortinet.com/resources/cyberglossary/file-transfer-protocol-ftp-meaning",sv:1600,kd:49,wk36:5,wk37:5,wk38:2,wk39:5,wk40:5,aio:false,trend:[3,3,3,3,2,2,2,2,3,3,3,3,3,3,2,2,2,2,2,2,3,3,4,3,3,4,4,3,4,2,2,2,5,5,5,5,5,2,5,5],cat:"Cyber Security"},
  {kw:"Kerberos Authentication",url:"https://www.fortinet.com/resources/cyberglossary/kerberos-authentication",sv:1900,kd:43,wk36:13,wk37:3,wk38:2,wk39:1,wk40:1,aio:true,trend:[2,2,3,2,2,1,1,1,1,2,2,3,2,1,1,1,2,3,1,1,3,4,3,1,2,1,1,1,2,14,5,14,14,10,7,13,3,2,1,1],cat:"Network Security"},
  {kw:"What Is NAT",url:"https://www.fortinet.com/resources/cyberglossary/network-address-translation",sv:4400,kd:48,wk36:2,wk37:5,wk38:4,wk39:5,wk40:3,aio:true,trend:[2,2,6,6,5,5,4,2,6,2,3,2,2,3,2,5,6,7,4,6,6,7,6,5,4,5,4,5,6,2,4,2,2,3,2,2,5,4,5,3],cat:"Cyber Security"},
  {kw:"What Is An IPS",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-ips",sv:720,kd:38,wk36:4,wk37:6,wk38:3,wk39:5,wk40:4,aio:true,trend:[2,13,11,14,15,12,15,12,6,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,4,14,6,7,3,3,5,5,8,4,4,6,3,5,4],cat:"Network Security"},
  {kw:"What Is HSM",url:"https://www.fortinet.com/resources/cyberglossary/hardware-security-module",sv:14800,kd:71,wk36:2,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[9,7,7,10,11,8,6,8,6,13,13,12,11,10,9,11,11,15,14,15,1,6,15,5,1,2,6,2,3,2,2,2,3,2,2,2,2,2,2,2],cat:"Network Security"},
  {kw:"Ethernet Switching",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ethernet-switching",sv:260,kd:33,wk36:6,wk37:7,wk38:7,wk39:10,wk40:4,aio:false,trend:[6,5,3,6,9,6,5,3,5,4,4,5,7,7,3,1,1,1,1,1,3,4,5,7,6,3,9,9,14,19,19,19,9,7,6,6,7,7,10,4],cat:"Network Security"},
  {kw:"Buffer Overflow",url:"https://www.fortinet.com/resources/cyberglossary/buffer-overflow",sv:2900,kd:56,wk36:2,wk37:3,wk38:3,wk39:2,wk40:2,aio:true,trend:[2,3,2,2,2,2,3,2,3,3,3,4,3,3,3,2,3,3,3,2,2,2,2,2,2,1,1,1,2,2,2,2,2,3,2,2,3,3,2,2],cat:"Cyber Threats"},
  {kw:"ICMP",url:"https://www.fortinet.com/resources/cyberglossary/internet-control-message-protocol-icmp",sv:12100,kd:75,wk36:5,wk37:4,wk38:4,wk39:5,wk40:5,aio:true,trend:[3,4,4,4,5,2,2,3,5,4,4,2,3,3,4,2,2,4,4,5,2,2,3,4,2,2,3,5,6,6,6,6,6,5,6,5,4,4,5,5],cat:"Cyber Security"},
  {kw:"Fault Tolerance",url:"https://www.fortinet.com/resources/cyberglossary/fault-tolerance",sv:2400,kd:44,wk36:2,wk37:5,wk38:3,wk39:3,wk40:4,aio:false,trend:[3,2,1,2,2,2,2,3,6,4,3,4,3,4,3,3,3,3,3,3,3,3,2,2,2,2,2,3,4,2,2,2,4,3,2,2,5,3,3,4],cat:"Cyber Security"},
  {kw:"DNS Protection",url:"https://www.fortinet.com/resources/cyberglossary/dns-protection",sv:590,kd:47,wk36:13,wk37:9,wk38:4,wk39:5,wk40:13,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2,2,2,5,11,10,10,9,12,4,4,4,7,9,7,13,9,4,5,13],cat:"Network Security"},
  {kw:"Data Leak",url:"https://www.fortinet.com/resources/cyberglossary/data-leak",sv:4400,kd:65,wk36:7,wk37:8,wk38:7,wk39:10,wk40:8,aio:false,trend:[6,5,9,6,7,7,7,8,8,8,7,6,6,7,8,5,4,6,6,7,7,5,6,7,8,8,6,6,7,4,8,4,4,4,4,7,8,7,10,8],cat:"Data Security"},
  {kw:"Latency",url:"https://www.fortinet.com/resources/cyberglossary/latency",sv:33100,kd:67,wk36:14,wk37:6,wk38:5,wk39:5,wk40:5,aio:false,trend:[5,5,6,6,9,7,5,5,5,5,4,4,5,4,2,5,4,3,3,5,3,5,5,5,4,5,5,4,5,4,3,4,45,13,12,14,6,5,5,5],cat:"Network Security"},
  {kw:"What Is Catfishing",url:"https://www.fortinet.com/resources/cyberglossary/catfishing",sv:8100,kd:48,wk36:3,wk37:2,wk38:2,wk39:3,wk40:2,aio:false,trend:[2,3,4,3,3,2,3,2,2,2,2,2,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,2,2,2,2,3,2,2,3,2],cat:"Cyber Threats"},
  {kw:"Cyber Attacks On Small Business",url:"https://www.fortinet.com/resources/cyberglossary/smb-cyberattacks",sv:0,kd:51,wk36:22,wk37:2,wk38:4,wk39:5,wk40:5,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,7,3,3,4,25,27,19,17,28,40,22,2,4,5,5],cat:"Cyber Threats"},
  {kw:"Ping Of Death",url:"https://www.fortinet.com/resources/cyberglossary/ping-of-death",sv:880,kd:30,wk36:1,wk37:6,wk38:5,wk39:6,wk40:3,aio:false,trend:[3,5,3,3,5,5,4,4,5,3,4,4,3,4,2,4,5,5,2,3,3,3,5,6,5,5,4,5,6,4,4,4,4,1,1,1,6,5,6,3],cat:"Cyber Threats"},
  {kw:"What Is SSE",url:"https://www.fortinet.com/resources/cyberglossary/security-service-edge-sse",sv:1300,kd:20,wk36:12,wk37:7,wk38:4,wk39:4,wk40:5,aio:true,trend:[13,12,13,14,16,16,15,9,9,10,8,5,6,8,9,6,4,4,3,3,5,7,8,6,3,6,5,3,7,14,16,20,14,11,9,12,7,4,4,5],cat:"SASE"},
  {kw:"Mobile App Security",url:"https://www.fortinet.com/resources/cyberglossary/mobile-app-security",sv:1600,kd:20,wk36:2,wk37:8,wk38:5,wk39:3,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,2,2,2,3,3,4,4,4,5,5,3,5,4,5,2,2,2,3,3,2,2,8,5,3,2],cat:"Cyber Security"},
  {kw:"P2P VPN",url:"https://www.fortinet.com/resources/cyberglossary/peer-to-peer-p2p-vpn",sv:3600,kd:43,wk36:1,wk37:7,wk38:8,wk39:11,wk40:14,aio:false,trend:[1,1,1,1,1,1,1,1,1,2,4,6,7,4,4,5,3,3,3,4,4,3,3,3,3,5,5,4,11,2,1,1,1,1,1,1,7,8,11,14],cat:"Cyber Threats"},
  {kw:"Runtime Application Self-Protection",url:"https://www.fortinet.com/resources/cyberglossary/runtime-application-self-protection-rasp",sv:320,kd:32,wk36:7,wk37:9,wk38:9,wk39:1,wk40:1,aio:false,trend:[6,5,3,6,6,6,6,5,6,3,5,1,1,4,5,5,5,4,4,6,8,9,7,8,9,9,8,8,9,3,7,8,8,8,8,7,9,9,1,1],cat:"Cyber Security"},
  {kw:"Enterprise Security",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-security",sv:2400,kd:43,wk36:2,wk37:4,wk38:4,wk39:4,wk40:3,aio:false,trend:[3,3,3,3,3,3,2,2,3,3,2,2,3,3,4,3,3,2,3,3,3,3,3,3,4,4,4,3,4,2,2,2,2,2,2,2,4,4,4,3],cat:"Cyber Security"},
  {kw:"Cryptojacking",url:"https://www.fortinet.com/resources/cyberglossary/cryptojacking",sv:1600,kd:56,wk36:15,wk37:10,wk38:9,wk39:10,wk40:6,aio:false,trend:[3,2,5,5,5,8,6,6,5,6,6,2,5,4,5,3,2,3,6,8,6,7,8,9,8,7,8,7,8,5,10,7,6,6,9,15,10,9,10,6],cat:"Cyber Threats"},
  {kw:"Smishing",url:"https://www.fortinet.com/resources/cyberglossary/smishing",sv:18100,kd:52,wk36:3,wk37:11,wk38:10,wk39:11,wk40:10,aio:false,trend:[4,8,7,5,6,5,5,5,7,5,6,4,4,4,3,5,5,8,8,10,11,11,11,11,11,9,8,8,9,5,5,7,3,3,3,3,11,10,11,10],cat:"Cyber Threats"},
  {kw:"Shadow It",url:"https://www.fortinet.com/resources/cyberglossary/shadow-it",sv:3600,kd:50,wk36:7,wk37:10,wk38:8,wk39:8,wk40:9,aio:false,trend:[8,11,11,12,6,13,10,8,12,11,7,8,7,10,5,13,10,12,12,8,13,19,22,17,23,21,15,19,23,21,22,17,18,14,5,7,10,8,8,9],cat:"Cyber Threats"},
  {kw:"What Is Data Center",url:"https://www.fortinet.com/resources/cyberglossary/data-center",sv:590,kd:52,wk36:15,wk37:8,wk38:7,wk39:6,wk40:6,aio:false,trend:[11,8,6,5,8,4,4,4,5,5,3,4,2,2,3,4,7,5,6,7,7,7,8,8,8,8,5,5,6,3,2,3,12,4,2,15,8,7,6,6],cat:"Cyber Security"},
  {kw:"Data Integrity",url:"https://www.fortinet.com/resources/cyberglossary/data-integrity",sv:5400,kd:55,wk36:7,wk37:5,wk38:2,wk39:2,wk40:2,aio:true,trend:[3,7,6,6,4,6,7,4,8,7,5,7,8,6,3,8,4,2,3,5,5,5,5,6,3,4,4,2,4,5,5,7,8,6,7,7,5,2,2,2],cat:"Network Security"},
  {kw:"Wardriving",url:"https://www.fortinet.com/resources/cyberglossary/wardriving",sv:1900,kd:44,wk36:3,wk37:5,wk38:4,wk39:2,wk40:3,aio:true,trend:[4,3,1,1,1,1,1,2,4,3,2,3,2,2,4,4,2,3,3,3,4,4,4,5,4,4,3,3,4,4,3,3,3,4,3,3,5,4,2,3],cat:"Cyber Threats"},
  {kw:"SSL VPN",url:"https://www.fortinet.com/resources/cyberglossary/ssl-vpn",sv:4400,kd:55,wk36:4,wk37:6,wk38:4,wk39:6,wk40:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,2,5,4,3,3,3,3,3,4,3,3,2,2,2,1,1,1,1,4,5,4,6,5,5,4,4,4,6,4,6,4],cat:"VPN"},
  {kw:"Snort",url:"https://www.fortinet.com/resources/cyberglossary/snort",sv:6600,kd:66,wk36:9,wk37:7,wk38:7,wk39:6,wk40:8,aio:false,trend:[9,9,9,9,8,9,9,7,8,8,6,5,5,6,7,5,7,9,9,9,9,9,9,8,6,6,7,5,8,10,13,7,13,14,12,9,7,7,6,8],cat:"Network Security"},
  {kw:"Zero-Day Attack",url:"https://www.fortinet.com/resources/cyberglossary/zero-day-attack",sv:1000,kd:50,wk36:2,wk37:1,wk38:1,wk39:3,wk40:1,aio:true,trend:[11,14,13,17,9,12,12,12,10,12,3,5,17,2,2,6,11,6,2,3,4,2,3,2,2,2,2,1,3,3,3,2,3,2,2,2,1,1,3,1],cat:"Cyber Threats"},
  {kw:"Vulnerability Scanning Vs Penetration Testing",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-scanning-compare",sv:390,kd:25,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[4,3,3,3,3,3,3,3,3,5,2,3,3,2,5,2,1,1,1,1,1,1,1,2,2,1,1,1,2,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Security"},
  {kw:"API Security",url:"https://www.fortinet.com/resources/cyberglossary/api-security",sv:3600,kd:55,wk36:6,wk37:6,wk38:6,wk39:3,wk40:2,aio:true,trend:[6,5,6,9,6,6,6,4,8,5,6,5,2,3,2,3,3,4,2,2,5,5,4,6,5,3,5,5,6,6,4,6,6,6,6,6,6,6,3,2],cat:"Cloud Security"},
  {kw:"Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cryptography",sv:22200,kd:77,wk36:4,wk37:4,wk38:3,wk39:2,wk40:2,aio:true,trend:[3,4,2,3,3,2,2,2,6,5,4,4,3,3,3,3,3,3,2,3,3,3,4,4,5,5,5,3,4,2,2,2,4,5,4,4,4,3,2,2],cat:"Cyber Security"},
  {kw:"Doxing",url:"https://www.fortinet.com/resources/cyberglossary/doxing",sv:27100,kd:56,wk36:10,wk37:10,wk38:8,wk39:8,wk40:9,aio:false,trend:[10,10,9,9,10,8,9,9,8,3,7,5,10,6,6,6,10,12,9,10,10,12,7,11,12,11,12,8,10,2,2,2,2,2,10,10,10,8,8,9],cat:"Cyber Threats"},
  {kw:"Access Control",url:"https://www.fortinet.com/resources/cyberglossary/access-control",sv:1000,kd:66,wk36:2,wk37:3,wk38:3,wk39:3,wk40:4,aio:true,trend:[3,2,1,1,3,5,2,3,4,4,4,2,2,3,4,2,3,3,4,3,3,3,2,3,3,3,4,3,4,3,2,2,2,2,2,2,3,3,3,4],cat:"Access Control"},
  {kw:"DKIM Record",url:"https://www.fortinet.com/resources/cyberglossary/dkim-record",sv:1300,kd:64,wk36:3,wk37:7,wk38:6,wk39:7,wk40:6,aio:true,trend:[37,25,17,12,10,9,9,4,3,2,5,6,5,6,3,4,4,7,7,9,7,7,5,5,6,6,7,9,10,3,3,4,2,5,4,3,7,6,7,6],cat:"Email Security"},
  {kw:"SAML Vs OAUTH Vs Open Id",url:"https://www.fortinet.com/resources/cyberglossary/saml-vs-oauth",sv:20,kd:18,wk36:4,wk37:12,wk38:10,wk39:12,wk40:19,aio:false,trend:[14,19,4,15,15,15,15,13,14,15,20,17,13,15,12,15,15,14,20,21,24,21,14,12,8,8,21,23,24,10,12,13,8,10,7,4,12,10,12,19],cat:"Access Control"},
  {kw:"CSRF Attack",url:"https://www.fortinet.com/resources/cyberglossary/csrf",sv:1300,kd:65,wk36:9,wk37:15,wk38:13,wk39:11,wk40:10,aio:false,trend:[6,7,2,5,5,8,5,6,9,8,8,6,8,6,3,10,10,13,12,11,12,12,11,14,14,11,13,12,13,3,3,11,13,13,5,9,15,13,11,10],cat:"Cyber Threats"},
  {kw:"What Is Captcha?",url:"https://www.fortinet.com/resources/cyberglossary/captcha",sv:33100,kd:81,wk36:6,wk37:8,wk38:9,wk39:10,wk40:15,aio:false,trend:[5,9,12,6,10,14,10,8,7,7,7,5,7,8,2,6,9,9,11,11,3,9,13,15,7,10,13,9,10,8,5,5,3,3,4,6,8,9,10,15],cat:"Cyber Security"},
  {kw:"Common Vulnerabilities And Exposures",url:"https://www.fortinet.com/resources/cyberglossary/cve",sv:6600,kd:91,wk36:19,wk37:26,wk38:28,wk39:17,wk40:22,aio:false,trend:[18,19,8,22,25,22,18,12,15,19,10,9,19,14,9,10,13,20,18,19,13,14,26,21,18,19,18,20,22,21,20,21,2,2,19,19,26,28,17,22],cat:"Cyber Security"},
  {kw:"Reverse Proxy",url:"https://www.fortinet.com/resources/cyberglossary/reverse-proxy",sv:6600,kd:69,wk36:4,wk37:9,wk38:6,wk39:6,wk40:6,aio:false,trend:[3,4,7,8,9,6,7,2,11,6,6,5,7,10,3,8,11,13,9,11,9,10,9,6,6,3,11,7,15,5,7,7,7,8,5,4,9,6,6,6],cat:"Cyber Security"},
  {kw:"What Is Scada",url:"https://www.fortinet.com/resources/cyberglossary/scada-and-scada-systems",sv:3600,kd:40,wk36:5,wk37:6,wk38:5,wk39:4,wk40:5,aio:false,trend:[4,3,2,3,3,4,3,2,2,2,3,3,3,2,8,2,3,2,2,4,4,4,4,4,6,5,5,2,3,2,2,4,6,6,5,5,6,5,4,5],cat:"OT Security"},
  {kw:"Identity And Access Management",url:"https://www.fortinet.com/resources/cyberglossary/identity-and-access-management",sv:5400,kd:65,wk36:2,wk37:19,wk38:7,wk39:9,wk40:9,aio:false,trend:[11,11,14,17,14,12,15,14,8,11,9,9,8,9,13,8,9,9,7,8,13,9,10,9,7,7,25,10,24,2,4,4,4,4,4,2,19,7,9,9],cat:"Access Control"},
  {kw:"What Is Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cybersecurity",sv:9900,kd:77,wk36:8,wk37:11,wk38:11,wk39:11,wk40:10,aio:false,trend:[9,9,12,13,16,14,10,9,9,10,10,8,7,7,11,11,9,10,9,9,10,11,11,9,9,9,10,10,12,6,6,6,9,10,18,8,11,11,11,10],cat:"Cyber Security"},
  {kw:"What Is Soc 2 Compliance",url:"https://www.fortinet.com/resources/cyberglossary/soc-2-compliance",sv:1000,kd:45,wk36:2,wk37:7,wk38:6,wk39:7,wk40:5,aio:true,trend:[5,5,7,4,3,2,3,2,2,3,3,3,3,2,5,3,3,3,2,2,4,4,4,3,5,3,5,4,6,2,3,3,3,2,2,2,7,6,7,5],cat:"Cyber Compliance"},
  {kw:"Cobit",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cobit",sv:3600,kd:41,wk36:6,wk37:3,wk38:3,wk39:4,wk40:2,aio:false,trend:[3,5,5,3,3,3,2,3,4,4,5,5,5,3,3,3,3,2,3,2,2,2,2,3,2,2,2,2,3,6,7,7,3,5,5,6,3,3,4,2],cat:"Cyber Compliance"},
  {kw:"What Is IOT?",url:"https://www.fortinet.com/resources/cyberglossary/iot",sv:9900,kd:75,wk36:6,wk37:20,wk38:11,wk39:25,wk40:25,aio:false,trend:[11,8,9,3,2,3,3,2,3,3,3,5,4,2,3,9,6,7,7,4,1,3,4,7,7,6,8,6,9,13,12,21,15,14,6,6,20,11,25,25],cat:"OT Security"},
  {kw:"Enterprise Architecture",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-architecture",sv:3600,kd:46,wk36:3,wk37:9,wk38:5,wk39:6,wk40:6,aio:false,trend:[19,26,19,19,21,18,17,14,16,7,15,13,13,11,7,32,15,12,13,9,10,11,14,12,15,23,12,24,30,3,4,3,3,4,3,3,9,5,6,6],cat:"Cyber Security"},
  {kw:"Disaster Recovery",url:"https://www.fortinet.com/resources/cyberglossary/disaster-recovery",sv:8100,kd:74,wk36:6,wk37:10,wk38:11,wk39:7,wk40:7,aio:false,trend:[15,15,15,15,16,14,11,12,14,12,7,9,11,13,7,14,20,15,12,15,11,14,15,13,16,14,15,12,28,9,11,11,6,4,5,6,10,11,7,7],cat:"Cyber Security"},
  {kw:"Personally Identifiable Information",url:"https://www.fortinet.com/resources/cyberglossary/pii",sv:12100,kd:64,wk36:3,wk37:25,wk38:25,wk39:31,wk40:27,aio:false,trend:[23,13,30,9,11,24,13,13,10,5,6,6,13,12,7,18,16,26,26,23,21,25,25,28,29,25,23,24,26,8,6,6,6,6,4,3,25,25,31,27],cat:"Cyber Compliance"},
  {kw:"OSI Model",url:"https://www.fortinet.com/resources/cyberglossary/osi-model",sv:33100,kd:59,wk36:23,wk37:36,wk38:36,wk39:35,wk40:1,aio:false,trend:[15,13,13,11,11,17,13,8,10,6,8,3,16,4,4,3,8,20,2,17,13,11,16,14,7,13,11,10,17,2,2,2,22,26,24,23,36,36,35,1],cat:"Network Security"},
  {kw:"Owasp",url:"https://www.fortinet.com/resources/cyberglossary/owasp",sv:14800,kd:72,wk36:16,wk37:12,wk38:12,wk39:7,wk40:6,aio:false,trend:[8,8,8,9,8,10,9,8,9,8,8,7,7,7,6,14,17,15,11,10,9,10,10,9,12,12,11,13,14,15,20,11,3,3,16,16,12,12,7,6],cat:"Cyber Compliance"},
  {kw:"RBAC",url:"https://www.fortinet.com/resources/cyberglossary/role-based-access-control",sv:9900,kd:79,wk36:11,wk37:15,wk38:6,wk39:3,wk40:2,aio:false,trend:[11,19,18,21,21,14,13,7,13,12,11,12,13,9,9,10,8,8,9,15,4,7,12,8,14,12,24,8,14,34,34,21,32,20,18,11,15,6,3,2],cat:"Cyber Security"},
  {kw:"What Is A Cyber Attack",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cyber-attack",sv:2900,kd:61,wk36:8,wk37:3,wk38:3,wk39:4,wk40:5,aio:true,trend:[8,9,4,11,11,10,7,7,2,2,2,3,4,6,7,2,2,2,2,2,3,4,4,4,5,3,3,3,5,11,8,21,11,14,9,8,3,3,4,5],cat:"Cyber Threats"},
  {kw:"Vishing Attack",url:"https://www.fortinet.com/resources/cyberglossary/vishing-attack",sv:1600,kd:35,wk36:5,wk37:5,wk38:5,wk39:6,wk40:5,aio:false,trend:[5,5,7,8,9,7,5,8,6,5,5,5,5,6,13,2,3,3,2,4,5,4,5,5,7,6,8,4,8,4,4,4,6,5,4,5,5,5,6,5],cat:"Cyber Threats"},
  {kw:"Endpoint Protection Platform",url:"https://www.fortinet.com/resources/cyberglossary/endpoint-protection-platform",sv:1300,kd:39,wk36:2,wk37:6,wk38:5,wk39:4,wk40:10,aio:true,trend:[2,2,1,2,2,2,2,5,4,5,5,5,12,5,4,5,5,2,2,2,2,2,1,2,2,3,3,2,3,2,2,2,2,2,4,2,6,5,4,10],cat:"Endpoint Security"},
  {kw:"What Is A WAN",url:"https://www.fortinet.com/resources/cyberglossary/wan",sv:1600,kd:49,wk36:11,wk37:4,wk38:3,wk39:6,wk40:7,aio:false,trend:[9,10,8,10,8,12,9,8,9,6,6,8,6,4,3,8,9,3,3,2,3,8,7,14,2,3,9,12,25,2,3,2,2,2,2,11,4,3,6,7],cat:"Network Security"},
  {kw:"Ransomware Statistics",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-statistics",sv:590,kd:44,wk36:29,wk37:20,wk38:7,wk39:6,wk40:20,aio:false,trend:[1,1,1,14,6,7,4,6,4,4,10,5,8,8,9,16,18,5,9,11,15,10,9,21,20,18,6,9,20,41,46,39,18,13,20,29,20,7,6,20],cat:"Cyber Threats"},
  {kw:"CIEM",url:"https://www.fortinet.com/resources/cyberglossary/ciem",sv:1900,kd:36,wk36:17,wk37:14,wk38:15,wk39:15,wk40:15,aio:false,trend:[6,2,4,3,4,4,5,5,4,4,9,4,9,10,7,8,9,8,9,10,13,16,15,17,17,18,16,20,21,16,12,19,19,11,15,17,14,15,15,15],cat:"Cloud Security"},
  {kw:"Command And Control Attack",url:"https://www.fortinet.com/resources/cyberglossary/command-and-control-attacks",sv:70,kd:19,wk36:75,wk37:2,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,2,2,3,2,3,1,2,2,2,3,2,3,3,3,3,1,2,2,2,2,2,2,2,2,2,1,1,2,61,57,58,70,75,70,75,2,1,1,1],cat:"Cyber Threats"},
  {kw:"IOT Security",url:"https://www.fortinet.com/resources/cyberglossary/iot-security",sv:3600,kd:52,wk36:10,wk37:6,wk38:6,wk39:5,wk40:5,aio:true,trend:[5,5,5,5,5,6,4,3,4,3,4,3,6,5,2,4,4,2,2,3,5,5,7,4,2,2,4,3,5,29,32,29,29,18,9,10,6,6,5,5],cat:"OT Security"},
  {kw:"Packet Loss",url:"https://www.fortinet.com/resources/cyberglossary/what-is-packet-loss",sv:3600,kd:54,wk36:7,wk37:6,wk38:5,wk39:5,wk40:5,aio:true,trend:[5,6,4,4,6,6,5,3,5,4,4,4,5,3,2,2,3,4,4,3,2,3,6,4,5,4,5,3,5,7,4,5,4,5,7,7,6,5,5,5],cat:"Cyber Security"},
  {kw:"Dynamic Application Security Testing",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-application-security-testing",sv:1300,kd:32,wk36:23,wk37:15,wk38:12,wk39:6,wk40:6,aio:false,trend:[17,14,16,12,21,9,7,5,2,2,3,8,4,8,3,11,14,10,10,11,11,15,14,18,13,10,12,18,19,18,25,26,23,20,18,23,15,12,6,6],cat:"Cyber Security"},
  {kw:"Bluekeep",url:"https://www.fortinet.com/resources/cyberglossary/what-is-bluekeep",sv:320,kd:22,wk36:11,wk37:3,wk38:3,wk39:3,wk40:2,aio:true,trend:[3,3,4,4,4,4,4,3,3,3,3,3,2,3,3,2,3,2,3,2,1,1,1,1,2,1,1,1,2,11,17,13,10,9,11,11,3,3,3,2],cat:"Cyber Security"},
  {kw:"It Operations",url:"https://www.fortinet.com/resources/cyberglossary/it-operations",sv:2400,kd:32,wk36:7,wk37:9,wk38:8,wk39:8,wk40:9,aio:false,trend:[10,10,9,14,10,14,11,9,8,8,8,6,7,5,7,5,7,6,6,6,8,7,8,8,7,7,8,8,9,8,8,8,8,9,8,7,9,8,8,9],cat:"SecOps"},
  {kw:"Advanced Persistent Threat",url:"https://www.fortinet.com/resources/cyberglossary/advanced-persistent-threat",sv:2900,kd:72,wk36:16,wk37:14,wk38:14,wk39:11,wk40:10,aio:false,trend:[13,15,15,16,16,17,13,14,14,13,13,13,19,14,15,16,19,18,19,17,14,16,21,22,18,20,19,18,20,16,27,26,20,21,15,16,14,14,11,10],cat:"Cyber Threats"},
  {kw:"CNapp",url:"https://www.fortinet.com/resources/cyberglossary/cnapp",sv:5400,kd:44,wk36:29,wk37:15,wk38:14,wk39:10,wk40:12,aio:false,trend:[21,31,38,30,20,27,27,12,10,13,13,11,20,18,11,12,14,28,16,12,15,27,14,12,13,21,12,10,18,25,29,29,28,33,29,29,15,14,10,12],cat:"Cloud Security"},
  {kw:"Social Engineering",url:"https://www.fortinet.com/resources/cyberglossary/social-engineering",sv:14800,kd:74,wk36:12,wk37:27,wk38:27,wk39:24,wk40:25,aio:false,trend:[9,10,10,9,12,10,10,10,10,10,10,9,8,7,6,8,16,24,23,21,24,24,21,23,23,25,24,22,24,16,20,26,3,9,20,12,27,27,24,25],cat:"Cyber Threats"},
  {kw:"SAAS",url:"https://www.fortinet.com/resources/cyberglossary/software-as-a-service",sv:90500,kd:92,wk36:4,wk37:5,wk38:5,wk39:7,wk40:10,aio:false,trend:[12,12,12,12,7,5,5,4,6,5,3,2,2,3,2,3,7,10,13,18,7,7,13,6,5,10,10,10,11,3,3,3,3,3,2,4,5,5,7,10],cat:"SecOps"},
  {kw:"Privileged Access Management",url:"https://www.fortinet.com/resources/cyberglossary/privileged-access-management",sv:6600,kd:62,wk36:25,wk37:12,wk38:12,wk39:11,wk40:10,aio:false,trend:[10,13,12,15,20,22,17,11,15,9,9,9,10,14,13,13,11,18,21,20,7,11,11,13,13,11,13,12,13,16,18,17,19,25,21,25,12,12,11,10],cat:"SASE"},
  {kw:"LAAS",url:"https://www.fortinet.com/resources/cyberglossary/infrastructure-as-a-service",sv:9900,kd:65,wk36:6,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[6,9,9,3,13,13,7,9,12,12,11,8,8,8,11,19,22,24,26,17,16,17,23,28,28,26,26,27,29,6,6,6,6,6,6,6,null,null,null,null],cat:"Cloud Security"},
  {kw:"Data Governance",url:"https://www.fortinet.com/resources/cyberglossary/data-governance",sv:12100,kd:65,wk36:5,wk37:44,wk38:31,wk39:35,wk40:30,aio:false,trend:[22,21,25,24,24,23,24,20,19,19,17,15,12,14,9,16,24,25,26,18,17,23,23,22,24,27,29,28,35,5,6,5,4,6,5,5,44,31,35,30],cat:"Data Security"},
  {kw:"IEC 62443",url:"https://www.fortinet.com/resources/cyberglossary/iec-62443",sv:1600,kd:37,wk36:20,wk37:3,wk38:3,wk39:3,wk40:3,aio:true,trend:[3,3,3,3,3,3,3,3,5,4,4,5,5,4,2,2,3,3,2,2,3,2,3,3,3,3,2,2,3,25,23,24,26,22,23,20,3,3,3,3],cat:"OT Security"},
  {kw:"Digital Experience Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/digital-experience-monitoring",sv:1000,kd:19,wk36:3,wk37:6,wk38:4,wk39:4,wk40:3,aio:true,trend:[29,41,20,24,17,14,15,10,12,6,7,6,11,8,6,6,6,7,9,14,8,8,8,8,9,6,6,5,8,2,3,2,3,4,4,3,6,4,4,3],cat:"Network Security"},
  {kw:"Active Directory Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/active-directory",sv:30,kd:20,wk36:10,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[12,12,2,5,5,4,5,3,3,3,3,5,5,2,2,3,2,2,2,3,3,3,3,3,5,5,5,3,4,10,8,10,11,10,11,10,1,1,2,2],cat:"Network Security"},
  {kw:"SCIM Authentication",url:"https://www.fortinet.com/resources/cyberglossary/what-is-scim",sv:110,kd:32,wk36:8,wk37:1,wk38:2,wk39:5,wk40:2,aio:true,trend:[9,4,6,6,6,6,6,6,6,5,2,1,1,1,1,6,8,8,8,6,6,6,8,8,7,8,5,4,6,18,24,21,21,17,16,8,1,2,5,2],cat:"Endpoint Security"},
  {kw:"Application Security",url:"https://www.fortinet.com/resources/cyberglossary/application-security",sv:4400,kd:49,wk36:35,wk37:29,wk38:27,wk39:8,wk40:15,aio:false,trend:[17,19,31,18,18,25,17,11,12,22,21,16,14,17,16,15,14,18,22,20,11,13,21,21,21,18,19,15,22,22,29,20,26,16,5,35,29,27,8,15],cat:"Network Security"},
  {kw:"Cyber Safety",url:"https://www.fortinet.com/resources/cyberglossary/cyber-safety",sv:1000,kd:52,wk36:2,wk37:4,wk38:3,wk39:5,wk40:4,aio:true,trend:[8,7,5,4,6,5,2,3,4,6,6,4,4,3,3,3,2,4,3,2,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,4,3,5,4],cat:"Cyber Threats"},
  {kw:"Cyber Resilience",url:"https://www.fortinet.com/resources/cyberglossary/cyber-resilience",sv:2400,kd:48,wk36:4,wk37:26,wk38:27,wk39:35,wk40:28,aio:false,trend:[17,16,15,19,24,19,16,19,17,11,17,5,9,4,4,5,6,5,8,9,4,5,4,5,5,6,8,9,13,5,3,6,5,6,5,4,26,27,35,28],cat:"Cyber Threats"},
  {kw:"Antivirus Protection",url:"https://www.fortinet.com/resources/cyberglossary/antivirus-protection",sv:4400,kd:88,wk36:7,wk37:5,wk38:5,wk39:6,wk40:6,aio:true,trend:[16,16,6,12,6,12,9,9,12,17,8,6,10,10,6,6,9,9,7,7,6,6,7,6,6,6,5,6,7,9,10,10,10,10,8,7,5,5,6,6],cat:"Cyber Security"},
  {kw:"Web Application Firewall Architecture",url:"https://www.fortinet.com/resources/cyberglossary/waf-architecture",sv:170,kd:45,wk36:9,wk37:5,wk38:2,wk39:2,wk40:2,aio:false,trend:[4,2,4,4,4,3,3,7,4,2,2,1,1,1,2,2,2,2,1,1,1,2,2,2,2,1,1,1,2,7,8,9,8,7,9,9,5,2,2,2],cat:"NGFW"},
  {kw:"Cybersecurity Awareness",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-awareness",sv:1220000,kd:65,wk36:2,wk37:11,wk38:11,wk39:10,wk40:9,aio:true,trend:[null,null,null,18,18,25,20,19,21,18,16,15,12,12,8,10,6,13,13,13,10,11,12,11,12,10,11,10,11,3,3,3,3,4,3,2,11,11,10,9],cat:"Cyber Security"},
  {kw:"It Security",url:"https://www.fortinet.com/resources/cyberglossary/it-security",sv:8100,kd:43,wk36:3,wk37:8,wk38:8,wk39:7,wk40:8,aio:true,trend:[null,null,null,13,14,17,14,9,8,11,7,7,6,7,12,11,11,20,13,16,12,12,27,25,18,14,30,21,23,5,4,5,5,5,3,3,8,8,7,8],cat:"Network Security"},
  {kw:"Nist 800 53",url:"https://www.fortinet.com/resources/cyberglossary/nist-800-53",sv:4400,kd:44,wk36:4,wk37:11,wk38:12,wk39:11,wk40:10,aio:false,trend:[null,null,null,7,8,9,8,7,7,6,5,7,6,7,6,6,8,9,12,11,12,15,12,15,12,14,16,12,14,4,5,5,5,5,3,4,11,12,11,10],cat:"Cyber Compliance"},
  {kw:"Nittf Cnssd 504",url:"https://www.fortinet.com/resources/cyberglossary/nittf-cnssd-504",sv:0,kd:14,wk36:6,wk37:2,wk38:2,wk39:2,wk40:1,aio:false,trend:[null,null,null,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,10,5,5,8,10,7,6,2,2,2,1],cat:"Cyber Compliance"},
  {kw:"Principle Of Least Privilege",url:"https://www.fortinet.com/resources/cyberglossary/principle-of-least-privilege",sv:5400,kd:63,wk36:5,wk37:30,wk38:25,wk39:14,wk40:11,aio:false,trend:[null,null,null,13,11,14,13,4,3,5,6,4,5,4,8,18,14,19,20,13,20,18,23,25,25,19,24,23,24,2,3,4,3,4,5,5,30,25,14,11],cat:"Access Control"},
  {kw:"SBOM",url:"https://www.fortinet.com/resources/cyberglossary/sbom",sv:4400,kd:46,wk36:9,wk37:24,wk38:25,wk39:29,wk40:25,aio:false,trend:[null,null,null,18,24,25,11,20,23,12,16,7,8,12,21,25,26,24,23,16,15,22,27,18,22,22,23,30,33,8,8,9,9,8,7,9,24,25,29,25],cat:"Cyber Security"},
  {kw:"Secret Detection",url:"https://www.fortinet.com/resources/cyberglossary/secret-detection",sv:50,kd:24,wk36:7,wk37:2,wk38:2,wk39:3,wk40:3,aio:false,trend:[null,null,null,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,7,6,8,9,10,9,7,2,2,3,3],cat:"Data Security"},
  {kw:"AI In Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/artificial-intelligence-in-cybersecurity",sv:320,kd:67,wk36:5,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[2,6,9,9,8,2,5,7,2,1,1,2,9,1,1,1,1,1,1,1,1,1,1,1,3,3,2,2,2,2,2,2,5,6,5,5,2,2,2,2],cat:"AI Security"},
  {kw:"AI Adoption",url:"https://www.fortinet.com/resources/cyberglossary/ai-adoption",sv:1600,kd:48,wk36:6,wk37:2,wk38:2,wk39:2,wk40:1,aio:true,trend:[1,3,17,13,11,9,7,5,5,9,6,7,7,6,6,5,4,4,4,2,4,5,3,4,3,2,2,2,2,7,7,7,7,7,6,6,2,2,2,1],cat:"AI Security"},
  {kw:"AI Security",url:"https://www.fortinet.com/resources/cyberglossary/ai-security",sv:4400,kd:67,wk36:11,wk37:12,wk38:9,wk39:7,wk40:5,aio:false,trend:[8,11,11,9,11,12,9,11,11,8,9,7,7,9,4,13,14,17,17,17,17,22,18,17,18,15,11,12,11,12,11,11,12,12,11,11,12,9,7,5],cat:"AI Security"},
  {kw:"Deep Fake AI",url:"https://www.fortinet.com/resources/cyberglossary/deepfake-ai",sv:3600,kd:82,wk36:6,wk37:6,wk38:10,wk39:10,wk40:11,aio:false,trend:[5,6,1,5,5,5,1,1,1,4,2,3,3,3,6,4,5,8,8,7,9,8,7,8,8,7,8,19,3,6,6,5,6,6,6,6,6,10,10,11],cat:"AI Security"},
  {kw:"Virtual Private Cloud",url:"https://www.fortinet.com/resources/cyberglossary/vpc",sv:1600,kd:21,wk36:3,wk37:8,wk38:9,wk39:10,wk40:10,aio:false,trend:[5,4,3,5,4,3,2,3,2,2,3,4,2,4,3,4,4,3,3,4,4,4,3,4,11,12,5,12,10,6,7,7,6,6,5,3,8,9,10,10],cat:"Cloud Security"},
  {kw:"CASB",url:"https://www.fortinet.com/resources/cyberglossary/casb",sv:1600,kd:50,wk36:2,wk37:7,wk38:6,wk39:6,wk40:7,aio:false,trend:[4,3,3,3,3,3,2,2,5,3,5,7,6,3,3,3,2,5,5,7,5,5,4,3,5,5,5,5,4,2,1,1,3,3,2,2,7,6,6,7],cat:"SASE"},
  {kw:"Public Cloud Security Risks",url:"https://www.fortinet.com/resources/cyberglossary/public-cloud-security-risks",sv:40,kd:25,wk36:4,wk37:6,wk38:6,wk39:4,wk40:2,aio:false,trend:[2,2,2,2,2,2,2,2,2,2,3,3,2,1,1,1,1,1,8,7,5,5,7,6,6,7,7,7,6,3,3,4,4,4,4,4,6,6,4,2],cat:"Cloud Security"},
  {kw:"Cloud VPN",url:"https://www.fortinet.com/resources/cyberglossary/cloud-vpn",sv:4400,kd:56,wk36:2,wk37:7,wk38:6,wk39:7,wk40:7,aio:false,trend:[9,8,7,8,10,12,9,8,6,9,8,8,8,7,4,5,4,5,6,7,6,6,6,7,8,7,6,4,4,2,2,2,2,3,2,2,7,6,7,7],cat:"VPN"},
  {kw:"Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cloud-security",sv:1300,kd:54,wk36:4,wk37:24,wk38:20,wk39:23,wk40:28,aio:false,trend:[18,13,15,14,14,16,14,14,9,9,8,7,8,13,9,12,14,12,14,15,21,21,16,11,23,15,10,23,18,2,2,3,4,5,3,4,24,20,23,28],cat:"Cloud Security"},
  {kw:"Cloud Data Protection",url:"https://www.fortinet.com/resources/cyberglossary/cloud-data-protection",sv:1300,kd:42,wk36:3,wk37:25,wk38:25,wk39:26,wk40:27,aio:false,trend:[15,13,17,19,22,17,15,8,8,10,7,8,10,12,7,13,19,44,47,45,38,36,18,35,35,30,25,27,26,2,3,3,3,4,3,3,25,25,26,27],cat:"Data Security"},
  {kw:"Cloud Encryption",url:"https://www.fortinet.com/resources/cyberglossary/cloud-encryption",sv:720,kd:37,wk36:1,wk37:13,wk38:11,wk39:8,wk40:6,aio:true,trend:[19,21,16,14,9,13,11,3,8,8,5,11,23,5,6,8,8,8,8,6,8,8,11,9,12,14,14,11,9,2,2,2,1,1,1,1,13,11,8,6],cat:"Cloud Security"},
  {kw:"Cloud Firewall",url:"https://www.fortinet.com/resources/cyberglossary/cloud-firewall",sv:1300,kd:38,wk36:7,wk37:2,wk38:2,wk39:2,wk40:3,aio:false,trend:[2,2,1,2,5,5,5,2,2,2,4,3,2,3,3,2,3,2,2,2,2,2,2,2,2,2,2,2,2,8,9,9,9,10,10,7,2,2,2,3],cat:"Cloud Security"},
  {kw:"Virtual Firewall",url:"https://www.fortinet.com/resources/cyberglossary/virtual-firewall-for-cloud",sv:1000,kd:36,wk36:2,wk37:8,wk38:8,wk39:1,wk40:12,aio:false,trend:[4,17,2,14,14,14,14,15,9,9,9,9,17,31,33,33,33,33,14,4,4,4,4,7,46,22,41,8,4,2,2,2,2,2,2,2,8,8,1,12],cat:"NGFW"},
  {kw:"Cloud Security TIPS",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-tips",sv:2240000,kd:34,wk36:2,wk37:9,wk38:2,wk39:2,wk40:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,3,2,3,3,2,5,2,9,2,2,1],cat:"Cloud Security"},
  {kw:"Cloud Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/cloud-detection-and-response",sv:720,kd:19,wk36:2,wk37:11,wk38:7,wk39:5,wk40:8,aio:true,trend:[null,null,null,6,5,3,5,4,5,7,6,3,7,6,5,5,5,6,10,7,10,10,6,4,4,6,5,5,2,2,2,2,3,2,3,2,11,7,5,8],cat:"Cloud Security"},
  {kw:"Cloud Workload Protection Platform",url:"https://www.fortinet.com/resources/cyberglossary/cwpp",sv:2900,kd:37,wk36:5,wk37:8,wk38:10,wk39:16,wk40:14,aio:false,trend:[null,null,null,10,13,12,11,10,10,9,9,9,9,11,14,10,10,10,14,11,11,12,11,11,16,7,16,5,4,8,8,8,6,6,4,5,8,10,16,14],cat:"Cloud Security"},
  {kw:"DLP For Cloud",url:"https://www.fortinet.com/resources/cyberglossary/dlp-for-cloud",sv:70,kd:26,wk36:7,wk37:6,wk38:4,wk39:4,wk40:6,aio:false,trend:[null,null,null,3,4,4,4,4,3,3,1,1,1,1,1,1,4,5,4,3,5,2,2,2,2,2,2,4,4,6,6,7,7,8,8,7,6,4,4,6],cat:"Data Security"},
  {kw:"What Does A Firewall Do",url:"https://www.fortinet.com/resources/cyberglossary/what-does-a-firewall-do",sv:1600,kd:59,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[8,8,6,6,7,6,7,5,3,3,3,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"NGFW"},
  {kw:"Firewall As A Service",url:"https://www.fortinet.com/resources/cyberglossary/firewall-as-a-service-fwaas",sv:1000,kd:30,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Waf Vs Firewall",url:"https://www.fortinet.com/resources/cyberglossary/waf-vs-firewall",sv:320,kd:20,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"NGFW"},
  {kw:"How Does A Firewall Work",url:"https://www.fortinet.com/resources/cyberglossary/how-does-a-firewall-work",sv:590,kd:44,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Perimeter Firewall",url:"https://www.fortinet.com/resources/cyberglossary/perimeter-firewall",sv:170,kd:13,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Transparent Firewall",url:"https://www.fortinet.com/resources/cyberglossary/transparent-firewall",sv:50,kd:9,wk36:1,wk37:1,wk38:1,wk39:2,wk40:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4],cat:"NGFW"},
  {kw:"Firewall Configuration",url:"https://www.fortinet.com/resources/cyberglossary/firewall-configuration",sv:5400,kd:27,wk36:1,wk37:1,wk38:1,wk39:1,wk40:6,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6],cat:"NGFW"},
  {kw:"Hybrid Mesh Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-mesh-firewall",sv:170,kd:24,wk36:5,wk37:5,wk38:3,wk39:1,wk40:6,aio:true,trend:[4,2,2,2,2,2,1,1,1,1,1,1,2,1,1,2,5,1,2,6,4,3,11,2,2,5,4,8,8,5,5,7,5,7,5,5,5,3,1,6],cat:"NGFW"},
  {kw:"Proxy Firewall",url:"https://www.fortinet.com/resources/cyberglossary/proxy-firewall",sv:590,kd:32,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"NGFW"},
  {kw:"Does Firewall Slow Down Internet Speed",url:"https://www.fortinet.com/resources/cyberglossary/does-a-firewall-affect-internet-speed",sv:20,kd:11,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Hybrid Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-firewall-advantages-disadvantages",sv:20,kd:23,wk36:2,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2,2,2,2,1,1,1,1],cat:"NGFW"},
  {kw:"Stateful Vs Stateless Firewall",url:"https://www.fortinet.com/resources/cyberglossary/stateful-vs-stateless-firewall",sv:1000,kd:33,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Proxy Server Vs Packet Filtering Firewall",url:"https://www.fortinet.com/resources/cyberglossary/proxy-server-vs-packet-filtering-firewall",sv:10,kd:25,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Firewall",url:"https://www.fortinet.com/resources/cyberglossary/firewall",sv:27100,kd:74,wk36:7,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[7,8,7,7,7,7,6,5,4,3,4,4,4,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,8,6,9,9,9,6,7,2,2,2,2],cat:"NGFW"},
  {kw:"Hardware Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hardware-firewalls-better-than-software",sv:4400,kd:28,wk36:4,wk37:4,wk38:3,wk39:4,wk40:3,aio:true,trend:[1,1,1,2,2,2,1,1,2,2,4,2,2,2,3,3,3,1,3,1,2,3,6,4,3,1,2,2,2,2,2,3,2,4,3,4,4,3,4,3],cat:"NGFW"},
  {kw:"Firewall Benefits",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-firewall",sv:50,kd:44,wk36:1,wk37:1,wk38:1,wk39:1,wk40:5,aio:false,trend:[2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5],cat:"NGFW"},
  {kw:"What Is A Firewall",url:"https://www.fortinet.com/resources/cyberglossary/firewall",sv:135000,kd:70,wk36:3,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[3,2,1,1,2,2,2,2,2,2,3,3,4,3,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,1,2,2,3,2,3,2,2,2,2],cat:"NGFW"},
  {kw:"End Of Life Firewall",url:"https://www.fortinet.com/resources/cyberglossary/end-of-life-firewall",sv:2900,kd:54,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Human Firewall",url:"https://www.fortinet.com/resources/cyberglossary/human-firewall",sv:1000,kd:21,wk36:6,wk37:2,wk38:2,wk39:2,wk40:3,aio:true,trend:[4,3,3,3,5,4,4,4,3,2,2,2,2,3,2,3,3,2,2,2,2,2,2,4,2,2,3,2,2,7,7,6,5,7,5,6,2,2,2,3],cat:"NGFW"},
  {kw:"Rugged Firewall",url:"https://www.fortinet.com/resources/cyberglossary/ruggedized-firewall",sv:20,kd:11,wk36:1,wk37:8,wk38:null,wk39:2,wk40:1,aio:false,trend:[16,17,11,14,16,16,16,16,11,10,10,10,10,10,11,8,6,6,6,8,8,6,7,6,6,6,9,1,1,1,1,1,1,1,1,1,8,null,2,1],cat:"OT Security"},
  {kw:"Web Application Firewall For Enterprise",url:"https://www.fortinet.com/resources/cyberglossary/business-web-application-firewall",sv:0,kd:69,wk36:5,wk37:21,wk38:2,wk39:2,wk40:18,aio:false,trend:[2,2,1,2,2,2,1,1,1,1,1,2,3,2,4,1,2,2,1,1,1,2,3,3,39,1,1,1,1,1,3,6,3,6,7,5,21,2,2,18],cat:"NGFW"},
  {kw:"WAF",url:"https://www.fortinet.com/resources/cyberglossary/waf",sv:1300,kd:58,wk36:4,wk37:12,wk38:12,wk39:11,wk40:10,aio:false,trend:[6,6,4,7,8,6,3,6,6,6,3,2,3,5,2,7,6,4,3,9,5,4,4,3,14,6,3,15,8,3,4,3,5,5,4,4,12,12,11,10],cat:"NGFW"},
  {kw:"Best Virtual Firwall",url:"https://www.fortinet.com/resources/cyberglossary/comparing-virtual-firewalls",sv:590,kd:39,wk36:5,wk37:15,wk38:15,wk39:1,wk40:1,aio:false,trend:[null,null,null,9,9,9,5,9,9,74,1,4,3,12,6,4,4,8,10,16,9,15,12,8,null,4,8,null,null,46,4,3,4,5,5,5,15,15,1,1],cat:"NGFW"},
  {kw:"NGFW",url:"https://www.fortinet.com/resources/cyberglossary/next-generation-firewall",sv:4400,kd:52,wk36:24,wk37:28,wk38:40,wk39:30,wk40:45,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,71,11,1,3,5,5,3,12,7,9,24,29,26,22,30,32,13,21,18,20,19,2,18,24,28,40,30,45],cat:"NGFW"},
  {kw:"Network Security Vulnerability",url:"https://www.fortinet.com/resources/cyberglossary/network-security-vulnerability",sv:110,kd:27,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Network Security"},
  {kw:"Network Security Threats",url:"https://www.fortinet.com/resources/cyberglossary/network-security-threats",sv:720,kd:50,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Network Security"},
  {kw:"Cloud Network Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-network-security",sv:2900,kd:32,wk36:2,wk37:2,wk38:1,wk39:2,wk40:1,aio:false,trend:[13,15,20,24,27,30,31,30,11,13,19,21,11,12,7,12,11,13,15,13,12,12,14,14,14,9,4,3,2,2,3,5,3,4,4,2,2,1,2,1],cat:"Network Security"},
  {kw:"Network Security Management",url:"https://www.fortinet.com/resources/cyberglossary/network-security-management",sv:1300,kd:31,wk36:2,wk37:7,wk38:7,wk39:7,wk40:4,aio:false,trend:[8,8,8,9,10,10,9,6,8,7,7,9,6,4,4,2,4,8,9,10,8,8,6,6,6,6,7,6,5,3,2,3,3,2,3,2,7,7,7,4],cat:"Network Security"},
  {kw:"Network Security Vs Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/network-security-vs-cybersecurity",sv:90,kd:12,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Network Security"},
  {kw:"IT Vs OT Security",url:"https://www.fortinet.com/resources/cyberglossary/it-vs-ot-cybersecurity",sv:70,kd:42,wk36:3,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,5,3,3,2,2,1,1],cat:"OT Security"},
  {kw:"Manufacturing OT",url:"https://www.fortinet.com/resources/cyberglossary/manufacturing-ot",sv:40,kd:10,wk36:2,wk37:5,wk38:4,wk39:1,wk40:1,aio:false,trend:[9,9,9,9,9,9,9,4,7,8,9,16,10,1,9,8,8,8,8,8,8,3,10,15,21,4,7,null,8,2,2,2,2,3,2,2,5,4,1,1],cat:"OT Security"},
  {kw:"Quantum Key Distribution",url:"https://www.fortinet.com/resources/cyberglossary/quantum-key-distribution",sv:1000,kd:45,wk36:4,wk37:2,wk38:2,wk39:4,wk40:3,aio:false,trend:[7,7,7,10,9,8,7,9,7,5,8,2,4,4,3,4,5,4,4,4,5,7,6,3,6,6,6,6,2,2,2,2,1,3,3,4,2,2,4,3],cat:"Quantum Security"},
  {kw:"Post Quantum Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/post-quantum-cryptography",sv:3600,kd:76,wk36:7,wk37:9,wk38:10,wk39:12,wk40:10,aio:false,trend:[17,2,1,1,2,2,2,2,4,9,4,9,5,2,20,3,3,2,2,2,2,3,10,2,19,18,2,17,10,18,22,21,11,12,9,7,9,10,12,10],cat:"Quantum Security"},
  {kw:"Quantum Computing Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-computing-security",sv:110,kd:34,wk36:2,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[8,4,4,4,4,3,4,4,6,5,6,6,6,6,9,2,3,2,3,7,7,7,7,5,5,4,4,5,5,3,2,2,3,4,4,2,1,1,1,1],cat:"Quantum Security"},
  {kw:"Quantum Safe Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-safe-security",sv:70,kd:48,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[3,3,1,1,1,1,3,2,2,2,2,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Quantum Security"},
  {kw:"Quantum Safe Encryption",url:"https://www.fortinet.com/resources/cyberglossary/quantum-safe-encryption",sv:390,kd:49,wk36:23,wk37:55,wk38:23,wk39:65,wk40:26,aio:false,trend:[1,1,1,2,3,4,4,6,7,31,33,3,36,22,43,41,21,32,32,28,9,9,9,9,8,8,8,8,5,28,2,2,25,2,43,23,55,23,65,26],cat:"Quantum Security"},
  {kw:"SD WAN Vs SASE",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-sase",sv:70,kd:13,wk36:2,wk37:3,wk38:3,wk39:1,wk40:1,aio:true,trend:[2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,2,2,2,2,2,3,3,1,1],cat:"SASE"},
  {kw:"SASE Vs CASB",url:"https://www.fortinet.com/resources/cyberglossary/sase-vs-casb",sv:260,kd:25,wk36:2,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[6,9,9,10,5,4,5,2,2,4,6,2,4,2,6,2,2,2,2,1,1,2,2,1,2,4,2,3,3,2,1,1,1,2,2,2,1,1,1,2],cat:"SASE"},
  {kw:"SASE",url:"https://www.fortinet.com/resources/cyberglossary/sase",sv:14800,kd:69,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[1,1,1,1,1,1,2,2,3,4,3,4,6,4,4,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"SASE"},
  {kw:"SASE Architecture",url:"https://www.fortinet.com/resources/cyberglossary/sase-architecture",sv:1000,kd:59,wk36:5,wk37:4,wk38:4,wk39:4,wk40:2,aio:false,trend:[3,4,3,3,5,5,4,5,7,4,4,4,2,3,4,4,3,3,1,1,1,1,1,1,1,2,3,3,3,4,6,8,6,5,6,5,4,4,4,2],cat:"SASE"},
  {kw:"SASE Vs ZTNA",url:"https://www.fortinet.com/resources/cyberglossary/sase-vs-ztna",sv:110,kd:17,wk36:4,wk37:4,wk38:3,wk39:3,wk40:9,aio:false,trend:[1,2,2,2,2,2,2,2,2,2,2,1,2,2,3,2,1,1,1,2,1,2,3,2,2,3,2,3,3,3,3,3,4,3,4,4,4,3,3,9],cat:"SASE"},
  {kw:"Sovereign SASE",url:"https://www.fortinet.com/resources/cyberglossary/sovereign-sase",sv:40,kd:8,wk36:1,wk37:15,wk38:11,wk39:1,wk40:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,4,2,2,3,2,2,1,1,15,11,1,1],cat:"SASE"},
  {kw:"SDN Vs SD WAN",url:"https://www.fortinet.com/resources/cyberglossary/sdn-vs-sd-wan",sv:210,kd:24,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"SD-WAN"},
  {kw:"SD WAN Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-vpn",sv:110,kd:12,wk36:4,wk37:5,wk38:2,wk39:1,wk40:1,aio:true,trend:[3,3,3,3,3,2,2,2,1,1,1,1,2,5,4,2,1,2,2,2,2,1,1,1,5,3,2,5,5,4,5,4,5,5,4,4,5,2,1,1],cat:"SD-WAN"},
  {kw:"SD WAN Explained",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-explained",sv:50,kd:40,wk36:6,wk37:3,wk38:2,wk39:1,wk40:2,aio:false,trend:[11,7,6,6,6,6,6,8,2,4,3,1,1,4,4,2,3,2,3,2,4,2,2,5,6,5,4,4,3,3,3,2,3,5,2,6,3,2,1,2],cat:"SASE"},
  {kw:"SD WAN Benefits",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-sd-wan",sv:390,kd:24,wk36:1,wk37:5,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,1,1,1,1,1,1,1,1,1,1,1,5,1,1,1],cat:"SD-WAN"},
  {kw:"SD WAN As A Service",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-as-a-service",sv:590,kd:7,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,2,34,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"SASE"},
  {kw:"SD WAN Security",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-security",sv:260,kd:30,wk36:6,wk37:9,wk38:7,wk39:15,wk40:17,aio:false,trend:[6,13,14,12,5,18,17,18,19,5,4,4,9,6,5,4,10,4,4,4,4,3,4,14,15,13,11,17,14,5,10,2,6,7,2,6,9,7,15,17],cat:"SASE"},
  {kw:"SD WAN Vs Mpls",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-mpls",sv:880,kd:19,wk36:3,wk37:3,wk38:3,wk39:1,wk40:1,aio:true,trend:[null,null,null,9,3,4,4,1,1,1,1,2,2,1,1,2,2,3,2,4,6,6,11,9,12,8,2,3,3,3,3,4,3,4,2,3,3,3,1,1],cat:"Network Security"},
  {kw:"Security Operations",url:"https://www.fortinet.com/resources/cyberglossary/what-is-secops",sv:1300,kd:49,wk36:2,wk37:5,wk38:33,wk39:6,wk40:8,aio:true,trend:[11,13,7,12,17,9,12,10,5,5,10,11,5,9,12,10,10,18,13,17,23,29,26,12,14,17,15,18,10,2,2,2,3,3,2,2,5,33,6,8],cat:"SecOps"},
  {kw:"Secops",url:"https://www.fortinet.com/resources/cyberglossary/what-is-secops",sv:1900,kd:47,wk36:10,wk37:4,wk38:7,wk39:4,wk40:5,aio:false,trend:[13,13,9,10,12,10,5,5,5,4,5,5,6,7,6,6,7,6,5,8,9,8,7,10,10,8,11,10,9,7,9,7,6,9,8,10,4,7,4,5],cat:"SecOps"},
  {kw:"Secops Metrics",url:"https://www.fortinet.com/resources/cyberglossary/secops-metrics",sv:30,kd:16,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"SecOps"},
  {kw:"How To Implement Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/how-to-implement-zero-trust",sv:880,kd:50,wk36:4,wk37:2,wk38:1,wk39:1,wk40:1,aio:true,trend:[5,2,3,4,2,4,3,2,3,3,4,2,3,2,2,2,1,2,1,2,1,2,2,2,2,2,3,1,1,2,1,2,2,3,2,4,2,1,1,1],cat:"ZTNA"},
  {kw:"Universal ZTNA",url:"https://www.fortinet.com/resources/cyberglossary/universal-ztna",sv:110,kd:15,wk36:1,wk37:41,wk38:19,wk39:17,wk40:28,aio:false,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,41,19,17,28],cat:"ZTNA"},
  {kw:"Zero Trust EDGE",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-edge",sv:260,kd:14,wk36:2,wk37:15,wk38:10,wk39:5,wk40:14,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,2,4,10,5,3,12,3,2,2,11,12,11,10,19,16,10,17,15,14,2,2,2,2,2,2,2,15,10,5,14],cat:"ZTNA"},
  {kw:"Zerotrust Security Model",url:"https://www.fortinet.com/resources/cyberglossary/what-is-the-zero-trust-network-security-model",sv:5400,kd:36,wk36:1,wk37:1,wk38:2,wk39:2,wk40:2,aio:false,trend:[5,7,3,6,6,5,4,4,3,3,2,2,4,2,2,3,3,2,2,3,5,6,6,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2],cat:"ZTNA"},
  {kw:"ZTNA Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/ztna-vs-vpn",sv:1000,kd:29,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[9,3,12,8,5,5,2,2,2,4,3,5,2,4,5,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"ZTNA"},
  {kw:"Zero-Trust Network Access",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ztna",sv:8100,kd:74,wk36:2,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,2,2,4,2,1,2,2,2,2,3,2,2,2,2,4,5,2,4,4,3,2,2,1,1,2,2,3,2,2,1,1,1,2],cat:"ZTNA"},
  {kw:"Virtual Firewall For Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/virtual-firewall-zero-trust",sv:0,kd:30,wk36:1,wk37:1,wk38:1,wk39:1,wk40:3,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],cat:"ZTNA"},
  {kw:"Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/what-is-zero-trust",sv:9900,kd:83,wk36:3,wk37:76,wk38:72,wk39:78,wk40:76,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,54,67,66,56,60,63,57,null,24,24,24,24,24,null,null,null,57,57,3,4,3,2,5,4,3,76,72,78,76],cat:"ZTNA"},
  {kw:"Cognitive Science",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cognitive-science",sv:12100,kd:66,wk36:4,wk37:10,wk38:8,wk39:11,wk40:10,aio:false,trend:[7,10,9,9,10,8,9,9,9,9,8,8,6,6,6,5,9,9,9,7,3,7,10,10,10,11,10,10,10,3,2,2,3,3,3,4,10,8,11,10],cat:"Cyber Security"},
  {kw:"Fedramp",url:"https://www.fortinet.com/resources/cyberglossary/what-is-fedramp",sv:18100,kd:67,wk36:9,wk37:7,wk38:7,wk39:7,wk40:6,aio:false,trend:[11,10,8,10,9,10,8,7,5,7,4,4,6,5,5,6,5,6,8,8,8,5,9,10,9,10,12,8,8,11,11,11,11,11,10,9,7,7,7,6],cat:"Cyber Compliance"},
  {kw:"Hyperscale Data Center",url:"https://www.fortinet.com/resources/cyberglossary/hyperscale",sv:1900,kd:34,wk36:13,wk37:13,wk38:9,wk39:13,wk40:14,aio:false,trend:[11,11,11,14,10,7,11,10,8,4,9,11,10,10,9,9,10,10,11,11,11,15,19,21,22,26,24,24,23,32,2,2,21,1,1,13,13,9,13,14],cat:"Cyber Security"},
  {kw:"What Is Adware",url:"https://www.fortinet.com/resources/cyberglossary/what-is-adware",sv:3600,kd:46,wk36:2,wk37:3,wk38:3,wk39:3,wk40:2,aio:true,trend:[6,5,7,7,4,5,5,4,5,4,6,3,5,4,4,4,3,4,4,2,3,3,4,3,3,2,4,3,3,2,2,2,2,2,2,2,3,3,3,2],cat:"Cyber Threats"},
  {kw:"Common Vulnerability Scoring System",url:"https://www.fortinet.com/resources/cyberglossary/common-vulnerability-scoring-system",sv:18100,kd:77,wk36:4,wk37:27,wk38:24,wk39:24,wk40:22,aio:false,trend:[11,10,10,11,11,11,10,10,11,13,13,9,10,8,10,15,14,13,17,12,16,20,19,19,19,17,21,19,18,4,4,3,3,4,5,4,27,24,24,22],cat:"Cyber Security"},
  {kw:"Bitcoin Mining",url:"https://www.fortinet.com/resources/cyberglossary/what-is-bitcoin-mining",sv:12100,kd:94,wk36:6,wk37:6,wk38:4,wk39:6,wk40:7,aio:false,trend:[6,7,4,3,4,5,4,4,4,5,4,5,6,5,5,6,6,6,6,6,7,6,6,6,6,6,6,6,6,2,2,2,2,2,2,6,6,4,6,7],cat:"Cyber Security"},
  {kw:"Business Email Compromise",url:"https://www.fortinet.com/resources/cyberglossary/business-email-compromise",sv:2900,kd:58,wk36:7,wk37:25,wk38:22,wk39:20,wk40:19,aio:false,trend:[19,15,10,6,11,13,10,13,17,13,18,16,19,13,10,24,25,27,25,23,15,23,23,25,25,23,24,24,23,25,28,2,5,9,7,7,25,22,20,19],cat:"Email Security"},
  {kw:"What Is Dmarc",url:"https://www.fortinet.com/resources/cyberglossary/dmarc",sv:12100,kd:78,wk36:2,wk37:3,wk38:3,wk39:2,wk40:2,aio:false,trend:[9,11,3,13,6,11,7,9,6,4,8,5,7,7,6,9,7,6,8,10,5,7,10,9,1,2,16,2,2,2,2,2,3,3,2,2,3,3,2,2],cat:"Email Security"},
  {kw:"ISO/IEC 27001",url:"https://www.fortinet.com/resources/cyberglossary/iso-iec-27001",sv:2900,kd:62,wk36:2,wk37:13,wk38:13,wk39:9,wk40:11,aio:false,trend:[9,9,5,5,16,2,2,2,2,4,2,4,2,6,6,4,4,9,11,8,13,12,15,15,9,11,16,13,12,6,6,5,5,6,6,2,13,13,9,11],cat:"Cyber Compliance"},
  {kw:"Managed Security Service Provider",url:"https://www.fortinet.com/resources/cyberglossary/what-is-mssp",sv:12100,kd:61,wk36:2,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[5,6,7,7,5,7,6,5,4,3,2,2,2,3,2,3,5,4,3,4,4,4,4,4,3,2,5,3,2,1,1,1,2,2,2,2,2,2,1,1],cat:"Cyber Security"},
  {kw:"Sandboxing",url:"https://www.fortinet.com/resources/cyberglossary/what-is-sandboxing",sv:1900,kd:56,wk36:5,wk37:4,wk38:4,wk39:4,wk40:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,5,6,5,5,7,6,6,2,6,6,6,5,4,5,4,4,4,4],cat:"SecOps"},
  {kw:"Web Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-web-security",sv:2400,kd:43,wk36:19,wk37:7,wk38:4,wk39:4,wk40:5,aio:false,trend:[2,3,3,3,3,3,3,3,4,5,3,2,2,3,3,3,3,3,2,3,7,7,7,10,9,9,8,8,7,21,21,29,20,24,2,19,7,4,4,5],cat:"Cloud Security"},
  {kw:"Cybersecurity Management",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-management",sv:720,kd:28,wk36:2,wk37:2,wk38:1,wk39:1,wk40:2,aio:true,trend:[10,7,11,10,5,10,8,11,5,4,3,4,6,4,1,3,2,2,2,4,12,9,7,9,7,4,3,3,3,3,2,2,2,3,2,2,2,1,1,2],cat:"Cyber Security"},
  {kw:"Endpoint Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-endpoint-security",sv:1600,kd:49,wk36:3,wk37:3,wk38:3,wk39:2,wk40:2,aio:true,trend:[10,12,11,12,10,9,6,5,5,4,5,5,5,3,3,3,3,3,3,4,2,3,2,3,2,4,3,4,4,2,3,3,4,3,5,3,3,3,2,2],cat:"Endpoint Security"},
  {kw:"What Is Encryption",url:"https://www.fortinet.com/resources/cyberglossary/encryption",sv:3600,kd:75,wk36:13,wk37:4,wk38:2,wk39:3,wk40:2,aio:true,trend:[9,10,10,11,12,12,7,10,9,6,4,5,8,5,6,7,5,4,4,4,4,7,5,8,9,8,5,8,5,6,9,5,7,9,6,13,4,2,3,2],cat:"Data Security"},
  {kw:"LDAP Authentication",url:"https://www.fortinet.com/resources/cyberglossary/ldap-authentication",sv:880,kd:24,wk36:1,wk37:6,wk38:3,wk39:2,wk40:2,aio:false,trend:[6,6,9,11,7,7,4,5,5,3,2,4,3,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,3,2,2],cat:"Network Security"},
  {kw:"Privileged Identity Management",url:"https://www.fortinet.com/resources/cyberglossary/privileged-identity-management",sv:6600,kd:33,wk36:2,wk37:12,wk38:9,wk39:8,wk40:9,aio:false,trend:[10,16,11,11,10,11,10,5,7,10,13,14,16,15,11,11,11,9,11,11,13,12,11,15,13,11,8,8,8,2,3,4,4,3,2,2,12,9,8,9],cat:"SASE"},
  {kw:"DMZ",url:"https://www.fortinet.com/resources/cyberglossary/what-is-dmz",sv:22200,kd:80,wk36:3,wk37:6,wk38:7,wk39:6,wk40:5,aio:false,trend:[5,5,4,5,4,5,5,3,5,5,4,5,4,4,6,7,7,7,5,6,6,8,7,10,7,8,6,6,5,3,3,4,3,4,4,3,6,7,6,5],cat:"Network Security"},
  {kw:"Does VPN Affect Internet Speed",url:"https://www.fortinet.com/resources/cyberglossary/does-vpn-decrease-internet-speed",sv:90,kd:43,wk36:5,wk37:5,wk38:2,wk39:1,wk40:1,aio:true,trend:[3,3,7,4,3,1,1,1,2,3,3,4,3,3,3,3,3,3,3,3,2,2,5,5,3,5,5,1,1,3,4,4,4,5,5,5,5,2,1,1],cat:"VPN"},
  {kw:"Are VPNs Safe",url:"https://www.fortinet.com/resources/cyberglossary/are-vpns-safe",sv:1300,kd:34,wk36:7,wk37:6,wk38:6,wk39:4,wk40:6,aio:false,trend:[6,11,9,8,7,10,9,6,3,4,5,5,4,4,2,5,11,5,6,6,7,6,6,7,6,7,7,6,6,5,5,5,5,6,6,7,6,6,4,6],cat:"VPN"},
  {kw:"Threat Modeling",url:"https://www.fortinet.com/resources/cyberglossary/threat-modeling",sv:2900,kd:60,wk36:2,wk37:11,wk38:11,wk39:11,wk40:10,aio:false,trend:[11,13,11,11,7,12,10,10,10,10,7,9,9,8,10,10,10,6,13,11,13,14,13,12,17,11,12,12,11,2,2,2,2,2,2,2,11,11,11,10],cat:"Data Security"},
  {kw:"Is VPN Safe",url:"https://www.fortinet.com/resources/cyberglossary/are-vpns-safe",sv:1300,kd:45,wk36:2,wk37:7,wk38:6,wk39:4,wk40:7,aio:false,trend:[3,3,4,3,3,6,5,4,2,4,3,4,4,3,2,5,5,4,5,5,6,6,6,6,6,6,6,6,5,2,2,2,2,2,2,2,7,6,4,7],cat:"VPN"},
  {kw:"Attack Vector",url:"https://www.fortinet.com/resources/cyberglossary/attack-vector",sv:1600,kd:48,wk36:6,wk37:5,wk38:4,wk39:5,wk40:3,aio:true,trend:[5,4,2,6,3,1,2,4,4,5,2,4,5,3,4,4,4,6,4,3,3,3,3,5,7,7,6,6,6,8,5,4,5,6,5,6,5,4,5,3],cat:"Cyber Threats"},
  {kw:"Service Set Identifier",url:"https://www.fortinet.com/resources/cyberglossary/service-set-identifier-ssid",sv:1300,kd:21,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Cyber Security"},
  {kw:"Digital Rights Management",url:"https://www.fortinet.com/resources/cyberglossary/digital-rights-management-drm",sv:5400,kd:49,wk36:6,wk37:3,wk38:3,wk39:3,wk40:3,aio:false,trend:[2,2,4,3,2,2,1,2,3,2,2,3,2,2,2,2,2,2,2,1,2,2,3,3,3,3,3,3,3,6,6,6,6,4,4,6,3,3,3,3],cat:"Data Security"},
  {kw:"Content Filtering",url:"https://www.fortinet.com/resources/cyberglossary/content-filtering",sv:2400,kd:35,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"SecOps"},
  {kw:"What Is Splunk",url:"https://www.fortinet.com/resources/cyberglossary/what-is-splunk",sv:4400,kd:44,wk36:5,wk37:4,wk38:2,wk39:1,wk40:2,aio:true,trend:[5,5,5,4,2,3,3,3,2,5,4,3,4,3,2,2,2,3,2,1,2,2,2,2,2,2,2,2,2,5,5,2,2,3,5,5,4,2,1,2],cat:"Data Security"},
  {kw:"What Is Proxy Server",url:"https://www.fortinet.com/resources/cyberglossary/proxy-server",sv:1600,kd:63,wk36:18,wk37:3,wk38:2,wk39:3,wk40:3,aio:true,trend:[3,4,5,4,6,5,4,1,1,1,1,1,1,2,6,2,3,3,3,3,2,2,2,3,2,2,2,3,3,14,14,12,15,17,20,18,3,2,3,3],cat:"SASE"},
  {kw:"Data Egress",url:"https://www.fortinet.com/resources/cyberglossary/data-egress",sv:320,kd:35,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"IOT EDGE",url:"https://www.fortinet.com/resources/cyberglossary/iot-edge",sv:390,kd:50,wk36:2,wk37:7,wk38:6,wk39:6,wk40:7,aio:false,trend:[5,3,1,3,4,4,4,5,3,5,4,3,2,4,2,3,5,5,4,6,8,9,8,9,10,7,8,8,7,2,2,2,3,3,2,2,7,6,6,7],cat:"OT Security"},
  {kw:"Http Proxy",url:"https://www.fortinet.com/resources/cyberglossary/http-proxy",sv:1900,kd:59,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"SASE"},
  {kw:"Web Security Threats",url:"https://www.fortinet.com/resources/cyberglossary/web-security-threats",sv:110,kd:49,wk36:2,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,5,3,5,4,3,2,2,2,2,2,2,2,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Email Encryption",url:"https://www.fortinet.com/resources/cyberglossary/email-encryption",sv:2900,kd:51,wk36:4,wk37:3,wk38:3,wk39:3,wk40:3,aio:true,trend:[6,8,6,5,7,7,6,6,4,5,4,3,2,3,2,3,2,4,3,3,5,4,5,4,3,3,2,2,2,9,7,5,7,7,6,4,3,3,3,3],cat:"Email Security"},
  {kw:"Brute Force Attack",url:"https://www.fortinet.com/resources/cyberglossary/brute-force-attack",sv:1900,kd:66,wk36:1,wk37:6,wk38:4,wk39:5,wk40:4,aio:false,trend:[8,9,9,8,7,10,7,3,4,4,3,6,2,2,2,4,4,4,4,5,5,7,7,7,9,7,6,5,5,2,2,2,1,1,1,1,6,4,5,4],cat:"Cyber Threats"},
  {kw:"Defense In Depth",url:"https://www.fortinet.com/resources/cyberglossary/defense-in-depth",sv:2900,kd:60,wk36:2,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[3,3,2,2,3,3,2,3,3,6,2,2,2,2,2,1,1,2,2,1,1,1,1,1,1,1,2,2,2,5,4,4,5,3,1,2,2,2,2,2],cat:"Data Security"},
  {kw:"Honey Tokens",url:"https://www.fortinet.com/resources/cyberglossary/honey-tokens",sv:320,kd:23,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[2,2,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Data Security"},
  {kw:"Attack Surface",url:"https://www.fortinet.com/resources/cyberglossary/attack-surface",sv:1900,kd:55,wk36:4,wk37:2,wk38:2,wk39:4,wk40:4,aio:true,trend:[3,2,4,3,3,2,3,3,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,3,2,2,2,2,5,6,5,6,6,5,4,2,2,4,4],cat:"Data Security"},
  {kw:"Types Of Cyber Attacks",url:"https://www.fortinet.com/resources/cyberglossary/types-of-cyber-attacks",sv:2900,kd:68,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"Active Defense",url:"https://www.fortinet.com/resources/cyberglossary/active-defense",sv:170,kd:20,wk36:9,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[4,2,2,4,3,2,3,3,3,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,2,4,3,1,1,1,1,1,2,7,7,9,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Nist Compliance",url:"https://www.fortinet.com/resources/cyberglossary/nist-compliance",sv:1900,kd:32,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,3,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Compliance"},
  {kw:"Remote Access Trojan",url:"https://www.fortinet.com/resources/cyberglossary/remote-access-trojan",sv:4400,kd:42,wk36:2,wk37:5,wk38:4,wk39:4,wk40:5,aio:false,trend:[2,2,1,1,2,1,2,2,2,2,3,2,2,2,2,1,1,1,1,2,2,2,2,2,2,2,3,3,3,2,2,2,2,2,2,2,5,4,4,5],cat:"Cyber Threats"},
  {kw:"Malware Analysis",url:"https://www.fortinet.com/resources/cyberglossary/malware-analysis",sv:1300,kd:24,wk36:4,wk37:8,wk38:7,wk39:8,wk40:7,aio:true,trend:[10,8,9,7,10,11,8,7,5,7,7,6,8,4,1,4,4,6,5,7,7,8,10,10,12,9,9,8,5,4,10,11,9,3,2,4,8,7,8,7],cat:"Cyber Threats"},
  {kw:"Fake Hacking",url:"https://www.fortinet.com/resources/cyberglossary/fake-hacking",sv:5400,kd:51,wk36:12,wk37:4,wk38:4,wk39:4,wk40:4,aio:false,trend:[7,5,8,6,7,7,5,6,6,5,3,4,4,5,2,5,8,7,6,5,5,4,4,4,5,5,4,4,4,8,7,8,13,14,10,12,4,4,4,4],cat:"Cyber Threats"},
  {kw:"Pos Security",url:"https://www.fortinet.com/resources/cyberglossary/pos-security",sv:480,kd:20,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"IOT Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/iot-best-practices",sv:210,kd:37,wk36:1,wk37:1,wk38:1,wk39:3,wk40:3,aio:false,trend:[5,5,15,16,16,22,16,18,22,22,3,2,4,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3],cat:"OT Security"},
  {kw:"What Is EDR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-edr",sv:2400,kd:63,wk36:3,wk37:6,wk38:4,wk39:5,wk40:10,aio:false,trend:[10,6,6,10,9,10,8,5,4,6,7,5,6,3,5,4,6,7,6,7,6,6,5,5,5,6,6,6,6,3,3,3,3,3,2,3,6,4,5,10],cat:"Endpoint Security"},
  {kw:"Types Of Endpoint Security",url:"https://www.fortinet.com/resources/cyberglossary/types-of-endpoint-security",sv:110,kd:26,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Endpoint Security"},
  {kw:"WAN Aggregation",url:"https://www.fortinet.com/resources/cyberglossary/what-is-wan-aggregation",sv:260,kd:18,wk36:5,wk37:5,wk38:5,wk39:3,wk40:1,aio:true,trend:[2,3,3,2,2,1,1,1,1,1,1,1,1,2,1,1,2,6,4,6,7,11,8,8,10,8,5,8,1,1,1,2,4,5,5,5,5,5,3,1],cat:"Network Security"},
  {kw:"UEBA",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ueba",sv:590,kd:44,wk36:5,wk37:4,wk38:3,wk39:3,wk40:5,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,3,3,1,2,4,4,2,2,2,2,1,1,1,2,3,5,3,3,7,7,3,3,5,4,5,4,3,3,5],cat:"SecOps"},
  {kw:"What Is A Pst File",url:"https://www.fortinet.com/resources/cyberglossary/pst-file",sv:2400,kd:33,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[6,3,2,3,2,3,3,3,5,5,4,2,2,2,2,5,5,2,2,3,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Email Security"},
  {kw:"SAML Vs OAUTH",url:"https://www.fortinet.com/resources/cyberglossary/saml-vs-oauth",sv:1000,kd:31,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,5,9,9,5,5,4,3,2,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Access Control"},
  {kw:"What Is Traceroute",url:"https://www.fortinet.com/resources/cyberglossary/traceroutes",sv:390,kd:21,wk36:1,wk37:1,wk38:1,wk39:4,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2],cat:"Cyber Security"},
  {kw:"Authentication Token",url:"https://www.fortinet.com/resources/cyberglossary/authentication-token",sv:590,kd:51,wk36:9,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[3,3,4,4,3,3,4,4,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,9,9,2,2,1,1],cat:"SASE"},
  {kw:"Network Traffic",url:"https://www.fortinet.com/resources/cyberglossary/network-traffic",sv:720,kd:41,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Network Security"},
  {kw:"Internet Fraud",url:"https://www.fortinet.com/resources/cyberglossary/internet-fraud",sv:1300,kd:78,wk36:3,wk37:3,wk38:3,wk39:4,wk40:4,aio:false,trend:[5,4,6,5,6,3,4,4,6,8,3,5,5,3,2,2,2,2,2,2,3,4,3,3,4,4,5,5,3,2,1,2,2,4,3,3,3,3,4,4],cat:"Cyber Threats"},
  {kw:"802.1X Authentication",url:"https://www.fortinet.com/resources/cyberglossary/802-1x-authentication",sv:1300,kd:24,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Threats"},
  {kw:"Network Access Control List",url:"https://www.fortinet.com/resources/cyberglossary/network-access-control-list",sv:480,kd:38,wk36:1,wk37:1,wk38:1,wk39:3,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],cat:"Network Security"},
  {kw:"What Is An Open Proxy",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-open-proxy",sv:110,kd:17,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"What Is An API Key",url:"https://www.fortinet.com/resources/cyberglossary/api-key",sv:8100,kd:44,wk36:2,wk37:2,wk38:1,wk39:1,wk40:2,aio:true,trend:[3,4,4,4,4,4,3,3,3,4,3,3,3,2,1,1,2,2,2,2,3,3,2,3,2,3,2,2,2,2,1,1,2,2,2,2,2,1,1,2],cat:"Cloud Security"},
  {kw:"Radius Protocol",url:"https://www.fortinet.com/resources/cyberglossary/radius-protocol",sv:1900,kd:44,wk36:2,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[3,2,1,2,3,2,2,2,4,2,3,2,2,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1],cat:"Access Control"},
  {kw:"Transparent Proxy",url:"https://www.fortinet.com/resources/cyberglossary/transparent-proxy",sv:480,kd:25,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"OCSP",url:"https://www.fortinet.com/resources/cyberglossary/ocsp",sv:2900,kd:49,wk36:3,wk37:2,wk38:2,wk39:1,wk40:3,aio:true,trend:[4,2,3,4,4,4,4,4,3,3,2,2,2,2,2,2,2,2,3,2,1,2,2,1,1,2,3,3,3,4,4,2,3,3,4,3,2,2,1,3],cat:"Cyber Security"},
  {kw:"Centralized Management",url:"https://www.fortinet.com/resources/cyberglossary/centralized-management",sv:590,kd:24,wk36:9,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[6,5,2,4,3,7,4,7,5,4,3,4,2,4,2,4,3,5,4,3,4,2,2,1,4,6,3,1,1,4,9,9,10,9,8,9,2,2,2,2],cat:"Network Security"},
  {kw:"Benefits Of VPN",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-vpn",sv:1900,kd:62,wk36:4,wk37:4,wk38:2,wk39:2,wk40:1,aio:false,trend:[7,7,6,5,7,7,6,2,2,5,3,1,3,3,4,3,4,5,3,3,3,2,3,2,2,2,3,2,2,11,11,10,10,10,10,4,4,2,2,1],cat:"VPN"},
  {kw:"VPN Split Tunneling",url:"https://www.fortinet.com/resources/cyberglossary/vpn-split-tunneling",sv:880,kd:42,wk36:2,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[4,2,7,4,4,3,6,2,3,4,7,2,3,5,2,2,2,2,2,2,3,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1],cat:"VPN"},
  {kw:"Proxy Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/proxy-vs-vpn",sv:4400,kd:53,wk36:2,wk37:3,wk38:2,wk39:1,wk40:2,aio:true,trend:[3,2,1,2,2,9,6,3,4,4,4,3,4,5,2,4,5,4,5,4,3,3,2,4,4,3,3,2,2,1,2,2,2,2,2,2,3,2,1,2],cat:"VPN"},
  {kw:"AAA Security",url:"https://www.fortinet.com/resources/cyberglossary/aaa-security",sv:880,kd:51,wk36:4,wk37:4,wk38:4,wk39:5,wk40:5,aio:false,trend:[4,5,4,4,3,5,4,4,4,6,5,6,5,6,4,3,5,6,6,5,6,7,6,5,5,5,5,5,4,4,5,4,5,5,5,4,4,4,5,5],cat:"Access Control"},
  {kw:"Network EDGE",url:"https://www.fortinet.com/resources/cyberglossary/network-edge",sv:480,kd:49,wk36:1,wk37:7,wk38:3,wk39:3,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,7,3,3,2],cat:"OT Security"},
  {kw:"Operational Security",url:"https://www.fortinet.com/resources/cyberglossary/operational-security",sv:1600,kd:37,wk36:4,wk37:3,wk38:2,wk39:1,wk40:2,aio:true,trend:[2,2,3,3,4,4,3,4,2,4,3,2,3,2,2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,4,4,4,3,2,1,2],cat:"OT Security"},
  {kw:"Hybrid Data Center",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-data-center",sv:170,kd:16,wk36:7,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,2,1,2,2,2,4,12,2,2,2,3,3,2,2,3,2,2,2,1,1,2,5,2,2,4,3,2,2,8,9,9,9,9,8,7,1,1,1,1],cat:"Cloud Security"},
  {kw:"How To Setup A Proxy Server",url:"https://www.fortinet.com/resources/cyberglossary/how-to-setup-a-proxy-server",sv:590,kd:34,wk36:4,wk37:6,wk38:5,wk39:7,wk40:8,aio:false,trend:[9,8,5,8,7,5,5,4,4,3,3,6,5,6,7,7,7,7,7,2,1,1,5,8,7,12,15,11,11,6,4,2,3,3,3,4,6,5,7,8],cat:"SASE"},
  {kw:"Message Authentication Code",url:"https://www.fortinet.com/resources/cyberglossary/message-authentication-code",sv:390,kd:39,wk36:11,wk37:3,wk38:3,wk39:1,wk40:2,aio:true,trend:[2,2,3,3,3,3,3,3,3,3,4,3,3,3,2,2,3,2,2,2,2,2,2,1,2,2,4,3,3,7,7,8,8,8,7,11,3,3,1,2],cat:"Cyber Security"},
  {kw:"DNS Security",url:"https://www.fortinet.com/resources/cyberglossary/dns-security",sv:1300,kd:39,wk36:11,wk37:11,wk38:10,wk39:8,wk40:11,aio:false,trend:[2,2,1,2,2,2,4,6,6,6,7,5,3,5,7,3,2,4,4,6,3,3,3,3,3,6,8,6,4,7,7,8,9,8,10,11,11,10,8,11],cat:"Network Security"},
  {kw:"Healthcare Data Security",url:"https://www.fortinet.com/resources/cyberglossary/healthcare-data-security",sv:590,kd:20,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"Data Security"},
  {kw:"Data Center Security",url:"https://www.fortinet.com/resources/cyberglossary/data-center-security",sv:2400,kd:36,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[11,16,13,13,12,13,9,8,7,5,7,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Data Security"},
  {kw:"Cybersecurity Mesh",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cybersecurity-mesh",sv:210,kd:34,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"Hacking",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hacking",sv:18100,kd:54,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"How Does A VPN Work",url:"https://www.fortinet.com/resources/cyberglossary/how-does-vpn-work",sv:5400,kd:64,wk36:1,wk37:4,wk38:3,wk39:3,wk40:2,aio:true,trend:[2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,3,3,2],cat:"VPN"},
  {kw:"CIA Triad",url:"https://www.fortinet.com/resources/cyberglossary/cia-triad",sv:9900,kd:46,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"Security-As-A-Service",url:"https://www.fortinet.com/resources/cyberglossary/security-as-a-service",sv:50,kd:23,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"SecOps"},
  {kw:"Compliance Automation",url:"https://www.fortinet.com/resources/cyberglossary/compliance-automation",sv:1000,kd:31,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"Cyber Compliance"},
  {kw:"Data Deduplication",url:"https://www.fortinet.com/resources/cyberglossary/data-deduplication",sv:480,kd:43,wk36:7,wk37:9,wk38:7,wk39:9,wk40:10,aio:false,trend:[13,15,16,13,11,13,8,10,8,12,8,3,11,11,11,12,11,10,8,9,12,7,13,14,13,11,12,12,11,9,8,9,8,9,8,7,9,7,9,10],cat:"Data Security"},
  {kw:"Tcp Ip Model Vs Osi Model",url:"https://www.fortinet.com/resources/cyberglossary/tcp-ip-model-vs-osi-model",sv:880,kd:23,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"Tailgating Attack",url:"https://www.fortinet.com/resources/cyberglossary/tailgating-attack",sv:1600,kd:35,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,3,2,2,2,2,3,2,2,2,3,2,2,3,2,2,3,2,2,3,2,1,1,1,1,1,1,1,2,2],cat:"Cyber Threats"},
  {kw:"Data Security",url:"https://www.fortinet.com/resources/cyberglossary/data-security",sv:9900,kd:70,wk36:5,wk37:4,wk38:4,wk39:2,wk40:2,aio:true,trend:[6,11,12,12,10,10,9,6,6,4,5,6,7,5,2,3,5,2,2,2,3,3,3,3,2,3,3,3,3,5,5,5,7,6,5,5,4,4,2,2],cat:"Data Security"},
  {kw:"Phishing Email Analysis",url:"https://www.fortinet.com/resources/cyberglossary/phishing-email-analysis",sv:50,kd:25,wk36:1,wk37:1,wk38:2,wk39:1,wk40:1,aio:false,trend:[1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,2,1,1],cat:"Email Security"},
  {kw:"Data Exfiltration",url:"https://www.fortinet.com/resources/cyberglossary/data-exfiltration",sv:1300,kd:20,wk36:1,wk37:6,wk38:5,wk39:2,wk40:3,aio:true,trend:[11,15,13,14,16,14,14,11,5,6,5,5,7,3,5,6,3,4,2,2,4,2,2,2,2,2,2,2,2,4,1,1,1,1,1,1,6,5,2,3],cat:"Data Security"},
  {kw:"PGP Encryption",url:"https://www.fortinet.com/resources/cyberglossary/pgp-encryption",sv:3600,kd:57,wk36:4,wk37:2,wk38:2,wk39:2,wk40:3,aio:false,trend:[3,3,2,5,4,4,5,2,1,1,6,3,6,5,3,3,2,3,1,3,3,3,3,3,2,3,2,3,3,5,4,3,5,5,4,4,2,2,2,3],cat:"Email Security"},
  {kw:"Unified Threat Management",url:"https://www.fortinet.com/resources/cyberglossary/unified-threat-management",sv:4400,kd:32,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Network Security"},
  {kw:"URL Phishing",url:"https://www.fortinet.com/resources/cyberglossary/url-phishing",sv:210,kd:57,wk36:1,wk37:1,wk38:1,wk39:4,wk40:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,28,1,1,1,1,1,1,1,1,1,1,4,4],cat:"Cyber Threats"},
  {kw:"It Security Policy",url:"https://www.fortinet.com/resources/cyberglossary/it-security-policy",sv:720,kd:41,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"DNS Hijacking",url:"https://www.fortinet.com/resources/cyberglossary/dns-hijacking",sv:720,kd:40,wk36:7,wk37:3,wk38:4,wk39:5,wk40:1,aio:true,trend:[3,3,1,1,2,3,2,3,4,4,4,3,4,3,3,3,2,2,2,2,3,4,3,3,2,3,4,4,4,5,8,7,7,7,6,7,3,4,5,1],cat:"Cyber Threats"},
  {kw:"DOS Vs DDOS",url:"https://www.fortinet.com/resources/cyberglossary/dos-vs-ddos",sv:880,kd:20,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Cyber Threats"},
  {kw:"Whaling Attack",url:"https://www.fortinet.com/resources/cyberglossary/whaling-attack",sv:1300,kd:22,wk36:5,wk37:3,wk38:3,wk39:3,wk40:4,aio:false,trend:[2,2,2,2,2,2,2,3,4,3,2,2,3,3,2,3,2,4,4,4,4,4,3,2,2,3,2,2,2,6,7,6,6,6,4,5,3,3,3,4],cat:"Cyber Threats"},
  {kw:"Botnet",url:"https://www.fortinet.com/resources/cyberglossary/what-is-botnet",sv:6600,kd:60,wk36:3,wk37:4,wk38:4,wk39:3,wk40:4,aio:false,trend:[2,5,5,5,6,4,3,4,6,6,7,6,5,6,2,4,3,3,5,5,3,5,7,7,6,5,4,4,4,3,3,3,3,5,5,3,4,4,3,4],cat:"Cyber Threats"},
  {kw:"Port Scan",url:"https://www.fortinet.com/resources/cyberglossary/what-is-port-scan",sv:2400,kd:68,wk36:10,wk37:6,wk38:6,wk39:5,wk40:5,aio:false,trend:[6,6,6,6,4,4,5,6,6,6,5,7,6,6,5,4,3,4,4,4,4,3,3,4,4,4,4,4,4,10,11,8,6,8,9,10,6,6,5,5],cat:"Cyber Threats"},
  {kw:"Digital Certificates",url:"https://www.fortinet.com/resources/cyberglossary/digital-certificates",sv:1000,kd:50,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,2,2,2,4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"Network Security"},
  {kw:"Eavesdropping Attack",url:"https://www.fortinet.com/resources/cyberglossary/eavesdropping",sv:70,kd:26,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"Cyber Threats"},
  {kw:"Border Gateway Protocol",url:"https://www.fortinet.com/resources/cyberglossary/bgp-border-gateway-protocol",sv:2400,kd:40,wk36:3,wk37:14,wk38:8,wk39:21,wk40:8,aio:false,trend:[7,10,8,8,5,8,7,7,5,7,7,7,8,6,5,9,6,2,6,7,8,8,7,6,10,14,9,18,16,3,3,3,4,4,3,3,14,8,21,8],cat:"Network Security"},
  {kw:"SSPM",url:"https://www.fortinet.com/resources/cyberglossary/saas-security-posture-management",sv:320,kd:33,wk36:3,wk37:5,wk38:4,wk39:4,wk40:3,aio:true,trend:[1,2,1,2,1,2,3,3,3,7,1,2,4,1,2,4,2,2,1,1,1,1,1,1,5,5,5,4,2,8,9,10,9,9,7,3,5,4,4,3],cat:"SASE"},
  {kw:"Cyber Extortion",url:"https://www.fortinet.com/resources/cyberglossary/cyber-extortion",sv:590,kd:25,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Devops Security",url:"https://www.fortinet.com/resources/cyberglossary/devops-security",sv:1300,kd:41,wk36:2,wk37:4,wk38:4,wk39:2,wk40:4,aio:true,trend:[3,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,3,2,2,2,2,2,3,2,2,5,2,2,2,2,3,4,3,2,2,4,4,2,4],cat:"Cyber Security"},
  {kw:"Confidential Computing",url:"https://www.fortinet.com/resources/cyberglossary/confidential-computing",sv:880,kd:66,wk36:4,wk37:19,wk38:19,wk39:13,wk40:10,aio:false,trend:[19,17,16,20,16,18,15,9,14,13,10,8,14,13,2,12,13,10,9,12,6,10,11,10,11,11,14,14,14,3,4,4,5,5,5,4,19,19,13,10],cat:"Data Security"},
  {kw:"Scareware",url:"https://www.fortinet.com/resources/cyberglossary/scareware",sv:2400,kd:44,wk36:8,wk37:7,wk38:3,wk39:4,wk40:5,aio:false,trend:[2,3,4,3,2,4,3,3,5,2,3,3,2,2,2,2,4,5,8,10,5,7,8,8,10,9,8,8,5,10,9,8,8,8,8,8,7,3,4,5],cat:"Cyber Threats"},
  {kw:"Trojan Horse Virus",url:"https://www.fortinet.com/resources/cyberglossary/trojan-horse-virus",sv:2900,kd:62,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Threats"},
  {kw:"Canary In Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/what-is-canary-in-cybersecurity",sv:40,kd:35,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"Email Security",url:"https://www.fortinet.com/resources/cyberglossary/email-security",sv:5400,kd:50,wk36:10,wk37:6,wk38:6,wk39:6,wk40:6,aio:false,trend:[8,9,9,12,13,12,8,7,4,8,8,8,10,8,2,3,3,5,6,7,11,13,12,12,11,8,5,6,5,8,9,10,9,8,8,10,6,6,6,6],cat:"Email Security"},
  {kw:"Cybersecurity Tools For Small Business",url:"https://www.fortinet.com/resources/cyberglossary/smb-cybersecurity-tools",sv:10,kd:50,wk36:3,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,3,3,3,1,1,1,2],cat:"Cyber Security"},
  {kw:"Ransomware Settlement",url:"https://www.fortinet.com/resources/cyberglossary/recent-ransomware-settlements",sv:40,kd:43,wk36:10,wk37:1,wk38:2,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,2,2,2,2,2,2,2,2,2,12,12,16,13,10,10,10,1,2,1,1],cat:"Cyber Threats"},
  {kw:"Fileless Malware",url:"https://www.fortinet.com/resources/cyberglossary/fileless-malware",sv:1000,kd:39,wk36:13,wk37:5,wk38:5,wk39:4,wk40:3,aio:true,trend:[5,9,2,4,5,6,3,5,5,6,4,4,6,5,3,4,3,4,4,4,4,5,5,7,7,6,8,6,5,6,4,7,5,7,8,13,5,5,4,3],cat:"Cyber Threats"},
  {kw:"Keyloggers",url:"https://www.fortinet.com/resources/cyberglossary/what-is-keyloggers",sv:1900,kd:53,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:true,trend:[3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Threats"},
  {kw:"Microsegmentation",url:"https://www.fortinet.com/resources/cyberglossary/microsegmentation",sv:1900,kd:50,wk36:3,wk37:9,wk38:7,wk39:6,wk40:7,aio:false,trend:[9,9,11,9,7,10,9,9,11,11,7,8,6,6,2,8,9,9,10,9,6,8,10,8,9,8,8,8,6,5,5,4,4,5,3,3,9,7,6,7],cat:"Network Security"},
  {kw:"Cybersquatting",url:"https://www.fortinet.com/resources/cyberglossary/cybersquatting",sv:1000,kd:46,wk36:15,wk37:12,wk38:12,wk39:12,wk40:10,aio:false,trend:[8,12,11,12,13,15,12,8,7,7,12,8,7,8,8,11,8,13,12,13,10,9,12,13,13,12,13,14,12,16,14,15,18,12,11,15,12,12,12,10],cat:"Cyber Security"},
  {kw:"What Is Firmware",url:"https://www.fortinet.com/resources/cyberglossary/what-is-firmware",sv:9900,kd:47,wk36:15,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[1,3,2,2,3,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,13,13,13,14,14,12,15,2,2,1,1],cat:"Cyber Security"},
  {kw:"User Datagram Protocol",url:"https://www.fortinet.com/resources/cyberglossary/user-datagram-protocol-udp",sv:8100,kd:64,wk36:7,wk37:7,wk38:4,wk39:9,wk40:5,aio:false,trend:[12,13,13,12,10,10,10,8,8,7,4,5,5,7,3,2,2,6,4,3,4,3,4,4,6,1,6,3,2,4,6,5,9,8,7,7,7,4,9,5],cat:"Cyber Security"},
  {kw:"Certificate Management",url:"https://www.fortinet.com/resources/cyberglossary/certificate-management",sv:720,kd:28,wk36:2,wk37:12,wk38:12,wk39:11,wk40:14,aio:false,trend:[7,15,11,2,7,8,3,2,7,3,2,3,5,5,5,2,2,3,6,3,9,5,4,7,7,8,6,7,6,3,2,3,4,3,2,2,12,12,11,14],cat:"Network Security"},
  {kw:"What Is Url Filtering",url:"https://www.fortinet.com/resources/cyberglossary/what-is-url-filtering",sv:1000,kd:35,wk36:7,wk37:2,wk38:2,wk39:1,wk40:1,aio:false,trend:[3,2,1,2,2,2,5,6,5,4,3,4,6,5,2,5,2,4,3,5,2,3,2,2,1,1,2,2,2,4,9,10,8,5,7,7,2,2,1,1],cat:"Network Security"},
  {kw:"Diy Vs Managed SD WAN",url:"https://www.fortinet.com/resources/cyberglossary/diy-vs-managed-sd-wan",sv:70,kd:7,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"SD-WAN"},
  {kw:"QOS",url:"https://www.fortinet.com/resources/cyberglossary/qos-quality-of-service",sv:9900,kd:50,wk36:2,wk37:3,wk38:2,wk39:2,wk40:2,aio:true,trend:[1,1,1,1,1,1,2,2,4,2,2,3,3,2,2,2,3,3,3,3,2,3,4,3,3,3,4,3,3,2,2,2,2,3,3,2,3,2,2,2],cat:"Network Security"},
  {kw:"Branch Networking",url:"https://www.fortinet.com/resources/cyberglossary/what-is-branch-networking",sv:50,kd:24,wk36:2,wk37:5,wk38:4,wk39:5,wk40:5,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,3,2,2,2,2,3,3,3,3,3,2,2,2,3,2,2,5,4,5,5],cat:"SASE"},
  {kw:"MPLS",url:"https://www.fortinet.com/resources/cyberglossary/mpls",sv:18100,kd:50,wk36:9,wk37:10,wk38:8,wk39:7,wk40:6,aio:false,trend:[8,5,4,3,5,5,3,7,8,6,3,4,4,6,5,3,4,4,4,7,3,5,7,8,5,6,9,11,9,8,8,8,9,10,9,9,10,8,7,6],cat:"Network Security"},
  {kw:"Failover",url:"https://www.fortinet.com/resources/cyberglossary/failover",sv:1600,kd:44,wk36:3,wk37:4,wk38:4,wk39:4,wk40:3,aio:false,trend:[12,13,11,10,6,2,2,5,6,4,5,2,3,3,4,3,2,4,3,3,3,2,4,4,4,3,3,4,4,2,2,2,2,3,2,3,4,4,4,3],cat:"Cyber Security"},
  {kw:"Lateral Movement",url:"https://www.fortinet.com/resources/cyberglossary/lateral-movement",sv:5400,kd:45,wk36:11,wk37:7,wk38:7,wk39:7,wk40:7,aio:false,trend:[8,8,9,8,6,8,8,7,7,6,5,9,9,7,6,4,6,5,6,7,7,6,8,6,7,7,7,6,6,11,11,11,13,8,12,11,7,7,7,7],cat:"Cyber Threats"},
  {kw:"Site To Site VPN",url:"https://www.fortinet.com/resources/cyberglossary/what-is-site-to-site-vpn",sv:6600,kd:66,wk36:10,wk37:3,wk38:3,wk39:2,wk40:1,aio:true,trend:[8,5,7,7,5,6,6,2,3,2,4,3,3,2,3,2,3,3,2,2,2,2,2,2,5,3,2,2,2,18,16,9,5,12,15,10,3,3,2,1],cat:"VPN"},
  {kw:"Ransomware Removal",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-removal",sv:880,kd:60,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,3,3,3,6,2,2,3,3,3,2,2,2,1,2,4,5,4,2,7,6,12,6,12,4,6,5,3,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Endpoint Security For Mobile Devices",url:"https://www.fortinet.com/resources/cyberglossary/endpoint-security-for-mobile-devices",sv:20,kd:14,wk36:1,wk37:17,wk38:17,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,17,17,1,1],cat:"Endpoint Security"},
  {kw:"Shift Left Security",url:"https://www.fortinet.com/resources/cyberglossary/shift-left-security",sv:880,kd:39,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"SecOps"},
  {kw:"What Is An Ip Address",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ip-address",sv:135000,kd:57,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Cyber Security"},
  {kw:"SPAM Filtering",url:"https://www.fortinet.com/resources/cyberglossary/spam-filters",sv:590,kd:45,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Email Security"},
  {kw:"IOT Device Vulnerabilities",url:"https://www.fortinet.com/resources/cyberglossary/iot-device-vulnerabilities",sv:70,kd:31,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"OT Security"},
  {kw:"DDOS Mitigation",url:"https://www.fortinet.com/resources/cyberglossary/implement-ddos-mitigation-strategy",sv:90,kd:33,wk36:4,wk37:11,wk38:9,wk39:5,wk40:9,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,11,11,9,8,9,9,13,11,10,6,4,11,9,5,9],cat:"Cloud Security"},
  {kw:"What Is Time To Live",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ttl",sv:8100,kd:63,wk36:12,wk37:4,wk38:3,wk39:7,wk40:7,aio:false,trend:[10,9,10,10,10,9,7,9,7,9,7,6,8,7,5,6,6,7,6,8,6,5,6,4,1,11,5,11,11,11,14,13,12,11,12,12,4,3,7,7],cat:"Cyber Security"},
  {kw:"Malware Vs Virus Vs Worm",url:"https://www.fortinet.com/resources/cyberglossary/malware-vs-virus-vs-worm",sv:20,kd:30,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Threats"},
  {kw:"Login Credentials",url:"https://www.fortinet.com/resources/cyberglossary/login-credentials",sv:1300,kd:35,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Cyber Security"},
  {kw:"Ransomware Jargon",url:"https://www.fortinet.com/resources/cyberglossary/definitions-of-jargon-ransomware",sv:10,kd:39,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Pretexting",url:"https://www.fortinet.com/resources/cyberglossary/pretexting",sv:4400,kd:43,wk36:2,wk37:5,wk38:3,wk39:5,wk40:5,aio:false,trend:[1,1,1,5,4,4,6,6,6,7,6,4,6,4,4,4,6,6,5,10,4,6,8,9,10,5,9,6,5,2,2,2,1,2,2,2,5,3,5,5],cat:"Cyber Threats"},
  {kw:"ICS Security",url:"https://www.fortinet.com/resources/cyberglossary/ics-security",sv:1600,kd:63,wk36:4,wk37:8,wk38:7,wk39:8,wk40:10,aio:false,trend:[14,17,15,16,14,11,9,8,8,9,8,8,6,7,3,6,6,9,6,8,6,6,5,5,5,8,9,9,9,10,8,5,5,6,6,4,8,7,8,10],cat:"OT Security"},
  {kw:"Fortinet DOJ",url:"https://www.fortinet.com/resources/cyberglossary/definitions-of-jargon",sv:20,kd:22,wk36:7,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[2,3,3,3,3,2,2,2,2,3,2,3,2,2,2,2,2,2,1,1,1,2,1,1,1,2,2,3,2,5,5,5,5,7,7,7,2,2,2,2],cat:"Cyber Security"},
  {kw:"Wireless Network",url:"https://www.fortinet.com/resources/cyberglossary/wireless-network",sv:2400,kd:43,wk36:2,wk37:2,wk38:2,wk39:3,wk40:3,aio:true,trend:[5,4,2,6,6,6,5,5,3,3,5,4,4,5,3,3,4,3,2,3,3,3,3,3,2,2,3,3,2,2,3,3,3,2,2,2,2,2,3,3],cat:"Network Security"},
  {kw:"What Is DNS",url:"https://www.fortinet.com/resources/cyberglossary/what-is-dns",sv:18100,kd:59,wk36:1,wk37:6,wk38:6,wk39:5,wk40:4,aio:false,trend:[7,7,8,9,9,8,7,8,8,6,5,5,5,4,4,6,4,3,4,6,4,4,5,7,3,7,5,6,4,6,3,6,6,1,1,1,6,6,5,4],cat:"Cyber Security"},
  {kw:"What Is Https",url:"https://www.fortinet.com/resources/cyberglossary/what-is-https",sv:2900,kd:54,wk36:23,wk37:7,wk38:7,wk39:8,wk40:8,aio:false,trend:[7,7,7,8,8,9,8,7,7,6,5,5,4,6,3,8,8,9,9,9,9,10,9,8,9,8,7,9,9,15,13,15,14,27,26,23,7,7,8,8],cat:"Cyber Security"},
  {kw:"Ransomware As A Service",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-as-a-service-raas",sv:720,kd:47,wk36:4,wk37:5,wk38:5,wk39:5,wk40:5,aio:false,trend:[5,5,4,4,4,4,4,4,4,3,4,4,5,5,5,4,5,5,5,4,5,5,4,4,5,4,4,4,4,4,4,4,4,1,2,4,5,5,5,5],cat:"Cyber Threats"},
  {kw:"TCP/IP",url:"https://www.fortinet.com/resources/cyberglossary/tcp-ip",sv:8100,kd:66,wk36:3,wk37:3,wk38:2,wk39:2,wk40:2,aio:true,trend:[4,2,3,5,7,5,5,3,3,4,4,3,4,4,5,2,3,4,3,2,2,2,3,3,2,2,2,2,2,3,4,3,2,3,3,3,3,2,2,2],cat:"Cyber Security"},
  {kw:"What Is An Insider Threat",url:"https://www.fortinet.com/resources/cyberglossary/insider-threats",sv:4400,kd:48,wk36:5,wk37:5,wk38:5,wk39:6,wk40:6,aio:false,trend:[3,3,5,4,3,4,3,4,5,2,3,3,4,3,3,2,3,4,3,4,3,3,3,3,2,2,5,4,4,9,6,6,7,5,5,5,5,5,6,6],cat:"Cyber Threats"},
  {kw:"Static Vs Dynamic Ip Address",url:"https://www.fortinet.com/resources/cyberglossary/static-vs-dynamic-ip",sv:1300,kd:36,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:true,trend:[3,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],cat:"Network Security"},
  {kw:"Smurf Attack",url:"https://www.fortinet.com/resources/cyberglossary/smurf-attack",sv:1600,kd:41,wk36:9,wk37:5,wk38:5,wk39:2,wk40:4,aio:false,trend:[1,1,1,3,3,4,4,2,3,3,2,4,4,3,3,4,3,2,2,2,5,5,3,5,5,4,5,5,5,21,8,7,21,22,11,9,5,5,2,4],cat:"Cyber Threats"},
  {kw:"Cybersecurity TIPS For Small Businesses",url:"https://www.fortinet.com/resources/cyberglossary/10-cybersecurity-tips-small-business",sv:390,kd:58,wk36:9,wk37:3,wk38:3,wk39:3,wk40:3,aio:false,trend:[5,5,4,3,4,3,3,2,2,2,5,6,5,5,2,3,3,3,3,3,2,2,2,2,4,2,4,4,4,8,9,6,3,4,7,9,3,3,3,3],cat:"Cyber Security"},
  {kw:"Data Loss Prevention",url:"https://www.fortinet.com/resources/cyberglossary/dlp",sv:1900,kd:48,wk36:14,wk37:10,wk38:7,wk39:8,wk40:9,aio:false,trend:[2,2,1,2,2,2,2,2,3,4,4,3,3,3,2,2,2,2,3,2,2,2,2,2,11,12,2,13,12,14,15,17,15,15,12,14,10,7,8,9],cat:"Cyber Security"},
  {kw:"Network Access Control",url:"https://www.fortinet.com/resources/cyberglossary/what-is-network-access-control",sv:390,kd:39,wk36:4,wk37:7,wk38:4,wk39:4,wk40:5,aio:true,trend:[3,2,3,3,3,1,2,7,3,2,2,2,4,1,1,1,1,1,1,1,1,1,1,1,2,5,2,7,6,5,4,5,4,5,4,4,7,4,4,5],cat:"Access Control"},
  {kw:"Dark Web Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/dark-web-monitoring",sv:590,kd:41,wk36:2,wk37:6,wk38:6,wk39:6,wk40:7,aio:false,trend:[2,6,6,3,5,2,3,3,5,5,2,3,3,3,3,4,2,5,4,3,6,5,5,4,8,7,4,7,7,3,2,3,2,2,2,2,6,6,6,7],cat:"Cyber Threats"},
  {kw:"Caching",url:"https://www.fortinet.com/resources/cyberglossary/what-is-caching",sv:8100,kd:74,wk36:25,wk37:11,wk38:9,wk39:9,wk40:11,aio:false,trend:[9,7,8,10,11,3,7,4,7,3,9,8,6,7,2,10,12,12,12,12,13,11,11,13,11,10,9,9,9,20,21,23,19,28,22,25,11,9,9,11],cat:"Cyber Security"},
  {kw:"What Is Spyware",url:"https://www.fortinet.com/resources/cyberglossary/spyware",sv:2900,kd:63,wk36:37,wk37:2,wk38:1,wk39:2,wk40:1,aio:true,trend:[9,4,7,5,6,7,4,2,3,2,2,4,4,3,8,2,2,4,3,3,4,5,4,4,5,3,2,2,2,35,44,44,41,38,39,37,2,1,2,1],cat:"Cyber Threats"},
  {kw:"Code Scanning",url:"https://www.fortinet.com/resources/cyberglossary/code-scanning",sv:720,kd:52,wk36:30,wk37:4,wk38:4,wk39:4,wk40:4,aio:false,trend:[4,4,3,4,3,2,3,3,4,3,2,3,4,3,2,3,3,2,3,3,3,3,3,3,3,4,3,3,3,13,38,38,25,38,30,30,4,4,4,4],cat:"Cyber Security"},
  {kw:"Cybersecurity Statistics",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-statistics",sv:590,kd:61,wk36:11,wk37:2,wk38:5,wk39:2,wk40:1,aio:false,trend:[1,1,1,2,2,3,3,3,2,2,3,3,3,4,3,4,4,4,5,7,3,4,5,3,5,3,5,3,3,11,10,12,12,13,12,11,2,5,2,1],cat:"Cyber Security"},
  {kw:"Pharming",url:"https://www.fortinet.com/resources/cyberglossary/pharming",sv:3600,kd:56,wk36:9,wk37:4,wk38:5,wk39:3,wk40:4,aio:true,trend:[4,3,5,4,4,5,4,4,3,5,3,2,2,3,4,2,2,3,3,3,3,4,3,5,4,3,3,3,3,9,10,9,8,8,7,9,4,5,3,4],cat:"Cyber Security"},
  {kw:"What Is An Exploit",url:"https://www.fortinet.com/resources/cyberglossary/exploit",sv:480,kd:38,wk36:9,wk37:8,wk38:8,wk39:8,wk40:8,aio:false,trend:[6,8,9,6,7,6,7,9,8,8,8,8,5,5,2,7,2,4,3,3,4,8,6,7,10,7,8,8,8,26,20,10,16,4,3,9,8,8,8,8],cat:"Cyber Threats"},
  {kw:"Vulnerability Assessment",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-assessment",sv:9900,kd:47,wk36:1,wk37:1,wk38:1,wk39:4,wk40:3,aio:false,trend:[2,2,2,2,3,3,2,3,4,5,6,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,3],cat:"Cyber Security"},
  {kw:"What Is A Bot",url:"https://www.fortinet.com/resources/cyberglossary/bot",sv:8100,kd:47,wk36:3,wk37:10,wk38:8,wk39:8,wk40:6,aio:false,trend:[3,3,3,3,3,5,4,3,3,3,4,3,2,3,4,4,6,6,7,7,7,8,8,8,8,7,8,8,8,5,3,4,3,4,3,3,10,8,8,6],cat:"Cyber Threats"},
  {kw:"DDOS Protection",url:"https://www.fortinet.com/resources/cyberglossary/ddos-protection",sv:2900,kd:72,wk36:2,wk37:3,wk38:2,wk39:3,wk40:3,aio:true,trend:[2,2,1,2,2,6,6,4,4,4,3,5,7,5,4,4,4,4,5,4,4,4,4,5,5,5,5,5,5,3,3,3,2,3,4,2,3,2,3,3],cat:"Cyber Threats"},
  {kw:"What Is Openstack",url:"https://www.fortinet.com/resources/cyberglossary/openstack",sv:480,kd:54,wk36:20,wk37:10,wk38:6,wk39:13,wk40:11,aio:false,trend:[9,11,11,11,10,11,10,10,10,8,9,11,10,10,9,9,9,11,9,9,10,23,12,4,7,10,10,10,10,22,20,23,24,21,18,20,10,6,13,11],cat:"Cloud Security"},
  {kw:"Hybrid It",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-it",sv:720,kd:31,wk36:5,wk37:8,wk38:10,wk39:5,wk40:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,5,3,3,3,2,2,4,3,6,9,6,5,7,5,3,4,5,5,5,8,10,5,4],cat:"Cloud Security"},
  {kw:"Krack Attack",url:"https://www.fortinet.com/resources/cyberglossary/krack-attack",sv:170,kd:28,wk36:2,wk37:5,wk38:5,wk39:5,wk40:4,aio:false,trend:[5,5,5,5,5,5,5,4,5,4,4,4,4,6,5,6,6,4,4,2,2,1,1,3,5,4,4,4,4,2,3,3,3,3,3,2,5,5,5,4],cat:"Cyber Threats"},
  {kw:"Thin Client",url:"https://www.fortinet.com/resources/cyberglossary/thin-client",sv:4400,kd:49,wk36:9,wk37:4,wk38:4,wk39:6,wk40:4,aio:false,trend:[2,3,3,6,2,1,1,2,5,3,3,2,4,3,9,2,4,4,3,2,3,3,4,3,3,3,3,3,3,10,11,10,11,10,8,9,4,4,6,4],cat:"Cyber Security"},
  {kw:"CIAM",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ciam",sv:3600,kd:55,wk36:30,wk37:18,wk38:13,wk39:9,wk40:9,aio:false,trend:[8,8,3,9,9,9,4,6,9,9,7,8,8,9,6,12,16,15,16,19,19,16,17,19,17,13,14,13,13,9,10,3,9,4,28,30,18,13,9,9],cat:"Access Control"},
  {kw:"Spear Phishing",url:"https://www.fortinet.com/resources/cyberglossary/spear-phishing",sv:12100,kd:51,wk36:2,wk37:7,wk38:5,wk39:9,wk40:7,aio:false,trend:[9,12,7,10,8,10,9,9,10,9,7,6,6,5,10,4,4,7,6,4,6,10,6,5,7,7,11,7,4,8,2,2,3,2,5,2,7,5,9,7],cat:"Cyber Threats"},
  {kw:"Advanced Threat Protection",url:"https://www.fortinet.com/resources/cyberglossary/advanced-threat-protection-atp",sv:1600,kd:33,wk36:1,wk37:1,wk38:1,wk39:2,wk40:3,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3],cat:"Cyber Security"},
  {kw:"Network As A Service",url:"https://www.fortinet.com/resources/cyberglossary/network-as-a-service",sv:1600,kd:10,wk36:7,wk37:5,wk38:5,wk39:7,wk40:7,aio:false,trend:[4,9,2,5,9,12,11,8,6,3,6,7,9,8,10,6,2,4,7,5,6,5,3,5,2,4,6,6,4,5,5,5,5,5,5,7,5,5,7,7],cat:"SASE"},
  {kw:"Managed Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/managed-detection-and-response",sv:3600,kd:49,wk36:8,wk37:27,wk38:28,wk39:24,wk40:26,aio:false,trend:[11,13,15,15,16,15,12,12,9,5,6,11,14,12,12,15,19,24,24,20,11,16,27,30,31,28,26,25,25,11,10,10,9,9,8,8,27,28,24,26],cat:"Endpoint Security"},
  {kw:"What Is SSO?",url:"https://www.fortinet.com/resources/cyberglossary/single-sign-on",sv:5400,kd:61,wk36:10,wk37:3,wk38:3,wk39:4,wk40:4,aio:false,trend:[3,5,5,3,4,5,5,2,3,1,1,2,4,2,3,2,2,4,3,3,3,2,2,2,2,2,3,2,2,9,7,8,8,8,9,10,3,3,4,4],cat:"Access Control"},
  {kw:"What Is Internet Security",url:"https://www.fortinet.com/resources/cyberglossary/internet-security",sv:2900,kd:43,wk36:5,wk37:2,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,2,4,5,2,1,1,1],cat:"Network Security"},
  {kw:"Wireless Security TIPS",url:"https://www.fortinet.com/resources/cyberglossary/wireless-security-tips",sv:20,kd:46,wk36:2,wk37:2,wk38:2,wk39:1,wk40:1,aio:false,trend:[4,2,2,2,2,3,3,3,3,4,2,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,3,1,1,2,1,1,1,1,1,2,2,2,1,1],cat:"Network Security"},
  {kw:"What Is PCI Compliance",url:"https://www.fortinet.com/resources/cyberglossary/what-is-pci-compliance",sv:4400,kd:44,wk36:6,wk37:2,wk38:1,wk39:1,wk40:2,aio:false,trend:[10,12,9,4,3,8,6,5,5,4,5,4,4,3,4,3,3,3,2,2,3,3,3,2,2,2,2,2,2,10,8,8,7,9,9,6,2,1,1,2],cat:"Cyber Compliance"},
  {kw:"SQL Injection",url:"https://www.fortinet.com/resources/cyberglossary/sql-injection",sv:9900,kd:74,wk36:5,wk37:13,wk38:10,wk39:14,wk40:15,aio:false,trend:[8,12,14,13,16,16,14,13,15,12,11,11,12,10,9,15,12,13,17,25,15,10,13,20,29,14,15,13,12,9,10,10,9,6,4,5,13,10,14,15],cat:"Cyber Threats"},
  {kw:"Sextortion",url:"https://www.fortinet.com/resources/cyberglossary/sextortion",sv:12100,kd:76,wk36:8,wk37:8,wk38:4,wk39:15,wk40:17,aio:false,trend:[2,6,6,5,8,13,8,8,13,14,19,18,16,5,4,2,3,12,10,10,14,11,11,16,15,15,15,15,15,8,9,7,9,8,8,8,8,4,15,17],cat:"Cyber Threats"},
  {kw:"Web ScrAPIng",url:"https://www.fortinet.com/resources/cyberglossary/web-scraping",sv:1830000,kd:64,wk36:2,wk37:6,wk38:4,wk39:7,wk40:6,aio:true,trend:[12,4,2,6,5,5,4,4,6,6,4,6,6,7,10,9,9,8,10,8,8,8,6,10,10,10,8,9,4,5,6,2,2,2,2,2,6,4,7,6],cat:"Cyber Security"},
  {kw:"Network Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/network-monitoring",sv:3600,kd:52,wk36:10,wk37:6,wk38:5,wk39:4,wk40:5,aio:true,trend:[21,23,19,17,17,19,15,5,10,9,6,7,8,7,8,8,8,10,10,13,12,13,11,13,16,18,11,14,11,10,10,8,8,10,8,10,6,5,4,5],cat:"Network Security"},
  {kw:"PKI",url:"https://www.fortinet.com/resources/cyberglossary/public-key-infrastructure",sv:22200,kd:78,wk36:3,wk37:3,wk38:2,wk39:3,wk40:2,aio:false,trend:[4,8,8,3,11,8,8,7,7,8,7,7,6,6,8,8,9,10,9,8,11,12,11,11,10,10,9,10,9,2,3,4,3,4,3,3,3,2,3,2],cat:"Access Control"},
  {kw:"PAAS",url:"https://www.fortinet.com/resources/cyberglossary/platform-as-a-service",sv:14800,kd:71,wk36:2,wk37:11,wk38:11,wk39:10,wk40:10,aio:false,trend:[7,9,9,9,10,11,9,10,9,7,6,6,7,6,10,6,10,9,11,11,11,13,11,11,11,9,9,9,9,2,2,3,2,3,2,2,11,11,10,10],cat:"Cloud Security"},
  {kw:"Mobile Device Management",url:"https://www.fortinet.com/resources/cyberglossary/mobile-device-management",sv:6600,kd:64,wk36:8,wk37:5,wk38:5,wk39:4,wk40:2,aio:true,trend:[5,4,4,3,6,8,5,5,7,7,3,4,4,5,8,5,8,7,5,9,6,7,5,7,4,4,7,3,3,2,3,2,4,7,4,8,5,5,4,2],cat:"Cyber Security"},
  {kw:"How To Prevent Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/how-to-prevent-ransomware",sv:1300,kd:54,wk36:3,wk37:2,wk38:2,wk39:1,wk40:2,aio:true,trend:[2,2,12,11,13,13,9,10,6,5,3,5,4,5,10,3,6,7,5,5,2,2,2,3,2,2,3,2,2,2,1,1,2,4,4,3,2,2,1,2],cat:"Cyber Threats"},
  {kw:"Remote Desktop Protocol",url:"https://www.fortinet.com/resources/cyberglossary/remote-desktop-protocol",sv:2900,kd:49,wk36:19,wk37:5,wk38:4,wk39:6,wk40:5,aio:true,trend:[7,5,3,5,6,6,3,5,6,6,7,5,2,2,3,5,5,5,5,7,6,6,6,6,7,6,9,8,8,10,18,14,13,17,20,19,5,4,6,5],cat:"Network Security"},
  {kw:"Cyber Glossary",url:"https://www.fortinet.com/resources/cyberglossary",sv:20,kd:42,wk36:3,wk37:7,wk38:3,wk39:4,wk40:8,aio:false,trend:[9,10,3,8,8,8,8,9,11,7,8,9,4,6,8,5,4,20,20,20,20,20,15,11,11,2,8,2,2,12,17,6,9,9,6,3,7,3,4,8],cat:"Cyber Compliance"},
  {kw:"Solarwinds Cyber Attack",url:"https://www.fortinet.com/resources/cyberglossary/solarwinds-cyber-attack",sv:390,kd:61,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"Identity Theft",url:"https://www.fortinet.com/resources/cyberglossary/identity-theft",sv:22200,kd:89,wk36:7,wk37:14,wk38:28,wk39:8,wk40:8,aio:false,trend:[42,55,54,40,49,58,56,9,9,5,10,14,8,5,3,9,19,11,10,16,32,20,11,21,15,15,15,17,13,1,11,7,5,3,7,7,14,28,8,8],cat:"Cyber Threats"},
  {kw:"Sarbanes-Oxley Act",url:"https://www.fortinet.com/resources/cyberglossary/sox-sarbanes-oxley-act",sv:6600,kd:65,wk36:20,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[6,7,6,2,7,11,8,6,6,5,8,8,2,2,2,2,1,4,3,56,3,2,1,5,4,4,5,5,3,9,19,17,18,17,17,20,null,null,null,null],cat:"Cyber Compliance"},
  {kw:"SSL Certificate",url:"https://www.fortinet.com/resources/cyberglossary/ssl-certificate",sv:14800,kd:95,wk36:25,wk37:9,wk38:9,wk39:8,wk40:8,aio:false,trend:[14,5,7,11,9,7,9,9,11,10,7,8,9,9,8,8,11,11,10,12,12,9,11,11,11,10,9,9,9,33,29,31,28,32,31,25,9,9,8,8],cat:"Cyber Security"},
  {kw:"Data Classification",url:"https://www.fortinet.com/resources/cyberglossary/data-classification",sv:2400,kd:42,wk36:18,wk37:18,wk38:16,wk39:16,wk40:23,aio:false,trend:[11,11,14,8,10,7,8,9,9,7,4,8,15,17,14,13,15,17,17,14,14,15,14,15,15,15,14,13,13,20,20,20,19,12,14,18,18,16,16,23],cat:"Data Security"},
  {kw:"What Is SOAR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-soar",sv:9900,kd:45,wk36:2,wk37:4,wk38:3,wk39:4,wk40:7,aio:true,trend:[7,7,7,8,7,8,7,7,7,7,4,6,7,7,6,7,5,7,7,9,9,7,6,4,5,5,5,4,4,2,2,2,2,4,2,2,4,3,4,7],cat:"SecOps"},
  {kw:"What Is Mobile Security",url:"https://www.fortinet.com/resources/cyberglossary/mobile-security",sv:2900,kd:61,wk36:2,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[6,10,12,12,12,13,12,11,8,8,7,8,11,7,13,12,12,13,9,8,12,14,12,15,1,2,10,4,4,5,3,2,2,2,2,2,2,2,2,2],cat:"Access Control"},
  {kw:"Devsecops",url:"https://www.fortinet.com/resources/cyberglossary/devsecops",sv:9900,kd:59,wk36:11,wk37:37,wk38:37,wk39:39,wk40:33,aio:false,trend:[28,30,32,29,30,34,28,26,23,23,15,13,8,12,14,18,22,25,27,21,20,29,32,26,35,29,31,45,37,9,9,7,9,8,8,11,37,37,39,33],cat:"Cyber Security"},
  {kw:"Dynamic DNS",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-dns",sv:3600,kd:57,wk36:9,wk37:9,wk38:7,wk39:7,wk40:8,aio:true,trend:[10,8,6,7,4,7,6,7,9,2,6,8,9,8,8,9,9,10,9,10,10,11,9,10,9,9,9,10,9,2,2,9,8,7,7,9,9,7,7,8],cat:"Cyber Security"},
  {kw:"Infrastructure As Code",url:"https://www.fortinet.com/resources/cyberglossary/infrastructure-as-code",sv:880,kd:52,wk36:6,wk37:26,wk38:22,wk39:22,wk40:12,aio:false,trend:[38,41,39,41,29,37,34,12,4,7,5,8,14,5,3,14,7,15,21,19,18,21,25,14,19,16,25,23,23,6,4,4,8,9,7,6,26,22,22,12],cat:"Cloud Security"},
  {kw:"What Is A Cyber Attack?",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cyber-attack",sv:2900,kd:61,wk36:6,wk37:3,wk38:3,wk39:3,wk40:4,aio:false,trend:[7,6,1,10,6,4,5,4,4,2,2,1,1,1,1,1,1,1,2,1,1,1,1,1,2,5,3,3,2,6,6,6,6,6,6,6,3,3,3,4],cat:"Cyber Threats"},
  {kw:"Multi-Factor Authentication",url:"https://www.fortinet.com/resources/cyberglossary/multi-factor-authentication",sv:6600,kd:75,wk36:5,wk37:23,wk38:20,wk39:24,wk40:25,aio:false,trend:[25,23,24,24,26,29,24,19,7,21,17,16,14,16,17,20,23,24,24,20,7,11,22,24,22,24,24,26,24,5,5,4,5,4,5,5,23,20,24,25],cat:"Access Control"},
  {kw:"Account Takeover",url:"https://www.fortinet.com/resources/cyberglossary/account-takeover",sv:1900,kd:38,wk36:15,wk37:6,wk38:5,wk39:8,wk40:9,aio:false,trend:[4,3,4,6,7,7,6,3,4,3,4,4,3,3,3,4,4,4,3,2,5,8,6,5,5,6,5,4,3,19,23,22,22,19,13,15,6,5,8,9],cat:"Cyber Security"},
  {kw:"Colocation Data Center",url:"https://www.fortinet.com/resources/cyberglossary/colocation-data-center",sv:3600,kd:44,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Cyber Security"},
  {kw:"Cyber Espionage",url:"https://www.fortinet.com/resources/cyberglossary/cyber-espionage",sv:880,kd:40,wk36:16,wk37:9,wk38:9,wk39:9,wk40:9,aio:false,trend:[6,6,6,7,3,8,8,5,3,5,6,2,5,6,5,6,7,8,8,8,8,9,9,9,9,9,9,10,10,10,11,12,10,7,13,16,9,9,9,9],cat:"Cyber Threats"},
  {kw:"Deception Technology",url:"https://www.fortinet.com/resources/cyberglossary/what-is-deception-technology",sv:390,kd:25,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[2,3,3,3,3,4,3,4,4,4,3,4,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"SecOps"},
  {kw:"Deep Packet Inspection",url:"https://www.fortinet.com/resources/cyberglossary/dpi-deep-packet-inspection",sv:1600,kd:50,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[6,5,5,4,4,6,3,3,3,2,3,4,3,2,2,2,2,3,3,3,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2],cat:"Network Security"},
  {kw:"Network Automation",url:"https://www.fortinet.com/resources/cyberglossary/network-automation",sv:1900,kd:41,wk36:2,wk37:8,wk38:7,wk39:10,wk40:13,aio:false,trend:[6,9,8,7,5,5,5,5,2,5,6,5,4,4,5,5,5,5,5,5,7,12,12,11,9,10,10,11,9,2,2,3,3,3,2,2,8,7,10,13],cat:"Network Security"},
  {kw:"DNS Leak",url:"https://www.fortinet.com/resources/cyberglossary/dns-leak",sv:8100,kd:69,wk36:6,wk37:8,wk38:6,wk39:7,wk40:7,aio:true,trend:[5,5,5,6,6,6,6,5,5,5,4,6,7,6,7,6,6,6,7,6,6,6,6,6,7,6,7,7,6,2,2,3,5,6,5,6,8,6,7,7],cat:"Cyber Threats"},
  {kw:"Swatting",url:"https://www.fortinet.com/resources/cyberglossary/swatting",sv:18100,kd:62,wk36:8,wk37:10,wk38:9,wk39:9,wk40:9,aio:true,trend:[9,9,8,9,6,8,8,8,8,9,3,4,6,8,4,6,11,9,9,9,10,10,10,10,11,10,11,9,9,8,9,8,10,11,7,8,10,9,9,9],cat:"Cyber Threats"},
  {kw:"What Is A Honeypot",url:"https://www.fortinet.com/resources/cyberglossary/what-is-honeypot",sv:3600,kd:57,wk36:9,wk37:7,wk38:7,wk39:6,wk40:5,aio:false,trend:[5,5,6,7,9,7,7,8,8,9,6,3,3,2,2,7,10,8,8,9,11,10,10,11,9,8,10,10,10,9,11,11,11,12,11,9,7,7,6,5],cat:"Cyber Security"},
  {kw:"What Is A Data Breach",url:"https://www.fortinet.com/resources/cyberglossary/data-breach",sv:6600,kd:52,wk36:4,wk37:6,wk38:5,wk39:3,wk40:4,aio:false,trend:[7,4,4,5,6,5,4,4,3,4,3,3,6,3,5,4,3,5,4,3,3,3,3,3,3,3,5,4,3,3,4,4,4,4,3,4,6,5,3,4],cat:"Data Security"},
  {kw:"What Is Remote Access",url:"https://www.fortinet.com/resources/cyberglossary/remote-access",sv:210,kd:35,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Access Control"},
  {kw:"Incident Response",url:"https://www.fortinet.com/resources/cyberglossary/incident-response",sv:590,kd:45,wk36:10,wk37:7,wk38:7,wk39:7,wk40:7,aio:true,trend:[2,2,1,2,2,3,12,4,6,10,8,7,15,12,5,4,2,5,4,5,5,9,9,10,8,10,9,8,8,10,10,11,10,11,9,10,7,7,7,7],cat:"SecOps"},
  {kw:"Cyber Warfare",url:"https://www.fortinet.com/resources/cyberglossary/most-notorious-attacks-in-the-history-of-cyber-warfare",sv:2400,kd:54,wk36:8,wk37:74,wk38:null,wk39:null,wk40:null,aio:false,trend:[2,2,1,1,1,1,1,1,1,1,1,1,4,2,3,4,2,4,5,5,5,4,3,1,null,31,34,40,20,9,9,10,9,10,9,8,74,null,null,null],cat:"Cyber Threats"},
  {kw:"Remote Work Cyber Security Risks",url:"https://www.fortinet.com/resources/cyberglossary/work-from-home-cybersecurity-risks",sv:40,kd:40,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[5,7,2,7,8,8,8,8,3,3,3,5,5,4,5,4,4,4,4,4,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Threats"},
  {kw:"What Is Deepfake",url:"https://www.fortinet.com/resources/cyberglossary/deepfake",sv:2400,kd:72,wk36:21,wk37:10,wk38:8,wk39:9,wk40:8,aio:false,trend:[3,3,1,2,3,4,3,3,2,6,3,5,4,3,5,4,6,4,5,5,6,7,6,4,4,5,6,9,8,29,33,44,43,46,29,21,10,8,9,8],cat:"Cyber Threats"},
  {kw:"Critical Infrastructure Protection",url:"https://www.fortinet.com/resources/cyberglossary/critical-infrastructure-protection",sv:4400,kd:46,wk36:9,wk37:3,wk38:3,wk39:2,wk40:3,aio:true,trend:[1,1,1,6,6,6,6,6,5,6,2,2,2,3,5,3,2,3,2,2,2,3,2,3,3,3,3,4,4,6,10,9,6,9,8,9,3,3,2,3],cat:"OT Security"},
  {kw:"Watering Hole Attack",url:"https://www.fortinet.com/resources/cyberglossary/watering-hole-attack",sv:1900,kd:49,wk36:2,wk37:2,wk38:2,wk39:2,wk40:1,aio:true,trend:[3,2,2,2,2,2,3,3,3,3,3,3,2,2,3,2,3,3,3,2,2,2,2,2,2,2,2,2,2,8,2,2,10,3,3,2,2,2,2,1],cat:"Cyber Threats"},
  {kw:"Rootkit",url:"https://www.fortinet.com/resources/cyberglossary/rootkit",sv:5400,kd:51,wk36:11,wk37:3,wk38:3,wk39:2,wk40:2,aio:true,trend:[2,2,4,4,3,3,2,3,3,2,3,2,2,2,2,2,3,3,3,2,3,3,2,2,2,2,3,2,2,12,13,14,13,12,14,11,3,3,2,2],cat:"Cyber Threats"},
  {kw:"OIDC",url:"https://www.fortinet.com/resources/cyberglossary/oidc",sv:9900,kd:55,wk36:68,wk37:18,wk38:19,wk39:17,wk40:14,aio:false,trend:[7,3,4,5,3,4,3,4,5,6,7,5,6,8,4,7,10,10,3,7,9,15,12,8,6,14,11,16,16,9,6,9,9,68,68,68,18,19,17,14],cat:"Access Control"},
  {kw:"Intrusion Detection System",url:"https://www.fortinet.com/resources/cyberglossary/intrusion-detection-system",sv:5400,kd:57,wk36:9,wk37:11,wk38:11,wk39:8,wk40:18,aio:false,trend:[4,11,12,13,14,14,11,10,8,6,8,7,10,6,3,6,5,8,11,16,8,9,10,12,11,11,13,15,13,8,8,8,9,9,8,9,11,11,8,18],cat:"Network Security"},
  {kw:"Heuristic Analysis",url:"https://www.fortinet.com/resources/cyberglossary/heuristic-analysis",sv:720,kd:44,wk36:7,wk37:7,wk38:6,wk39:2,wk40:4,aio:false,trend:[8,3,8,2,6,3,1,3,9,6,6,3,6,2,8,6,3,6,6,4,7,6,5,6,6,6,8,7,5,2,6,7,5,3,7,7,7,6,2,4],cat:"Cyber Security"},
  {kw:"Serverless Computing",url:"https://www.fortinet.com/resources/cyberglossary/serverless-computing",sv:4400,kd:71,wk36:7,wk37:30,wk38:27,wk39:28,wk40:25,aio:false,trend:[10,11,12,13,13,12,11,11,10,13,9,12,12,9,3,12,13,13,13,12,3,14,13,16,14,15,19,27,23,8,9,8,9,9,10,7,30,27,28,25],cat:"Cloud Security"},
  {kw:"Hacktivism",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hacktivism",sv:1900,kd:49,wk36:15,wk37:2,wk38:2,wk39:4,wk40:3,aio:true,trend:[2,3,2,3,4,4,3,2,3,3,3,3,3,2,6,2,2,3,2,3,2,5,3,5,5,4,4,5,3,5,12,14,15,11,11,15,2,2,4,3],cat:"Cyber Threats"},
  {kw:"Types Of Phishing Attacks",url:"https://www.fortinet.com/resources/cyberglossary/types-of-phishing-attacks",sv:1000,kd:44,wk36:2,wk37:2,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,null,3,4,3,3,2,2,1,1,1],cat:"Cyber Threats"},
  {kw:"Election Security",url:"https://www.fortinet.com/resources/cyberglossary/election-security",sv:880,kd:57,wk36:10,wk37:9,wk38:9,wk39:10,wk40:10,aio:false,trend:[7,6,7,7,9,8,9,9,9,8,7,9,7,9,9,8,3,6,6,6,8,7,8,7,8,8,9,9,9,10,9,9,11,12,8,10,9,9,10,10],cat:"Cyber Threats"},
  {kw:"ARP",url:"https://www.fortinet.com/resources/cyberglossary/what-is-arp",sv:90500,kd:63,wk36:4,wk37:6,wk38:6,wk39:6,wk40:6,aio:false,trend:[6,6,6,6,5,4,5,5,5,5,4,4,6,5,4,6,6,6,5,5,6,5,6,6,7,6,6,6,6,3,3,2,4,4,4,4,6,6,6,6],cat:"Cyber Threats"},
  {kw:"Supply Chain Attacks",url:"https://www.fortinet.com/resources/cyberglossary/supply-chain-attacks",sv:720,kd:52,wk36:4,wk37:16,wk38:15,wk39:16,wk40:8,aio:false,trend:[9,10,11,11,11,11,11,8,6,9,8,8,9,11,10,11,13,13,13,20,15,19,18,23,19,19,20,21,21,4,5,5,5,6,4,4,16,15,16,8],cat:"Cyber Threats"},
  {kw:"Emailsecurity Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/email-security-best-practices",sv:590,kd:15,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[10,9,6,9,10,10,2,3,3,2,2,2,3,2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Email Security"},
  {kw:"White Hat Hacking",url:"https://www.fortinet.com/resources/cyberglossary/whitehat-security",sv:4400,kd:48,wk36:10,wk37:3,wk38:3,wk39:4,wk40:3,aio:false,trend:[2,4,5,6,2,2,2,2,4,5,5,4,2,4,2,2,2,5,5,4,5,4,4,3,3,5,3,4,3,5,3,10,10,10,10,10,3,3,4,3],cat:"Cyber Security"},
  {kw:"What Is DDOS Attack",url:"https://www.fortinet.com/resources/cyberglossary/ddos-attack",sv:2900,kd:73,wk36:17,wk37:6,wk38:7,wk39:6,wk40:4,aio:true,trend:[8,8,6,9,9,8,5,8,2,2,6,3,2,3,2,4,4,6,11,8,6,5,7,7,5,6,12,26,11,12,9,23,22,14,12,17,6,7,6,4],cat:"Cyber Threats"},
  {kw:"Recent Cyber Attacks",url:"https://www.fortinet.com/resources/cyberglossary/recent-cyber-attacks",sv:3600,kd:61,wk36:27,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[8,8,4,6,3,4,3,2,3,3,3,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,29,28,31,27,2,2,2,2],cat:"Cyber Security"},
  {kw:"Remote Access VPN",url:"https://www.fortinet.com/resources/cyberglossary/remote-access-vpn",sv:5400,kd:60,wk36:7,wk37:7,wk38:3,wk39:4,wk40:8,aio:false,trend:[4,2,6,7,9,6,2,3,3,2,2,4,16,3,2,2,2,2,3,3,2,2,3,3,2,2,2,3,3,7,12,4,12,11,9,7,7,3,4,8],cat:"VPN"},
  {kw:"Fisma",url:"https://www.fortinet.com/resources/cyberglossary/fisma-and-fisma-compliance",sv:6600,kd:57,wk36:1,wk37:8,wk38:5,wk39:8,wk40:7,aio:true,trend:[3,5,2,2,2,5,3,4,6,7,6,6,3,9,8,6,8,7,7,8,8,8,8,8,8,8,8,6,3,8,9,8,8,1,1,1,8,5,8,7],cat:"Cyber Compliance"},
  {kw:"How To Detect Keylogger",url:"https://www.fortinet.com/resources/cyberglossary/how-to-detect-keylogger-on-phone",sv:320,kd:39,wk36:29,wk37:12,wk38:8,wk39:11,wk40:11,aio:false,trend:[11,10,9,7,11,9,9,9,9,5,4,9,10,6,3,7,12,10,11,11,7,7,2,9,11,7,7,11,10,19,22,23,28,23,25,29,12,8,11,11],cat:"Cyber Threats"},
  {kw:"Network Segmentation",url:"https://www.fortinet.com/resources/cyberglossary/network-segmentation",sv:2900,kd:45,wk36:2,wk37:6,wk38:6,wk39:7,wk40:6,aio:true,trend:[10,11,9,10,14,13,8,7,8,3,4,6,8,7,2,5,6,3,3,3,5,6,7,8,7,3,6,5,5,2,2,2,2,3,3,2,6,6,7,6],cat:"Network Security"},
  {kw:"Intrusion Prevention System",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-ips",sv:9900,kd:65,wk36:2,wk37:10,wk38:9,wk39:7,wk40:7,aio:false,trend:[15,15,14,17,18,11,8,6,7,6,6,6,8,9,7,7,7,7,8,6,6,8,7,10,11,11,12,11,9,3,4,6,2,3,4,2,10,9,7,7],cat:"Network Security"},
  {kw:"SIEM",url:"https://www.fortinet.com/resources/cyberglossary/what-is-siem",sv:2900,kd:58,wk36:9,wk37:19,wk38:27,wk39:36,wk40:30,aio:false,trend:[16,13,15,15,14,19,13,5,9,5,6,9,8,10,8,8,10,10,10,11,11,11,11,16,30,37,16,40,36,10,10,6,7,10,9,9,19,27,36,30],cat:"SecOps"},
  {kw:"XDR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-XDR",sv:6600,kd:58,wk36:5,wk37:7,wk38:7,wk39:7,wk40:7,aio:false,trend:[9,9,5,9,11,15,13,15,9,6,7,6,12,5,5,7,7,5,6,7,8,8,7,5,6,11,11,13,12,11,11,11,9,9,11,5,7,7,7,7],cat:"Endpoint Security"},
  {kw:"VPN Routers",url:"https://www.fortinet.com/resources/cyberglossary/vpn-routers",sv:480,kd:36,wk36:9,wk37:4,wk38:2,wk39:4,wk40:1,aio:true,trend:[7,8,2,5,5,4,2,4,3,3,7,7,8,8,7,5,5,5,5,7,3,4,3,7,5,6,7,7,7,7,8,8,10,9,8,9,4,2,4,1],cat:"VPN"},
  {kw:"Clickjacking",url:"https://www.fortinet.com/resources/cyberglossary/clickjacking",sv:1600,kd:48,wk36:12,wk37:12,wk38:12,wk39:15,wk40:12,aio:false,trend:[9,11,11,10,10,11,9,9,10,8,8,10,6,9,5,8,10,10,11,12,11,11,12,11,11,11,12,13,12,11,12,13,11,15,13,12,12,12,15,12],cat:"Cyber Threats"},
  {kw:"Bring Your Own Device",url:"https://www.fortinet.com/resources/cyberglossary/byod",sv:2400,kd:59,wk36:26,wk37:68,wk38:6,wk39:6,wk40:7,aio:false,trend:[5,10,7,7,8,11,9,6,7,8,7,8,8,7,9,8,9,11,10,13,24,23,30,17,48,10,5,21,13,28,27,28,28,26,25,26,68,6,6,7],cat:"Cyber Security"},
  {kw:"Cross Site Scripting",url:"https://www.fortinet.com/resources/cyberglossary/cross-site-scripting",sv:5400,kd:71,wk36:21,wk37:9,wk38:9,wk39:8,wk40:7,aio:false,trend:[6,6,5,6,6,7,6,4,3,6,3,7,7,5,9,7,6,6,6,6,5,6,6,6,7,6,6,6,6,10,20,14,9,27,17,21,9,9,8,7],cat:"Cyber Threats"},
  {kw:"Fast Flux Networks",url:"https://www.fortinet.com/resources/cyberglossary/fast-flux-networks",sv:20,kd:50,wk36:12,wk37:3,wk38:2,wk39:2,wk40:3,aio:false,trend:[2,2,1,2,2,2,2,2,3,2,1,2,2,2,5,2,2,2,2,2,2,2,2,2,2,3,3,3,2,12,12,12,12,12,12,12,3,2,2,3],cat:"Cyber Threats"},
  {kw:"Phishing",url:"https://www.fortinet.com/resources/cyberglossary/phishing",sv:49500,kd:98,wk36:30,wk37:8,wk38:7,wk39:8,wk40:7,aio:false,trend:[7,8,15,9,12,17,9,14,10,11,10,7,7,11,8,8,10,10,9,5,11,9,9,9,7,9,8,9,8,22,19,15,32,35,29,30,8,7,8,7],cat:"Cyber Threats"},
  {kw:"Malware",url:"https://www.fortinet.com/resources/cyberglossary/malware",sv:40500,kd:84,wk36:11,wk37:19,wk38:13,wk39:10,wk40:12,aio:false,trend:[8,8,8,9,10,9,9,6,6,8,6,8,9,9,17,7,5,9,11,9,4,7,12,9,10,12,9,9,6,7,9,8,9,10,10,11,19,13,10,12],cat:"Cyber Threats"},
  {kw:"Unified Endpoint Management",url:"https://www.fortinet.com/resources/cyberglossary/unified-endpoint-management-uem",sv:1300,kd:43,wk36:2,wk37:2,wk38:3,wk39:5,wk40:6,aio:false,trend:[9,13,12,11,14,13,9,5,5,5,6,6,5,4,5,4,3,4,4,4,3,6,4,4,3,2,3,3,3,5,8,4,5,3,4,2,2,3,5,6],cat:"Endpoint Security"},
  {kw:"Man In The Middle Attack",url:"https://www.fortinet.com/resources/cyberglossary/man-in-the-middle-attack",sv:5400,kd:71,wk36:29,wk37:8,wk38:7,wk39:7,wk40:7,aio:false,trend:[11,10,11,12,12,13,9,6,6,6,6,5,4,6,8,8,6,6,8,8,7,9,9,12,11,11,11,11,9,24,23,26,27,25,26,29,8,7,7,7],cat:"Cyber Threats"},
  {kw:"Cyber Insurance",url:"https://www.fortinet.com/resources/cyberglossary/cyber-insurance",sv:9900,kd:61,wk36:2,wk37:4,wk38:3,wk39:3,wk40:3,aio:true,trend:[4,4,3,2,3,3,3,3,3,4,3,3,2,2,6,2,2,3,2,2,3,2,2,3,2,2,2,3,3,4,7,2,2,2,2,2,4,3,3,3],cat:"Cyber Security"},
  {kw:"Bloatware",url:"https://www.fortinet.com/resources/cyberglossary/bloatware",sv:4400,kd:51,wk36:29,wk37:5,wk38:3,wk39:2,wk40:3,aio:false,trend:[2,2,1,2,2,1,1,2,3,3,2,2,2,2,3,3,2,4,3,3,3,5,4,3,4,4,3,3,3,29,30,32,29,30,30,29,5,3,2,3],cat:"Cyber Threats"},
  {kw:"What Is Two Factor Authentication",url:"https://www.fortinet.com/resources/cyberglossary/two-factor-authentication",sv:6600,kd:72,wk36:7,wk37:11,wk38:10,wk39:9,wk40:12,aio:false,trend:[10,9,9,12,11,9,10,10,9,10,10,10,8,9,9,11,10,10,11,10,9,10,11,10,10,10,10,11,8,4,4,3,4,4,5,7,11,10,9,12],cat:"Access Control"},
  {kw:"Black Hat Security",url:"https://www.fortinet.com/resources/cyberglossary/black-hat-security",sv:110,kd:52,wk36:10,wk37:12,wk38:4,wk39:8,wk40:10,aio:false,trend:[7,6,8,8,8,8,4,5,5,5,5,5,4,7,5,7,7,6,6,11,15,15,15,15,5,11,11,11,11,11,6,9,9,9,9,10,12,4,8,10],cat:"Cyber Threats"},
  {kw:"DHCP",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-host-configuration-protocol-dhcp",sv:8100,kd:47,wk36:16,wk37:7,wk38:8,wk39:8,wk40:7,aio:true,trend:[6,7,8,8,8,9,8,5,6,3,4,4,5,5,2,6,4,5,5,6,4,5,5,4,8,9,5,11,9,12,11,8,11,9,9,16,7,8,8,7],cat:"Network Security"},
  {kw:"Machine Learning",url:"https://www.fortinet.com/resources/cyberglossary/what-is-machine-learning",sv:60500,kd:93,wk36:1,wk37:1,wk38:1,wk39:null,wk40:null,aio:false,trend:[6,2,1,1,1,1,1,1,5,10,1,1,2,7,3,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,null,null],cat:"Cyber Security"},
  {kw:"Cyber Threat Intelligence",url:"https://www.fortinet.com/resources/cyberglossary/cyber-threat-intelligence",sv:3600,kd:52,wk36:3,wk37:26,wk38:20,wk39:8,wk40:7,aio:false,trend:[15,18,15,19,19,20,19,13,13,10,7,8,11,12,7,19,16,20,19,14,8,13,18,19,23,26,28,25,24,3,3,4,3,3,2,3,26,20,8,7],cat:"Cyber Threats"},
  {kw:"What Is A Qr Code",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-qr-code",sv:5400,kd:48,wk36:2,wk37:3,wk38:3,wk39:3,wk40:3,aio:true,trend:[2,2,2,2,2,2,2,2,2,3,4,3,3,3,2,4,3,2,2,2,2,2,2,2,2,2,2,2,2,3,3,2,2,3,2,2,3,3,3,3],cat:"Cyber Security"},
  {kw:"Simple Network Management Protocol",url:"https://www.fortinet.com/resources/cyberglossary/simple-network-management-protocol",sv:4400,kd:38,wk36:2,wk37:3,wk38:3,wk39:2,wk40:2,aio:true,trend:[5,6,6,6,4,5,6,4,4,3,4,3,3,3,2,2,2,3,4,3,4,4,4,4,4,4,4,4,3,3,4,6,2,3,4,2,3,3,2,2],cat:"Network Security"},
  {kw:"Federated Identity",url:"https://www.fortinet.com/resources/cyberglossary/federated-identity",sv:880,kd:49,wk36:12,wk37:8,wk38:7,wk39:7,wk40:3,aio:false,trend:[13,10,6,8,9,7,8,9,7,8,6,4,5,7,5,9,8,9,7,5,8,7,3,7,10,9,10,10,10,13,14,19,15,14,15,12,8,7,7,3],cat:"Access Control"},
  {kw:"Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/ransomware",sv:33100,kd:84,wk36:13,wk37:8,wk38:9,wk39:7,wk40:7,aio:false,trend:[6,6,7,5,4,6,6,6,7,6,5,5,5,6,5,4,2,3,6,6,7,8,6,8,8,7,8,8,8,9,7,11,11,10,16,13,8,9,7,7],cat:"Cyber Threats"},
  {kw:"SOC",url:"https://www.fortinet.com/resources/cyberglossary/what-is-soc",sv:40500,kd:73,wk36:3,wk37:18,wk38:18,wk39:23,wk40:13,aio:false,trend:[8,11,7,5,6,11,8,6,10,10,7,7,7,4,6,4,7,17,10,16,16,17,6,8,14,8,6,16,13,3,2,5,4,4,2,3,18,18,23,13],cat:"SecOps"},
  {kw:"Wannacry",url:"https://www.fortinet.com/resources/cyberglossary/wannacry-ransomware-attack",sv:4400,kd:68,wk36:5,wk37:13,wk38:12,wk39:13,wk40:8,aio:false,trend:[7,7,7,8,9,8,8,8,9,9,6,7,8,7,12,12,11,12,11,8,12,11,12,15,14,11,12,12,11,6,5,6,5,6,6,5,13,12,13,8],cat:"Cyber Threats"},
  {kw:"CI/CD Pipelines",url:"https://www.fortinet.com/resources/cyberglossary/ci-cd-pipeline",sv:3600,kd:57,wk36:12,wk37:23,wk38:67,wk39:99,wk40:2,aio:false,trend:[19,19,19,20,17,16,15,9,6,4,3,5,3,3,3,3,3,23,11,14,2,10,5,2,2,2,2,14,13,12,12,11,11,12,12,12,23,67,99,2],cat:"Cyber Security"},
  {kw:"How To Pick A Wifi Router",url:"https://www.fortinet.com/resources/cyberglossary/how-to-pick-a-work-from-home-wi-fi-router",sv:90,kd:38,wk36:7,wk37:7,wk38:5,wk39:9,wk40:9,aio:false,trend:[9,11,1,10,5,5,5,5,5,9,11,6,6,8,9,7,10,11,8,7,10,8,8,8,8,8,8,8,8,10,14,7,7,15,10,7,7,5,9,9],cat:"Network Security"},
  {kw:"Mitre ATT&CK",url:"https://www.fortinet.com/resources/cyberglossary/mitre-attck",sv:5400,kd:56,wk36:29,wk37:31,wk38:27,wk39:26,wk40:25,aio:false,trend:[10,9,10,10,9,14,11,12,10,13,15,8,7,7,6,11,13,16,15,16,15,22,24,21,27,26,21,21,21,20,20,25,26,25,26,29,31,27,26,25],cat:"Network Security"},
  {kw:"What Is 5G?",url:"https://www.fortinet.com/resources/cyberglossary/what-is-5g",sv:135000,kd:68,wk36:18,wk37:10,wk38:7,wk39:8,wk40:7,aio:false,trend:[9,9,9,11,10,7,4,3,2,2,5,7,7,6,7,3,1,1,2,4,2,5,8,6,6,8,8,7,6,16,17,17,15,15,15,18,10,7,8,7],cat:"Network Security"},
  {kw:"Virtual Desktop Infrastructure",url:"https://www.fortinet.com/resources/cyberglossary/virtual-desktop-infrastructure-vdi",sv:1900,kd:40,wk36:15,wk37:29,wk38:28,wk39:28,wk40:27,aio:false,trend:[6,7,17,20,10,19,15,15,23,19,16,19,15,9,9,19,21,27,28,22,22,25,24,20,27,31,29,31,24,7,7,6,5,2,18,15,29,28,28,27],cat:"Cyber Security"},
  {kw:"What Is A VPN",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-vpn",sv:165000,kd:81,wk36:29,wk37:7,wk38:6,wk39:5,wk40:6,aio:true,trend:[12,11,11,9,10,8,8,7,9,9,6,8,7,7,7,6,6,6,6,4,3,3,4,3,2,2,4,4,4,20,23,24,26,26,27,29,7,6,5,6],cat:"VPN"},
  {kw:"Fabric Of Security",url:"https://www.fortinet.com/resources/cyberglossary/fabric-of-security",sv:40,kd:31,wk36:1,wk37:1,wk38:1,wk39:14,wk40:1,aio:false,trend:[1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,14,1],cat:"Cyber Security"},
  {kw:"Network Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ndr",sv:1300,kd:33,wk36:5,wk37:13,wk38:12,wk39:7,wk40:6,aio:false,trend:[14,14,17,15,13,9,9,4,4,3,2,4,2,4,4,2,2,3,3,3,2,2,3,2,10,9,2,15,11,5,7,6,6,5,4,5,13,12,7,6],cat:"SecOps"},
  {kw:"Cyber Physical Systems",url:"https://www.fortinet.com/resources/cyberglossary/cyber-physical-systems",sv:1300,kd:50,wk36:3,wk37:3,wk38:3,wk39:4,wk40:3,aio:true,trend:[3,3,4,5,2,4,4,4,5,2,4,4,3,3,4,4,5,3,6,5,4,4,7,7,4,6,6,5,3,3,2,5,6,5,4,3,3,3,4,3],cat:"OT Security"},
  {kw:"Purdue Model",url:"https://www.fortinet.com/resources/cyberglossary/purdue-model",sv:70,kd:34,wk36:30,wk37:2,wk38:3,wk39:2,wk40:3,aio:false,trend:[5,2,3,3,3,3,3,3,2,2,2,2,3,2,2,2,2,3,2,2,3,3,2,2,2,3,2,3,2,21,25,33,33,30,31,30,2,3,2,3],cat:"OT Security"},
  {kw:"What Is Air Gap",url:"https://www.fortinet.com/resources/cyberglossary/what-is-air-gap",sv:210,kd:50,wk36:4,wk37:11,wk38:9,wk39:11,wk40:6,aio:false,trend:[11,11,3,8,8,8,8,8,7,7,7,7,7,11,9,11,7,8,9,9,9,9,6,4,14,13,13,13,13,13,15,16,13,16,11,4,11,9,11,6],cat:"AI Security"},
  {kw:"Malware Protection",url:"https://www.fortinet.com/resources/cyberglossary/malware-protection",sv:1830000,kd:62,wk36:11,wk37:12,wk38:13,wk39:12,wk40:17,aio:false,trend:[18,16,21,29,21,16,15,11,11,9,7,5,9,11,9,10,10,10,9,9,9,10,11,10,10,11,17,14,12,10,8,13,12,13,12,11,12,13,12,17],cat:"Cyber Threats"},
  {kw:"Browser Security",url:"https://www.fortinet.com/resources/cyberglossary/browser-security",sv:1000,kd:50,wk36:14,wk37:14,wk38:14,wk39:11,wk40:10,aio:false,trend:[11,11,14,16,8,10,7,8,8,9,5,4,6,4,6,3,5,6,5,8,7,6,3,6,6,6,12,9,7,9,7,11,11,8,16,14,14,14,11,10],cat:"Endpoint Security"},
  {kw:"Types Of Malware",url:"https://www.fortinet.com/resources/cyberglossary/types-of-malware",sv:2900,kd:43,wk36:28,wk37:3,wk38:3,wk39:1,wk40:1,aio:true,trend:[3,6,7,8,9,2,4,2,2,3,4,2,2,2,2,3,2,2,2,4,4,2,3,3,2,2,4,4,3,11,11,13,8,16,28,28,3,3,1,1],cat:"Cyber Threats"},
  {kw:"Identity As A Service",url:"https://www.fortinet.com/resources/cyberglossary/identity-as-a-service",sv:880,kd:26,wk36:4,wk37:13,wk38:12,wk39:9,wk40:12,aio:false,trend:[15,9,15,13,13,13,13,11,9,10,4,8,11,12,10,8,13,13,14,14,16,17,15,14,13,15,13,12,12,2,2,1,11,8,5,4,13,12,9,12],cat:"Endpoint Security"},
  {kw:"DFIR",url:"https://www.fortinet.com/resources/cyberglossary/dfir",sv:2900,kd:41,wk36:12,wk37:6,wk38:5,wk39:8,wk40:8,aio:false,trend:[9,11,14,16,25,17,18,2,2,3,3,3,2,4,14,5,4,5,9,13,10,13,5,5,7,6,6,14,11,11,13,10,14,12,11,12,6,5,8,8],cat:"Network Security"},
  {kw:"Application Performance Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/application-performance-monitoring",sv:6600,kd:54,wk36:5,wk37:24,wk38:18,wk39:18,wk40:26,aio:false,trend:[19,24,19,11,21,16,16,13,11,10,6,9,10,8,3,14,12,13,13,13,15,9,11,14,12,15,17,17,17,6,6,7,7,8,5,5,24,18,18,26],cat:"Network Security"},
  {kw:"Soc 1 Compliance",url:"https://www.fortinet.com/resources/cyberglossary/soc1-compliance",sv:590,kd:21,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Cyber Security"},
  {kw:"Security Audit",url:"https://www.fortinet.com/resources/cyberglossary/security-audit",sv:1300,kd:36,wk36:63,wk37:4,wk38:4,wk39:3,wk40:3,aio:true,trend:[2,2,12,12,12,11,9,5,3,3,5,3,8,6,5,4,3,4,3,5,4,6,5,6,5,6,9,7,7,40,46,53,60,60,60,63,4,4,3,3],cat:"Cyber Compliance"},
  {kw:"Web Application Security",url:"https://www.fortinet.com/resources/cyberglossary/web-application-security",sv:1900,kd:35,wk36:11,wk37:25,wk38:28,wk39:31,wk40:18,aio:false,trend:[14,19,35,18,16,16,16,12,9,3,5,8,4,6,2,7,8,10,21,14,20,8,10,5,5,5,26,27,26,6,2,6,5,9,7,11,25,28,31,18],cat:"SecOps"},
  {kw:"Server Virtualization",url:"https://www.fortinet.com/resources/cyberglossary/server-virtualization",sv:1600,kd:37,wk36:4,wk37:8,wk38:8,wk39:6,wk40:10,aio:false,trend:[6,4,7,2,4,10,6,4,7,5,5,1,2,2,4,8,8,9,10,9,8,10,5,8,12,17,15,14,6,2,5,3,7,2,8,4,8,8,6,10],cat:"Network Security"},
  {kw:"Vulnerability Assessment Tools",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-assessment-tools",sv:1300,kd:42,wk36:3,wk37:10,wk38:8,wk39:7,wk40:7,aio:false,trend:[12,13,12,16,18,14,9,3,9,12,7,8,11,10,9,9,12,13,12,12,12,9,13,8,10,8,10,12,11,4,7,7,7,10,8,3,10,8,7,7],cat:"Cyber Threats"},
  {kw:"Neural Networks",url:"https://www.fortinet.com/resources/cyberglossary/neural-network",sv:9900,kd:91,wk36:2,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,2,2,2,3,3,1,3,3,2,3,3,3,1,2,1,1,1,null,null,null,null,null,88,2,2,null,null,null,null],cat:"Data Security"},
  {kw:"Shor's Algorithm",url:"https://www.fortinet.com/resources/cyberglossary/shors-grovers-algorithms",sv:3600,kd:67,wk36:3,wk37:5,wk38:1,wk39:2,wk40:4,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,6,6,8,6,10,8,9,6,2,2,3,5,1,2,4],cat:"Cyber Security"},
  {kw:"Dark Web Vs Deep Web",url:"https://www.fortinet.com/resources/cyberglossary/dark-vs-deep-web",sv:1000,kd:33,wk36:5,wk37:18,wk38:12,wk39:7,wk40:8,aio:false,trend:[2,2,3,2,2,3,2,3,2,4,5,2,7,4,9,6,6,7,9,8,8,11,10,11,10,10,9,11,11,5,5,5,5,5,5,5,18,12,7,8],cat:"Cyber Threats"},
  {kw:"Signs Of Malware",url:"https://www.fortinet.com/resources/cyberglossary/signs-of-malware",sv:260,kd:41,wk36:1,wk37:5,wk38:1,wk39:1,wk40:6,aio:false,trend:[3,2,5,3,3,6,6,2,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,1,1,6],cat:"Cyber Threats"},
  {kw:"Vulnerability Management",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-management",sv:5400,kd:48,wk36:9,wk37:67,wk38:63,wk39:53,wk40:53,aio:false,trend:[93,93,48,48,48,57,57,57,57,45,44,40,40,45,33,20,19,20,22,22,24,28,24,30,32,37,44,51,47,41,49,53,9,9,9,9,67,63,53,53],cat:"Cyber Security"},
  {kw:"Vulnerability Disclosure",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-disclosure",sv:140,kd:28,wk36:7,wk37:5,wk38:5,wk39:1,wk40:2,aio:true,trend:[1,1,1,4,5,4,5,5,4,6,3,1,1,1,7,2,2,3,2,3,3,5,4,3,7,7,4,3,2,1,4,8,10,8,6,7,5,5,1,2],cat:"Cyber Security"},
  {kw:"Virtual Patching",url:"https://www.fortinet.com/resources/cyberglossary/virtual-patching",sv:260,kd:31,wk36:2,wk37:3,wk38:3,wk39:1,wk40:1,aio:true,trend:[5,7,7,7,8,8,8,2,2,2,5,8,6,1,7,2,2,11,8,9,4,1,4,6,2,4,5,3,3,3,3,3,5,6,5,2,3,3,1,1],cat:"OT Security"},
  {kw:"NERC CIP",url:"https://www.fortinet.com/resources/cyberglossary/nerc-cip",sv:5400,kd:27,wk36:3,wk37:6,wk38:6,wk39:6,wk40:5,aio:true,trend:[2,3,2,2,4,9,3,6,4,4,6,7,4,7,4,4,9,8,5,8,5,5,6,5,5,3,5,5,3,29,29,7,7,9,8,3,6,6,6,5],cat:"OT Security"},
  {kw:"Cyber Security Platform",url:"https://www.fortinet.com/resources/cyberglossary/cyber-security-platform",sv:1000,kd:57,wk36:2,wk37:2,wk38:2,wk39:2,wk40:1,aio:true,trend:[6,3,5,4,4,3,3,4,2,2,2,2,2,2,2,2,2,2,1,2,2,1,1,1,1,1,1,1,1,3,3,5,2,3,2,2,2,2,2,1],cat:"Cyber Security"},
  {kw:"Compensating Controls",url:"https://www.fortinet.com/resources/cyberglossary/compensating-controls",sv:720,kd:22,wk36:5,wk37:2,wk38:2,wk39:2,wk40:1,aio:true,trend:[2,3,2,3,4,5,4,3,1,3,2,2,2,3,4,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,4,5,4,5,2,2,2,1],cat:"OT Security"},
  {kw:"Darkside Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/darkside-ransomware",sv:260,kd:35,wk36:14,wk37:5,wk38:4,wk39:5,wk40:1,aio:false,trend:[7,5,5,5,3,4,4,4,5,3,4,3,3,3,2,2,2,4,4,5,4,4,4,4,4,4,5,5,5,16,18,18,17,16,15,14,5,4,5,1],cat:"Cyber Security"},
  {kw:"Rugged Hardware",url:"https://www.fortinet.com/resources/cyberglossary/rugged-hardware",sv:50,kd:24,wk36:6,wk37:9,wk38:9,wk39:6,wk40:5,aio:false,trend:[5,7,9,9,9,9,9,9,4,6,7,7,7,7,4,9,9,9,9,3,4,1,1,4,4,3,3,3,3,13,16,12,17,17,16,6,9,9,6,5],cat:"OT Security"},
  {kw:"Identity Based Attacks",url:"https://www.fortinet.com/resources/cyberglossary/identity-based-attacks",sv:110,kd:25,wk36:3,wk37:7,wk38:7,wk39:6,wk40:6,aio:false,trend:[11,12,11,11,11,7,7,10,10,10,10,12,11,11,5,5,5,5,5,4,4,6,7,7,9,10,9,9,9,5,5,5,5,5,5,3,7,7,6,6],cat:"Cyber Security"},
  {kw:"Enterprise VPN Solutions",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-vpn-solutions",sv:390,kd:50,wk36:8,wk37:4,wk38:3,wk39:3,wk40:2,aio:false,trend:[8,5,4,4,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,3,20,25,29,23,10,6,8,4,3,3,2],cat:"VPN"},
  {kw:"Waf Owasp Top 10",url:"https://www.fortinet.com/resources/cyberglossary/owasp-web-application-firewall",sv:110,kd:58,wk36:11,wk37:7,wk38:3,wk39:4,wk40:4,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,23,25,29,29,11,11,11,11,12,12,11,7,3,4,4],cat:"NGFW"},
  {kw:"Virtual Machine",url:"https://www.fortinet.com/resources/cyberglossary/virtual-machines",sv:40500,kd:69,wk36:55,wk37:30,wk38:9,wk39:9,wk40:9,aio:false,trend:[null,null,32,37,37,32,36,16,14,7,4,5,6,4,7,19,10,20,20,24,3,9,7,4,14,1,2,5,3,48,47,45,45,47,48,55,30,9,9,9],cat:"Cloud Security"},
  {kw:"Agent Vs Agentless Security",url:"https://www.fortinet.com/resources/cyberglossary/agent-vs-agentless-security",sv:90,kd:8,wk36:12,wk37:5,wk38:3,wk39:5,wk40:5,aio:true,trend:[null,null,null,3,3,4,4,6,6,6,6,1,1,1,1,5,1,1,2,4,3,4,4,3,3,3,4,3,3,9,10,11,11,11,12,12,5,3,5,5],cat:"Cloud Security"},
  {kw:"Behavioral Analytics",url:"https://www.fortinet.com/resources/cyberglossary/behavioral-analytics",sv:1000,kd:41,wk36:14,wk37:14,wk38:14,wk39:13,wk40:13,aio:false,trend:[null,null,null,7,7,10,8,5,5,5,5,6,7,9,12,15,15,17,12,9,11,15,16,16,13,17,18,19,18,13,12,13,10,11,13,14,14,14,13,13],cat:"Data Security"},
  {kw:"CI/CD",url:"https://www.fortinet.com/resources/cyberglossary/ci-cd",sv:9900,kd:63,wk36:7,wk37:13,wk38:9,wk39:6,wk40:4,aio:false,trend:[null,null,null,11,15,24,16,8,5,4,5,4,8,4,4,6,10,17,11,9,8,9,12,13,9,9,18,15,13,13,13,11,14,13,12,7,13,9,6,4],cat:"Cyber Security"},
  {kw:"CSPM Vs DSPM",url:"https://www.fortinet.com/resources/cyberglossary/cspm-vs-dspm",sv:320,kd:14,wk36:5,wk37:5,wk38:5,wk39:6,wk40:4,aio:false,trend:[null,null,null,15,14,14,10,13,5,3,8,6,9,5,4,3,13,5,3,4,2,6,4,4,8,1,2,10,10,4,5,5,5,5,4,5,5,5,6,4],cat:"Data Security"},
  {kw:"CTEM",url:"https://www.fortinet.com/resources/cyberglossary/ctem",sv:1600,kd:29,wk36:18,wk37:17,wk38:7,wk39:7,wk40:6,aio:true,trend:[null,null,null,5,4,9,5,6,6,11,16,6,5,11,9,10,8,13,15,19,16,14,19,17,23,21,22,26,24,35,33,31,20,18,21,18,17,7,7,6],cat:"Data Security"},
  {kw:"Data Discovery",url:"https://www.fortinet.com/resources/cyberglossary/data-discovery",sv:1900,kd:30,wk36:51,wk37:23,wk38:30,wk39:21,wk40:51,aio:false,trend:[null,null,null,53,54,51,52,54,67,45,59,52,54,53,54,53,87,81,76,78,78,57,58,58,58,58,48,48,48,79,2,2,72,2,78,51,23,30,21,51],cat:"Data Security"},
  {kw:"Data Matching",url:"https://www.fortinet.com/resources/cyberglossary/data-matching",sv:1300,kd:15,wk36:3,wk37:10,wk38:11,wk39:10,wk40:9,aio:false,trend:[null,null,null,11,11,12,9,9,11,10,6,8,9,5,6,11,8,8,7,7,7,7,8,7,9,10,9,8,8,3,4,4,4,2,4,3,10,11,10,9],cat:"Data Security"},
  {kw:"Data Protection",url:"https://www.fortinet.com/resources/cyberglossary/data-protection",sv:6600,kd:50,wk36:2,wk37:14,wk38:14,wk39:14,wk40:15,aio:false,trend:[null,null,null,1,1,1,1,1,1,1,1,2,4,4,4,8,9,20,19,15,9,12,12,12,13,14,11,11,10,10,12,3,3,3,2,2,14,14,14,15],cat:"Data Security"},
  {kw:"DCAP",url:"https://www.fortinet.com/resources/cyberglossary/dcap",sv:3600,kd:41,wk36:2,wk37:22,wk38:8,wk39:8,wk40:7,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,2,2,2,2,2,5,6,6,8,8,4,4,8,7,7,3,null,null,null,null,null,20,20,2,2,22,8,8,7],cat:"Data Security"},
  {kw:"Device Control",url:"https://www.fortinet.com/resources/cyberglossary/device-control",sv:720,kd:30,wk36:45,wk37:5,wk38:5,wk39:5,wk40:4,aio:false,trend:[null,null,null,2,6,6,4,5,6,3,3,4,2,3,1,1,2,4,4,4,4,4,3,4,5,5,4,5,5,42,38,44,43,44,43,45,5,5,5,4],cat:"Data Security"},
  {kw:"Digital Operational Resilience Act",url:"https://www.fortinet.com/resources/cyberglossary/digital-operational-resilience-act-dora",sv:140,kd:51,wk36:16,wk37:17,wk38:19,wk39:18,wk40:33,aio:false,trend:[null,null,null,null,null,17,21,8,20,23,19,18,20,19,16,16,16,16,27,15,16,19,18,21,19,36,30,43,31,14,17,16,15,17,21,16,17,19,18,33],cat:"Cyber Compliance"},
  {kw:"DLP Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/dlp-monitoring",sv:110,kd:27,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,null,2,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"DLP Policy",url:"https://www.fortinet.com/resources/cyberglossary/dlp-policy",sv:720,kd:21,wk36:9,wk37:3,wk38:2,wk39:2,wk40:2,aio:false,trend:[null,null,null,7,7,7,7,8,8,7,6,8,2,6,8,6,2,6,5,5,6,5,5,3,5,4,3,2,2,16,14,16,12,7,9,9,3,2,2,2],cat:"Data Security"},
  {kw:"DLP As A Service",url:"https://www.fortinet.com/resources/cyberglossary/dlpaas-and-dlp-as-a-managed-service",sv:50,kd:39,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"File Sharing Security",url:"https://www.fortinet.com/resources/cyberglossary/file-sharing-security",sv:40,kd:25,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[null,null,null,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],cat:"Data Security"},
  {kw:"GDPR",url:"https://www.fortinet.com/resources/cyberglossary/gdpr",sv:49500,kd:100,wk36:1,wk37:44,wk38:44,wk39:42,wk40:43,aio:false,trend:[null,null,null,1,1,13,13,13,13,48,39,39,39,39,39,57,79,79,79,78,1,1,42,42,40,41,40,42,41,71,68,44,2,2,48,1,44,44,42,43],cat:"Cyber Compliance"},
  {kw:"Hipaa Compliance",url:"https://www.fortinet.com/resources/cyberglossary/hipaa-compliance",sv:22200,kd:76,wk36:13,wk37:17,wk38:17,wk39:16,wk40:11,aio:false,trend:[null,null,null,14,16,18,17,17,5,2,13,14,9,10,10,16,12,15,21,19,18,17,18,18,22,20,19,19,17,16,15,14,14,15,16,13,17,17,16,11],cat:"Cyber Compliance"},
  {kw:"Identity Risk",url:"https://www.fortinet.com/resources/cyberglossary/identity-risk-prioritization",sv:170,kd:16,wk36:16,wk37:22,wk38:15,wk39:13,wk40:13,aio:false,trend:[null,null,null,5,3,6,4,5,5,4,3,3,3,1,1,1,1,1,1,2,7,5,5,9,9,8,11,14,10,12,13,19,9,10,16,16,22,15,13,13],cat:"Access Control"},
  {kw:"Living Off The Land Attack",url:"https://www.fortinet.com/resources/cyberglossary/living-off-the-land-lotl",sv:320,kd:37,wk36:27,wk37:4,wk38:4,wk39:4,wk40:4,aio:false,trend:[null,null,null,4,8,8,8,8,2,4,4,4,2,3,7,3,3,2,2,2,2,2,2,2,3,4,2,4,3,25,29,28,27,24,28,27,4,4,4,4],cat:"Cyber Threats"},
  {kw:"National Vulnerability Database",url:"https://www.fortinet.com/resources/cyberglossary/national-vulnerability-database-nvd",sv:590,kd:25,wk36:5,wk37:5,wk38:5,wk39:5,wk40:6,aio:false,trend:[null,null,null,3,4,4,4,4,7,3,4,4,4,4,6,8,8,4,5,5,5,5,5,3,4,5,3,6,5,5,5,5,5,5,5,5,5,5,5,6],cat:"Cyber Security"},
  {kw:"Network DLP",url:"https://www.fortinet.com/resources/cyberglossary/network-dlp",sv:320,kd:23,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"Private 5G Warehousing",url:"https://www.fortinet.com/resources/cyberglossary/private-5g-warehousing",sv:0,kd:6,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,3,3,3,2,2,1,3,2,1,1,2,3,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"OT Security"},
  {kw:"SAAS Security",url:"https://www.fortinet.com/resources/cyberglossary/saas-security",sv:1600,kd:40,wk36:3,wk37:11,wk38:9,wk39:9,wk40:8,aio:false,trend:[null,null,null,22,18,30,17,14,13,10,9,11,10,10,9,10,11,14,11,10,10,10,10,10,11,11,10,10,9,10,11,10,3,4,3,3,11,9,9,8],cat:"Cloud Security"},
  {kw:"Secret Management",url:"https://www.fortinet.com/resources/cyberglossary/secret-management",sv:590,kd:39,wk36:23,wk37:24,wk38:24,wk39:27,wk40:9,aio:false,trend:[null,null,null,42,42,42,8,16,16,16,16,28,28,23,20,25,23,17,17,17,17,17,21,21,24,27,24,14,11,18,27,27,25,27,25,23,24,24,27,9],cat:"Data Security"},
  {kw:"Security Misconfiguration",url:"https://www.fortinet.com/resources/cyberglossary/security-misconfiguration",sv:720,kd:30,wk36:7,wk37:6,wk38:6,wk39:6,wk40:6,aio:false,trend:[null,null,null,5,4,2,2,3,6,3,2,2,3,6,8,5,4,4,5,5,6,5,8,9,10,9,10,9,8,4,8,10,9,8,7,7,6,6,6,6],cat:"Cyber Threats"},
  {kw:"Software Defined Perimeter",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-software-defined-perimeter",sv:590,kd:27,wk36:7,wk37:7,wk38:5,wk39:8,wk40:3,aio:true,trend:[null,null,null,7,7,6,6,2,3,4,2,5,4,3,3,3,3,3,4,6,5,5,4,4,3,2,6,6,5,5,5,5,6,6,5,7,7,5,8,3],cat:"Access Control"},
  {kw:"Threat Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/threat-detection-and-response",sv:1300,kd:31,wk36:12,wk37:12,wk38:12,wk39:14,wk40:17,aio:false,trend:[null,null,null,3,7,6,6,3,7,6,5,3,6,7,7,8,9,8,9,9,6,8,9,9,9,10,10,10,10,9,10,10,12,13,12,12,12,12,14,17],cat:"SecOps"},
  {kw:"Remote Code Execution",url:"https://www.fortinet.com/resources/cyberglossary/remote-code-execution",sv:4400,kd:84,wk36:4,wk37:6,wk38:3,wk39:6,wk40:6,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,6,6,6,6,6,11,8,7,7,7,7,8,8,22,8,7,11,11,7,7,3,3,2,5,4,6,3,6,6],cat:"Cyber Threats"},
  {kw:"Data Poisoning",url:"https://www.fortinet.com/resources/cyberglossary/data-poisoning",sv:590,kd:39,wk36:26,wk37:26,wk38:26,wk39:26,wk40:27,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,5,5,4,6,5,5,5,10,19,18,14,18,30,31,29,23,28,28,24,27,27,27,30,24,26,26,26,26,27],cat:"Cyber Threats"},
  {kw:"Data Privacy",url:"https://www.fortinet.com/resources/cyberglossary/data-privacy",sv:6600,kd:88,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],cat:"Data Security"},
  {kw:"Cloud Migration",url:"https://www.fortinet.com/resources/cyberglossary/cloud-migration",sv:480,kd:40,wk36:81,wk37:null,wk38:74,wk39:84,wk40:84,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,69,68,81,null,74,84,84],cat:"Cloud Security"},
  {kw:"Cloud Workload Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-workload-security",sv:480,kd:23,wk36:9,wk37:10,wk38:10,wk39:8,wk40:10,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,7,7,8,6,10,14,12,18,10,5,7,8,8,8,8,9,9,10,10,9,10,10,8,10],cat:"Cloud Security"},
  {kw:"Rise Of Cybersecurity Mesh",url:"https://www.fortinet.com/resources/cyberglossary/rise-of-cybersecurity-mesh",sv:170,kd:27,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,27,29,29,24,20,19,56,56,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"Data Security"},
  {kw:"SAML",url:"https://www.fortinet.com/resources/cyberglossary/saml",sv:18100,kd:66,wk36:14,wk37:16,wk38:17,wk39:17,wk40:14,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9,15,14,14,13,16,15,16,16,15,16,21,17,17,17,17,21,21,21,14,16,17,17,14],cat:"Access Control"},
  {kw:"NGFW Vs UTM",url:"https://www.fortinet.com/resources/cyberglossary/ngfw-vs-utm",sv:170,kd:7,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],cat:"NGFW"},
  {kw:"Cybersecurity Trends",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-trends-2026",sv:1300,kd:58,wk36:1,wk37:1,wk38:1,wk39:2,wk40:2,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,2,2,3,5,2,2,2,1,1,1,1,2,2],cat:"Cyber Security"},
  {kw:"Cybersecurity Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-best-practices",sv:40500,kd:67,wk36:6,wk37:6,wk38:6,wk39:8,wk40:9,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,4,18,7,10,12,4,6,6,6,8,9],cat:"Cyber Security"},
  {kw:"Mlsecops",url:"https://www.fortinet.com/resources/cyberglossary/what-is-mlsecops",sv:100,kd:9,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],cat:"SecOps"},
  {kw:"Quantum Cryptanalysis",url:"https://www.fortinet.com/resources/cyberglossary/quantum-cryptanalysis",sv:20,kd:30,wk36:4,wk37:1,wk38:1,wk39:4,wk40:7,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,3,3,4,4,4,4,4,1,1,4,7],cat:"Quantum Security"},
  {kw:"Cybersecurity Risks",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-risk",sv:590,kd:54,wk36:16,wk37:19,wk38:6,wk39:8,wk40:5,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,18,18,16,19,6,8,5],cat:"Cyber Security"},
  {kw:"Quantum Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/quantum-cryptography",sv:18100,kd:70,wk36:28,wk37:9,wk38:5,wk39:11,wk40:13,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,65,42,null,null,13,4,28,9,5,11,13],cat:"Quantum Security"},
  {kw:"Red Teaming",url:"https://www.fortinet.com/resources/cyberglossary/red-teaming",sv:6600,kd:60,wk36:16,wk37:16,wk38:17,wk39:12,wk40:10,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,19,17,24,16,16,17,12,10],cat:"SecOps"},
  {kw:"Prompt Injection Attack",url:"https://www.fortinet.com/resources/cyberglossary/prompt-injection",sv:1000,kd:75,wk36:18,wk37:17,wk38:17,wk39:25,wk40:3,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,17,24,15,18,17,17,25,3],cat:"Data Security"},
  {kw:"AI Risk Management",url:"https://www.fortinet.com/resources/cyberglossary/ai-risk-management",sv:2800,kd:59,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],cat:"Cyber Threats"},
  {kw:"SASE Firewall",url:"https://www.fortinet.com/resources/cyberglossary/sase",sv:40,kd:65,wk36:1,wk37:2,wk38:2,wk39:1,wk40:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,15,1,1,2,2,1,1],cat:"SASE"},
  {kw:"Agentic AI",url:"https://www.fortinet.com/resources/cyberglossary/agentic-ai-security",sv:94000,kd:68,wk36:null,wk37:null,wk38:null,wk39:null,wk40:4,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,4],cat:"AI Security"},
  {kw:"Generative AI Security",url:"https://www.fortinet.com/resources/cyberglossary/generative-ai-security",sv:600,kd:16,wk36:null,wk37:null,wk38:null,wk39:null,wk40:36,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36],cat:"AI Security"},
]
const ART_KW_DATA:OKKw[]=[
  {kw:"Kinsing And Dark Iot Botnet",url:"https://www.fortinet.com/resources/articles/kinsing-dark-iot-botnet",sv:0,kd:18,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Sysrv - Hello",url:"https://www.fortinet.com/resources/articles/sysrv-hello",sv:0,kd:6,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cloud Security Solutions",url:"https://www.fortinet.com/resources/articles/top-cloud-security-solutions",sv:5400,kd:53,wk36:12,wk37:13,wk38:13,wk39:13,wk40:25,aio:false,trend:[22,83,55,23,32,38,38,27,23,41,17,16,13,1,10,13,8,18,15,12,12,7,10,6,4,4,5,13,10,8,9,8,7,10,17,12,13,13,13,25]},
  {kw:"Carbine Cryptojacking CampAIgn",url:"https://www.fortinet.com/resources/articles/carbine-loader-cryptojacking",sv:10,kd:16,wk36:8,wk37:1,wk38:2,wk39:2,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,7,10,7,8,1,2,2,1]},
  {kw:"Androxgh0St – The Python Malware Exploiting Your Aws Keys",url:"https://www.fortinet.com/resources/articles/androxgh0st-the-python-malware-exploiting-your-aws-keys",sv:0,kd:4,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cybersecurity Incident Management",url:"https://www.fortinet.com/resources/articles/cybersecurity-incident-management",sv:20,kd:44,wk36:1,wk37:2,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1]},
  {kw:"Dlp Security Checklist",url:"https://www.fortinet.com/resources/articles/dlp-security-checklist",sv:0,kd:16,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"New Data Breach Rules For Nonbanking Financial Institutions",url:"https://www.fortinet.com/resources/articles/new-data-breach-rules-for-nonbanking-financial-institutions",sv:0,kd:7,wk36:2,wk37:1,wk38:2,wk39:2,wk40:2,aio:false,trend:[null,null,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,1,2,2,2]},
  {kw:"Penalties For Hipaa Violations And Noncompliance",url:"https://www.fortinet.com/resources/articles/penalties-for-hipaa-violations-and-noncompliance",sv:0,kd:56,wk36:3,wk37:4,wk38:4,wk39:20,wk40:4,aio:false,trend:[null,null,4,5,5,4,4,4,4,5,4,5,5,5,4,5,4,4,4,4,4,4,4,4,4,4,3,1,3,3,3,3,3,3,4,3,4,4,20,4]},
  {kw:"Changes To Iso 27001 2022",url:"https://www.fortinet.com/resources/articles/changes-to-iso-27001-2022",sv:0,kd:34,wk36:3,wk37:3,wk38:5,wk39:4,wk40:40,aio:false,trend:[null,null,1,1,6,1,1,6,1,1,1,6,1,9,1,5,9,7,1,6,1,1,8,7,5,5,5,1,1,6,6,6,8,7,7,3,3,5,4,40]},
  {kw:"How To Conduct A Hipaa Compliance Audit",url:"https://www.fortinet.com/resources/articles/how-to-conduct-a-hipaa-compliance-audit",sv:0,kd:25,wk36:3,wk37:2,wk38:2,wk39:6,wk40:2,aio:false,trend:[null,null,3,3,3,3,3,3,2,2,2,3,3,2,2,3,3,2,2,2,1,1,3,1,2,2,2,1,2,2,2,2,2,3,3,3,2,2,6,2]},
  {kw:"How To Implement A Dlp Strategy",url:"https://www.fortinet.com/resources/articles/how-to-implement-a-dlp-strategy",sv:0,kd:26,wk36:2,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[null,null,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2]},
  {kw:"Addressing Bias Insider Risk Monitoring",url:"https://www.fortinet.com/resources/articles/addressing-bias-insider-risk-monitoring",sv:0,kd:16,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,1,2,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Dlp Software Solution Considerations",url:"https://www.fortinet.com/resources/articles/dlp-software-solution-considerations",sv:0,kd:22,wk36:1,wk37:1,wk38:1,wk39:1,wk40:2,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2]},
  {kw:"Hipaa Compliance Checklist",url:"https://www.fortinet.com/resources/articles/hipaa-compliance-checklist",sv:1300,kd:28,wk36:3,wk37:2,wk38:2,wk39:2,wk40:2,aio:true,trend:[null,null,6,5,4,1,1,1,1,2,1,2,3,2,2,1,1,2,2,2,2,2,2,2,2,2,4,1,2,2,2,2,3,3,3,3,2,2,2,2]},
  {kw:"Hipaa Compliant Telehealth Platforms",url:"https://www.fortinet.com/resources/articles/hipaa-compliant-telehealth-platforms",sv:720,kd:36,wk36:2,wk37:2,wk38:1,wk39:2,wk40:2,aio:true,trend:[null,null,1,1,1,1,1,2,1,2,2,2,3,2,2,2,1,2,2,1,2,2,2,1,2,2,1,2,1,1,2,1,2,2,2,2,2,1,2,2]},
  {kw:"Hipaa Compliant Video Conferencing",url:"https://www.fortinet.com/resources/articles/hipaa-compliant-video-conferencing-platforms",sv:590,kd:36,wk36:2,wk37:1,wk38:1,wk39:1,wk40:2,aio:true,trend:[null,null,2,3,3,2,2,2,1,1,2,1,1,2,2,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,2]},
  {kw:"Aws Hipaa Compliance",url:"https://www.fortinet.com/resources/articles/is-aws-hipaa-compliant",sv:480,kd:40,wk36:1,wk37:10,wk38:9,wk39:10,wk40:9,aio:false,trend:[null,null,15,14,9,10,10,9,8,7,9,8,9,6,6,6,7,7,5,7,9,10,10,9,9,9,8,6,8,9,10,9,2,2,2,1,10,9,10,9]},
  {kw:"Is Dropbox Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-dropbox-hipaa-compliant",sv:590,kd:20,wk36:10,wk37:8,wk38:7,wk39:8,wk40:6,aio:false,trend:[null,null,9,6,8,9,8,6,1,4,4,6,6,9,9,8,7,7,7,7,8,8,8,8,9,8,8,8,7,8,7,7,9,9,8,10,8,7,8,6]},
  {kw:"Is Google Drive Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-google-drive-hipaa-compliant",sv:590,kd:30,wk36:8,wk37:2,wk38:1,wk39:2,wk40:2,aio:true,trend:[null,null,8,8,2,1,1,6,7,1,1,9,3,2,6,1,2,1,3,3,5,4,2,6,7,7,7,1,5,8,6,2,8,8,8,8,2,1,2,2]},
  {kw:"Is Whatsapp Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-whatsapp-hipaa-compliant",sv:480,kd:11,wk36:3,wk37:3,wk38:5,wk39:4,wk40:6,aio:true,trend:[null,null,1,1,4,6,3,4,5,5,3,1,5,4,4,2,2,5,4,5,5,4,3,3,4,4,4,2,4,3,5,4,2,2,4,3,3,5,4,6]},
  {kw:"Key Benefits Of Effective Endpoint Dlp",url:"https://www.fortinet.com/resources/articles/key-benefits-of-effective-endpoint-dlp",sv:0,kd:22,wk36:3,wk37:1,wk38:1,wk39:2,wk40:1,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,3,4,3,1,1,2,1]},
  {kw:"Strategies To Defend AgAInst Insider Threats",url:"https://www.fortinet.com/resources/articles/strategies-to-defend-against-insider-threats",sv:0,kd:23,wk36:3,wk37:3,wk38:3,wk39:2,wk40:2,aio:false,trend:[null,null,2,2,2,2,2,2,2,1,1,2,1,2,1,1,2,2,2,1,1,1,2,2,1,2,2,5,2,2,2,2,4,3,3,3,3,3,2,2]},
  {kw:"Credential Compromise Attacks",url:"https://www.fortinet.com/resources/articles/credential-compromise-attacks",sv:0,kd:37,wk36:2,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[null,null,1,1,1,2,2,1,3,2,2,3,2,1,2,2,1,2,2,2,2,2,2,2,4,2,2,3,2,3,2,2,2,2,2,2,2,2,2,2]},
  {kw:"How Do I Achieve Cyber Security Compliance",url:"https://www.fortinet.com/resources/articles/how-do-i-achieve-cyber-security-compliance",sv:0,kd:27,wk36:1,wk37:2,wk38:2,wk39:2,wk40:2,aio:false,trend:[null,null,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,2,2,2]},
  {kw:"Is Microsoft Teams Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-microsoft-teams-hipaa-compliant",sv:480,kd:15,wk36:5,wk37:7,wk38:7,wk39:3,wk40:7,aio:false,trend:[null,null,7,8,5,7,7,1,1,1,1,1,1,5,4,1,2,1,1,2,3,9,7,8,8,8,8,1,7,9,9,7,5,5,6,5,7,7,3,7]},
  {kw:"Common Hipaa Violations",url:"https://www.fortinet.com/resources/articles/common-hipaa-violations",sv:170,kd:22,wk36:3,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,10,9,5,8,7,1,1,3,1,6,1,2,1,2,3,1,1,1,1,1,1,2,4,1,2,2,2,3,2,2,3,3,3,3,1,1,1,1]},
  {kw:"Cloud Identity Attacks Are GAIning Traction",url:"https://www.fortinet.com/resources/articles/cloud-identity-attacks-are-gaining-traction",sv:0,kd:22,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Is GmAIl Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-gmail-hipaa-compliant",sv:720,kd:19,wk36:4,wk37:4,wk38:5,wk39:6,wk40:4,aio:false,trend:[null,null,6,5,3,5,1,6,5,5,4,6,1,2,4,2,2,2,2,3,4,5,2,3,5,4,4,2,3,4,6,5,4,3,4,4,4,5,6,4]},
  {kw:"Is Google Voice Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-google-voice-hipaa-compliant",sv:590,kd:14,wk36:6,wk37:6,wk38:7,wk39:8,wk40:7,aio:false,trend:[null,null,1,6,7,5,5,8,1,6,4,3,2,4,6,4,4,5,5,5,8,6,6,5,7,6,7,4,7,7,7,7,7,8,7,6,6,7,8,7]},
  {kw:"Is Slack Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-slack-hipaa-compliant",sv:320,kd:23,wk36:6,wk37:7,wk38:3,wk39:2,wk40:2,aio:true,trend:[null,null,10,8,13,7,11,11,12,2,2,5,4,3,5,5,5,6,5,5,2,5,4,5,4,3,2,5,4,3,6,3,6,6,8,6,7,3,2,2]},
  {kw:"Groundhog Botnet",url:"https://www.fortinet.com/resources/articles/groundhog-botnet",sv:0,kd:14,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"XZ Utils Vulnerability",url:"https://www.fortinet.com/resources/articles/xz-utils-vulnerability",sv:50,kd:47,wk36:1,wk37:12,wk38:12,wk39:16,wk40:14,aio:false,trend:[null,null,20,15,14,14,14,14,null,7,11,11,11,11,9,14,10,11,16,12,12,12,13,13,13,13,13,14,10,11,14,11,3,3,1,1,12,12,16,14]},
  {kw:"Detecting AI Resource Hijacking With Composite Alerts",url:"https://www.fortinet.com/resources/articles/detecting-ai-resource-hijacking-with-composite-alerts",sv:0,kd:7,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,1,1,1,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Is Docusign Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-docusign-hipaa-compliant",sv:480,kd:35,wk36:4,wk37:1,wk38:2,wk39:3,wk40:1,aio:true,trend:[null,null,4,3,1,4,3,1,1,1,1,1,1,3,1,1,1,1,1,2,4,4,3,5,5,5,6,1,5,4,1,1,5,3,6,4,1,2,3,1]},
  {kw:"Is Efax Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-efax-hipaa-compliant",sv:140,kd:25,wk36:7,wk37:4,wk38:4,wk39:6,wk40:6,aio:false,trend:[null,null,4,7,4,5,4,3,3,3,1,1,1,1,1,3,2,2,2,5,4,3,3,5,6,5,5,3,1,1,5,3,7,9,7,7,4,4,6,6]},
  {kw:"Is Facetime Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-facetime-hipaa-compliant",sv:320,kd:11,wk36:7,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,1,3,1,1,2,2,1,1,1,1,1,2,2,1,1,1,1,1,4,3,1,3,2,2,3,1,3,1,1,1,7,7,8,7,1,1,1,1]},
  {kw:"How To Become Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/how-to-become-hipaa-compliant",sv:320,kd:43,wk36:2,wk37:1,wk38:1,wk39:1,wk40:1,aio:true,trend:[null,null,1,3,3,4,1,1,1,1,1,1,4,6,5,4,5,5,4,3,4,1,1,1,2,1,1,4,1,1,1,1,3,3,2,2,1,1,1,1]},
  {kw:"Implementing cnapp",url:"https://www.fortinet.com/resources/articles/how-to-implement-cnapp",sv:0,kd:9,wk36:1,wk37:14,wk38:12,wk39:12,wk40:3,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,2,2,2,1,2,2,2,3,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,14,12,12,3]},
  {kw:"defense against zero day attackshow to prevent bot attacks",url:"https://www.fortinet.com/resources/articles/defending-against-zero-day-and-bot-attacks",sv:0,kd:16,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"How FortiWeb WAF Transformed E-Commerce Security and Performance",url:"https://www.fortinet.com/resources/articles/fortiweb-waf-transformed-ecommerce-security",sv:0,kd:0,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SecOps use cases to reduce MTTR",url:"https://www.fortinet.com/resources/articles/reduce-mttr-secops-use-cases",sv:0,kd:10,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Crypto-Agility For Quantum Readiness",url:"https://www.fortinet.com/resources/articles/crypto-agility-quantum-readiness",sv:0,kd:16,wk36:1,wk37:5,wk38:6,wk39:5,wk40:6,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,6,5,6]},
  {kw:"Automated ransomware response playbook",url:"https://www.fortinet.com/resources/articles/automated-ransomware-response",sv:0,kd:11,wk36:1,wk37:1,wk38:1,wk39:5,wk40:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,5,1]},
  {kw:"post-quantum cryptography plan",url:"https://www.fortinet.com/resources/articles/post-quantum-cryptography-preparation",sv:0,kd:48,wk36:1,wk37:12,wk38:8,wk39:6,wk40:7,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,2,2,3,3,2,1,1,2,3,2,3,3,2,2,3,1,3,1,3,3,1,1,2,1,12,8,6,7]},
  {kw:"Redis Rush",url:"https://www.fortinet.com/resources/articles/redis-rush",sv:0,kd:0,wk36:5,wk37:2,wk38:2,wk39:1,wk40:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,5,5,5,2,2,1,2]},
  {kw:"Keksec &Tsunami-Ryuk",url:"https://www.fortinet.com/resources/articles/keksec-tsunami-ryuk",sv:0,kd:3,wk36:1,wk37:1,wk38:1,wk39:2,wk40:1,aio:false,trend:[1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1]},
  {kw:"Watchdog Smuggles Malware",url:"https://www.fortinet.com/resources/articles/watchdog-smuggles-malware",sv:0,kd:3,wk36:1,wk37:1,wk38:1,wk39:1,wk40:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cloud Security Providers",url:"https://www.fortinet.com/resources/articles/best-cloud-security-providers",sv:590,kd:30,wk36:11,wk37:10,wk38:7,wk39:6,wk40:1,aio:false,trend:[4,6,7,8,9,8,9,6,7,2,2,8,10,9,8,8,9,8,10,7,8,4,4,2,3,3,3,8,8,8,4,8,11,11,12,11,10,7,6,1]},
  {kw:"Is Google Meet Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-google-meet-hipaa-compliant",sv:880,kd:1,wk36:2,wk37:3,wk38:2,wk39:2,wk40:3,aio:true,trend:[null,null,1,1,2,4,2,2,1,1,1,2,2,2,3,1,1,2,2,1,1,1,3,2,2,2,3,1,3,4,3,4,2,2,2,2,3,2,2,3]},
  {kw:"Steps To Building Effective Insider Risk Management Program",url:"https://www.fortinet.com/resources/articles/steps-to-building-effective-insider-risk-management-program",sv:0,kd:20,wk36:15,wk37:30,wk38:38,wk39:62,wk40:30,aio:false,trend:[null,null,1,1,1,2,1,1,3,1,1,2,4,1,2,17,5,4,23,23,23,21,19,null,null,17,20,5,19,21,25,30,28,5,18,15,30,38,62,30]},
  {kw:"Hipaa Compliant Cloud Storage Providers",url:"https://www.fortinet.com/resources/articles/hipaa-compliant-cloud-storage-providers",sv:10,kd:44,wk36:5,wk37:7,wk38:9,wk39:8,wk40:8,aio:false,trend:[null,null,2,2,2,1,5,1,1,1,1,6,4,5,3,3,3,3,4,4,4,4,6,null,null,8,8,3,8,6,6,5,6,4,5,5,7,9,8,8]},
  {kw:"Is Zoom Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-zoom-hipaa-compliant",sv:1300,kd:21,wk36:5,wk37:6,wk38:6,wk39:6,wk40:6,aio:false,trend:[null,null,1,3,4,1,3,7,1,3,3,6,5,7,4,2,4,3,2,3,6,4,3,3,3,4,3,2,6,5,5,6,5,5,6,5,6,6,6,6]},
  {kw:"It Security And Segregation Of Duties",url:"https://www.fortinet.com/resources/cyberglossary/aaa-security",sv:0,kd:24,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"Is Google Docs Hipaa Compliant",url:"https://www.fortinet.com/resources/articles/is-google-docs-hipaa-compliant",sv:210,kd:4,wk36:7,wk37:6,wk38:6,wk39:6,wk40:1,aio:false,trend:[null,null,6,6,4,6,1,1,1,1,1,1,1,1,1,1,1,7,5,6,7,4,4,null,4,4,4,1,4,6,6,8,5,5,6,7,6,6,6,1]},
  {kw:"Hipaa Compliance And Privacy For Employers",url:"https://www.fortinet.com/resources/articles/hipaa-compliance-and-privacy-for-employers",sv:0,kd:9,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,4,4,3,4,4,4,3,5,4,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"Taking Teamtnt Docker Images Offline",url:"https://www.fortinet.com/resources/articles/navigating-the-paradox-of-insiders",sv:0,kd:20,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"what is q-day",url:"https://www.fortinet.com/resources/articles/what-is-q-day",sv:40,kd:27,wk36:3,wk37:5,wk38:1,wk39:2,wk40:7,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,7,1,2,3,4,7,6,2,4,3,2,3,3,3,3,3,1,3,3,1,3,3,3,8,3,5,1,2,7]},
  {kw:"sase implementation",url:"https://www.fortinet.com/resources/articles/sase-for-hybrid-workforces",sv:320,kd:49,wk36:null,wk37:null,wk38:37,wk39:19,wk40:8,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,37,19,8]},
  {kw:"SASE Vendors",url:"https://www.fortinet.com/resources/articles/steps-to-evaluate-sase-vendors",sv:880,kd:23,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"SASE Solutions",url:"https://www.fortinet.com/resources/articles/how-sase-secures-remote-branch-users",sv:1900,kd:66,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,65,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"SASE vpn",url:"https://www.fortinet.com/resources/articles/sase-replaces-vpns",sv:390,kd:55,wk36:8,wk37:2,wk38:2,wk39:2,wk40:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,8,9,6,18,18,3,3,3,23,1,8,4,7,4,4,8,4,4,4,4,7,3,7,5,8,2,2,2,1]},
  {kw:"securing aws workloads /aws protection",url:"https://www.fortinet.com/resources/articles/protect-aws-workloads",sv:10,kd:16,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,3,3,4,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"secops automation",url:"https://www.fortinet.com/resources/articles/deploying-secops-automation",sv:110,kd:10,wk36:null,wk37:30,wk38:16,wk39:16,wk40:38,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,9,22,25,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,30,16,16,38]},
  {kw:"quantum day",url:"https://www.fortinet.com/resources/articles/what-is-q-day",sv:480,kd:34,wk36:null,wk37:17,wk38:18,wk39:18,wk40:18,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,17,18,18,18]},
  {kw:"Securing containers and kubernetes",url:"https://www.fortinet.com/resources/articles/secure-containers-kubernetes-multi-cloud",sv:0,kd:27,wk36:null,wk37:28,wk38:26,wk39:39,wk40:44,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,81,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,28,26,39,44]},
  {kw:"Automating security operations",url:"https://www.fortinet.com/resources/articles/automate-security-operations-with-soar",sv:0,kd:11,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"quantum risk assessment",url:"https://www.fortinet.com/resources/articles/quantum-risk-assessment",sv:20,kd:22,wk36:1,wk37:2,wk38:2,wk39:1,wk40:20,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,1,1,1,4,13,1,1,1,1,1,4,4,null,2,1,1,1,1,1,4,4,3,3,3,1,2,2,1,20]},
  {kw:"Docker Images",url:"https://www.fortinet.com/resources/articles/teamtnt-docker-images",sv:4400,kd:66,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"Grafana",url:"https://www.fortinet.com/resources/articles/aws-credential-compromises-tied-to-grafana-ssrf-attacks",sv:33100,kd:97,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"S3 Targeting",url:"https://www.fortinet.com/resources/articles/trends-in-s3-targeting",sv:0,kd:13,wk36:2,wk37:1,wk38:1,wk39:1,wk40:20,aio:false,trend:[1,1,1,1,1,1,1,1,2,1,1,2,2,1,1,1,1,1,1,1,2,2,1,1,2,2,2,2,1,2,1,2,2,1,2,2,1,1,1,20]},
  {kw:"Find Big Cyber Threats With Small Signals",url:"https://www.fortinet.com/resources/articles/big-threats-small-signals",sv:0,kd:54,wk36:null,wk37:null,wk38:null,wk39:null,wk40:null,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"leading ai security companies",url:"https://www.fortinet.com/resources/articles/leading-ai-security-companies",sv:0,kd:22,wk36:7,wk37:7,wk38:7,wk39:1,wk40:8,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,4,7,8,null,null,null,null,5,5,4,3,5,6,8,7,7,8,7,7,7,7,1,8]},
]

type DrawerCfgEntry = { title: string; color: string; keywords: readonly CgKw[]; source?: string }
const CG_DRAWER_CFG: Record<string, DrawerCfgEntry> = {
  'Position 1':                 { title: 'Position 1 Keywords',          color: '#16a34a', keywords: toCgKw(CG_KW_DATA.filter(k => k.wk40 === 1)) },
  'Position 2-3':               { title: 'Position 2–3 Keywords',        color: '#1d4ed8', keywords: toCgKw(CG_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 2 && k.wk40 <= 3)) },
  'Position 4-10':              { title: 'Position 4–10 Keywords',       color: '#ea580c', keywords: toCgKw(CG_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 4 && k.wk40 <= 10)) },
  'Total Keywords on Page 1':   { title: 'Total Keywords on Page 1',     color: '#0891b2', keywords: toCgKw(CG_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 1 && k.wk40 <= 10)) },
  'Overall Number of Keywords': { title: 'All Keywords',                 color: '#6b7280', keywords: toCgKw(CG_KW_DATA) },
  'Keywords in AI Overview':    { title: 'Keywords in AI Overview',      color: '#7c3aed', keywords: toCgKw(CG_KW_DATA.filter(k => k.aio)), source: 'Semrush' },
  'Keywords without Ranking':   { title: 'Keywords without Ranking',     color: '#dc2626', keywords: toCgKw(CG_KW_DATA.filter(k => k.wk40 === null)) },
}
const ART_DRAWER_CFG: Record<string, DrawerCfgEntry> = {
  'Position 1':                 { title: 'Position 1 Keywords',          color: '#16a34a', keywords: toCgKw(ART_KW_DATA.filter(k => k.wk40 === 1)) },
  'Position 2-3':               { title: 'Position 2–3 Keywords',        color: '#1d4ed8', keywords: toCgKw(ART_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 2 && k.wk40 <= 3)) },
  'Position 4-10':              { title: 'Position 4–10 Keywords',       color: '#ea580c', keywords: toCgKw(ART_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 4 && k.wk40 <= 10)) },
  'Total Keywords on Page 1':   { title: 'Total Keywords on Page 1',     color: '#0891b2', keywords: toCgKw(ART_KW_DATA.filter(k => k.wk40 !== null && k.wk40 >= 1 && k.wk40 <= 10)) },
  'Overall Number of Keywords': { title: 'All Keywords',                 color: '#6b7280', keywords: toCgKw(ART_KW_DATA) },
  'Keywords in AI Overview':    { title: 'Keywords in AI Overview',      color: '#7c3aed', keywords: toCgKw(ART_KW_DATA.filter(k => k.aio)), source: 'Semrush' },
  'Keywords without Ranking':   { title: 'Keywords without Ranking',     color: '#dc2626', keywords: toCgKw(ART_KW_DATA.filter(k => k.wk40 === null)) },
}

// CG_FILTER_TRENDS, ART_FILTER_TRENDS imported from ./dashboardData

// ─── OVERALL KEYWORDS SLIDE ───────────────────────────────────────────────────
function RankSparkline({ trend, color }: { trend: (number|null)[]; color: string }) {
  const W=120, H=28, p=2
  const valid = trend.map((v,i)=>({v,i})).filter(o=>o.v!==null) as {v:number;i:number}[]
  if (!valid.length) return <span style={{color:C.textDim,fontSize:11}}>—</span>
  const vmin=Math.min(...valid.map(o=>o.v)), vmax=Math.max(...valid.map(o=>o.v))
  const rng=vmax-vmin||1; const n=trend.length
  const xAt=(i:number)=>p+(n===1?0:(i/(n-1))*(W-2*p))
  // invert y: position 1 = top
  const yAt=(v:number)=>p+((v-vmin)/rng)*(H-2*p)
  const d=valid.map((o,j)=>`${j===0?'M':'L'}${xAt(o.i).toFixed(1)},${yAt(o.v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block',width:120,height:28}}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

type OKFilter = 'overall'|'pos1'|'pos23'|'pos410'|'page1'|'aio'|'norank'
type OKCat = 'all'|'cg'|'art'

const OK_CAT_OPTIONS: {value: OKCat; label: string; color: string}[] = [
  {value:'all', label:'All Categories', color:'#6b7280'},
  {value:'cg',  label:'Cyberglossary',  color:'#7c3aed'},
  {value:'art', label:'Articles',       color:'#2563eb'},
]

const CG_CATEGORIES = ['AI Security','Access Control','Cloud Security','Cyber Compliance','Cyber Security','Cyber Threats','Data Security','Email Security','Endpoint Security','NGFW','Network Security','OT Security','Quantum Security','SASE','SD-WAN','SecOps','VPN','ZTNA'] as const

function OKSlide() {
  const [cat, setCat] = useState<OKCat>('cg')
  const [filter, setFilter] = useState<OKFilter>('overall')
  const [cgCat, setCgCat] = useState<string>('all')
  const [sortSv, setSortSv] = useState(true)
  const [expandedKw, setExpandedKw] = useState<string|null>(null)

  const showCgCat = cat === 'cg'

  const kws: OKKw[] = cat==='cg'  ? CG_KW_DATA as unknown as OKKw[]
    : cat==='art' ? ART_KW_DATA as unknown as OKKw[]
    : [...CG_KW_DATA, ...ART_KW_DATA] as unknown as OKKw[]

  const applyFilter = (base: OKKw[]) => {
    let r = base
    if (showCgCat && cgCat !== 'all') r = r.filter(k=>k.cat===cgCat)
    if (filter==='pos1')   r = r.filter(k=>k.wk40===1)
    else if (filter==='pos23')  r = r.filter(k=>k.wk40===2||k.wk40===3)
    else if (filter==='pos410') r = r.filter(k=>k.wk40!==null&&k.wk40>=4&&k.wk40<=10)
    else if (filter==='page1')  r = r.filter(k=>k.wk40!==null&&k.wk40>=1&&k.wk40<=10)
    else if (filter==='aio')    r = r.filter(k=>k.aio)
    else if (filter==='norank') r = r.filter(k=>k.wk40===null)
    return sortSv ? [...r].sort((a,b)=>b.sv-a.sv) : r
  }

  const filtered = applyFilter(kws)
  const cgCatCount = showCgCat && cgCat !== 'all'
    ? kws.filter(k=>k.cat===cgCat).length : null

  const baseKws = showCgCat && cgCat !== 'all' ? kws.filter(k=>k.cat===cgCat) : kws
  const metrics = {
    overall: baseKws.length,
    pos1:    baseKws.filter(k=>k.wk40===1).length,
    pos23:   baseKws.filter(k=>k.wk40===2||k.wk40===3).length,
    pos410:  baseKws.filter(k=>k.wk40!==null&&k.wk40>=4&&k.wk40<=10).length,
    page1:   baseKws.filter(k=>k.wk40!==null&&k.wk40>=1&&k.wk40<=10).length,
    aio:     baseKws.filter(k=>k.aio).length,
    norank:  baseKws.filter(k=>k.wk40===null).length,
  }

  const catOption = OK_CAT_OPTIONS.find(o=>o.value===cat)!
  const accentColor = catOption.color

  const KPI_DEFS: {key: OKFilter; label: string; color: string}[] = [
    {key:'overall', label:'Overall',     color:'#6b7280'},
    {key:'pos1',    label:'Position 1',  color:'#16a34a'},
    {key:'pos23',   label:'Position 2–3',color:'#1d4ed8'},
    {key:'pos410',  label:'Position 4–10',color:'#ea580c'},
    {key:'page1',   label:'Page 1',      color:'#0891b2'},
    {key:'aio',     label:'AIO Wk40',    color:'#7c3aed'},
    {key:'norank',  label:'Not Ranking', color:'#dc2626'},
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>

      {/* Control bar — two clean dropdowns, no external labels */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' as const,
        background:C.surface,border:`1px solid ${C.line}`,borderRadius:12,padding:'10px 14px'}}>

        {/* Category select — styled like a pill button */}
        <div style={{position:'relative' as const,flexShrink:0}}>
          <select
            value={cat}
            onChange={e=>{setCat(e.target.value as OKCat);setFilter('overall');setCgCat('all')}}
            style={{fontFamily:C.sans,fontSize:13,fontWeight:700,
              padding:'7px 30px 7px 14px',borderRadius:22,
              border:`1.5px solid ${accentColor}`,
              background:`${accentColor}10`,color:accentColor,cursor:'pointer',
              appearance:'none' as const,WebkitAppearance:'none' as const,
              outline:'none',boxShadow:`0 0 0 2px ${accentColor}14`}}>
            {OK_CAT_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span style={{position:'absolute' as const,right:11,top:'50%',transform:'translateY(-50%)',
            pointerEvents:'none' as const,color:accentColor,fontSize:10,fontWeight:700}}>▾</span>
        </div>

        {/* CG Category dropdown — only when viewing Cyberglossary */}
        {showCgCat && (<>
          <div style={{width:1,height:22,background:C.line,flexShrink:0,margin:'0 2px'}}/>
          <div style={{position:'relative' as const,flexShrink:0}}>
            <select value={cgCat} onChange={e=>{setCgCat(e.target.value);setFilter('overall')}}
              style={{fontFamily:C.sans,fontSize:13,fontWeight:700,
                padding:'7px 30px 7px 14px',borderRadius:22,
                border:`1.5px solid #7c3aed`,
                background:cgCat!=='all'?'#7c3aed14':C.surface2,
                color:cgCat!=='all'?'#7c3aed':C.textMid,cursor:'pointer',
                appearance:'none' as const,WebkitAppearance:'none' as const,
                outline:'none',boxShadow:cgCat!=='all'?'0 0 0 2px #7c3aed14':'none'}}>
              <option value="all">All Categories</option>
              {CG_CATEGORIES.map(c=>(
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span style={{position:'absolute' as const,right:11,top:'50%',transform:'translateY(-50%)',
              pointerEvents:'none' as const,color:cgCat!=='all'?'#7c3aed':C.textMid,fontSize:10,fontWeight:700}}>▾</span>
          </div>
          {cgCatCount !== null && (
            <span style={{fontFamily:C.mono,fontSize:11,fontWeight:700,color:'#7c3aed',
              background:'#7c3aed12',border:'1px solid #7c3aed30',borderRadius:8,
              padding:'3px 10px',flexShrink:0,letterSpacing:'0.02em'}}>
              {cgCat} — {cgCatCount} Keywords
            </span>
          )}
        </>)}

        {/* Divider */}
        <div style={{width:1,height:22,background:C.line,flexShrink:0,margin:'0 2px'}}/>

        {/* Filter pills — no label */}
        {KPI_DEFS.map(({key,label,color})=>{
          const active=filter===key
          return (
            <button key={key} onClick={()=>setFilter(key)}
              style={{fontFamily:C.sans,fontSize:12.5,fontWeight:700,padding:'5px 13px',borderRadius:20,
                border:`1.5px solid ${active?color:C.line}`,
                background:active?`${color}14`:C.surface2,color:active?color:C.textMid,
                cursor:'pointer',transition:'all .13s',letterSpacing:'-0.01em',flexShrink:0,
                boxShadow:active?`0 0 0 2px ${color}18`:'none'}}>
              {label}
            </button>
          )
        })}

        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontFamily:C.mono,fontSize:11,color:C.textDim,letterSpacing:'0.02em'}}>
            {filtered.length.toLocaleString()} kws
          </span>
          <button onClick={()=>setSortSv(s=>!s)}
            style={{fontFamily:C.mono,fontSize:11,padding:'4px 10px',borderRadius:6,
              border:`1px solid ${C.line}`,background:C.surface,color:C.textMid,cursor:'pointer',
              letterSpacing:'0.02em'}}>
            {sortSv?'SV ↓':'Default'}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:10}}>
        {KPI_DEFS.map(({key,label,color})=>{
          const val = metrics[key]
          const active = filter===key
          return (
            <div key={key} onClick={()=>setFilter(key)}
              style={{background:active?`${color}12`:C.surface,border:`1px solid ${active?color:C.line}`,
                borderRadius:12,padding:'14px 12px',cursor:'pointer',transition:'all .15s',
                boxShadow:active?`0 0 0 2px ${color}28`:'0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{fontFamily:C.mono,fontSize:10,fontWeight:700,textTransform:'uppercase' as const,
                letterSpacing:'0.09em',color:active?color:C.textDim,marginBottom:6}}>{label}</div>
              <div style={{fontFamily:C.mono,fontSize:24,fontWeight:800,color:active?color:C.text,
                letterSpacing:'-0.03em',lineHeight:1}}>{val.toLocaleString()}</div>
            </div>
          )
        })}
      </div>

      {/* Keyword table */}
      <div style={{background:C.surface,border:`1px solid ${C.line}`,borderRadius:14,overflow:'hidden'}}>
        {/* Table header */}
        <div style={{display:'grid',
          gridTemplateColumns:showCgCat?'1.6fr 120px 1.5fr 80px 60px 90px 90px 130px':'2fr 1.8fr 80px 60px 90px 90px 130px',
          gap:0,padding:'10px 16px',background:C.surface2,borderBottom:`1px solid ${C.line}`}}>
          {(showCgCat?['Keyword','Category','Pages','SV','KD','Wk39','Wk40','Trendline']:['Keyword','Pages','SV','KD','Wk39','Wk40','Trendline']).map(h=>(
            <div key={h} style={{fontFamily:C.mono,fontSize:10.5,fontWeight:700,
              textTransform:'uppercase',letterSpacing:'0.09em',color:C.textDim}}>{h}</div>
          ))}
        </div>
        {/* Table rows */}
        <div style={{maxHeight:520,overflowY:'auto'}}>
          {filtered.map((kw,i)=>{
            const wk35str = kw.wk39===null ? '—' : String(kw.wk39)
            const wk36str = kw.wk40===null ? '—' : String(kw.wk40)
            const moved = kw.wk39!==null&&kw.wk40!==null
              ? kw.wk39>kw.wk40 ? 'gain' : kw.wk39<kw.wk40 ? 'loss' : 'stable'
              : 'stable'
            const posColor = moved==='gain'?'#16a34a':moved==='loss'?'#dc2626':C.textDim
            const isExp = expandedKw===kw.kw
            const kwCatColor = kw.cat ? '#7c3aed' : C.textDim
            return (
              <div key={kw.kw+i} style={{borderBottom:`1px solid ${C.lineSoft}`}}>
                <div
                  style={{display:'grid',
                    gridTemplateColumns:showCgCat?'1.6fr 120px 1.5fr 80px 60px 90px 90px 130px':'2fr 1.8fr 80px 60px 90px 90px 130px',
                    gap:0,padding:'9px 16px',alignItems:'center',
                    background:i%2===0?'transparent':'rgba(0,0,0,0.012)',
                    cursor:'pointer',transition:'background .1s'}}
                  onClick={()=>setExpandedKw(isExp?null:kw.kw)}>
                  <div style={{fontFamily:C.sans,fontSize:12.5,fontWeight:600,color:C.text,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}
                    title={kw.kw}>{kw.kw}</div>
                  {showCgCat && (
                    <div style={{fontFamily:C.mono,fontSize:10,fontWeight:700,
                      color:kwCatColor,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                      background:`${kwCatColor}10`,borderRadius:6,
                      padding:'2px 7px',display:'inline-block',maxWidth:110}}
                      title={kw.cat||'—'}>{kw.cat||'—'}</div>
                  )}
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    <a href={kw.url} target="_blank" rel="noopener noreferrer"
                      onClick={e=>e.stopPropagation()}
                      style={{fontFamily:C.mono,fontSize:10.5,color:accentColor,textDecoration:'none',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      title={kw.url}>
                      {kw.url.replace('https://www.fortinet.com','')||kw.url}
                    </a>
                  </div>
                  <div style={{fontFamily:C.mono,fontSize:12,color:C.text,fontWeight:600}}>
                    {kw.sv>=1000?(kw.sv/1000).toFixed(kw.sv>=10000?0:1)+'K':kw.sv||'—'}
                  </div>
                  <div style={{fontFamily:C.mono,fontSize:12,color:C.textDim}}>{kw.kd||'—'}</div>
                  <div style={{fontFamily:C.mono,fontSize:13,fontWeight:700,color:C.textMid}}>{wk35str}</div>
                  <div style={{fontFamily:C.mono,fontSize:13,fontWeight:700,color:posColor}}>
                    {wk36str}
                    {moved==='gain'&&<span style={{fontSize:10,marginLeft:3}}>↑</span>}
                    {moved==='loss'&&<span style={{fontSize:10,marginLeft:3}}>↓</span>}
                  </div>
                  <div><RankSparkline trend={kw.trend} color={accentColor}/></div>
                </div>
                {isExp && (
                  <div style={{padding:'12px 16px 16px',background:`${accentColor}08`,
                    borderTop:`1px solid ${C.lineSoft}`}}>
                    <div style={{fontFamily:C.mono,fontSize:10,fontWeight:700,textTransform:'uppercase',
                      letterSpacing:'0.09em',color:accentColor,marginBottom:8}}>
                      40-Week Ranking Trend — {kw.kw}
                    </div>
                    <div style={{height:48}}>
                      <RankSparkline trend={kw.trend} color={accentColor}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(40,1fr)',gap:2,marginTop:8}}>
                      {kw.trend.map((v,wi)=>(
                        <div key={wi} title={`Wk${wi+1}: ${v??'—'}`}
                          style={{fontFamily:C.mono,fontSize:8,textAlign:'center',color:
                            wi===39?accentColor:C.textDim,fontWeight:wi===39?700:400}}>
                          {v??'—'}
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:20,marginTop:10,flexWrap:'wrap'}}>
                      <span style={{fontFamily:C.mono,fontSize:11,color:C.textDim}}>
                        URL: <a href={kw.url} target="_blank" rel="noopener noreferrer"
                          style={{color:accentColor,textDecoration:'underline'}}>{kw.url}</a>
                      </span>
                      <span style={{fontFamily:C.mono,fontSize:11,color:C.textDim}}>
                        AIO: <span style={{color:kw.aio?'#7c3aed':C.textDim,fontWeight:700}}>{kw.aio?'Yes':'No'}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length===0&&(
            <div style={{padding:32,textAlign:'center',fontFamily:C.mono,fontSize:13,color:C.textDim}}>
              No keywords match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



// ─── BACKLINK DATA ─────────────────────────────────────────────────────────────
const BL_KW_DATA:OKKw[]=[
  {kw:"Network Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-network-security",sv:1300,kd:48,wk35:8,wk36:2,aio:true,trend:[6,9,10,11,13,14,6,5,3,4,5,3,3,3,2,3,2,3,2,2,2,2,3,7,11,8,5,11,14,2,2,4,4,3,8,2]},
  {kw:"Quantum Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-security",sv:720,kd:41,wk35:7,wk36:7,aio:true,trend:[7,6,7,8,8,8,8,6,6,5,6,5,5,6,6,4,5,4,3,4,4,3,2,2,2,3,6,4,6,5,4,4,4,6,7,7]},
  {kw:"What Is Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cybersecurity",sv:9900,kd:77,wk35:18,wk36:8,aio:false,trend:[9,9,12,13,16,14,10,9,9,10,10,8,7,7,11,11,9,10,9,9,10,11,11,9,9,9,10,10,12,6,6,6,9,10,18,8]},
  {kw:"Privileged Access Management",url:"https://www.fortinet.com/resources/cyberglossary/privileged-access-management",sv:6600,kd:62,wk35:21,wk36:25,aio:false,trend:[10,13,12,15,20,22,17,11,15,9,9,9,10,14,13,13,11,18,21,20,7,11,11,13,13,11,13,12,13,16,18,17,19,25,21,25]},
  {kw:"Application Security",url:"https://www.fortinet.com/resources/cyberglossary/application-security",sv:4400,kd:49,wk35:5,wk36:35,aio:false,trend:[17,19,31,18,18,25,17,11,12,22,21,16,14,17,16,15,14,18,22,20,11,13,21,21,21,18,19,15,22,22,29,20,26,16,5,35]},
  {kw:"AI Security",url:"https://www.fortinet.com/resources/cyberglossary/ai-security",sv:4400,kd:67,wk35:11,wk36:11,aio:false,trend:[8,11,11,9,11,12,9,11,11,8,9,7,7,9,4,13,14,17,17,17,17,22,18,17,18,15,11,12,11,12,11,11,12,12,11,11]},
  {kw:"Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cloud-security",sv:1300,kd:54,wk35:3,wk36:4,aio:false,trend:[18,13,15,14,14,16,14,14,9,9,8,7,8,13,9,12,14,12,14,15,21,21,16,11,23,15,10,23,18,2,2,3,4,5,3,4]},
  {kw:"Cloud Data Protection",url:"https://www.fortinet.com/resources/cyberglossary/cloud-data-protection",sv:1300,kd:42,wk35:3,wk36:3,aio:false,trend:[15,13,17,19,22,17,15,8,8,10,7,8,10,12,7,13,19,44,47,45,38,36,18,35,35,30,25,27,26,2,3,3,3,4,3,3]},
  {kw:"Firewall",url:"https://www.fortinet.com/resources/cyberglossary/firewall",sv:27100,kd:74,wk35:6,wk36:7,aio:true,trend:[7,8,7,7,7,7,6,5,4,3,4,4,4,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,8,6,9,9,9,6,7]},
  {kw:"Quantum Key Distribution",url:"https://www.fortinet.com/resources/cyberglossary/quantum-key-distribution",sv:1000,kd:45,wk35:3,wk36:4,aio:true,trend:[7,7,7,10,9,8,7,9,7,5,8,2,4,4,3,4,5,4,4,4,5,7,6,3,6,6,6,6,2,2,2,2,1,3,3,4]},
  {kw:"Post Quantum Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/post-quantum-cryptography",sv:3600,kd:76,wk35:9,wk36:7,aio:false,trend:[17,2,1,1,2,2,2,2,4,9,4,9,5,2,20,3,3,2,2,2,2,3,10,2,19,18,2,17,10,18,22,21,11,12,9,7]},
  {kw:"Quantum Computing Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-computing-security",sv:110,kd:34,wk35:4,wk36:2,aio:false,trend:[8,4,4,4,4,3,4,4,6,5,6,6,6,6,9,2,3,2,3,7,7,7,7,5,5,4,4,5,5,3,2,2,3,4,4,2]},
  {kw:"Quantum Safe Security",url:"https://www.fortinet.com/resources/cyberglossary/quantum-safe-security",sv:70,kd:48,wk35:1,wk36:1,aio:false,trend:[3,3,1,1,1,1,3,2,2,2,2,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SASE",url:"https://www.fortinet.com/resources/cyberglossary/sase",sv:14800,kd:69,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,2,2,3,4,3,4,6,4,4,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Secops",url:"https://www.fortinet.com/resources/cyberglossary/what-is-secops",sv:1900,kd:47,wk35:8,wk36:10,aio:true,trend:[13,13,9,10,12,10,5,5,5,4,5,5,6,7,6,6,7,6,5,8,9,8,7,10,10,8,11,10,9,7,9,7,6,9,8,10]},
  {kw:"Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/what-is-zero-trust",sv:9900,kd:83,wk35:4,wk36:3,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,54,67,66,56,60,63,57,null,24,24,24,24,24,null,null,null,57,57,3,4,3,2,5,4,3]},
  {kw:"Network Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/network-monitoring",sv:3600,kd:52,wk35:8,wk36:10,aio:false,trend:[21,23,19,17,17,19,15,5,10,9,6,7,8,7,8,8,8,10,10,13,12,13,11,13,16,18,11,14,11,10,10,8,8,10,8,10]},
  {kw:"Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/ransomware",sv:33100,kd:84,wk35:16,wk36:13,aio:false,trend:[6,6,7,5,4,6,6,6,7,6,5,5,5,6,5,4,2,3,6,6,7,8,6,8,8,7,8,8,8,9,7,11,11,10,16,13]},
] as const as unknown as OKKw[]
const NOBL_KW_DATA:OKKw[]=[
  {kw:"AIOPS",url:"https://www.fortinet.com/resources/cyberglossary/aiops-future-of-it-operations",sv:1300,kd:69,wk35:12,wk36:28,aio:false,trend:[16,16,17,17,18,13,14,16,23,13,8,16,15,17,17,19,16,23,27,21,19,25,24,21,17,18,13,17,24,20,23,25,26,24,12,28]},
  {kw:"AI Data Center",url:"https://www.fortinet.com/resources/cyberglossary/ai-data-centers",sv:2900,kd:36,wk35:2,wk36:2,aio:false,trend:[65,65,70,72,58,58,58,58,58,52,61,61,61,19,6,22,23,20,23,21,14,12,11,28,20,13,13,15,24,2,2,2,2,2,2,2]},
  {kw:"AWS Compliance",url:"https://www.fortinet.com/resources/cyberglossary/aws-compliance",sv:590,kd:69,wk35:2,wk36:2,aio:false,trend:[15,12,11,11,23,19,23,13,8,7,10,11,13,10,9,6,5,5,5,6,8,5,5,5,5,7,8,6,8,2,3,4,3,3,2,2]},
  {kw:"Virtual Cloud Network",url:"https://www.fortinet.com/resources/cyberglossary/virtual-cloud-network",sv:70,kd:49,wk35:10,wk36:13,aio:false,trend:[2,6,2,4,4,4,4,2,2,4,4,4,4,3,3,2,3,3,3,2,1,1,1,1,2,2,4,2,4,10,11,12,10,12,10,13]},
  {kw:"Cloud Infrastructure",url:"https://www.fortinet.com/resources/cyberglossary/cloud-infrastructure",sv:3600,kd:57,wk35:17,wk36:20,aio:false,trend:[2,6,6,7,7,7,7,8,5,7,7,7,5,8,4,8,9,11,12,14,11,13,14,17,16,16,17,15,23,17,17,13,7,18,17,20]},
  {kw:"Hybrid Cloud",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hybrid-cloud",sv:4400,kd:62,wk35:21,wk36:28,aio:false,trend:[13,20,21,18,18,16,14,11,11,13,13,11,16,13,9,12,15,14,13,13,13,17,12,14,16,18,18,18,20,17,22,24,23,22,21,28]},
  {kw:"Hybrid Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-cloud-security",sv:1300,kd:31,wk35:10,wk36:10,aio:false,trend:[4,3,1,2,6,4,4,5,5,5,8,7,10,8,2,4,6,3,2,3,10,10,5,5,4,2,6,4,6,11,10,10,10,10,10,10]},
  {kw:"CSPM",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-posture-management",sv:5400,kd:26,wk35:6,wk36:7,aio:false,trend:[15,11,20,28,29,16,11,6,3,4,5,4,6,6,4,11,18,22,14,7,7,10,6,5,23,26,19,12,13,5,7,8,7,6,6,7]},
  {kw:"Cloud NATive",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cloud-native",sv:2900,kd:81,wk35:8,wk36:12,aio:false,trend:[41,34,35,46,42,27,32,14,5,3,22,9,33,28,32,16,26,35,35,30,30,38,41,44,36,38,42,40,43,8,10,9,6,7,8,12]},
  {kw:"Secure Web Gateway",url:"https://www.fortinet.com/resources/cyberglossary/secure-web-gateways",sv:4400,kd:60,wk35:6,wk36:4,aio:false,trend:[5,7,9,6,5,10,4,7,6,10,7,5,2,6,7,8,10,7,8,7,8,8,8,8,8,7,7,6,9,4,4,4,5,6,6,4]},
  {kw:"Cloud Security Tools",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-tools",sv:2900,kd:23,wk35:6,wk36:7,aio:false,trend:[5,7,2,4,3,5,4,3,2,6,5,4,3,1,3,4,3,4,2,4,3,4,4,4,3,4,5,3,4,6,6,6,5,6,6,7]},
  {kw:"Cloud Security Architecture",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-architecture",sv:2400,kd:33,wk35:8,wk36:8,aio:false,trend:[7,6,6,6,9,11,8,9,8,6,5,6,7,5,6,8,8,9,9,10,9,10,14,15,11,10,16,11,12,6,5,5,7,7,8,8]},
  {kw:"Cloud Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-best-practices",sv:3600,kd:50,wk35:18,wk36:21,aio:false,trend:[6,8,8,12,17,14,14,8,4,3,4,10,4,4,8,4,6,20,18,18,18,21,20,13,8,5,22,10,18,17,17,14,16,19,18,21]},
  {kw:"Multi Cloud Security",url:"https://www.fortinet.com/resources/cyberglossary/multi-cloud-security",sv:320,kd:27,wk35:16,wk36:16,aio:false,trend:[9,6,11,11,9,8,9,8,4,5,4,3,2,5,5,4,9,10,12,9,10,9,10,11,3,3,2,4,5,18,18,17,17,18,16,16]},
  {kw:"Cloud Native Firewall",url:"https://www.fortinet.com/resources/cyberglossary/cloud-native-firewalls",sv:50,kd:38,wk35:18,wk36:18,aio:false,trend:[1,1,1,41,41,41,41,28,28,28,28,41,43,43,14,43,77,61,69,69,69,69,51,52,60,40,45,5,7,20,17,23,17,22,18,18]},
  {kw:"Cloud Application Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-application-security",sv:1000,kd:20,wk35:4,wk36:4,aio:true,trend:[null,null,null,1,1,1,1,1,2,3,3,2,3,3,3,2,2,2,2,2,3,2,3,3,3,5,6,5,7,8,6,10,6,8,4,4]},
  {kw:"Private Cloud Vs Public Cloud",url:"https://www.fortinet.com/resources/cyberglossary/public-vs-private-cloud",sv:3600,kd:28,wk35:11,wk36:15,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,38,32,33,22,24,21,18,9,23,20,11,15]},
  {kw:"Distributed Firewall",url:"https://www.fortinet.com/resources/cyberglossary/distributed-firewall",sv:50,kd:22,wk35:24,wk36:26,aio:false,trend:[2,2,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,1,2,3,2,2,2,2,2,2,4,3,6,22,23,27,26,27,24,26]},
  {kw:"Stateful Firewall",url:"https://www.fortinet.com/resources/cyberglossary/stateful-firewall",sv:1600,kd:31,wk35:41,wk36:37,aio:false,trend:[2,2,1,1,1,2,2,4,5,4,4,3,4,6,3,3,3,2,3,4,3,3,3,3,5,5,7,4,6,34,38,42,44,45,41,37]},
  {kw:"DNS Firewall",url:"https://www.fortinet.com/resources/cyberglossary/dns-firewall",sv:320,kd:30,wk35:6,wk36:6,aio:true,trend:[4,3,14,4,3,3,5,3,2,16,3,15,18,18,5,20,20,1,3,13,10,5,10,6,3,6,10,9,10,10,7,9,7,6,6,6]},
  {kw:"Firewall Design Principles",url:"https://www.fortinet.com/resources/cyberglossary/firewall-design-principles",sv:20,kd:21,wk35:11,wk36:9,aio:false,trend:[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,7,5,3,8,5,7,6,3,6,2,2,2,19,9,9,15,12,12,11,9]},
  {kw:"OT Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/ot-security-best-practices",sv:140,kd:19,wk35:3,wk36:4,aio:false,trend:[7,7,8,1,1,1,1,2,2,2,5,1,2,2,2,2,1,2,1,1,1,1,1,1,1,1,2,8,19,3,3,2,2,3,3,4]},
  {kw:"OT Network Segmentation",url:"https://www.fortinet.com/resources/cyberglossary/ot-network-segmentation-and-microsegmentation",sv:140,kd:6,wk35:10,wk36:4,aio:false,trend:[1,1,1,13,6,6,3,3,4,4,3,3,3,2,2,2,2,2,2,2,3,25,2,2,2,2,2,2,3,8,14,10,13,11,10,4]},
  {kw:"ICS SCADA",url:"https://www.fortinet.com/resources/cyberglossary/ics-scada",sv:90,kd:14,wk35:25,wk36:23,aio:false,trend:[4,5,1,1,1,1,1,1,1,1,1,1,2,7,7,7,3,5,4,2,4,4,4,5,3,3,3,3,5,9,19,21,25,24,25,23]},
  {kw:"SASE Benefits",url:"https://www.fortinet.com/resources/cyberglossary/sase-benefits",sv:720,kd:17,wk35:1,wk36:1,aio:false,trend:[6,5,8,8,6,2,3,3,2,1,1,1,1,2,3,4,11,3,2,2,2,2,2,2,2,2,8,5,7,1,1,1,1,1,1,1]},
  {kw:"SD WAN Architecture",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-architecture",sv:320,kd:19,wk35:11,wk36:5,aio:false,trend:[7,6,1,2,2,2,2,5,10,4,2,2,5,6,1,1,1,2,2,1,1,1,1,1,4,4,2,4,5,6,6,24,11,6,11,5]},
  {kw:"SD WAN Cost",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-costs",sv:110,kd:9,wk35:7,wk36:11,aio:true,trend:[3,3,1,1,1,1,1,2,3,5,7,8,8,8,7,4,4,5,4,3,3,4,14,14,6,1,4,3,7,5,7,7,4,7,7,11]},
  {kw:"Zero Trust Architecture",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-architecture",sv:6600,kd:78,wk35:3,wk36:3,aio:false,trend:[42,45,45,39,34,24,32,4,19,17,14,15,13,8,9,13,14,35,46,24,22,32,36,51,53,55,53,42,50,6,6,6,4,4,3,3]},
  {kw:"Zero Trust Cloud",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-for-the-cloud",sv:390,kd:48,wk35:5,wk36:11,aio:false,trend:[null,null,null,11,9,10,10,14,15,2,8,6,6,6,3,10,11,9,9,7,6,17,11,22,21,19,36,26,36,5,3,4,6,4,5,11]},
  {kw:"Public Wifi",url:"https://www.fortinet.com/resources/cyberglossary/vpn-wifi",sv:1000,kd:52,wk35:9,wk36:11,aio:false,trend:[6,12,9,9,7,9,6,3,5,3,5,4,4,4,5,5,6,7,5,3,4,3,4,4,6,7,7,7,9,6,3,4,7,10,9,11]},
  {kw:"Threat Hunting",url:"https://www.fortinet.com/resources/cyberglossary/threat-hunting",sv:4400,kd:40,wk35:17,wk36:20,aio:false,trend:[19,22,23,26,25,17,20,18,20,21,20,19,18,19,14,8,7,7,12,19,24,13,9,12,11,15,12,14,17,4,4,20,19,16,17,20]},
  {kw:"Information Security",url:"https://www.fortinet.com/resources/cyberglossary/information-security",sv:1000,kd:52,wk35:7,wk36:18,aio:false,trend:[10,12,17,13,9,12,13,17,19,10,11,11,10,10,10,15,19,14,23,26,21,25,21,32,29,25,31,27,30,25,25,28,27,13,7,18]},
  {kw:"OAUTH",url:"https://www.fortinet.com/resources/cyberglossary/oauth",sv:12100,kd:71,wk35:2,wk36:17,aio:false,trend:[6,5,4,7,4,5,3,4,5,5,7,8,5,6,5,5,7,8,6,8,3,7,3,4,4,4,5,6,22,2,13,2,2,2,2,17]},
  {kw:"Credential Stuffing",url:"https://www.fortinet.com/resources/cyberglossary/credential-stuffing",sv:3600,kd:55,wk35:4,wk36:4,aio:false,trend:[5,8,5,8,7,4,6,3,5,5,2,3,5,2,4,5,4,5,7,9,5,6,4,6,4,5,5,4,6,4,3,4,4,2,4,4]},
  {kw:"Malvertising",url:"https://www.fortinet.com/resources/cyberglossary/malvertising",sv:1900,kd:53,wk35:5,wk36:5,aio:false,trend:[11,11,10,11,15,9,4,5,5,2,5,3,4,2,2,2,3,2,1,2,4,6,7,9,10,9,11,9,10,2,6,5,5,5,5,5]},
  {kw:"EDGE Computing",url:"https://www.fortinet.com/resources/cyberglossary/edge-computing",sv:3600,kd:67,wk35:28,wk36:28,aio:false,trend:[22,20,16,19,21,20,20,12,11,11,8,8,9,9,12,15,18,21,22,19,11,21,19,7,20,23,16,23,28,29,30,19,25,2,28,28]},
  {kw:"Wannacry Ransomware Attack",url:"https://www.fortinet.com/resources/cyberglossary/wannacry-ransomware-attack",sv:2900,kd:65,wk35:1,wk36:1,aio:false,trend:[6,8,8,8,8,8,7,7,8,6,6,6,8,8,8,9,9,10,9,9,9,10,9,10,10,10,10,8,9,12,7,8,2,1,1,1]},
  {kw:"Authentication Vs Authorization",url:"https://www.fortinet.com/resources/cyberglossary/authentication-vs-authorization",sv:3600,kd:47,wk35:3,wk36:3,aio:false,trend:[7,4,10,10,6,4,3,5,4,6,3,3,2,2,4,3,4,5,5,3,7,10,7,5,8,7,5,7,9,15,6,3,3,2,3,3]},
  {kw:"Email Spoofing",url:"https://www.fortinet.com/resources/cyberglossary/email-spoofing",sv:2400,kd:56,wk35:2,wk36:2,aio:false,trend:[10,10,12,8,7,9,7,6,5,5,5,5,2,2,4,5,3,5,5,5,7,7,7,7,6,8,5,6,7,2,2,2,1,2,2,2]},
  {kw:"Cybersecurity Analytics",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-analytics",sv:480,kd:28,wk35:1,wk36:1,aio:true,trend:[16,20,21,20,10,8,17,10,10,4,3,6,2,4,2,2,2,3,4,5,2,5,5,7,8,14,11,4,6,2,2,2,1,1,1,1]},
  {kw:"Worm Virus",url:"https://www.fortinet.com/resources/cyberglossary/worm-virus",sv:1300,kd:38,wk35:4,wk36:3,aio:false,trend:[3,3,1,1,1,2,1,2,2,2,3,2,3,3,2,2,2,2,2,2,2,2,2,3,2,2,2,2,3,3,3,3,3,6,4,3]},
  {kw:"Computer Viruses",url:"https://www.fortinet.com/resources/cyberglossary/computer-virus",sv:2400,kd:49,wk35:6,wk36:7,aio:true,trend:[4,4,3,4,5,3,3,2,5,4,4,3,5,5,2,2,2,3,3,3,3,3,4,4,5,4,4,3,5,6,31,12,6,3,6,7]},
  {kw:"VPN Blocker",url:"https://www.fortinet.com/resources/cyberglossary/vpn-blocker",sv:2900,kd:68,wk35:2,wk36:3,aio:false,trend:[2,4,5,5,5,4,3,3,5,7,4,2,2,3,4,3,2,4,2,2,3,3,3,3,3,4,5,4,5,6,5,4,3,3,2,3]},
  {kw:"DNS Poisioning",url:"https://www.fortinet.com/resources/cyberglossary/dns-poisoning",sv:20,kd:42,wk35:4,wk36:5,aio:false,trend:[2,3,2,3,2,2,1,2,3,2,3,2,2,2,2,2,2,2,2,3,3,3,3,3,2,2,2,2,4,2,2,2,4,4,4,5]},
  {kw:"Cyberwarfare",url:"https://www.fortinet.com/resources/cyberglossary/cyber-warfare",sv:1600,kd:55,wk35:4,wk36:3,aio:false,trend:[5,7,5,4,6,6,5,6,7,5,4,6,4,5,4,3,3,3,3,2,2,2,3,4,6,5,6,4,5,2,2,2,2,4,4,3]},
  {kw:"Indicators Of Compromise",url:"https://www.fortinet.com/resources/cyberglossary/indicators-of-compromise",sv:4400,kd:51,wk35:2,wk36:2,aio:true,trend:[2,1,1,2,2,3,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,3,3,2,1,1,1,2,1,2,2,2,3,2,2]},
  {kw:"File Transfer Protocol",url:"https://www.fortinet.com/resources/cyberglossary/file-transfer-protocol-ftp-meaning",sv:1600,kd:49,wk35:5,wk36:5,aio:false,trend:[3,3,3,3,2,2,2,2,3,3,3,3,3,3,2,2,2,2,2,2,3,3,4,3,3,4,4,3,4,2,2,2,5,5,5,5]},
  {kw:"Kerberos Authentication",url:"https://www.fortinet.com/resources/cyberglossary/kerberos-authentication",sv:1900,kd:43,wk35:7,wk36:13,aio:true,trend:[2,2,3,2,2,1,1,1,1,2,2,3,2,1,1,1,2,3,1,1,3,4,3,1,2,1,1,1,2,14,5,14,14,10,7,13]},
  {kw:"What Is NAT",url:"https://www.fortinet.com/resources/cyberglossary/network-address-translation",sv:4400,kd:48,wk35:2,wk36:2,aio:false,trend:[2,2,6,6,5,5,4,2,6,2,3,2,2,3,2,5,6,7,4,6,6,7,6,5,4,5,4,5,6,2,4,2,2,3,2,2]},
  {kw:"What Is An IPS",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-ips",sv:720,kd:38,wk35:4,wk36:4,aio:true,trend:[2,13,11,14,15,12,15,12,6,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,4,14,6,7,3,3,5,5,8,4,4]},
  {kw:"What Is HSM",url:"https://www.fortinet.com/resources/cyberglossary/hardware-security-module",sv:14800,kd:71,wk35:2,wk36:2,aio:false,trend:[9,7,7,10,11,8,6,8,6,13,13,12,11,10,9,11,11,15,14,15,1,6,15,5,1,2,6,2,3,2,2,2,3,2,2,2]},
  {kw:"Ethernet Switching",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ethernet-switching",sv:260,kd:33,wk35:6,wk36:6,aio:false,trend:[6,5,3,6,9,6,5,3,5,4,4,5,7,7,3,1,1,1,1,1,3,4,5,7,6,3,9,9,14,19,19,19,9,7,6,6]},
  {kw:"Buffer Overflow",url:"https://www.fortinet.com/resources/cyberglossary/buffer-overflow",sv:2900,kd:56,wk35:2,wk36:2,aio:false,trend:[2,3,2,2,2,2,3,2,3,3,3,4,3,3,3,2,3,3,3,2,2,2,2,2,2,1,1,1,2,2,2,2,2,3,2,2]},
  {kw:"ICMP",url:"https://www.fortinet.com/resources/cyberglossary/internet-control-message-protocol-icmp",sv:12100,kd:75,wk35:6,wk36:5,aio:true,trend:[3,4,4,4,5,2,2,3,5,4,4,2,3,3,4,2,2,4,4,5,2,2,3,4,2,2,3,5,6,6,6,6,6,5,6,5]},
  {kw:"Fault Tolerance",url:"https://www.fortinet.com/resources/cyberglossary/fault-tolerance",sv:2400,kd:44,wk35:2,wk36:2,aio:false,trend:[3,2,1,2,2,2,2,3,6,4,3,4,3,4,3,3,3,3,3,3,3,3,2,2,2,2,2,3,4,2,2,2,4,3,2,2]},
  {kw:"DNS Protection",url:"https://www.fortinet.com/resources/cyberglossary/dns-protection",sv:590,kd:47,wk35:7,wk36:13,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2,2,2,5,11,10,10,9,12,4,4,4,7,9,7,13]},
  {kw:"Data Leak",url:"https://www.fortinet.com/resources/cyberglossary/data-leak",sv:4400,kd:65,wk35:4,wk36:7,aio:false,trend:[6,5,9,6,7,7,7,8,8,8,7,6,6,7,8,5,4,6,6,7,7,5,6,7,8,8,6,6,7,4,8,4,4,4,4,7]},
  {kw:"Latency",url:"https://www.fortinet.com/resources/cyberglossary/latency",sv:33100,kd:67,wk35:12,wk36:14,aio:true,trend:[5,5,6,6,9,7,5,5,5,5,4,4,5,4,2,5,4,3,3,5,3,5,5,5,4,5,5,4,5,4,3,4,45,13,12,14]},
  {kw:"What Is Catfishing",url:"https://www.fortinet.com/resources/cyberglossary/catfishing",sv:8100,kd:48,wk35:2,wk36:3,aio:false,trend:[2,3,4,3,3,2,3,2,2,2,2,2,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,2,2,2,2,3]},
  {kw:"Cyber Attacks On Small Business",url:"https://www.fortinet.com/resources/cyberglossary/smb-cyberattacks",sv:0,kd:51,wk35:40,wk36:22,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,7,3,3,4,25,27,19,17,28,40,22]},
  {kw:"Ping Of Death",url:"https://www.fortinet.com/resources/cyberglossary/ping-of-death",sv:880,kd:30,wk35:1,wk36:1,aio:false,trend:[3,5,3,3,5,5,4,4,5,3,4,4,3,4,2,4,5,5,2,3,3,3,5,6,5,5,4,5,6,4,4,4,4,1,1,1]},
  {kw:"What Is SSE",url:"https://www.fortinet.com/resources/cyberglossary/security-service-edge-sse",sv:1300,kd:20,wk35:9,wk36:12,aio:true,trend:[13,12,13,14,16,16,15,9,9,10,8,5,6,8,9,6,4,4,3,3,5,7,8,6,3,6,5,3,7,14,16,20,14,11,9,12]},
  {kw:"Mobile App Security",url:"https://www.fortinet.com/resources/cyberglossary/mobile-app-security",sv:1600,kd:20,wk35:2,wk36:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,2,2,2,3,3,4,4,4,5,5,3,5,4,5,2,2,2,3,3,2,2]},
  {kw:"P2P VPN",url:"https://www.fortinet.com/resources/cyberglossary/peer-to-peer-p2p-vpn",sv:3600,kd:43,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,2,4,6,7,4,4,5,3,3,3,4,4,3,3,3,3,5,5,4,11,2,1,1,1,1,1,1]},
  {kw:"Runtime Application Self-Protection",url:"https://www.fortinet.com/resources/cyberglossary/runtime-application-self-protection-rasp",sv:320,kd:32,wk35:8,wk36:7,aio:false,trend:[6,5,3,6,6,6,6,5,6,3,5,1,1,4,5,5,5,4,4,6,8,9,7,8,9,9,8,8,9,3,7,8,8,8,8,7]},
  {kw:"Enterprise Security",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-security",sv:2400,kd:43,wk35:2,wk36:2,aio:true,trend:[3,3,3,3,3,3,2,2,3,3,2,2,3,3,4,3,3,2,3,3,3,3,3,3,4,4,4,3,4,2,2,2,2,2,2,2]},
  {kw:"Cryptojacking",url:"https://www.fortinet.com/resources/cyberglossary/cryptojacking",sv:1600,kd:56,wk35:9,wk36:15,aio:false,trend:[3,2,5,5,5,8,6,6,5,6,6,2,5,4,5,3,2,3,6,8,6,7,8,9,8,7,8,7,8,5,10,7,6,6,9,15]},
  {kw:"Smishing",url:"https://www.fortinet.com/resources/cyberglossary/smishing",sv:18100,kd:52,wk35:3,wk36:3,aio:false,trend:[4,8,7,5,6,5,5,5,7,5,6,4,4,4,3,5,5,8,8,10,11,11,11,11,11,9,8,8,9,5,5,7,3,3,3,3]},
  {kw:"Shadow It",url:"https://www.fortinet.com/resources/cyberglossary/shadow-it",sv:3600,kd:50,wk35:5,wk36:7,aio:true,trend:[8,11,11,12,6,13,10,8,12,11,7,8,7,10,5,13,10,12,12,8,13,19,22,17,23,21,15,19,23,21,22,17,18,14,5,7]},
  {kw:"What Is Data Center",url:"https://www.fortinet.com/resources/cyberglossary/data-center",sv:590,kd:52,wk35:2,wk36:15,aio:false,trend:[11,8,6,5,8,4,4,4,5,5,3,4,2,2,3,4,7,5,6,7,7,7,8,8,8,8,5,5,6,3,2,3,12,4,2,15]},
  {kw:"Data Integrity",url:"https://www.fortinet.com/resources/cyberglossary/data-integrity",sv:5400,kd:55,wk35:7,wk36:7,aio:false,trend:[3,7,6,6,4,6,7,4,8,7,5,7,8,6,3,8,4,2,3,5,5,5,5,6,3,4,4,2,4,5,5,7,8,6,7,7]},
  {kw:"Wardriving",url:"https://www.fortinet.com/resources/cyberglossary/wardriving",sv:1900,kd:44,wk35:3,wk36:3,aio:false,trend:[4,3,1,1,1,1,1,2,4,3,2,3,2,2,4,4,2,3,3,3,4,4,4,5,4,4,3,3,4,4,3,3,3,4,3,3]},
  {kw:"SSL VPN",url:"https://www.fortinet.com/resources/cyberglossary/ssl-vpn",sv:4400,kd:55,wk35:4,wk36:4,aio:true,trend:[1,1,1,1,1,1,1,1,1,2,5,4,3,3,3,3,3,4,3,3,2,2,2,1,1,1,1,4,5,4,6,5,5,4,4,4]},
  {kw:"Snort",url:"https://www.fortinet.com/resources/cyberglossary/snort",sv:6600,kd:66,wk35:12,wk36:9,aio:false,trend:[9,9,9,9,8,9,9,7,8,8,6,5,5,6,7,5,7,9,9,9,9,9,9,8,6,6,7,5,8,10,13,7,13,14,12,9]},
  {kw:"Zero-Day Attack",url:"https://www.fortinet.com/resources/cyberglossary/zero-day-attack",sv:1000,kd:50,wk35:2,wk36:2,aio:true,trend:[11,14,13,17,9,12,12,12,10,12,3,5,17,2,2,6,11,6,2,3,4,2,3,2,2,2,2,1,3,3,3,2,3,2,2,2]},
  {kw:"Vulnerability Scanning Vs Penetration Testing",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-scanning-compare",sv:390,kd:25,wk35:1,wk36:1,aio:false,trend:[4,3,3,3,3,3,3,3,3,5,2,3,3,2,5,2,1,1,1,1,1,1,1,2,2,1,1,1,2,1,1,1,1,1,1,1]},
  {kw:"API Security",url:"https://www.fortinet.com/resources/cyberglossary/api-security",sv:3600,kd:55,wk35:6,wk36:6,aio:false,trend:[6,5,6,9,6,6,6,4,8,5,6,5,2,3,2,3,3,4,2,2,5,5,4,6,5,3,5,5,6,6,4,6,6,6,6,6]},
  {kw:"Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cryptography",sv:22200,kd:77,wk35:4,wk36:4,aio:true,trend:[3,4,2,3,3,2,2,2,6,5,4,4,3,3,3,3,3,3,2,3,3,3,4,4,5,5,5,3,4,2,2,2,4,5,4,4]},
  {kw:"Doxing",url:"https://www.fortinet.com/resources/cyberglossary/doxing",sv:27100,kd:56,wk35:10,wk36:10,aio:false,trend:[10,10,9,9,10,8,9,9,8,3,7,5,10,6,6,6,10,12,9,10,10,12,7,11,12,11,12,8,10,2,2,2,2,2,10,10]},
  {kw:"Access Control",url:"https://www.fortinet.com/resources/cyberglossary/access-control",sv:1000,kd:66,wk35:2,wk36:2,aio:false,trend:[3,2,1,1,3,5,2,3,4,4,4,2,2,3,4,2,3,3,4,3,3,3,2,3,3,3,4,3,4,3,2,2,2,2,2,2]},
  {kw:"DKIM Record",url:"https://www.fortinet.com/resources/cyberglossary/dkim-record",sv:1300,kd:64,wk35:4,wk36:3,aio:false,trend:[37,25,17,12,10,9,9,4,3,2,5,6,5,6,3,4,4,7,7,9,7,7,5,5,6,6,7,9,10,3,3,4,2,5,4,3]},
  {kw:"SAML Vs OAUTH Vs Open Id",url:"https://www.fortinet.com/resources/cyberglossary/saml-vs-oauth",sv:20,kd:18,wk35:7,wk36:4,aio:false,trend:[14,19,4,15,15,15,15,13,14,15,20,17,13,15,12,15,15,14,20,21,24,21,14,12,8,8,21,23,24,10,12,13,8,10,7,4]},
  {kw:"CSRF Attack",url:"https://www.fortinet.com/resources/cyberglossary/csrf",sv:1300,kd:65,wk35:5,wk36:9,aio:false,trend:[6,7,2,5,5,8,5,6,9,8,8,6,8,6,3,10,10,13,12,11,12,12,11,14,14,11,13,12,13,3,3,11,13,13,5,9]},
  {kw:"What Is Captcha?",url:"https://www.fortinet.com/resources/cyberglossary/captcha",sv:33100,kd:81,wk35:4,wk36:6,aio:false,trend:[5,9,12,6,10,14,10,8,7,7,7,5,7,8,2,6,9,9,11,11,3,9,13,15,7,10,13,9,10,8,5,5,3,3,4,6]},
  {kw:"Common Vulnerabilities And Exposures",url:"https://www.fortinet.com/resources/cyberglossary/cve",sv:6600,kd:91,wk35:19,wk36:19,aio:false,trend:[18,19,8,22,25,22,18,12,15,19,10,9,19,14,9,10,13,20,18,19,13,14,26,21,18,19,18,20,22,21,20,21,2,2,19,19]},
  {kw:"Reverse Proxy",url:"https://www.fortinet.com/resources/cyberglossary/reverse-proxy",sv:6600,kd:69,wk35:5,wk36:4,aio:false,trend:[3,4,7,8,9,6,7,2,11,6,6,5,7,10,3,8,11,13,9,11,9,10,9,6,6,3,11,7,15,5,7,7,7,8,5,4]},
  {kw:"What Is Scada",url:"https://www.fortinet.com/resources/cyberglossary/scada-and-scada-systems",sv:3600,kd:40,wk35:5,wk36:5,aio:false,trend:[4,3,2,3,3,4,3,2,2,2,3,3,3,2,8,2,3,2,2,4,4,4,4,4,6,5,5,2,3,2,2,4,6,6,5,5]},
  {kw:"Identity And Access Management",url:"https://www.fortinet.com/resources/cyberglossary/identity-and-access-management",sv:5400,kd:65,wk35:4,wk36:2,aio:false,trend:[11,11,14,17,14,12,15,14,8,11,9,9,8,9,13,8,9,9,7,8,13,9,10,9,7,7,25,10,24,2,4,4,4,4,4,2]},
  {kw:"What Is Soc 2 Compliance",url:"https://www.fortinet.com/resources/cyberglossary/soc-2-compliance",sv:1000,kd:45,wk35:2,wk36:2,aio:false,trend:[5,5,7,4,3,2,3,2,2,3,3,3,3,2,5,3,3,3,2,2,4,4,4,3,5,3,5,4,6,2,3,3,3,2,2,2]},
  {kw:"Cobit",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cobit",sv:3600,kd:41,wk35:5,wk36:6,aio:true,trend:[3,5,5,3,3,3,2,3,4,4,5,5,5,3,3,3,3,2,3,2,2,2,2,3,2,2,2,2,3,6,7,7,3,5,5,6]},
  {kw:"What Is IOT?",url:"https://www.fortinet.com/resources/cyberglossary/iot",sv:9900,kd:75,wk35:6,wk36:6,aio:false,trend:[11,8,9,3,2,3,3,2,3,3,3,5,4,2,3,9,6,7,7,4,1,3,4,7,7,6,8,6,9,13,12,21,15,14,6,6]},
  {kw:"Enterprise Architecture",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-architecture",sv:3600,kd:46,wk35:3,wk36:3,aio:false,trend:[19,26,19,19,21,18,17,14,16,7,15,13,13,11,7,32,15,12,13,9,10,11,14,12,15,23,12,24,30,3,4,3,3,4,3,3]},
  {kw:"Disaster Recovery",url:"https://www.fortinet.com/resources/cyberglossary/disaster-recovery",sv:8100,kd:74,wk35:5,wk36:6,aio:false,trend:[15,15,15,15,16,14,11,12,14,12,7,9,11,13,7,14,20,15,12,15,11,14,15,13,16,14,15,12,28,9,11,11,6,4,5,6]},
  {kw:"Personally Identifiable Information",url:"https://www.fortinet.com/resources/cyberglossary/pii",sv:12100,kd:64,wk35:4,wk36:3,aio:false,trend:[23,13,30,9,11,24,13,13,10,5,6,6,13,12,7,18,16,26,26,23,21,25,25,28,29,25,23,24,26,8,6,6,6,6,4,3]},
  {kw:"OSI Model",url:"https://www.fortinet.com/resources/cyberglossary/osi-model",sv:33100,kd:59,wk35:24,wk36:23,aio:false,trend:[15,13,13,11,11,17,13,8,10,6,8,3,16,4,4,3,8,20,2,17,13,11,16,14,7,13,11,10,17,2,2,2,22,26,24,23]},
  {kw:"Owasp",url:"https://www.fortinet.com/resources/cyberglossary/owasp",sv:14800,kd:72,wk35:16,wk36:16,aio:false,trend:[8,8,8,9,8,10,9,8,9,8,8,7,7,7,6,14,17,15,11,10,9,10,10,9,12,12,11,13,14,15,20,11,3,3,16,16]},
  {kw:"RBAC",url:"https://www.fortinet.com/resources/cyberglossary/role-based-access-control",sv:9900,kd:79,wk35:18,wk36:11,aio:false,trend:[11,19,18,21,21,14,13,7,13,12,11,12,13,9,9,10,8,8,9,15,4,7,12,8,14,12,24,8,14,34,34,21,32,20,18,11]},
  {kw:"What Is A Cyber Attack",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cyber-attack",sv:2900,kd:61,wk35:9,wk36:8,aio:false,trend:[8,9,4,11,11,10,7,7,2,2,2,3,4,6,7,2,2,2,2,2,3,4,4,4,5,3,3,3,5,11,8,21,11,14,9,8]},
  {kw:"Vishing Attack",url:"https://www.fortinet.com/resources/cyberglossary/vishing-attack",sv:1600,kd:35,wk35:4,wk36:5,aio:false,trend:[5,5,7,8,9,7,5,8,6,5,5,5,5,6,13,2,3,3,2,4,5,4,5,5,7,6,8,4,8,4,4,4,6,5,4,5]},
  {kw:"Endpoint Protection Platform",url:"https://www.fortinet.com/resources/cyberglossary/endpoint-protection-platform",sv:1300,kd:39,wk35:4,wk36:2,aio:false,trend:[2,2,1,2,2,2,2,5,4,5,5,5,12,5,4,5,5,2,2,2,2,2,1,2,2,3,3,2,3,2,2,2,2,2,4,2]},
  {kw:"What Is A WAN",url:"https://www.fortinet.com/resources/cyberglossary/wan",sv:1600,kd:49,wk35:2,wk36:11,aio:false,trend:[9,10,8,10,8,12,9,8,9,6,6,8,6,4,3,8,9,3,3,2,3,8,7,14,2,3,9,12,25,2,3,2,2,2,2,11]},
  {kw:"Ransomware Statistics",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-statistics",sv:590,kd:44,wk35:20,wk36:29,aio:false,trend:[1,1,1,14,6,7,4,6,4,4,10,5,8,8,9,16,18,5,9,11,15,10,9,21,20,18,6,9,20,41,46,39,18,13,20,29]},
  {kw:"CIEM",url:"https://www.fortinet.com/resources/cyberglossary/ciem",sv:1900,kd:36,wk35:15,wk36:17,aio:false,trend:[6,2,4,3,4,4,5,5,4,4,9,4,9,10,7,8,9,8,9,10,13,16,15,17,17,18,16,20,21,16,12,19,19,11,15,17]},
  {kw:"Command And Control Attack",url:"https://www.fortinet.com/resources/cyberglossary/command-and-control-attacks",sv:70,kd:19,wk35:70,wk36:75,aio:true,trend:[2,2,2,3,2,3,1,2,2,2,3,2,3,3,3,3,1,2,2,2,2,2,2,2,2,2,1,1,2,61,57,58,70,75,70,75]},
  {kw:"IOT Security",url:"https://www.fortinet.com/resources/cyberglossary/iot-security",sv:3600,kd:52,wk35:9,wk36:10,aio:true,trend:[5,5,5,5,5,6,4,3,4,3,4,3,6,5,2,4,4,2,2,3,5,5,7,4,2,2,4,3,5,29,32,29,29,18,9,10]},
  {kw:"Packet Loss",url:"https://www.fortinet.com/resources/cyberglossary/what-is-packet-loss",sv:3600,kd:54,wk35:7,wk36:7,aio:true,trend:[5,6,4,4,6,6,5,3,5,4,4,4,5,3,2,2,3,4,4,3,2,3,6,4,5,4,5,3,5,7,4,5,4,5,7,7]},
  {kw:"Dynamic Application Security Testing",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-application-security-testing",sv:1300,kd:32,wk35:18,wk36:23,aio:false,trend:[17,14,16,12,21,9,7,5,2,2,3,8,4,8,3,11,14,10,10,11,11,15,14,18,13,10,12,18,19,18,25,26,23,20,18,23]},
  {kw:"Bluekeep",url:"https://www.fortinet.com/resources/cyberglossary/what-is-bluekeep",sv:320,kd:22,wk35:11,wk36:11,aio:true,trend:[3,3,4,4,4,4,4,3,3,3,3,3,2,3,3,2,3,2,3,2,1,1,1,1,2,1,1,1,2,11,17,13,10,9,11,11]},
  {kw:"It Operations",url:"https://www.fortinet.com/resources/cyberglossary/it-operations",sv:2400,kd:32,wk35:8,wk36:7,aio:false,trend:[10,10,9,14,10,14,11,9,8,8,8,6,7,5,7,5,7,6,6,6,8,7,8,8,7,7,8,8,9,8,8,8,8,9,8,7]},
  {kw:"Advanced Persistent Threat",url:"https://www.fortinet.com/resources/cyberglossary/advanced-persistent-threat",sv:2900,kd:72,wk35:15,wk36:16,aio:false,trend:[13,15,15,16,16,17,13,14,14,13,13,13,19,14,15,16,19,18,19,17,14,16,21,22,18,20,19,18,20,16,27,26,20,21,15,16]},
  {kw:"CNapp",url:"https://www.fortinet.com/resources/cyberglossary/cnapp",sv:5400,kd:44,wk35:29,wk36:29,aio:false,trend:[21,31,38,30,20,27,27,12,10,13,13,11,20,18,11,12,14,28,16,12,15,27,14,12,13,21,12,10,18,25,29,29,28,33,29,29]},
  {kw:"Social Engineering",url:"https://www.fortinet.com/resources/cyberglossary/social-engineering",sv:14800,kd:74,wk35:20,wk36:12,aio:false,trend:[9,10,10,9,12,10,10,10,10,10,10,9,8,7,6,8,16,24,23,21,24,24,21,23,23,25,24,22,24,16,20,26,3,9,20,12]},
  {kw:"SAAS",url:"https://www.fortinet.com/resources/cyberglossary/software-as-a-service",sv:90500,kd:92,wk35:2,wk36:4,aio:false,trend:[12,12,12,12,7,5,5,4,6,5,3,2,2,3,2,3,7,10,13,18,7,7,13,6,5,10,10,10,11,3,3,3,3,3,2,4]},
  {kw:"LAAS",url:"https://www.fortinet.com/resources/cyberglossary/infrastructure-as-a-service",sv:9900,kd:65,wk35:6,wk36:6,aio:false,trend:[6,9,9,3,13,13,7,9,12,12,11,8,8,8,11,19,22,24,26,17,16,17,23,28,28,26,26,27,29,6,6,6,6,6,6,6]},
  {kw:"Data Governance",url:"https://www.fortinet.com/resources/cyberglossary/data-governance",sv:12100,kd:65,wk35:5,wk36:5,aio:false,trend:[22,21,25,24,24,23,24,20,19,19,17,15,12,14,9,16,24,25,26,18,17,23,23,22,24,27,29,28,35,5,6,5,4,6,5,5]},
  {kw:"IEC 62443",url:"https://www.fortinet.com/resources/cyberglossary/iec-62443",sv:1600,kd:37,wk35:23,wk36:20,aio:true,trend:[3,3,3,3,3,3,3,3,5,4,4,5,5,4,2,2,3,3,2,2,3,2,3,3,3,3,2,2,3,25,23,24,26,22,23,20]},
  {kw:"Digital Experience Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/digital-experience-monitoring",sv:1000,kd:19,wk35:4,wk36:3,aio:false,trend:[29,41,20,24,17,14,15,10,12,6,7,6,11,8,6,6,6,7,9,14,8,8,8,8,9,6,6,5,8,2,3,2,3,4,4,3]},
  {kw:"Active Directory Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/active-directory",sv:30,kd:20,wk35:11,wk36:10,aio:false,trend:[12,12,2,5,5,4,5,3,3,3,3,5,5,2,2,3,2,2,2,3,3,3,3,3,5,5,5,3,4,10,8,10,11,10,11,10]},
  {kw:"SCIM Authentication",url:"https://www.fortinet.com/resources/cyberglossary/what-is-scim",sv:110,kd:32,wk35:16,wk36:8,aio:false,trend:[9,4,6,6,6,6,6,6,6,5,2,1,1,1,1,6,8,8,8,6,6,6,8,8,7,8,5,4,6,18,24,21,21,17,16,8]},
  {kw:"Cyber Safety",url:"https://www.fortinet.com/resources/cyberglossary/cyber-safety",sv:1000,kd:52,wk35:2,wk36:2,aio:false,trend:[8,7,5,4,6,5,2,3,4,6,6,4,4,3,3,3,2,4,3,2,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2]},
  {kw:"Cyber Resilience",url:"https://www.fortinet.com/resources/cyberglossary/cyber-resilience",sv:2400,kd:48,wk35:5,wk36:4,aio:false,trend:[17,16,15,19,24,19,16,19,17,11,17,5,9,4,4,5,6,5,8,9,4,5,4,5,5,6,8,9,13,5,3,6,5,6,5,4]},
  {kw:"Antivirus Protection",url:"https://www.fortinet.com/resources/cyberglossary/antivirus-protection",sv:4400,kd:88,wk35:8,wk36:7,aio:true,trend:[16,16,6,12,6,12,9,9,12,17,8,6,10,10,6,6,9,9,7,7,6,6,7,6,6,6,5,6,7,9,10,10,10,10,8,7]},
  {kw:"Web Application Firewall Architecture",url:"https://www.fortinet.com/resources/cyberglossary/waf-architecture",sv:170,kd:45,wk35:9,wk36:9,aio:true,trend:[4,2,4,4,4,3,3,7,4,2,2,1,1,1,2,2,2,2,1,1,1,2,2,2,2,1,1,1,2,7,8,9,8,7,9,9]},
  {kw:"Cybersecurity Awareness",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-awareness",sv:1220000,kd:65,wk35:3,wk36:2,aio:false,trend:[null,null,null,18,18,25,20,19,21,18,16,15,12,12,8,10,6,13,13,13,10,11,12,11,12,10,11,10,11,3,3,3,3,4,3,2]},
  {kw:"It Security",url:"https://www.fortinet.com/resources/cyberglossary/it-security",sv:8100,kd:43,wk35:3,wk36:3,aio:true,trend:[null,null,null,13,14,17,14,9,8,11,7,7,6,7,12,11,11,20,13,16,12,12,27,25,18,14,30,21,23,5,4,5,5,5,3,3]},
  {kw:"Nist 800 53",url:"https://www.fortinet.com/resources/cyberglossary/nist-800-53",sv:4400,kd:44,wk35:3,wk36:4,aio:false,trend:[null,null,null,7,8,9,8,7,7,6,5,7,6,7,6,6,8,9,12,11,12,15,12,15,12,14,16,12,14,4,5,5,5,5,3,4]},
  {kw:"Nittf Cnssd 504",url:"https://www.fortinet.com/resources/cyberglossary/nittf-cnssd-504",sv:0,kd:14,wk35:7,wk36:6,aio:false,trend:[null,null,null,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,10,5,5,8,10,7,6]},
  {kw:"Principle Of Least Privilege",url:"https://www.fortinet.com/resources/cyberglossary/principle-of-least-privilege",sv:5400,kd:63,wk35:5,wk36:5,aio:false,trend:[null,null,null,13,11,14,13,4,3,5,6,4,5,4,8,18,14,19,20,13,20,18,23,25,25,19,24,23,24,2,3,4,3,4,5,5]},
  {kw:"SBOM",url:"https://www.fortinet.com/resources/cyberglossary/sbom",sv:4400,kd:46,wk35:7,wk36:9,aio:false,trend:[null,null,null,18,24,25,11,20,23,12,16,7,8,12,21,25,26,24,23,16,15,22,27,18,22,22,23,30,33,8,8,9,9,8,7,9]},
  {kw:"Secret Detection",url:"https://www.fortinet.com/resources/cyberglossary/secret-detection",sv:50,kd:24,wk35:9,wk36:7,aio:false,trend:[null,null,null,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,7,6,8,9,10,9,7]},
  {kw:"AI In Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/artificial-intelligence-in-cybersecurity",sv:320,kd:67,wk35:5,wk36:5,aio:true,trend:[2,6,9,9,8,2,5,7,2,1,1,2,9,1,1,1,1,1,1,1,1,1,1,1,3,3,2,2,2,2,2,2,5,6,5,5]},
  {kw:"AI Adoption",url:"https://www.fortinet.com/resources/cyberglossary/ai-adoption",sv:1600,kd:48,wk35:6,wk36:6,aio:false,trend:[1,3,17,13,11,9,7,5,5,9,6,7,7,6,6,5,4,4,4,2,4,5,3,4,3,2,2,2,2,7,7,7,7,7,6,6]},
  {kw:"Deep Fake AI",url:"https://www.fortinet.com/resources/cyberglossary/deepfake-ai",sv:3600,kd:82,wk35:6,wk36:6,aio:false,trend:[5,6,1,5,5,5,1,1,1,4,2,3,3,3,6,4,5,8,8,7,9,8,7,8,8,7,8,19,3,6,6,5,6,6,6,6]},
  {kw:"Virtual Private Cloud",url:"https://www.fortinet.com/resources/cyberglossary/vpc",sv:1600,kd:21,wk35:5,wk36:3,aio:false,trend:[5,4,3,5,4,3,2,3,2,2,3,4,2,4,3,4,4,3,3,4,4,4,3,4,11,12,5,12,10,6,7,7,6,6,5,3]},
  {kw:"CASB",url:"https://www.fortinet.com/resources/cyberglossary/casb",sv:1600,kd:50,wk35:2,wk36:2,aio:true,trend:[4,3,3,3,3,3,2,2,5,3,5,7,6,3,3,3,2,5,5,7,5,5,4,3,5,5,5,5,4,2,1,1,3,3,2,2]},
  {kw:"Public Cloud Security Risks",url:"https://www.fortinet.com/resources/cyberglossary/public-cloud-security-risks",sv:40,kd:25,wk35:4,wk36:4,aio:false,trend:[2,2,2,2,2,2,2,2,2,2,3,3,2,1,1,1,1,1,8,7,5,5,7,6,6,7,7,7,6,3,3,4,4,4,4,4]},
  {kw:"Cloud VPN",url:"https://www.fortinet.com/resources/cyberglossary/cloud-vpn",sv:4400,kd:56,wk35:2,wk36:2,aio:false,trend:[9,8,7,8,10,12,9,8,6,9,8,8,8,7,4,5,4,5,6,7,6,6,6,7,8,7,6,4,4,2,2,2,2,3,2,2]},
  {kw:"Cloud Encryption",url:"https://www.fortinet.com/resources/cyberglossary/cloud-encryption",sv:720,kd:37,wk35:1,wk36:1,aio:true,trend:[19,21,16,14,9,13,11,3,8,8,5,11,23,5,6,8,8,8,8,6,8,8,11,9,12,14,14,11,9,2,2,2,1,1,1,1]},
  {kw:"Cloud Firewall",url:"https://www.fortinet.com/resources/cyberglossary/cloud-firewall",sv:1300,kd:38,wk35:10,wk36:7,aio:true,trend:[2,2,1,2,5,5,5,2,2,2,4,3,2,3,3,2,3,2,2,2,2,2,2,2,2,2,2,2,2,8,9,9,9,10,10,7]},
  {kw:"Virtual Firewall",url:"https://www.fortinet.com/resources/cyberglossary/virtual-firewall-for-cloud",sv:1000,kd:36,wk35:2,wk36:2,aio:false,trend:[4,17,2,14,14,14,14,15,9,9,9,9,17,31,33,33,33,33,14,4,4,4,4,7,46,22,41,8,4,2,2,2,2,2,2,2]},
  {kw:"Cloud Security TIPS",url:"https://www.fortinet.com/resources/cyberglossary/cloud-security-tips",sv:2240000,kd:34,wk35:5,wk36:2,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,3,2,3,3,2,5,2]},
  {kw:"Cloud Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/cloud-detection-and-response",sv:720,kd:19,wk35:3,wk36:2,aio:true,trend:[null,null,null,6,5,3,5,4,5,7,6,3,7,6,5,5,5,6,10,7,10,10,6,4,4,6,5,5,2,2,2,2,3,2,3,2]},
  {kw:"Cloud Workload Protection Platform",url:"https://www.fortinet.com/resources/cyberglossary/cwpp",sv:2900,kd:37,wk35:4,wk36:5,aio:false,trend:[null,null,null,10,13,12,11,10,10,9,9,9,9,11,14,10,10,10,14,11,11,12,11,11,16,7,16,5,4,8,8,8,6,6,4,5]},
  {kw:"DLP For Cloud",url:"https://www.fortinet.com/resources/cyberglossary/dlp-for-cloud",sv:70,kd:26,wk35:8,wk36:7,aio:false,trend:[null,null,null,3,4,4,4,4,3,3,1,1,1,1,1,1,4,5,4,3,5,2,2,2,2,2,2,4,4,6,6,7,7,8,8,7]},
  {kw:"What Does A Firewall Do",url:"https://www.fortinet.com/resources/cyberglossary/what-does-a-firewall-do",sv:1600,kd:59,wk35:1,wk36:1,aio:true,trend:[8,8,6,6,7,6,7,5,3,3,3,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Firewall As A Service",url:"https://www.fortinet.com/resources/cyberglossary/firewall-as-a-service-fwaas",sv:1000,kd:30,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Waf Vs Firewall",url:"https://www.fortinet.com/resources/cyberglossary/waf-vs-firewall",sv:320,kd:20,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"How Does A Firewall Work",url:"https://www.fortinet.com/resources/cyberglossary/how-does-a-firewall-work",sv:590,kd:44,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Perimeter Firewall",url:"https://www.fortinet.com/resources/cyberglossary/perimeter-firewall",sv:170,kd:13,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Transparent Firewall",url:"https://www.fortinet.com/resources/cyberglossary/transparent-firewall",sv:50,kd:9,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Firewall Configuration",url:"https://www.fortinet.com/resources/cyberglossary/firewall-configuration",sv:5400,kd:27,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Hybrid Mesh Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-mesh-firewall",sv:170,kd:24,wk35:5,wk36:5,aio:true,trend:[4,2,2,2,2,2,1,1,1,1,1,1,2,1,1,2,5,1,2,6,4,3,11,2,2,5,4,8,8,5,5,7,5,7,5,5]},
  {kw:"Proxy Firewall",url:"https://www.fortinet.com/resources/cyberglossary/proxy-firewall",sv:590,kd:32,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Does Firewall Slow Down Internet Speed",url:"https://www.fortinet.com/resources/cyberglossary/does-a-firewall-affect-internet-speed",sv:20,kd:11,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Hybrid Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-firewall-advantages-disadvantages",sv:20,kd:23,wk35:2,wk36:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2,2,2,2]},
  {kw:"Stateful Vs Stateless Firewall",url:"https://www.fortinet.com/resources/cyberglossary/stateful-vs-stateless-firewall",sv:1000,kd:33,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Proxy Server Vs Packet Filtering Firewall",url:"https://www.fortinet.com/resources/cyberglossary/proxy-server-vs-packet-filtering-firewall",sv:10,kd:25,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Hardware Firewall",url:"https://www.fortinet.com/resources/cyberglossary/hardware-firewalls-better-than-software",sv:4400,kd:28,wk35:3,wk36:4,aio:true,trend:[1,1,1,2,2,2,1,1,2,2,4,2,2,2,3,3,3,1,3,1,2,3,6,4,3,1,2,2,2,2,2,3,2,4,3,4]},
  {kw:"Firewall Benefits",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-firewall",sv:50,kd:44,wk35:1,wk36:1,aio:false,trend:[2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is A Firewall",url:"https://www.fortinet.com/resources/cyberglossary/firewall",sv:135000,kd:70,wk35:2,wk36:3,aio:true,trend:[3,2,1,1,2,2,2,2,2,2,3,3,4,3,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,1,2,2,3,2,3]},
  {kw:"End Of Life Firewall",url:"https://www.fortinet.com/resources/cyberglossary/end-of-life-firewall",sv:2900,kd:54,wk35:1,wk36:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,null,null,null,1,1,1,1,1,1,1,1,1]},
  {kw:"Human Firewall",url:"https://www.fortinet.com/resources/cyberglossary/human-firewall",sv:1000,kd:21,wk35:5,wk36:6,aio:false,trend:[4,3,3,3,5,4,4,4,3,2,2,2,2,3,2,3,3,2,2,2,2,2,2,4,2,2,3,2,2,7,7,6,5,7,5,6]},
  {kw:"Rugged Firewall",url:"https://www.fortinet.com/resources/cyberglossary/ruggedized-firewall",sv:20,kd:11,wk35:1,wk36:1,aio:false,trend:[16,17,11,14,16,16,16,16,11,10,10,10,10,10,11,8,6,6,6,8,8,6,7,6,6,6,9,1,1,1,1,1,1,1,1,1]},
  {kw:"Web Application Firewall For Enterprise",url:"https://www.fortinet.com/resources/cyberglossary/business-web-application-firewall",sv:0,kd:69,wk35:7,wk36:5,aio:false,trend:[2,2,1,2,2,2,1,1,1,1,1,2,3,2,4,1,2,2,1,1,1,2,3,3,39,1,1,1,1,1,3,6,3,6,7,5]},
  {kw:"WAF",url:"https://www.fortinet.com/resources/cyberglossary/waf",sv:1300,kd:58,wk35:4,wk36:4,aio:false,trend:[6,6,4,7,8,6,3,6,6,6,3,2,3,5,2,7,6,4,3,9,5,4,4,3,14,6,3,15,8,3,4,3,5,5,4,4]},
  {kw:"Best Virtual Firwall",url:"https://www.fortinet.com/resources/cyberglossary/comparing-virtual-firewalls",sv:590,kd:39,wk35:5,wk36:5,aio:false,trend:[null,null,null,9,9,9,5,9,9,74,1,4,3,12,6,4,4,8,10,16,9,15,12,8,null,4,8,null,null,46,4,3,4,5,5,5]},
  {kw:"NGFW",url:"https://www.fortinet.com/resources/cyberglossary/next-generation-firewall",sv:4400,kd:52,wk35:18,wk36:24,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,71,11,1,3,5,5,3,12,7,9,24,29,26,22,30,32,13,21,18,20,19,2,18,24]},
  {kw:"Network Security Vulnerability",url:"https://www.fortinet.com/resources/cyberglossary/network-security-vulnerability",sv:110,kd:27,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Network Security Threats",url:"https://www.fortinet.com/resources/cyberglossary/network-security-threats",sv:720,kd:50,wk35:1,wk36:1,aio:true,trend:[5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cloud Network Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-network-security",sv:2900,kd:32,wk35:4,wk36:2,aio:true,trend:[13,15,20,24,27,30,31,30,11,13,19,21,11,12,7,12,11,13,15,13,12,12,14,14,14,9,4,3,2,2,3,5,3,4,4,2]},
  {kw:"Network Security Management",url:"https://www.fortinet.com/resources/cyberglossary/network-security-management",sv:1300,kd:31,wk35:3,wk36:2,aio:false,trend:[8,8,8,9,10,10,9,6,8,7,7,9,6,4,4,2,4,8,9,10,8,8,6,6,6,6,7,6,5,3,2,3,3,2,3,2]},
  {kw:"Network Security Vs Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/network-security-vs-cybersecurity",sv:90,kd:12,wk35:1,wk36:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"IT Vs OT Security",url:"https://www.fortinet.com/resources/cyberglossary/it-vs-ot-cybersecurity",sv:70,kd:42,wk35:3,wk36:3,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,5,3,3]},
  {kw:"Manufacturing OT",url:"https://www.fortinet.com/resources/cyberglossary/manufacturing-ot",sv:40,kd:10,wk35:2,wk36:2,aio:false,trend:[9,9,9,9,9,9,9,4,7,8,9,16,10,1,9,8,8,8,8,8,8,3,10,15,21,4,7,null,8,2,2,2,2,3,2,2]},
  {kw:"Quantum Safe Encryption",url:"https://www.fortinet.com/resources/cyberglossary/quantum-safe-encryption",sv:390,kd:49,wk35:43,wk36:23,aio:false,trend:[1,1,1,2,3,4,4,6,7,31,33,3,36,22,43,41,21,32,32,28,9,9,9,9,8,8,8,8,5,28,2,2,25,2,43,23]},
  {kw:"SD WAN Vs SASE",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-sase",sv:70,kd:13,wk35:2,wk36:2,aio:true,trend:[2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,2,2,2,2,2,2]},
  {kw:"SASE Vs CASB",url:"https://www.fortinet.com/resources/cyberglossary/sase-vs-casb",sv:260,kd:25,wk35:2,wk36:2,aio:true,trend:[6,9,9,10,5,4,5,2,2,4,6,2,4,2,6,2,2,2,2,1,1,2,2,1,2,4,2,3,3,2,1,1,1,2,2,2]},
  {kw:"SASE Architecture",url:"https://www.fortinet.com/resources/cyberglossary/sase-architecture",sv:1000,kd:59,wk35:6,wk36:5,aio:false,trend:[3,4,3,3,5,5,4,5,7,4,4,4,2,3,4,4,3,3,1,1,1,1,1,1,1,2,3,3,3,4,6,8,6,5,6,5]},
  {kw:"SASE Vs ZTNA",url:"https://www.fortinet.com/resources/cyberglossary/sase-vs-ztna",sv:110,kd:17,wk35:4,wk36:4,aio:false,trend:[1,2,2,2,2,2,2,2,2,2,2,1,2,2,3,2,1,1,1,2,1,2,3,2,2,3,2,3,3,3,3,3,4,3,4,4]},
  {kw:"Sovereign SASE",url:"https://www.fortinet.com/resources/cyberglossary/sovereign-sase",sv:40,kd:8,wk35:1,wk36:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,4,2,2,3,2,2,1,1]},
  {kw:"SDN Vs SD WAN",url:"https://www.fortinet.com/resources/cyberglossary/sdn-vs-sd-wan",sv:210,kd:24,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SD WAN Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-vpn",sv:110,kd:12,wk35:4,wk36:4,aio:true,trend:[3,3,3,3,3,2,2,2,1,1,1,1,2,5,4,2,1,2,2,2,2,1,1,1,5,3,2,5,5,4,5,4,5,5,4,4]},
  {kw:"SD WAN Explained",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-explained",sv:50,kd:40,wk35:2,wk36:6,aio:false,trend:[11,7,6,6,6,6,6,8,2,4,3,1,1,4,4,2,3,2,3,2,4,2,2,5,6,5,4,4,3,3,3,2,3,5,2,6]},
  {kw:"SD WAN Benefits",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-sd-wan",sv:390,kd:24,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SD WAN As A Service",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-as-a-service",sv:590,kd:7,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,2,34,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SD WAN Security",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-security",sv:260,kd:30,wk35:2,wk36:6,aio:false,trend:[6,13,14,12,5,18,17,18,19,5,4,4,9,6,5,4,10,4,4,4,4,3,4,14,15,13,11,17,14,5,10,2,6,7,2,6]},
  {kw:"SD WAN Vs Mpls",url:"https://www.fortinet.com/resources/cyberglossary/sd-wan-vs-mpls",sv:880,kd:19,wk35:2,wk36:3,aio:true,trend:[null,null,null,9,3,4,4,1,1,1,1,2,2,1,1,2,2,3,2,4,6,6,11,9,12,8,2,3,3,3,3,4,3,4,2,3]},
  {kw:"Security Operations",url:"https://www.fortinet.com/resources/cyberglossary/what-is-secops",sv:1300,kd:49,wk35:2,wk36:2,aio:false,trend:[11,13,7,12,17,9,12,10,5,5,10,11,5,9,12,10,10,18,13,17,23,29,26,12,14,17,15,18,10,2,2,2,3,3,2,2]},
  {kw:"Secops Metrics",url:"https://www.fortinet.com/resources/cyberglossary/secops-metrics",sv:30,kd:16,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"How To Implement Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/how-to-implement-zero-trust",sv:880,kd:50,wk35:2,wk36:4,aio:true,trend:[5,2,3,4,2,4,3,2,3,3,4,2,3,2,2,2,1,2,1,2,1,2,2,2,2,2,3,1,1,2,1,2,2,3,2,4]},
  {kw:"Universal ZTNA",url:"https://www.fortinet.com/resources/cyberglossary/universal-ztna",sv:110,kd:15,wk35:1,wk36:1,aio:false,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Zero Trust EDGE",url:"https://www.fortinet.com/resources/cyberglossary/zero-trust-edge",sv:260,kd:14,wk35:2,wk36:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,2,4,10,5,3,12,3,2,2,11,12,11,10,19,16,10,17,15,14,2,2,2,2,2,2,2]},
  {kw:"Zerotrust Security Model",url:"https://www.fortinet.com/resources/cyberglossary/what-is-the-zero-trust-network-security-model",sv:5400,kd:36,wk35:1,wk36:1,aio:false,trend:[5,7,3,6,6,5,4,4,3,3,2,2,4,2,2,3,3,2,2,3,5,6,6,2,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"ZTNA Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/ztna-vs-vpn",sv:1000,kd:29,wk35:1,wk36:1,aio:false,trend:[9,3,12,8,5,5,2,2,2,4,3,5,2,4,5,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Zero-Trust Network Access",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ztna",sv:8100,kd:74,wk35:2,wk36:2,aio:true,trend:[1,1,1,1,1,1,1,2,2,4,2,1,2,2,2,2,3,2,2,2,2,4,5,2,4,4,3,2,2,1,1,2,2,3,2,2]},
  {kw:"Virtual Firewall For Zero Trust",url:"https://www.fortinet.com/resources/cyberglossary/virtual-firewall-zero-trust",sv:0,kd:30,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cognitive Science",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cognitive-science",sv:12100,kd:66,wk35:3,wk36:4,aio:false,trend:[7,10,9,9,10,8,9,9,9,9,8,8,6,6,6,5,9,9,9,7,3,7,10,10,10,11,10,10,10,3,2,2,3,3,3,4]},
  {kw:"Fedramp",url:"https://www.fortinet.com/resources/cyberglossary/what-is-fedramp",sv:18100,kd:67,wk35:10,wk36:9,aio:false,trend:[11,10,8,10,9,10,8,7,5,7,4,4,6,5,5,6,5,6,8,8,8,5,9,10,9,10,12,8,8,11,11,11,11,11,10,9]},
  {kw:"Hyperscale Data Center",url:"https://www.fortinet.com/resources/cyberglossary/hyperscale",sv:1900,kd:34,wk35:1,wk36:13,aio:true,trend:[11,11,11,14,10,7,11,10,8,4,9,11,10,10,9,9,10,10,11,11,11,15,19,21,22,26,24,24,23,32,2,2,21,1,1,13]},
  {kw:"What Is Adware",url:"https://www.fortinet.com/resources/cyberglossary/what-is-adware",sv:3600,kd:46,wk35:2,wk36:2,aio:false,trend:[6,5,7,7,4,5,5,4,5,4,6,3,5,4,4,4,3,4,4,2,3,3,4,3,3,2,4,3,3,2,2,2,2,2,2,2]},
  {kw:"Common Vulnerability Scoring System",url:"https://www.fortinet.com/resources/cyberglossary/common-vulnerability-scoring-system",sv:18100,kd:77,wk35:5,wk36:4,aio:false,trend:[11,10,10,11,11,11,10,10,11,13,13,9,10,8,10,15,14,13,17,12,16,20,19,19,19,17,21,19,18,4,4,3,3,4,5,4]},
  {kw:"Bitcoin Mining",url:"https://www.fortinet.com/resources/cyberglossary/what-is-bitcoin-mining",sv:12100,kd:94,wk35:2,wk36:6,aio:true,trend:[6,7,4,3,4,5,4,4,4,5,4,5,6,5,5,6,6,6,6,6,7,6,6,6,6,6,6,6,6,2,2,2,2,2,2,6]},
  {kw:"Business Email Compromise",url:"https://www.fortinet.com/resources/cyberglossary/business-email-compromise",sv:2900,kd:58,wk35:7,wk36:7,aio:false,trend:[19,15,10,6,11,13,10,13,17,13,18,16,19,13,10,24,25,27,25,23,15,23,23,25,25,23,24,24,23,25,28,2,5,9,7,7]},
  {kw:"What Is Dmarc",url:"https://www.fortinet.com/resources/cyberglossary/dmarc",sv:12100,kd:78,wk35:2,wk36:2,aio:false,trend:[9,11,3,13,6,11,7,9,6,4,8,5,7,7,6,9,7,6,8,10,5,7,10,9,1,2,16,2,2,2,2,2,3,3,2,2]},
  {kw:"ISO/IEC 27001",url:"https://www.fortinet.com/resources/cyberglossary/iso-iec-27001",sv:2900,kd:62,wk35:6,wk36:2,aio:false,trend:[9,9,5,5,16,2,2,2,2,4,2,4,2,6,6,4,4,9,11,8,13,12,15,15,9,11,16,13,12,6,6,5,5,6,6,2]},
  {kw:"Managed Security Service Provider",url:"https://www.fortinet.com/resources/cyberglossary/what-is-mssp",sv:12100,kd:61,wk35:2,wk36:2,aio:true,trend:[5,6,7,7,5,7,6,5,4,3,2,2,2,3,2,3,5,4,3,4,4,4,4,4,3,2,5,3,2,1,1,1,2,2,2,2]},
  {kw:"Sandboxing",url:"https://www.fortinet.com/resources/cyberglossary/what-is-sandboxing",sv:1900,kd:56,wk35:4,wk36:5,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,5,6,5,5,7,6,6,2,6,6,6,5,4,5]},
  {kw:"Web Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-web-security",sv:2400,kd:43,wk35:2,wk36:19,aio:false,trend:[2,3,3,3,3,3,3,3,4,5,3,2,2,3,3,3,3,3,2,3,7,7,7,10,9,9,8,8,7,21,21,29,20,24,2,19]},
  {kw:"Cybersecurity Management",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-management",sv:720,kd:28,wk35:2,wk36:2,aio:false,trend:[10,7,11,10,5,10,8,11,5,4,3,4,6,4,1,3,2,2,2,4,12,9,7,9,7,4,3,3,3,3,2,2,2,3,2,2]},
  {kw:"Endpoint Security",url:"https://www.fortinet.com/resources/cyberglossary/what-is-endpoint-security",sv:1600,kd:49,wk35:5,wk36:3,aio:false,trend:[10,12,11,12,10,9,6,5,5,4,5,5,5,3,3,3,3,3,3,4,2,3,2,3,2,4,3,4,4,2,3,3,4,3,5,3]},
  {kw:"What Is Encryption",url:"https://www.fortinet.com/resources/cyberglossary/encryption",sv:3600,kd:75,wk35:6,wk36:13,aio:true,trend:[9,10,10,11,12,12,7,10,9,6,4,5,8,5,6,7,5,4,4,4,4,7,5,8,9,8,5,8,5,6,9,5,7,9,6,13]},
  {kw:"LDAP Authentication",url:"https://www.fortinet.com/resources/cyberglossary/ldap-authentication",sv:880,kd:24,wk35:1,wk36:1,aio:false,trend:[6,6,9,11,7,7,4,5,5,3,2,4,3,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Privileged Identity Management",url:"https://www.fortinet.com/resources/cyberglossary/privileged-identity-management",sv:6600,kd:33,wk35:2,wk36:2,aio:false,trend:[10,16,11,11,10,11,10,5,7,10,13,14,16,15,11,11,11,9,11,11,13,12,11,15,13,11,8,8,8,2,3,4,4,3,2,2]},
  {kw:"DMZ",url:"https://www.fortinet.com/resources/cyberglossary/what-is-dmz",sv:22200,kd:80,wk35:4,wk36:3,aio:true,trend:[5,5,4,5,4,5,5,3,5,5,4,5,4,4,6,7,7,7,5,6,6,8,7,10,7,8,6,6,5,3,3,4,3,4,4,3]},
  {kw:"Does VPN Affect Internet Speed",url:"https://www.fortinet.com/resources/cyberglossary/does-vpn-decrease-internet-speed",sv:90,kd:43,wk35:5,wk36:5,aio:true,trend:[3,3,7,4,3,1,1,1,2,3,3,4,3,3,3,3,3,3,3,3,2,2,5,5,3,5,5,1,1,3,4,4,4,5,5,5]},
  {kw:"Are VPNs Safe",url:"https://www.fortinet.com/resources/cyberglossary/are-vpns-safe",sv:1300,kd:34,wk35:6,wk36:7,aio:false,trend:[6,11,9,8,7,10,9,6,3,4,5,5,4,4,2,5,11,5,6,6,7,6,6,7,6,7,7,6,6,5,5,5,5,6,6,7]},
  {kw:"Threat Modeling",url:"https://www.fortinet.com/resources/cyberglossary/threat-modeling",sv:2900,kd:60,wk35:2,wk36:2,aio:false,trend:[11,13,11,11,7,12,10,10,10,10,7,9,9,8,10,10,10,6,13,11,13,14,13,12,17,11,12,12,11,2,2,2,2,2,2,2]},
  {kw:"Is VPN Safe",url:"https://www.fortinet.com/resources/cyberglossary/are-vpns-safe",sv:1300,kd:45,wk35:2,wk36:2,aio:true,trend:[3,3,4,3,3,6,5,4,2,4,3,4,4,3,2,5,5,4,5,5,6,6,6,6,6,6,6,6,5,2,2,2,2,2,2,2]},
  {kw:"Attack Vector",url:"https://www.fortinet.com/resources/cyberglossary/attack-vector",sv:1600,kd:48,wk35:5,wk36:6,aio:true,trend:[5,4,2,6,3,1,2,4,4,5,2,4,5,3,4,4,4,6,4,3,3,3,3,5,7,7,6,6,6,8,5,4,5,6,5,6]},
  {kw:"Service Set Identifier",url:"https://www.fortinet.com/resources/cyberglossary/service-set-identifier-ssid",sv:1300,kd:21,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Digital Rights Management",url:"https://www.fortinet.com/resources/cyberglossary/digital-rights-management-drm",sv:5400,kd:49,wk35:4,wk36:6,aio:true,trend:[2,2,4,3,2,2,1,2,3,2,2,3,2,2,2,2,2,2,2,1,2,2,3,3,3,3,3,3,3,6,6,6,6,4,4,6]},
  {kw:"Content Filtering",url:"https://www.fortinet.com/resources/cyberglossary/content-filtering",sv:2400,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is Splunk",url:"https://www.fortinet.com/resources/cyberglossary/what-is-splunk",sv:4400,kd:44,wk35:5,wk36:5,aio:false,trend:[5,5,5,4,2,3,3,3,2,5,4,3,4,3,2,2,2,3,2,1,2,2,2,2,2,2,2,2,2,5,5,2,2,3,5,5]},
  {kw:"What Is Proxy Server",url:"https://www.fortinet.com/resources/cyberglossary/proxy-server",sv:1600,kd:63,wk35:20,wk36:18,aio:true,trend:[3,4,5,4,6,5,4,1,1,1,1,1,1,2,6,2,3,3,3,3,2,2,2,3,2,2,2,3,3,14,14,12,15,17,20,18]},
  {kw:"Data Egress",url:"https://www.fortinet.com/resources/cyberglossary/data-egress",sv:320,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"IOT EDGE",url:"https://www.fortinet.com/resources/cyberglossary/iot-edge",sv:390,kd:50,wk35:2,wk36:2,aio:false,trend:[5,3,1,3,4,4,4,5,3,5,4,3,2,4,2,3,5,5,4,6,8,9,8,9,10,7,8,8,7,2,2,2,3,3,2,2]},
  {kw:"Http Proxy",url:"https://www.fortinet.com/resources/cyberglossary/http-proxy",sv:1900,kd:59,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Web Security Threats",url:"https://www.fortinet.com/resources/cyberglossary/web-security-threats",sv:110,kd:49,wk35:2,wk36:2,aio:false,trend:[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,5,3,5,4,3,2,2,2,2,2,2,2]},
  {kw:"Email Encryption",url:"https://www.fortinet.com/resources/cyberglossary/email-encryption",sv:2900,kd:51,wk35:6,wk36:4,aio:false,trend:[6,8,6,5,7,7,6,6,4,5,4,3,2,3,2,3,2,4,3,3,5,4,5,4,3,3,2,2,2,9,7,5,7,7,6,4]},
  {kw:"Brute Force Attack",url:"https://www.fortinet.com/resources/cyberglossary/brute-force-attack",sv:1900,kd:66,wk35:1,wk36:1,aio:true,trend:[8,9,9,8,7,10,7,3,4,4,3,6,2,2,2,4,4,4,4,5,5,7,7,7,9,7,6,5,5,2,2,2,1,1,1,1]},
  {kw:"Defense In Depth",url:"https://www.fortinet.com/resources/cyberglossary/defense-in-depth",sv:2900,kd:60,wk35:1,wk36:2,aio:true,trend:[3,3,2,2,3,3,2,3,3,6,2,2,2,2,2,1,1,2,2,1,1,1,1,1,1,1,2,2,2,5,4,4,5,3,1,2]},
  {kw:"Honey Tokens",url:"https://www.fortinet.com/resources/cyberglossary/honey-tokens",sv:320,kd:23,wk35:1,wk36:1,aio:true,trend:[2,2,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Attack Surface",url:"https://www.fortinet.com/resources/cyberglossary/attack-surface",sv:1900,kd:55,wk35:5,wk36:4,aio:true,trend:[3,2,4,3,3,2,3,3,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,3,2,2,2,2,5,6,5,6,6,5,4]},
  {kw:"Types Of Cyber Attacks",url:"https://www.fortinet.com/resources/cyberglossary/types-of-cyber-attacks",sv:2900,kd:68,wk35:1,wk36:1,aio:true,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Active Defense",url:"https://www.fortinet.com/resources/cyberglossary/active-defense",sv:170,kd:20,wk35:7,wk36:9,aio:true,trend:[4,2,2,4,3,2,3,3,3,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,2,4,3,1,1,1,1,1,2,7,7,9]},
  {kw:"Nist Compliance",url:"https://www.fortinet.com/resources/cyberglossary/nist-compliance",sv:1900,kd:32,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,2,2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Remote Access Trojan",url:"https://www.fortinet.com/resources/cyberglossary/remote-access-trojan",sv:4400,kd:42,wk35:2,wk36:2,aio:true,trend:[2,2,1,1,2,1,2,2,2,2,3,2,2,2,2,1,1,1,1,2,2,2,2,2,2,2,3,3,3,2,2,2,2,2,2,2]},
  {kw:"Malware Analysis",url:"https://www.fortinet.com/resources/cyberglossary/malware-analysis",sv:1300,kd:24,wk35:2,wk36:4,aio:true,trend:[10,8,9,7,10,11,8,7,5,7,7,6,8,4,1,4,4,6,5,7,7,8,10,10,12,9,9,8,5,4,10,11,9,3,2,4]},
  {kw:"Fake Hacking",url:"https://www.fortinet.com/resources/cyberglossary/fake-hacking",sv:5400,kd:51,wk35:10,wk36:12,aio:false,trend:[7,5,8,6,7,7,5,6,6,5,3,4,4,5,2,5,8,7,6,5,5,4,4,4,5,5,4,4,4,8,7,8,13,14,10,12]},
  {kw:"Pos Security",url:"https://www.fortinet.com/resources/cyberglossary/pos-security",sv:480,kd:20,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"IOT Security Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/iot-best-practices",sv:210,kd:37,wk35:1,wk36:1,aio:false,trend:[5,5,15,16,16,22,16,18,22,22,3,2,4,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is EDR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-edr",sv:2400,kd:63,wk35:2,wk36:3,aio:false,trend:[10,6,6,10,9,10,8,5,4,6,7,5,6,3,5,4,6,7,6,7,6,6,5,5,5,6,6,6,6,3,3,3,3,3,2,3]},
  {kw:"Types Of Endpoint Security",url:"https://www.fortinet.com/resources/cyberglossary/types-of-endpoint-security",sv:110,kd:26,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"WAN Aggregation",url:"https://www.fortinet.com/resources/cyberglossary/what-is-wan-aggregation",sv:260,kd:18,wk35:5,wk36:5,aio:true,trend:[2,3,3,2,2,1,1,1,1,1,1,1,1,2,1,1,2,6,4,6,7,11,8,8,10,8,5,8,1,1,1,2,4,5,5,5]},
  {kw:"UEBA",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ueba",sv:590,kd:44,wk35:4,wk36:5,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,3,3,3,1,2,4,4,2,2,2,2,1,1,1,2,3,5,3,3,7,7,3,3,5,4,5]},
  {kw:"What Is A Pst File",url:"https://www.fortinet.com/resources/cyberglossary/pst-file",sv:2400,kd:33,wk35:1,wk36:1,aio:true,trend:[6,3,2,3,2,3,3,3,5,5,4,2,2,2,2,5,5,2,2,3,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SAML Vs OAUTH",url:"https://www.fortinet.com/resources/cyberglossary/saml-vs-oauth",sv:1000,kd:31,wk35:1,wk36:1,aio:false,trend:[2,5,9,9,5,5,4,3,2,2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is Traceroute",url:"https://www.fortinet.com/resources/cyberglossary/traceroutes",sv:390,kd:21,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Authentication Token",url:"https://www.fortinet.com/resources/cyberglossary/authentication-token",sv:590,kd:51,wk35:9,wk36:9,aio:false,trend:[3,3,4,4,3,3,4,4,3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,9,9]},
  {kw:"Network Traffic",url:"https://www.fortinet.com/resources/cyberglossary/network-traffic",sv:720,kd:41,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Internet Fraud",url:"https://www.fortinet.com/resources/cyberglossary/internet-fraud",sv:1300,kd:78,wk35:3,wk36:3,aio:false,trend:[5,4,6,5,6,3,4,4,6,8,3,5,5,3,2,2,2,2,2,2,3,4,3,3,4,4,5,5,3,2,1,2,2,4,3,3]},
  {kw:"802.1X Authentication",url:"https://www.fortinet.com/resources/cyberglossary/802-1x-authentication",sv:1300,kd:24,wk35:1,wk36:1,aio:false,trend:[2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Network Access Control List",url:"https://www.fortinet.com/resources/cyberglossary/network-access-control-list",sv:480,kd:38,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is An Open Proxy",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-open-proxy",sv:110,kd:17,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is An API Key",url:"https://www.fortinet.com/resources/cyberglossary/api-key",sv:8100,kd:44,wk35:2,wk36:2,aio:false,trend:[3,4,4,4,4,4,3,3,3,4,3,3,3,2,1,1,2,2,2,2,3,3,2,3,2,3,2,2,2,2,1,1,2,2,2,2]},
  {kw:"Radius Protocol",url:"https://www.fortinet.com/resources/cyberglossary/radius-protocol",sv:1900,kd:44,wk35:2,wk36:2,aio:true,trend:[3,2,1,2,3,2,2,2,4,2,3,2,2,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,2,2,2,2,2,2]},
  {kw:"Transparent Proxy",url:"https://www.fortinet.com/resources/cyberglossary/transparent-proxy",sv:480,kd:25,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"OCSP",url:"https://www.fortinet.com/resources/cyberglossary/ocsp",sv:2900,kd:49,wk35:4,wk36:3,aio:true,trend:[4,2,3,4,4,4,4,4,3,3,2,2,2,2,2,2,2,2,3,2,1,2,2,1,1,2,3,3,3,4,4,2,3,3,4,3]},
  {kw:"Centralized Management",url:"https://www.fortinet.com/resources/cyberglossary/centralized-management",sv:590,kd:24,wk35:8,wk36:9,aio:true,trend:[6,5,2,4,3,7,4,7,5,4,3,4,2,4,2,4,3,5,4,3,4,2,2,1,4,6,3,1,1,4,9,9,10,9,8,9]},
  {kw:"Benefits Of VPN",url:"https://www.fortinet.com/resources/cyberglossary/benefits-of-vpn",sv:1900,kd:62,wk35:10,wk36:4,aio:false,trend:[7,7,6,5,7,7,6,2,2,5,3,1,3,3,4,3,4,5,3,3,3,2,3,2,2,2,3,2,2,11,11,10,10,10,10,4]},
  {kw:"VPN Split Tunneling",url:"https://www.fortinet.com/resources/cyberglossary/vpn-split-tunneling",sv:880,kd:42,wk35:2,wk36:2,aio:true,trend:[4,2,7,4,4,3,6,2,3,4,7,2,3,5,2,2,2,2,2,2,3,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2]},
  {kw:"Proxy Vs VPN",url:"https://www.fortinet.com/resources/cyberglossary/proxy-vs-vpn",sv:4400,kd:53,wk35:2,wk36:2,aio:true,trend:[3,2,1,2,2,9,6,3,4,4,4,3,4,5,2,4,5,4,5,4,3,3,2,4,4,3,3,2,2,1,2,2,2,2,2,2]},
  {kw:"AAA Security",url:"https://www.fortinet.com/resources/cyberglossary/aaa-security",sv:880,kd:51,wk35:5,wk36:4,aio:false,trend:[4,5,4,4,3,5,4,4,4,6,5,6,5,6,4,3,5,6,6,5,6,7,6,5,5,5,5,5,4,4,5,4,5,5,5,4]},
  {kw:"Network EDGE",url:"https://www.fortinet.com/resources/cyberglossary/network-edge",sv:480,kd:49,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Operational Security",url:"https://www.fortinet.com/resources/cyberglossary/operational-security",sv:1600,kd:37,wk35:4,wk36:4,aio:true,trend:[2,2,3,3,4,4,3,4,2,4,3,2,3,2,2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,4,4,4]},
  {kw:"Hybrid Data Center",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-data-center",sv:170,kd:16,wk35:8,wk36:7,aio:true,trend:[2,2,1,2,2,2,4,12,2,2,2,3,3,2,2,3,2,2,2,1,1,2,5,2,2,4,3,2,2,8,9,9,9,9,8,7]},
  {kw:"How To Setup A Proxy Server",url:"https://www.fortinet.com/resources/cyberglossary/how-to-setup-a-proxy-server",sv:590,kd:34,wk35:3,wk36:4,aio:false,trend:[9,8,5,8,7,5,5,4,4,3,3,6,5,6,7,7,7,7,7,2,1,1,5,8,7,12,15,11,11,6,4,2,3,3,3,4]},
  {kw:"Message Authentication Code",url:"https://www.fortinet.com/resources/cyberglossary/message-authentication-code",sv:390,kd:39,wk35:7,wk36:11,aio:true,trend:[2,2,3,3,3,3,3,3,3,3,4,3,3,3,2,2,3,2,2,2,2,2,2,1,2,2,4,3,3,7,7,8,8,8,7,11]},
  {kw:"DNS Security",url:"https://www.fortinet.com/resources/cyberglossary/dns-security",sv:1300,kd:39,wk35:10,wk36:11,aio:true,trend:[2,2,1,2,2,2,4,6,6,6,7,5,3,5,7,3,2,4,4,6,3,3,3,3,3,6,8,6,4,7,7,8,9,8,10,11]},
  {kw:"Healthcare Data Security",url:"https://www.fortinet.com/resources/cyberglossary/healthcare-data-security",sv:590,kd:20,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Data Center Security",url:"https://www.fortinet.com/resources/cyberglossary/data-center-security",sv:2400,kd:36,wk35:1,wk36:1,aio:false,trend:[11,16,13,13,12,13,9,8,7,5,7,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cybersecurity Mesh",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cybersecurity-mesh",sv:210,kd:34,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Hacking",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hacking",sv:18100,kd:54,wk35:1,wk36:1,aio:false,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"How Does A VPN Work",url:"https://www.fortinet.com/resources/cyberglossary/how-does-vpn-work",sv:5400,kd:64,wk35:1,wk36:1,aio:true,trend:[2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"CIA Triad",url:"https://www.fortinet.com/resources/cyberglossary/cia-triad",sv:9900,kd:46,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Security-As-A-Service",url:"https://www.fortinet.com/resources/cyberglossary/security-as-a-service",sv:50,kd:23,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Compliance Automation",url:"https://www.fortinet.com/resources/cyberglossary/compliance-automation",sv:1000,kd:31,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Data Deduplication",url:"https://www.fortinet.com/resources/cyberglossary/data-deduplication",sv:480,kd:43,wk35:8,wk36:7,aio:false,trend:[13,15,16,13,11,13,8,10,8,12,8,3,11,11,11,12,11,10,8,9,12,7,13,14,13,11,12,12,11,9,8,9,8,9,8,7]},
  {kw:"Tcp Ip Model Vs Osi Model",url:"https://www.fortinet.com/resources/cyberglossary/tcp-ip-model-vs-osi-model",sv:880,kd:23,wk35:1,wk36:1,aio:false,trend:[1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Tailgating Attack",url:"https://www.fortinet.com/resources/cyberglossary/tailgating-attack",sv:1600,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,3,2,2,2,2,3,2,2,2,3,2,2,3,2,2,3,2,2,3,2,1,1,1,1,1]},
  {kw:"Data Security",url:"https://www.fortinet.com/resources/cyberglossary/data-security",sv:9900,kd:70,wk35:5,wk36:5,aio:false,trend:[6,11,12,12,10,10,9,6,6,4,5,6,7,5,2,3,5,2,2,2,3,3,3,3,2,3,3,3,3,5,5,5,7,6,5,5]},
  {kw:"Phishing Email Analysis",url:"https://www.fortinet.com/resources/cyberglossary/phishing-email-analysis",sv:50,kd:25,wk35:1,wk36:1,aio:false,trend:[1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1]},
  {kw:"Data Exfiltration",url:"https://www.fortinet.com/resources/cyberglossary/data-exfiltration",sv:1300,kd:20,wk35:1,wk36:1,aio:false,trend:[11,15,13,14,16,14,14,11,5,6,5,5,7,3,5,6,3,4,2,2,4,2,2,2,2,2,2,2,2,4,1,1,1,1,1,1]},
  {kw:"PGP Encryption",url:"https://www.fortinet.com/resources/cyberglossary/pgp-encryption",sv:3600,kd:57,wk35:4,wk36:4,aio:false,trend:[3,3,2,5,4,4,5,2,1,1,6,3,6,5,3,3,2,3,1,3,3,3,3,3,2,3,2,3,3,5,4,3,5,5,4,4]},
  {kw:"Unified Threat Management",url:"https://www.fortinet.com/resources/cyberglossary/unified-threat-management",sv:4400,kd:32,wk35:1,wk36:1,aio:true,trend:[2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"URL Phishing",url:"https://www.fortinet.com/resources/cyberglossary/url-phishing",sv:210,kd:57,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,28,1,1,1,1,1,1,1,1]},
  {kw:"It Security Policy",url:"https://www.fortinet.com/resources/cyberglossary/it-security-policy",sv:720,kd:41,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"DNS Hijacking",url:"https://www.fortinet.com/resources/cyberglossary/dns-hijacking",sv:720,kd:40,wk35:6,wk36:7,aio:false,trend:[3,3,1,1,2,3,2,3,4,4,4,3,4,3,3,3,2,2,2,2,3,4,3,3,2,3,4,4,4,5,8,7,7,7,6,7]},
  {kw:"DOS Vs DDOS",url:"https://www.fortinet.com/resources/cyberglossary/dos-vs-ddos",sv:880,kd:20,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Whaling Attack",url:"https://www.fortinet.com/resources/cyberglossary/whaling-attack",sv:1300,kd:22,wk35:4,wk36:5,aio:false,trend:[2,2,2,2,2,2,2,3,4,3,2,2,3,3,2,3,2,4,4,4,4,4,3,2,2,3,2,2,2,6,7,6,6,6,4,5]},
  {kw:"Botnet",url:"https://www.fortinet.com/resources/cyberglossary/what-is-botnet",sv:6600,kd:60,wk35:5,wk36:3,aio:false,trend:[2,5,5,5,6,4,3,4,6,6,7,6,5,6,2,4,3,3,5,5,3,5,7,7,6,5,4,4,4,3,3,3,3,5,5,3]},
  {kw:"Port Scan",url:"https://www.fortinet.com/resources/cyberglossary/what-is-port-scan",sv:2400,kd:68,wk35:9,wk36:10,aio:false,trend:[6,6,6,6,4,4,5,6,6,6,5,7,6,6,5,4,3,4,4,4,4,3,3,4,4,4,4,4,4,10,11,8,6,8,9,10]},
  {kw:"Digital Certificates",url:"https://www.fortinet.com/resources/cyberglossary/digital-certificates",sv:1000,kd:50,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,2,2,2,4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Eavesdropping Attack",url:"https://www.fortinet.com/resources/cyberglossary/eavesdropping",sv:70,kd:26,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Border Gateway Protocol",url:"https://www.fortinet.com/resources/cyberglossary/bgp-border-gateway-protocol",sv:2400,kd:40,wk35:3,wk36:3,aio:false,trend:[7,10,8,8,5,8,7,7,5,7,7,7,8,6,5,9,6,2,6,7,8,8,7,6,10,14,9,18,16,3,3,3,4,4,3,3]},
  {kw:"SSPM",url:"https://www.fortinet.com/resources/cyberglossary/saas-security-posture-management",sv:320,kd:33,wk35:7,wk36:3,aio:true,trend:[1,2,1,2,1,2,3,3,3,7,1,2,4,1,2,4,2,2,1,1,1,1,1,1,5,5,5,4,2,8,9,10,9,9,7,3]},
  {kw:"Cyber Extortion",url:"https://www.fortinet.com/resources/cyberglossary/cyber-extortion",sv:590,kd:25,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Devops Security",url:"https://www.fortinet.com/resources/cyberglossary/devops-security",sv:1300,kd:41,wk35:2,wk36:2,aio:true,trend:[3,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,3,2,2,2,2,2,3,2,2,5,2,2,2,2,3,4,3,2,2]},
  {kw:"Confidential Computing",url:"https://www.fortinet.com/resources/cyberglossary/confidential-computing",sv:880,kd:66,wk35:5,wk36:4,aio:false,trend:[19,17,16,20,16,18,15,9,14,13,10,8,14,13,2,12,13,10,9,12,6,10,11,10,11,11,14,14,14,3,4,4,5,5,5,4]},
  {kw:"Scareware",url:"https://www.fortinet.com/resources/cyberglossary/scareware",sv:2400,kd:44,wk35:8,wk36:8,aio:false,trend:[2,3,4,3,2,4,3,3,5,2,3,3,2,2,2,2,4,5,8,10,5,7,8,8,10,9,8,8,5,10,9,8,8,8,8,8]},
  {kw:"Trojan Horse Virus",url:"https://www.fortinet.com/resources/cyberglossary/trojan-horse-virus",sv:2900,kd:62,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Canary In Cybersecurity",url:"https://www.fortinet.com/resources/cyberglossary/what-is-canary-in-cybersecurity",sv:40,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Email Security",url:"https://www.fortinet.com/resources/cyberglossary/email-security",sv:5400,kd:50,wk35:8,wk36:10,aio:false,trend:[8,9,9,12,13,12,8,7,4,8,8,8,10,8,2,3,3,5,6,7,11,13,12,12,11,8,5,6,5,8,9,10,9,8,8,10]},
  {kw:"Cybersecurity Tools For Small Business",url:"https://www.fortinet.com/resources/cyberglossary/smb-cybersecurity-tools",sv:10,kd:50,wk35:3,wk36:3,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,3,3,3]},
  {kw:"Ransomware Settlement",url:"https://www.fortinet.com/resources/cyberglossary/recent-ransomware-settlements",sv:40,kd:43,wk35:10,wk36:10,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,2,2,2,2,2,2,2,2,2,12,12,16,13,10,10,10]},
  {kw:"Fileless Malware",url:"https://www.fortinet.com/resources/cyberglossary/fileless-malware",sv:1000,kd:39,wk35:8,wk36:13,aio:true,trend:[5,9,2,4,5,6,3,5,5,6,4,4,6,5,3,4,3,4,4,4,4,5,5,7,7,6,8,6,5,6,4,7,5,7,8,13]},
  {kw:"Keyloggers",url:"https://www.fortinet.com/resources/cyberglossary/what-is-keyloggers",sv:1900,kd:53,wk35:1,wk36:1,aio:false,trend:[3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Microsegmentation",url:"https://www.fortinet.com/resources/cyberglossary/microsegmentation",sv:1900,kd:50,wk35:3,wk36:3,aio:false,trend:[9,9,11,9,7,10,9,9,11,11,7,8,6,6,2,8,9,9,10,9,6,8,10,8,9,8,8,8,6,5,5,4,4,5,3,3]},
  {kw:"Cybersquatting",url:"https://www.fortinet.com/resources/cyberglossary/cybersquatting",sv:1000,kd:46,wk35:11,wk36:15,aio:false,trend:[8,12,11,12,13,15,12,8,7,7,12,8,7,8,8,11,8,13,12,13,10,9,12,13,13,12,13,14,12,16,14,15,18,12,11,15]},
  {kw:"What Is Firmware",url:"https://www.fortinet.com/resources/cyberglossary/what-is-firmware",sv:9900,kd:47,wk35:12,wk36:15,aio:true,trend:[1,3,2,2,3,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,13,13,13,14,14,12,15]},
  {kw:"User Datagram Protocol",url:"https://www.fortinet.com/resources/cyberglossary/user-datagram-protocol-udp",sv:8100,kd:64,wk35:7,wk36:7,aio:true,trend:[12,13,13,12,10,10,10,8,8,7,4,5,5,7,3,2,2,6,4,3,4,3,4,4,6,1,6,3,2,4,6,5,9,8,7,7]},
  {kw:"Certificate Management",url:"https://www.fortinet.com/resources/cyberglossary/certificate-management",sv:720,kd:28,wk35:2,wk36:2,aio:false,trend:[7,15,11,2,7,8,3,2,7,3,2,3,5,5,5,2,2,3,6,3,9,5,4,7,7,8,6,7,6,3,2,3,4,3,2,2]},
  {kw:"What Is Url Filtering",url:"https://www.fortinet.com/resources/cyberglossary/what-is-url-filtering",sv:1000,kd:35,wk35:7,wk36:7,aio:false,trend:[3,2,1,2,2,2,5,6,5,4,3,4,6,5,2,5,2,4,3,5,2,3,2,2,1,1,2,2,2,4,9,10,8,5,7,7]},
  {kw:"Diy Vs Managed SD WAN",url:"https://www.fortinet.com/resources/cyberglossary/diy-vs-managed-sd-wan",sv:70,kd:7,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"QOS",url:"https://www.fortinet.com/resources/cyberglossary/qos-quality-of-service",sv:9900,kd:50,wk35:3,wk36:2,aio:true,trend:[1,1,1,1,1,1,2,2,4,2,2,3,3,2,2,2,3,3,3,3,2,3,4,3,3,3,4,3,3,2,2,2,2,3,3,2]},
  {kw:"Branch Networking",url:"https://www.fortinet.com/resources/cyberglossary/what-is-branch-networking",sv:50,kd:24,wk35:2,wk36:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,3,2,2,2,2,3,3,3,3,3,2,2,2,3,2,2]},
  {kw:"MPLS",url:"https://www.fortinet.com/resources/cyberglossary/mpls",sv:18100,kd:50,wk35:9,wk36:9,aio:true,trend:[8,5,4,3,5,5,3,7,8,6,3,4,4,6,5,3,4,4,4,7,3,5,7,8,5,6,9,11,9,8,8,8,9,10,9,9]},
  {kw:"Failover",url:"https://www.fortinet.com/resources/cyberglossary/failover",sv:1600,kd:44,wk35:2,wk36:3,aio:false,trend:[12,13,11,10,6,2,2,5,6,4,5,2,3,3,4,3,2,4,3,3,3,2,4,4,4,3,3,4,4,2,2,2,2,3,2,3]},
  {kw:"Lateral Movement",url:"https://www.fortinet.com/resources/cyberglossary/lateral-movement",sv:5400,kd:45,wk35:12,wk36:11,aio:true,trend:[8,8,9,8,6,8,8,7,7,6,5,9,9,7,6,4,6,5,6,7,7,6,8,6,7,7,7,6,6,11,11,11,13,8,12,11]},
  {kw:"Site To Site VPN",url:"https://www.fortinet.com/resources/cyberglossary/what-is-site-to-site-vpn",sv:6600,kd:66,wk35:15,wk36:10,aio:false,trend:[8,5,7,7,5,6,6,2,3,2,4,3,3,2,3,2,3,3,2,2,2,2,2,2,5,3,2,2,2,18,16,9,5,12,15,10]},
  {kw:"Ransomware Removal",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-removal",sv:880,kd:60,wk35:1,wk36:1,aio:true,trend:[2,3,3,3,6,2,2,3,3,3,2,2,2,1,2,4,5,4,2,7,6,12,6,12,4,6,5,3,1,1,1,1,1,1,1,1]},
  {kw:"Endpoint Security For Mobile Devices",url:"https://www.fortinet.com/resources/cyberglossary/endpoint-security-for-mobile-devices",sv:20,kd:14,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Shift Left Security",url:"https://www.fortinet.com/resources/cyberglossary/shift-left-security",sv:880,kd:39,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is An Ip Address",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ip-address",sv:135000,kd:57,wk35:1,wk36:1,aio:true,trend:[4,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SPAM Filtering",url:"https://www.fortinet.com/resources/cyberglossary/spam-filters",sv:590,kd:45,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"IOT Device Vulnerabilities",url:"https://www.fortinet.com/resources/cyberglossary/iot-device-vulnerabilities",sv:70,kd:31,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"DDOS Mitigation",url:"https://www.fortinet.com/resources/cyberglossary/implement-ddos-mitigation-strategy",sv:90,kd:33,wk35:6,wk36:4,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,11,11,9,8,9,9,13,11,10,6,4]},
  {kw:"What Is Time To Live",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ttl",sv:8100,kd:63,wk35:12,wk36:12,aio:false,trend:[10,9,10,10,10,9,7,9,7,9,7,6,8,7,5,6,6,7,6,8,6,5,6,4,1,11,5,11,11,11,14,13,12,11,12,12]},
  {kw:"Malware Vs Virus Vs Worm",url:"https://www.fortinet.com/resources/cyberglossary/malware-vs-virus-vs-worm",sv:20,kd:30,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Login Credentials",url:"https://www.fortinet.com/resources/cyberglossary/login-credentials",sv:1300,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Ransomware Jargon",url:"https://www.fortinet.com/resources/cyberglossary/definitions-of-jargon-ransomware",sv:10,kd:39,wk35:1,wk36:1,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Pretexting",url:"https://www.fortinet.com/resources/cyberglossary/pretexting",sv:4400,kd:43,wk35:2,wk36:2,aio:false,trend:[1,1,1,5,4,4,6,6,6,7,6,4,6,4,4,4,6,6,5,10,4,6,8,9,10,5,9,6,5,2,2,2,1,2,2,2]},
  {kw:"ICS Security",url:"https://www.fortinet.com/resources/cyberglossary/ics-security",sv:1600,kd:63,wk35:6,wk36:4,aio:false,trend:[14,17,15,16,14,11,9,8,8,9,8,8,6,7,3,6,6,9,6,8,6,6,5,5,5,8,9,9,9,10,8,5,5,6,6,4]},
  {kw:"Fortinet DOJ",url:"https://www.fortinet.com/resources/cyberglossary/definitions-of-jargon",sv:20,kd:22,wk35:7,wk36:7,aio:false,trend:[2,3,3,3,3,2,2,2,2,3,2,3,2,2,2,2,2,2,1,1,1,2,1,1,1,2,2,3,2,5,5,5,5,7,7,7]},
  {kw:"Wireless Network",url:"https://www.fortinet.com/resources/cyberglossary/wireless-network",sv:2400,kd:43,wk35:2,wk36:2,aio:true,trend:[5,4,2,6,6,6,5,5,3,3,5,4,4,5,3,3,4,3,2,3,3,3,3,3,2,2,3,3,2,2,3,3,3,2,2,2]},
  {kw:"What Is DNS",url:"https://www.fortinet.com/resources/cyberglossary/what-is-dns",sv:18100,kd:59,wk35:1,wk36:1,aio:true,trend:[7,7,8,9,9,8,7,8,8,6,5,5,5,4,4,6,4,3,4,6,4,4,5,7,3,7,5,6,4,6,3,6,6,1,1,1]},
  {kw:"What Is Https",url:"https://www.fortinet.com/resources/cyberglossary/what-is-https",sv:2900,kd:54,wk35:26,wk36:23,aio:false,trend:[7,7,7,8,8,9,8,7,7,6,5,5,4,6,3,8,8,9,9,9,9,10,9,8,9,8,7,9,9,15,13,15,14,27,26,23]},
  {kw:"Ransomware As A Service",url:"https://www.fortinet.com/resources/cyberglossary/ransomware-as-a-service-raas",sv:720,kd:47,wk35:2,wk36:4,aio:false,trend:[5,5,4,4,4,4,4,4,4,3,4,4,5,5,5,4,5,5,5,4,5,5,4,4,5,4,4,4,4,4,4,4,4,1,2,4]},
  {kw:"TCP/IP",url:"https://www.fortinet.com/resources/cyberglossary/tcp-ip",sv:8100,kd:66,wk35:3,wk36:3,aio:false,trend:[4,2,3,5,7,5,5,3,3,4,4,3,4,4,5,2,3,4,3,2,2,2,3,3,2,2,2,2,2,3,4,3,2,3,3,3]},
  {kw:"What Is An Insider Threat",url:"https://www.fortinet.com/resources/cyberglossary/insider-threats",sv:4400,kd:48,wk35:5,wk36:5,aio:false,trend:[3,3,5,4,3,4,3,4,5,2,3,3,4,3,3,2,3,4,3,4,3,3,3,3,2,2,5,4,4,9,6,6,7,5,5,5]},
  {kw:"Static Vs Dynamic Ip Address",url:"https://www.fortinet.com/resources/cyberglossary/static-vs-dynamic-ip",sv:1300,kd:36,wk35:1,wk36:1,aio:true,trend:[3,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Smurf Attack",url:"https://www.fortinet.com/resources/cyberglossary/smurf-attack",sv:1600,kd:41,wk35:11,wk36:9,aio:false,trend:[1,1,1,3,3,4,4,2,3,3,2,4,4,3,3,4,3,2,2,2,5,5,3,5,5,4,5,5,5,21,8,7,21,22,11,9]},
  {kw:"Cybersecurity TIPS For Small Businesses",url:"https://www.fortinet.com/resources/cyberglossary/10-cybersecurity-tips-small-business",sv:390,kd:58,wk35:7,wk36:9,aio:false,trend:[5,5,4,3,4,3,3,2,2,2,5,6,5,5,2,3,3,3,3,3,2,2,2,2,4,2,4,4,4,8,9,6,3,4,7,9]},
  {kw:"Data Loss Prevention",url:"https://www.fortinet.com/resources/cyberglossary/dlp",sv:1900,kd:48,wk35:12,wk36:14,aio:false,trend:[2,2,1,2,2,2,2,2,3,4,4,3,3,3,2,2,2,2,3,2,2,2,2,2,11,12,2,13,12,14,15,17,15,15,12,14]},
  {kw:"Network Access Control",url:"https://www.fortinet.com/resources/cyberglossary/what-is-network-access-control",sv:390,kd:39,wk35:4,wk36:4,aio:true,trend:[3,2,3,3,3,1,2,7,3,2,2,2,4,1,1,1,1,1,1,1,1,1,1,1,2,5,2,7,6,5,4,5,4,5,4,4]},
  {kw:"Dark Web Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/dark-web-monitoring",sv:590,kd:41,wk35:2,wk36:2,aio:false,trend:[2,6,6,3,5,2,3,3,5,5,2,3,3,3,3,4,2,5,4,3,6,5,5,4,8,7,4,7,7,3,2,3,2,2,2,2]},
  {kw:"Caching",url:"https://www.fortinet.com/resources/cyberglossary/what-is-caching",sv:8100,kd:74,wk35:22,wk36:25,aio:false,trend:[9,7,8,10,11,3,7,4,7,3,9,8,6,7,2,10,12,12,12,12,13,11,11,13,11,10,9,9,9,20,21,23,19,28,22,25]},
  {kw:"What Is Spyware",url:"https://www.fortinet.com/resources/cyberglossary/spyware",sv:2900,kd:63,wk35:39,wk36:37,aio:true,trend:[9,4,7,5,6,7,4,2,3,2,2,4,4,3,8,2,2,4,3,3,4,5,4,4,5,3,2,2,2,35,44,44,41,38,39,37]},
  {kw:"Code Scanning",url:"https://www.fortinet.com/resources/cyberglossary/code-scanning",sv:720,kd:52,wk35:30,wk36:30,aio:false,trend:[4,4,3,4,3,2,3,3,4,3,2,3,4,3,2,3,3,2,3,3,3,3,3,3,3,4,3,3,3,13,38,38,25,38,30,30]},
  {kw:"Cybersecurity Statistics",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-statistics",sv:590,kd:61,wk35:12,wk36:11,aio:true,trend:[1,1,1,2,2,3,3,3,2,2,3,3,3,4,3,4,4,4,5,7,3,4,5,3,5,3,5,3,3,11,10,12,12,13,12,11]},
  {kw:"Pharming",url:"https://www.fortinet.com/resources/cyberglossary/pharming",sv:3600,kd:56,wk35:7,wk36:9,aio:false,trend:[4,3,5,4,4,5,4,4,3,5,3,2,2,3,4,2,2,3,3,3,3,4,3,5,4,3,3,3,3,9,10,9,8,8,7,9]},
  {kw:"What Is An Exploit",url:"https://www.fortinet.com/resources/cyberglossary/exploit",sv:480,kd:38,wk35:3,wk36:9,aio:false,trend:[6,8,9,6,7,6,7,9,8,8,8,8,5,5,2,7,2,4,3,3,4,8,6,7,10,7,8,8,8,26,20,10,16,4,3,9]},
  {kw:"Vulnerability Assessment",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-assessment",sv:9900,kd:47,wk35:1,wk36:1,aio:false,trend:[2,2,2,2,3,3,2,3,4,5,6,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is A Bot",url:"https://www.fortinet.com/resources/cyberglossary/bot",sv:8100,kd:47,wk35:3,wk36:3,aio:false,trend:[3,3,3,3,3,5,4,3,3,3,4,3,2,3,4,4,6,6,7,7,7,8,8,8,8,7,8,8,8,5,3,4,3,4,3,3]},
  {kw:"DDOS Protection",url:"https://www.fortinet.com/resources/cyberglossary/ddos-protection",sv:2900,kd:72,wk35:4,wk36:2,aio:true,trend:[2,2,1,2,2,6,6,4,4,4,3,5,7,5,4,4,4,4,5,4,4,4,4,5,5,5,5,5,5,3,3,3,2,3,4,2]},
  {kw:"What Is Openstack",url:"https://www.fortinet.com/resources/cyberglossary/openstack",sv:480,kd:54,wk35:18,wk36:20,aio:false,trend:[9,11,11,11,10,11,10,10,10,8,9,11,10,10,9,9,9,11,9,9,10,23,12,4,7,10,10,10,10,22,20,23,24,21,18,20]},
  {kw:"Hybrid It",url:"https://www.fortinet.com/resources/cyberglossary/hybrid-it",sv:720,kd:31,wk35:5,wk36:5,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,5,3,3,3,2,2,4,3,6,9,6,5,7,5,3,4,5,5,5]},
  {kw:"Krack Attack",url:"https://www.fortinet.com/resources/cyberglossary/krack-attack",sv:170,kd:28,wk35:3,wk36:2,aio:false,trend:[5,5,5,5,5,5,5,4,5,4,4,4,4,6,5,6,6,4,4,2,2,1,1,3,5,4,4,4,4,2,3,3,3,3,3,2]},
  {kw:"Thin Client",url:"https://www.fortinet.com/resources/cyberglossary/thin-client",sv:4400,kd:49,wk35:8,wk36:9,aio:true,trend:[2,3,3,6,2,1,1,2,5,3,3,2,4,3,9,2,4,4,3,2,3,3,4,3,3,3,3,3,3,10,11,10,11,10,8,9]},
  {kw:"CIAM",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ciam",sv:3600,kd:55,wk35:28,wk36:30,aio:false,trend:[8,8,3,9,9,9,4,6,9,9,7,8,8,9,6,12,16,15,16,19,19,16,17,19,17,13,14,13,13,9,10,3,9,4,28,30]},
  {kw:"Spear Phishing",url:"https://www.fortinet.com/resources/cyberglossary/spear-phishing",sv:12100,kd:51,wk35:5,wk36:2,aio:false,trend:[9,12,7,10,8,10,9,9,10,9,7,6,6,5,10,4,4,7,6,4,6,10,6,5,7,7,11,7,4,8,2,2,3,2,5,2]},
  {kw:"Advanced Threat Protection",url:"https://www.fortinet.com/resources/cyberglossary/advanced-threat-protection-atp",sv:1600,kd:33,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Network As A Service",url:"https://www.fortinet.com/resources/cyberglossary/network-as-a-service",sv:1600,kd:10,wk35:5,wk36:7,aio:false,trend:[4,9,2,5,9,12,11,8,6,3,6,7,9,8,10,6,2,4,7,5,6,5,3,5,2,4,6,6,4,5,5,5,5,5,5,7]},
  {kw:"Managed Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/managed-detection-and-response",sv:3600,kd:49,wk35:8,wk36:8,aio:false,trend:[11,13,15,15,16,15,12,12,9,5,6,11,14,12,12,15,19,24,24,20,11,16,27,30,31,28,26,25,25,11,10,10,9,9,8,8]},
  {kw:"What Is SSO?",url:"https://www.fortinet.com/resources/cyberglossary/single-sign-on",sv:5400,kd:61,wk35:9,wk36:10,aio:false,trend:[3,5,5,3,4,5,5,2,3,1,1,2,4,2,3,2,2,4,3,3,3,2,2,2,2,2,3,2,2,9,7,8,8,8,9,10]},
  {kw:"What Is Internet Security",url:"https://www.fortinet.com/resources/cyberglossary/internet-security",sv:2900,kd:43,wk35:4,wk36:5,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,2,4,5]},
  {kw:"Wireless Security TIPS",url:"https://www.fortinet.com/resources/cyberglossary/wireless-security-tips",sv:20,kd:46,wk35:1,wk36:2,aio:false,trend:[4,2,2,2,2,3,3,3,3,4,2,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,3,1,1,2,1,1,1,1,1,2]},
  {kw:"What Is PCI Compliance",url:"https://www.fortinet.com/resources/cyberglossary/what-is-pci-compliance",sv:4400,kd:44,wk35:9,wk36:6,aio:true,trend:[10,12,9,4,3,8,6,5,5,4,5,4,4,3,4,3,3,3,2,2,3,3,3,2,2,2,2,2,2,10,8,8,7,9,9,6]},
  {kw:"SQL Injection",url:"https://www.fortinet.com/resources/cyberglossary/sql-injection",sv:9900,kd:74,wk35:4,wk36:5,aio:false,trend:[8,12,14,13,16,16,14,13,15,12,11,11,12,10,9,15,12,13,17,25,15,10,13,20,29,14,15,13,12,9,10,10,9,6,4,5]},
  {kw:"Sextortion",url:"https://www.fortinet.com/resources/cyberglossary/sextortion",sv:12100,kd:76,wk35:8,wk36:8,aio:false,trend:[2,6,6,5,8,13,8,8,13,14,19,18,16,5,4,2,3,12,10,10,14,11,11,16,15,15,15,15,15,8,9,7,9,8,8,8]},
  {kw:"Web ScrAPIng",url:"https://www.fortinet.com/resources/cyberglossary/web-scraping",sv:1830000,kd:64,wk35:2,wk36:2,aio:false,trend:[12,4,2,6,5,5,4,4,6,6,4,6,6,7,10,9,9,8,10,8,8,8,6,10,10,10,8,9,4,5,6,2,2,2,2,2]},
  {kw:"PKI",url:"https://www.fortinet.com/resources/cyberglossary/public-key-infrastructure",sv:22200,kd:78,wk35:3,wk36:3,aio:false,trend:[4,8,8,3,11,8,8,7,7,8,7,7,6,6,8,8,9,10,9,8,11,12,11,11,10,10,9,10,9,2,3,4,3,4,3,3]},
  {kw:"PAAS",url:"https://www.fortinet.com/resources/cyberglossary/platform-as-a-service",sv:14800,kd:71,wk35:2,wk36:2,aio:false,trend:[7,9,9,9,10,11,9,10,9,7,6,6,7,6,10,6,10,9,11,11,11,13,11,11,11,9,9,9,9,2,2,3,2,3,2,2]},
  {kw:"Mobile Device Management",url:"https://www.fortinet.com/resources/cyberglossary/mobile-device-management",sv:6600,kd:64,wk35:4,wk36:8,aio:false,trend:[5,4,4,3,6,8,5,5,7,7,3,4,4,5,8,5,8,7,5,9,6,7,5,7,4,4,7,3,3,2,3,2,4,7,4,8]},
  {kw:"How To Prevent Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/how-to-prevent-ransomware",sv:1300,kd:54,wk35:4,wk36:3,aio:false,trend:[2,2,12,11,13,13,9,10,6,5,3,5,4,5,10,3,6,7,5,5,2,2,2,3,2,2,3,2,2,2,1,1,2,4,4,3]},
  {kw:"Remote Desktop Protocol",url:"https://www.fortinet.com/resources/cyberglossary/remote-desktop-protocol",sv:2900,kd:49,wk35:20,wk36:19,aio:true,trend:[7,5,3,5,6,6,3,5,6,6,7,5,2,2,3,5,5,5,5,7,6,6,6,6,7,6,9,8,8,10,18,14,13,17,20,19]},
  {kw:"Cyber Glossary",url:"https://www.fortinet.com/resources/cyberglossary",sv:20,kd:42,wk35:6,wk36:3,aio:false,trend:[9,10,3,8,8,8,8,9,11,7,8,9,4,6,8,5,4,20,20,20,20,20,15,11,11,2,8,2,2,12,17,6,9,9,6,3]},
  {kw:"Solarwinds Cyber Attack",url:"https://www.fortinet.com/resources/cyberglossary/solarwinds-cyber-attack",sv:390,kd:61,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1]},
  {kw:"Identity Theft",url:"https://www.fortinet.com/resources/cyberglossary/identity-theft",sv:22200,kd:89,wk35:7,wk36:7,aio:false,trend:[42,55,54,40,49,58,56,9,9,5,10,14,8,5,3,9,19,11,10,16,32,20,11,21,15,15,15,17,13,1,11,7,5,3,7,7]},
  {kw:"Sarbanes-Oxley Act",url:"https://www.fortinet.com/resources/cyberglossary/sox-sarbanes-oxley-act",sv:6600,kd:65,wk35:17,wk36:20,aio:false,trend:[6,7,6,2,7,11,8,6,6,5,8,8,2,2,2,2,1,4,3,56,3,2,1,5,4,4,5,5,3,9,19,17,18,17,17,20]},
  {kw:"SSL Certificate",url:"https://www.fortinet.com/resources/cyberglossary/ssl-certificate",sv:14800,kd:95,wk35:31,wk36:25,aio:false,trend:[14,5,7,11,9,7,9,9,11,10,7,8,9,9,8,8,11,11,10,12,12,9,11,11,11,10,9,9,9,33,29,31,28,32,31,25]},
  {kw:"Data Classification",url:"https://www.fortinet.com/resources/cyberglossary/data-classification",sv:2400,kd:42,wk35:14,wk36:18,aio:false,trend:[11,11,14,8,10,7,8,9,9,7,4,8,15,17,14,13,15,17,17,14,14,15,14,15,15,15,14,13,13,20,20,20,19,12,14,18]},
  {kw:"What Is SOAR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-soar",sv:9900,kd:45,wk35:2,wk36:2,aio:false,trend:[7,7,7,8,7,8,7,7,7,7,4,6,7,7,6,7,5,7,7,9,9,7,6,4,5,5,5,4,4,2,2,2,2,4,2,2]},
  {kw:"What Is Mobile Security",url:"https://www.fortinet.com/resources/cyberglossary/mobile-security",sv:2900,kd:61,wk35:2,wk36:2,aio:true,trend:[6,10,12,12,12,13,12,11,8,8,7,8,11,7,13,12,12,13,9,8,12,14,12,15,1,2,10,4,4,5,3,2,2,2,2,2]},
  {kw:"Devsecops",url:"https://www.fortinet.com/resources/cyberglossary/devsecops",sv:9900,kd:59,wk35:8,wk36:11,aio:false,trend:[28,30,32,29,30,34,28,26,23,23,15,13,8,12,14,18,22,25,27,21,20,29,32,26,35,29,31,45,37,9,9,7,9,8,8,11]},
  {kw:"Dynamic DNS",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-dns",sv:3600,kd:57,wk35:7,wk36:9,aio:false,trend:[10,8,6,7,4,7,6,7,9,2,6,8,9,8,8,9,9,10,9,10,10,11,9,10,9,9,9,10,9,2,2,9,8,7,7,9]},
  {kw:"Infrastructure As Code",url:"https://www.fortinet.com/resources/cyberglossary/infrastructure-as-code",sv:880,kd:52,wk35:7,wk36:6,aio:false,trend:[38,41,39,41,29,37,34,12,4,7,5,8,14,5,3,14,7,15,21,19,18,21,25,14,19,16,25,23,23,6,4,4,8,9,7,6]},
  {kw:"What Is A Cyber Attack?",url:"https://www.fortinet.com/resources/cyberglossary/what-is-cyber-attack",sv:2900,kd:61,wk35:6,wk36:6,aio:false,trend:[7,6,1,10,6,4,5,4,4,2,2,1,1,1,1,1,1,1,2,1,1,1,1,1,2,5,3,3,2,6,6,6,6,6,6,6]},
  {kw:"Multi-Factor Authentication",url:"https://www.fortinet.com/resources/cyberglossary/multi-factor-authentication",sv:6600,kd:75,wk35:5,wk36:5,aio:false,trend:[25,23,24,24,26,29,24,19,7,21,17,16,14,16,17,20,23,24,24,20,7,11,22,24,22,24,24,26,24,5,5,4,5,4,5,5]},
  {kw:"Account Takeover",url:"https://www.fortinet.com/resources/cyberglossary/account-takeover",sv:1900,kd:38,wk35:13,wk36:15,aio:false,trend:[4,3,4,6,7,7,6,3,4,3,4,4,3,3,3,4,4,4,3,2,5,8,6,5,5,6,5,4,3,19,23,22,22,19,13,15]},
  {kw:"Colocation Data Center",url:"https://www.fortinet.com/resources/cyberglossary/colocation-data-center",sv:3600,kd:44,wk35:1,wk36:1,aio:false,trend:[2,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cyber Espionage",url:"https://www.fortinet.com/resources/cyberglossary/cyber-espionage",sv:880,kd:40,wk35:13,wk36:16,aio:false,trend:[6,6,6,7,3,8,8,5,3,5,6,2,5,6,5,6,7,8,8,8,8,9,9,9,9,9,9,10,10,10,11,12,10,7,13,16]},
  {kw:"Deception Technology",url:"https://www.fortinet.com/resources/cyberglossary/what-is-deception-technology",sv:390,kd:25,wk35:1,wk36:1,aio:true,trend:[2,3,3,3,3,4,3,4,4,4,3,4,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Deep Packet Inspection",url:"https://www.fortinet.com/resources/cyberglossary/dpi-deep-packet-inspection",sv:1600,kd:50,wk35:1,wk36:1,aio:true,trend:[6,5,5,4,4,6,3,3,3,2,3,4,3,2,2,2,2,3,3,3,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Network Automation",url:"https://www.fortinet.com/resources/cyberglossary/network-automation",sv:1900,kd:41,wk35:2,wk36:2,aio:false,trend:[6,9,8,7,5,5,5,5,2,5,6,5,4,4,5,5,5,5,5,5,7,12,12,11,9,10,10,11,9,2,2,3,3,3,2,2]},
  {kw:"DNS Leak",url:"https://www.fortinet.com/resources/cyberglossary/dns-leak",sv:8100,kd:69,wk35:5,wk36:6,aio:true,trend:[5,5,5,6,6,6,6,5,5,5,4,6,7,6,7,6,6,6,7,6,6,6,6,6,7,6,7,7,6,2,2,3,5,6,5,6]},
  {kw:"Swatting",url:"https://www.fortinet.com/resources/cyberglossary/swatting",sv:18100,kd:62,wk35:7,wk36:8,aio:false,trend:[9,9,8,9,6,8,8,8,8,9,3,4,6,8,4,6,11,9,9,9,10,10,10,10,11,10,11,9,9,8,9,8,10,11,7,8]},
  {kw:"What Is A Honeypot",url:"https://www.fortinet.com/resources/cyberglossary/what-is-honeypot",sv:3600,kd:57,wk35:11,wk36:9,aio:false,trend:[5,5,6,7,9,7,7,8,8,9,6,3,3,2,2,7,10,8,8,9,11,10,10,11,9,8,10,10,10,9,11,11,11,12,11,9]},
  {kw:"What Is A Data Breach",url:"https://www.fortinet.com/resources/cyberglossary/data-breach",sv:6600,kd:52,wk35:3,wk36:4,aio:false,trend:[7,4,4,5,6,5,4,4,3,4,3,3,6,3,5,4,3,5,4,3,3,3,3,3,3,3,5,4,3,3,4,4,4,4,3,4]},
  {kw:"What Is Remote Access",url:"https://www.fortinet.com/resources/cyberglossary/remote-access",sv:210,kd:35,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Incident Response",url:"https://www.fortinet.com/resources/cyberglossary/incident-response",sv:590,kd:45,wk35:9,wk36:10,aio:true,trend:[2,2,1,2,2,3,12,4,6,10,8,7,15,12,5,4,2,5,4,5,5,9,9,10,8,10,9,8,8,10,10,11,10,11,9,10]},
  {kw:"Cyber Warfare",url:"https://www.fortinet.com/resources/cyberglossary/most-notorious-attacks-in-the-history-of-cyber-warfare",sv:2400,kd:54,wk35:9,wk36:8,aio:false,trend:[2,2,1,1,1,1,1,1,1,1,1,1,4,2,3,4,2,4,5,5,5,4,3,1,null,31,34,40,20,9,9,10,9,10,9,8]},
  {kw:"Remote Work Cyber Security Risks",url:"https://www.fortinet.com/resources/cyberglossary/work-from-home-cybersecurity-risks",sv:40,kd:40,wk35:1,wk36:1,aio:false,trend:[5,7,2,7,8,8,8,8,3,3,3,5,5,4,5,4,4,4,4,4,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"What Is Deepfake",url:"https://www.fortinet.com/resources/cyberglossary/deepfake",sv:2400,kd:72,wk35:29,wk36:21,aio:false,trend:[3,3,1,2,3,4,3,3,2,6,3,5,4,3,5,4,6,4,5,5,6,7,6,4,4,5,6,9,8,29,33,44,43,46,29,21]},
  {kw:"Critical Infrastructure Protection",url:"https://www.fortinet.com/resources/cyberglossary/critical-infrastructure-protection",sv:4400,kd:46,wk35:8,wk36:9,aio:true,trend:[1,1,1,6,6,6,6,6,5,6,2,2,2,3,5,3,2,3,2,2,2,3,2,3,3,3,3,4,4,6,10,9,6,9,8,9]},
  {kw:"Watering Hole Attack",url:"https://www.fortinet.com/resources/cyberglossary/watering-hole-attack",sv:1900,kd:49,wk35:3,wk36:2,aio:true,trend:[3,2,2,2,2,2,3,3,3,3,3,3,2,2,3,2,3,3,3,2,2,2,2,2,2,2,2,2,2,8,2,2,10,3,3,2]},
  {kw:"Rootkit",url:"https://www.fortinet.com/resources/cyberglossary/rootkit",sv:5400,kd:51,wk35:14,wk36:11,aio:true,trend:[2,2,4,4,3,3,2,3,3,2,3,2,2,2,2,2,3,3,3,2,3,3,2,2,2,2,3,2,2,12,13,14,13,12,14,11]},
  {kw:"OIDC",url:"https://www.fortinet.com/resources/cyberglossary/oidc",sv:9900,kd:55,wk35:68,wk36:68,aio:false,trend:[7,3,4,5,3,4,3,4,5,6,7,5,6,8,4,7,10,10,3,7,9,15,12,8,6,14,11,16,16,9,6,9,9,68,68,68]},
  {kw:"Intrusion Detection System",url:"https://www.fortinet.com/resources/cyberglossary/intrusion-detection-system",sv:5400,kd:57,wk35:8,wk36:9,aio:false,trend:[4,11,12,13,14,14,11,10,8,6,8,7,10,6,3,6,5,8,11,16,8,9,10,12,11,11,13,15,13,8,8,8,9,9,8,9]},
  {kw:"Heuristic Analysis",url:"https://www.fortinet.com/resources/cyberglossary/heuristic-analysis",sv:720,kd:44,wk35:7,wk36:7,aio:false,trend:[8,3,8,2,6,3,1,3,9,6,6,3,6,2,8,6,3,6,6,4,7,6,5,6,6,6,8,7,5,2,6,7,5,3,7,7]},
  {kw:"Serverless Computing",url:"https://www.fortinet.com/resources/cyberglossary/serverless-computing",sv:4400,kd:71,wk35:10,wk36:7,aio:false,trend:[10,11,12,13,13,12,11,11,10,13,9,12,12,9,3,12,13,13,13,12,3,14,13,16,14,15,19,27,23,8,9,8,9,9,10,7]},
  {kw:"Hacktivism",url:"https://www.fortinet.com/resources/cyberglossary/what-is-hacktivism",sv:1900,kd:49,wk35:11,wk36:15,aio:true,trend:[2,3,2,3,4,4,3,2,3,3,3,3,3,2,6,2,2,3,2,3,2,5,3,5,5,4,4,5,3,5,12,14,15,11,11,15]},
  {kw:"Types Of Phishing Attacks",url:"https://www.fortinet.com/resources/cyberglossary/types-of-phishing-attacks",sv:1000,kd:44,wk35:3,wk36:2,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,null,3,4,3,3,2]},
  {kw:"Election Security",url:"https://www.fortinet.com/resources/cyberglossary/election-security",sv:880,kd:57,wk35:8,wk36:10,aio:false,trend:[7,6,7,7,9,8,9,9,9,8,7,9,7,9,9,8,3,6,6,6,8,7,8,7,8,8,9,9,9,10,9,9,11,12,8,10]},
  {kw:"ARP",url:"https://www.fortinet.com/resources/cyberglossary/what-is-arp",sv:90500,kd:63,wk35:4,wk36:4,aio:false,trend:[6,6,6,6,5,4,5,5,5,5,4,4,6,5,4,6,6,6,5,5,6,5,6,6,7,6,6,6,6,3,3,2,4,4,4,4]},
  {kw:"Supply Chain Attacks",url:"https://www.fortinet.com/resources/cyberglossary/supply-chain-attacks",sv:720,kd:52,wk35:4,wk36:4,aio:false,trend:[9,10,11,11,11,11,11,8,6,9,8,8,9,11,10,11,13,13,13,20,15,19,18,23,19,19,20,21,21,4,5,5,5,6,4,4]},
  {kw:"Emailsecurity Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/email-security-best-practices",sv:590,kd:15,wk35:1,wk36:1,aio:false,trend:[10,9,6,9,10,10,2,3,3,2,2,2,3,2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"White Hat Hacking",url:"https://www.fortinet.com/resources/cyberglossary/whitehat-security",sv:4400,kd:48,wk35:10,wk36:10,aio:false,trend:[2,4,5,6,2,2,2,2,4,5,5,4,2,4,2,2,2,5,5,4,5,4,4,3,3,5,3,4,3,5,3,10,10,10,10,10]},
  {kw:"What Is DDOS Attack",url:"https://www.fortinet.com/resources/cyberglossary/ddos-attack",sv:2900,kd:73,wk35:12,wk36:17,aio:true,trend:[8,8,6,9,9,8,5,8,2,2,6,3,2,3,2,4,4,6,11,8,6,5,7,7,5,6,12,26,11,12,9,23,22,14,12,17]},
  {kw:"Recent Cyber Attacks",url:"https://www.fortinet.com/resources/cyberglossary/recent-cyber-attacks",sv:3600,kd:61,wk35:31,wk36:27,aio:false,trend:[8,8,4,6,3,4,3,2,3,3,3,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,29,28,31,27]},
  {kw:"Remote Access VPN",url:"https://www.fortinet.com/resources/cyberglossary/remote-access-vpn",sv:5400,kd:60,wk35:9,wk36:7,aio:true,trend:[4,2,6,7,9,6,2,3,3,2,2,4,16,3,2,2,2,2,3,3,2,2,3,3,2,2,2,3,3,7,12,4,12,11,9,7]},
  {kw:"Fisma",url:"https://www.fortinet.com/resources/cyberglossary/fisma-and-fisma-compliance",sv:6600,kd:57,wk35:1,wk36:1,aio:true,trend:[3,5,2,2,2,5,3,4,6,7,6,6,3,9,8,6,8,7,7,8,8,8,8,8,8,8,8,6,3,8,9,8,8,1,1,1]},
  {kw:"How To Detect Keylogger",url:"https://www.fortinet.com/resources/cyberglossary/how-to-detect-keylogger-on-phone",sv:320,kd:39,wk35:25,wk36:29,aio:false,trend:[11,10,9,7,11,9,9,9,9,5,4,9,10,6,3,7,12,10,11,11,7,7,2,9,11,7,7,11,10,19,22,23,28,23,25,29]},
  {kw:"Network Segmentation",url:"https://www.fortinet.com/resources/cyberglossary/network-segmentation",sv:2900,kd:45,wk35:3,wk36:2,aio:false,trend:[10,11,9,10,14,13,8,7,8,3,4,6,8,7,2,5,6,3,3,3,5,6,7,8,7,3,6,5,5,2,2,2,2,3,3,2]},
  {kw:"Intrusion Prevention System",url:"https://www.fortinet.com/resources/cyberglossary/what-is-an-ips",sv:9900,kd:65,wk35:4,wk36:2,aio:false,trend:[15,15,14,17,18,11,8,6,7,6,6,6,8,9,7,7,7,7,8,6,6,8,7,10,11,11,12,11,9,3,4,6,2,3,4,2]},
  {kw:"SIEM",url:"https://www.fortinet.com/resources/cyberglossary/what-is-siem",sv:2900,kd:58,wk35:9,wk36:9,aio:false,trend:[16,13,15,15,14,19,13,5,9,5,6,9,8,10,8,8,10,10,10,11,11,11,11,16,30,37,16,40,36,10,10,6,7,10,9,9]},
  {kw:"XDR",url:"https://www.fortinet.com/resources/cyberglossary/what-is-XDR",sv:6600,kd:58,wk35:11,wk36:5,aio:true,trend:[9,9,5,9,11,15,13,15,9,6,7,6,12,5,5,7,7,5,6,7,8,8,7,5,6,11,11,13,12,11,11,11,9,9,11,5]},
  {kw:"VPN Routers",url:"https://www.fortinet.com/resources/cyberglossary/vpn-routers",sv:480,kd:36,wk35:8,wk36:9,aio:true,trend:[7,8,2,5,5,4,2,4,3,3,7,7,8,8,7,5,5,5,5,7,3,4,3,7,5,6,7,7,7,7,8,8,10,9,8,9]},
  {kw:"Clickjacking",url:"https://www.fortinet.com/resources/cyberglossary/clickjacking",sv:1600,kd:48,wk35:13,wk36:12,aio:false,trend:[9,11,11,10,10,11,9,9,10,8,8,10,6,9,5,8,10,10,11,12,11,11,12,11,11,11,12,13,12,11,12,13,11,15,13,12]},
  {kw:"Bring Your Own Device",url:"https://www.fortinet.com/resources/cyberglossary/byod",sv:2400,kd:59,wk35:25,wk36:26,aio:false,trend:[5,10,7,7,8,11,9,6,7,8,7,8,8,7,9,8,9,11,10,13,24,23,30,17,48,10,5,21,13,28,27,28,28,26,25,26]},
  {kw:"Cross Site Scripting",url:"https://www.fortinet.com/resources/cyberglossary/cross-site-scripting",sv:5400,kd:71,wk35:17,wk36:21,aio:false,trend:[6,6,5,6,6,7,6,4,3,6,3,7,7,5,9,7,6,6,6,6,5,6,6,6,7,6,6,6,6,10,20,14,9,27,17,21]},
  {kw:"Fast Flux Networks",url:"https://www.fortinet.com/resources/cyberglossary/fast-flux-networks",sv:20,kd:50,wk35:12,wk36:12,aio:false,trend:[2,2,1,2,2,2,2,2,3,2,1,2,2,2,5,2,2,2,2,2,2,2,2,2,2,3,3,3,2,12,12,12,12,12,12,12]},
  {kw:"Phishing",url:"https://www.fortinet.com/resources/cyberglossary/phishing",sv:49500,kd:98,wk35:29,wk36:30,aio:false,trend:[7,8,15,9,12,17,9,14,10,11,10,7,7,11,8,8,10,10,9,5,11,9,9,9,7,9,8,9,8,22,19,15,32,35,29,30]},
  {kw:"Malware",url:"https://www.fortinet.com/resources/cyberglossary/malware",sv:40500,kd:84,wk35:10,wk36:11,aio:false,trend:[8,8,8,9,10,9,9,6,6,8,6,8,9,9,17,7,5,9,11,9,4,7,12,9,10,12,9,9,6,7,9,8,9,10,10,11]},
  {kw:"Unified Endpoint Management",url:"https://www.fortinet.com/resources/cyberglossary/unified-endpoint-management-uem",sv:1300,kd:43,wk35:4,wk36:2,aio:true,trend:[9,13,12,11,14,13,9,5,5,5,6,6,5,4,5,4,3,4,4,4,3,6,4,4,3,2,3,3,3,5,8,4,5,3,4,2]},
  {kw:"Man In The Middle Attack",url:"https://www.fortinet.com/resources/cyberglossary/man-in-the-middle-attack",sv:5400,kd:71,wk35:26,wk36:29,aio:false,trend:[11,10,11,12,12,13,9,6,6,6,6,5,4,6,8,8,6,6,8,8,7,9,9,12,11,11,11,11,9,24,23,26,27,25,26,29]},
  {kw:"Cyber Insurance",url:"https://www.fortinet.com/resources/cyberglossary/cyber-insurance",sv:9900,kd:61,wk35:2,wk36:2,aio:false,trend:[4,4,3,2,3,3,3,3,3,4,3,3,2,2,6,2,2,3,2,2,3,2,2,3,2,2,2,3,3,4,7,2,2,2,2,2]},
  {kw:"Bloatware",url:"https://www.fortinet.com/resources/cyberglossary/bloatware",sv:4400,kd:51,wk35:30,wk36:29,aio:true,trend:[2,2,1,2,2,1,1,2,3,3,2,2,2,2,3,3,2,4,3,3,3,5,4,3,4,4,3,3,3,29,30,32,29,30,30,29]},
  {kw:"What Is Two Factor Authentication",url:"https://www.fortinet.com/resources/cyberglossary/two-factor-authentication",sv:6600,kd:72,wk35:5,wk36:7,aio:false,trend:[10,9,9,12,11,9,10,10,9,10,10,10,8,9,9,11,10,10,11,10,9,10,11,10,10,10,10,11,8,4,4,3,4,4,5,7]},
  {kw:"Black Hat Security",url:"https://www.fortinet.com/resources/cyberglossary/black-hat-security",sv:110,kd:52,wk35:9,wk36:10,aio:false,trend:[7,6,8,8,8,8,4,5,5,5,5,5,4,7,5,7,7,6,6,11,15,15,15,15,5,11,11,11,11,11,6,9,9,9,9,10]},
  {kw:"DHCP",url:"https://www.fortinet.com/resources/cyberglossary/dynamic-host-configuration-protocol-dhcp",sv:8100,kd:47,wk35:9,wk36:16,aio:false,trend:[6,7,8,8,8,9,8,5,6,3,4,4,5,5,2,6,4,5,5,6,4,5,5,4,8,9,5,11,9,12,11,8,11,9,9,16]},
  {kw:"Machine Learning",url:"https://www.fortinet.com/resources/cyberglossary/what-is-machine-learning",sv:60500,kd:93,wk35:1,wk36:1,aio:false,trend:[6,2,1,1,1,1,1,1,5,10,1,1,2,7,3,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,1,1,1,1]},
  {kw:"Cyber Threat Intelligence",url:"https://www.fortinet.com/resources/cyberglossary/cyber-threat-intelligence",sv:3600,kd:52,wk35:2,wk36:3,aio:false,trend:[15,18,15,19,19,20,19,13,13,10,7,8,11,12,7,19,16,20,19,14,8,13,18,19,23,26,28,25,24,3,3,4,3,3,2,3]},
  {kw:"What Is A Qr Code",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-qr-code",sv:5400,kd:48,wk35:2,wk36:2,aio:true,trend:[2,2,2,2,2,2,2,2,2,3,4,3,3,3,2,4,3,2,2,2,2,2,2,2,2,2,2,2,2,3,3,2,2,3,2,2]},
  {kw:"Simple Network Management Protocol",url:"https://www.fortinet.com/resources/cyberglossary/simple-network-management-protocol",sv:4400,kd:38,wk35:4,wk36:2,aio:true,trend:[5,6,6,6,4,5,6,4,4,3,4,3,3,3,2,2,2,3,4,3,4,4,4,4,4,4,4,4,3,3,4,6,2,3,4,2]},
  {kw:"Federated Identity",url:"https://www.fortinet.com/resources/cyberglossary/federated-identity",sv:880,kd:49,wk35:15,wk36:12,aio:false,trend:[13,10,6,8,9,7,8,9,7,8,6,4,5,7,5,9,8,9,7,5,8,7,3,7,10,9,10,10,10,13,14,19,15,14,15,12]},
  {kw:"SOC",url:"https://www.fortinet.com/resources/cyberglossary/what-is-soc",sv:40500,kd:73,wk35:2,wk36:3,aio:false,trend:[8,11,7,5,6,11,8,6,10,10,7,7,7,4,6,4,7,17,10,16,16,17,6,8,14,8,6,16,13,3,2,5,4,4,2,3]},
  {kw:"Wannacry",url:"https://www.fortinet.com/resources/cyberglossary/wannacry-ransomware-attack",sv:4400,kd:68,wk35:6,wk36:5,aio:false,trend:[7,7,7,8,9,8,8,8,9,9,6,7,8,7,12,12,11,12,11,8,12,11,12,15,14,11,12,12,11,6,5,6,5,6,6,5]},
  {kw:"CI/CD Pipelines",url:"https://www.fortinet.com/resources/cyberglossary/ci-cd-pipeline",sv:3600,kd:57,wk35:12,wk36:12,aio:false,trend:[19,19,19,20,17,16,15,9,6,4,3,5,3,3,3,3,3,23,11,14,2,10,5,2,2,2,2,14,13,12,12,11,11,12,12,12]},
  {kw:"How To Pick A Wifi Router",url:"https://www.fortinet.com/resources/cyberglossary/how-to-pick-a-work-from-home-wi-fi-router",sv:90,kd:38,wk35:10,wk36:7,aio:false,trend:[9,11,1,10,5,5,5,5,5,9,11,6,6,8,9,7,10,11,8,7,10,8,8,8,8,8,8,8,8,10,14,7,7,15,10,7]},
  {kw:"Mitre ATT&CK",url:"https://www.fortinet.com/resources/cyberglossary/mitre-attck",sv:5400,kd:56,wk35:26,wk36:29,aio:false,trend:[10,9,10,10,9,14,11,12,10,13,15,8,7,7,6,11,13,16,15,16,15,22,24,21,27,26,21,21,21,20,20,25,26,25,26,29]},
  {kw:"What Is 5G?",url:"https://www.fortinet.com/resources/cyberglossary/what-is-5g",sv:135000,kd:68,wk35:15,wk36:18,aio:false,trend:[9,9,9,11,10,7,4,3,2,2,5,7,7,6,7,3,1,1,2,4,2,5,8,6,6,8,8,7,6,16,17,17,15,15,15,18]},
  {kw:"Virtual Desktop Infrastructure",url:"https://www.fortinet.com/resources/cyberglossary/virtual-desktop-infrastructure-vdi",sv:1900,kd:40,wk35:18,wk36:15,aio:false,trend:[6,7,17,20,10,19,15,15,23,19,16,19,15,9,9,19,21,27,28,22,22,25,24,20,27,31,29,31,24,7,7,6,5,2,18,15]},
  {kw:"What Is A VPN",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-vpn",sv:165000,kd:81,wk35:27,wk36:29,aio:true,trend:[12,11,11,9,10,8,8,7,9,9,6,8,7,7,7,6,6,6,6,4,3,3,4,3,2,2,4,4,4,20,23,24,26,26,27,29]},
  {kw:"Fabric Of Security",url:"https://www.fortinet.com/resources/cyberglossary/fabric-of-security",sv:40,kd:31,wk35:1,wk36:1,aio:false,trend:[1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Network Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/what-is-ndr",sv:1300,kd:33,wk35:4,wk36:5,aio:true,trend:[14,14,17,15,13,9,9,4,4,3,2,4,2,4,4,2,2,3,3,3,2,2,3,2,10,9,2,15,11,5,7,6,6,5,4,5]},
  {kw:"Cyber Physical Systems",url:"https://www.fortinet.com/resources/cyberglossary/cyber-physical-systems",sv:1300,kd:50,wk35:4,wk36:3,aio:true,trend:[3,3,4,5,2,4,4,4,5,2,4,4,3,3,4,4,5,3,6,5,4,4,7,7,4,6,6,5,3,3,2,5,6,5,4,3]},
  {kw:"Purdue Model",url:"https://www.fortinet.com/resources/cyberglossary/purdue-model",sv:70,kd:34,wk35:31,wk36:30,aio:false,trend:[5,2,3,3,3,3,3,3,2,2,2,2,3,2,2,2,2,3,2,2,3,3,2,2,2,3,2,3,2,21,25,33,33,30,31,30]},
  {kw:"What Is Air Gap",url:"https://www.fortinet.com/resources/cyberglossary/what-is-air-gap",sv:210,kd:50,wk35:11,wk36:4,aio:false,trend:[11,11,3,8,8,8,8,8,7,7,7,7,7,11,9,11,7,8,9,9,9,9,6,4,14,13,13,13,13,13,15,16,13,16,11,4]},
  {kw:"Malware Protection",url:"https://www.fortinet.com/resources/cyberglossary/malware-protection",sv:1830000,kd:62,wk35:12,wk36:11,aio:true,trend:[18,16,21,29,21,16,15,11,11,9,7,5,9,11,9,10,10,10,9,9,9,10,11,10,10,11,17,14,12,10,8,13,12,13,12,11]},
  {kw:"Browser Security",url:"https://www.fortinet.com/resources/cyberglossary/browser-security",sv:1000,kd:50,wk35:16,wk36:14,aio:false,trend:[11,11,14,16,8,10,7,8,8,9,5,4,6,4,6,3,5,6,5,8,7,6,3,6,6,6,12,9,7,9,7,11,11,8,16,14]},
  {kw:"Types Of Malware",url:"https://www.fortinet.com/resources/cyberglossary/types-of-malware",sv:2900,kd:43,wk35:28,wk36:28,aio:true,trend:[3,6,7,8,9,2,4,2,2,3,4,2,2,2,2,3,2,2,2,4,4,2,3,3,2,2,4,4,3,11,11,13,8,16,28,28]},
  {kw:"Identity As A Service",url:"https://www.fortinet.com/resources/cyberglossary/identity-as-a-service",sv:880,kd:26,wk35:5,wk36:4,aio:false,trend:[15,9,15,13,13,13,13,11,9,10,4,8,11,12,10,8,13,13,14,14,16,17,15,14,13,15,13,12,12,2,2,1,11,8,5,4]},
  {kw:"DFIR",url:"https://www.fortinet.com/resources/cyberglossary/dfir",sv:2900,kd:41,wk35:11,wk36:12,aio:false,trend:[9,11,14,16,25,17,18,2,2,3,3,3,2,4,14,5,4,5,9,13,10,13,5,5,7,6,6,14,11,11,13,10,14,12,11,12]},
  {kw:"Application Performance Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/application-performance-monitoring",sv:6600,kd:54,wk35:5,wk36:5,aio:false,trend:[19,24,19,11,21,16,16,13,11,10,6,9,10,8,3,14,12,13,13,13,15,9,11,14,12,15,17,17,17,6,6,7,7,8,5,5]},
  {kw:"Soc 1 Compliance",url:"https://www.fortinet.com/resources/cyberglossary/soc1-compliance",sv:590,kd:21,wk35:1,wk36:1,aio:true,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Security Audit",url:"https://www.fortinet.com/resources/cyberglossary/security-audit",sv:1300,kd:36,wk35:60,wk36:63,aio:true,trend:[2,2,12,12,12,11,9,5,3,3,5,3,8,6,5,4,3,4,3,5,4,6,5,6,5,6,9,7,7,40,46,53,60,60,60,63]},
  {kw:"Web Application Security",url:"https://www.fortinet.com/resources/cyberglossary/web-application-security",sv:1900,kd:35,wk35:7,wk36:11,aio:false,trend:[14,19,35,18,16,16,16,12,9,3,5,8,4,6,2,7,8,10,21,14,20,8,10,5,5,5,26,27,26,6,2,6,5,9,7,11]},
  {kw:"Server Virtualization",url:"https://www.fortinet.com/resources/cyberglossary/server-virtualization",sv:1600,kd:37,wk35:8,wk36:4,aio:true,trend:[6,4,7,2,4,10,6,4,7,5,5,1,2,2,4,8,8,9,10,9,8,10,5,8,12,17,15,14,6,2,5,3,7,2,8,4]},
  {kw:"Vulnerability Assessment Tools",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-assessment-tools",sv:1300,kd:42,wk35:8,wk36:3,aio:false,trend:[12,13,12,16,18,14,9,3,9,12,7,8,11,10,9,9,12,13,12,12,12,9,13,8,10,8,10,12,11,4,7,7,7,10,8,3]},
  {kw:"Neural Networks",url:"https://www.fortinet.com/resources/cyberglossary/neural-network",sv:9900,kd:91,wk35:2,wk36:2,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,2,2,2,3,3,1,3,3,2,3,3,3,1,2,1,1,1,null,null,null,null,null,88,2,2]},
  {kw:"Shor's Algorithm",url:"https://www.fortinet.com/resources/cyberglossary/shors-grovers-algorithms",sv:3600,kd:67,wk35:2,wk36:3,aio:false,trend:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,6,6,8,6,10,8,9,6,2,2,3]},
  {kw:"Dark Web Vs Deep Web",url:"https://www.fortinet.com/resources/cyberglossary/dark-vs-deep-web",sv:1000,kd:33,wk35:5,wk36:5,aio:false,trend:[2,2,3,2,2,3,2,3,2,4,5,2,7,4,9,6,6,7,9,8,8,11,10,11,10,10,9,11,11,5,5,5,5,5,5,5]},
  {kw:"Signs Of Malware",url:"https://www.fortinet.com/resources/cyberglossary/signs-of-malware",sv:260,kd:41,wk35:1,wk36:1,aio:false,trend:[3,2,5,3,3,6,6,2,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Vulnerability Management",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-management",sv:5400,kd:48,wk35:9,wk36:9,aio:false,trend:[93,93,48,48,48,57,57,57,57,45,44,40,40,45,33,20,19,20,22,22,24,28,24,30,32,37,44,51,47,41,49,53,9,9,9,9]},
  {kw:"Vulnerability Disclosure",url:"https://www.fortinet.com/resources/cyberglossary/vulnerability-disclosure",sv:140,kd:28,wk35:6,wk36:7,aio:true,trend:[1,1,1,4,5,4,5,5,4,6,3,1,1,1,7,2,2,3,2,3,3,5,4,3,7,7,4,3,2,1,4,8,10,8,6,7]},
  {kw:"Virtual Patching",url:"https://www.fortinet.com/resources/cyberglossary/virtual-patching",sv:260,kd:31,wk35:5,wk36:2,aio:true,trend:[5,7,7,7,8,8,8,2,2,2,5,8,6,1,7,2,2,11,8,9,4,1,4,6,2,4,5,3,3,3,3,3,5,6,5,2]},
  {kw:"NERC CIP",url:"https://www.fortinet.com/resources/cyberglossary/nerc-cip",sv:5400,kd:27,wk35:8,wk36:3,aio:true,trend:[2,3,2,2,4,9,3,6,4,4,6,7,4,7,4,4,9,8,5,8,5,5,6,5,5,3,5,5,3,29,29,7,7,9,8,3]},
  {kw:"Cyber Security Platform",url:"https://www.fortinet.com/resources/cyberglossary/cyber-security-platform",sv:1000,kd:57,wk35:2,wk36:2,aio:true,trend:[6,3,5,4,4,3,3,4,2,2,2,2,2,2,2,2,2,2,1,2,2,1,1,1,1,1,1,1,1,3,3,5,2,3,2,2]},
  {kw:"Compensating Controls",url:"https://www.fortinet.com/resources/cyberglossary/compensating-controls",sv:720,kd:22,wk35:4,wk36:5,aio:true,trend:[2,3,2,3,4,5,4,3,1,3,2,2,2,3,4,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,4,5,4,5]},
  {kw:"Darkside Ransomware",url:"https://www.fortinet.com/resources/cyberglossary/darkside-ransomware",sv:260,kd:35,wk35:15,wk36:14,aio:false,trend:[7,5,5,5,3,4,4,4,5,3,4,3,3,3,2,2,2,4,4,5,4,4,4,4,4,4,5,5,5,16,18,18,17,16,15,14]},
  {kw:"Rugged Hardware",url:"https://www.fortinet.com/resources/cyberglossary/rugged-hardware",sv:50,kd:24,wk35:16,wk36:6,aio:false,trend:[5,7,9,9,9,9,9,9,4,6,7,7,7,7,4,9,9,9,9,3,4,1,1,4,4,3,3,3,3,13,16,12,17,17,16,6]},
  {kw:"Identity Based Attacks",url:"https://www.fortinet.com/resources/cyberglossary/identity-based-attacks",sv:110,kd:25,wk35:5,wk36:3,aio:false,trend:[11,12,11,11,11,7,7,10,10,10,10,12,11,11,5,5,5,5,5,4,4,6,7,7,9,10,9,9,9,5,5,5,5,5,5,3]},
  {kw:"Enterprise VPN Solutions",url:"https://www.fortinet.com/resources/cyberglossary/enterprise-vpn-solutions",sv:390,kd:50,wk35:6,wk36:8,aio:false,trend:[8,5,4,4,3,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,3,20,25,29,23,10,6,8]},
  {kw:"Waf Owasp Top 10",url:"https://www.fortinet.com/resources/cyberglossary/owasp-web-application-firewall",sv:110,kd:58,wk35:12,wk36:11,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,23,25,29,29,11,11,11,11,12,12,11]},
  {kw:"Virtual Machine",url:"https://www.fortinet.com/resources/cyberglossary/virtual-machines",sv:40500,kd:69,wk35:48,wk36:55,aio:false,trend:[null,null,32,37,37,32,36,16,14,7,4,5,6,4,7,19,10,20,20,24,3,9,7,4,14,1,2,5,3,48,47,45,45,47,48,55]},
  {kw:"Agent Vs Agentless Security",url:"https://www.fortinet.com/resources/cyberglossary/agent-vs-agentless-security",sv:90,kd:8,wk35:12,wk36:12,aio:false,trend:[null,null,null,3,3,4,4,6,6,6,6,1,1,1,1,5,1,1,2,4,3,4,4,3,3,3,4,3,3,9,10,11,11,11,12,12]},
  {kw:"Behavioral Analytics",url:"https://www.fortinet.com/resources/cyberglossary/behavioral-analytics",sv:1000,kd:41,wk35:13,wk36:14,aio:false,trend:[null,null,null,7,7,10,8,5,5,5,5,6,7,9,12,15,15,17,12,9,11,15,16,16,13,17,18,19,18,13,12,13,10,11,13,14]},
  {kw:"CI/CD",url:"https://www.fortinet.com/resources/cyberglossary/ci-cd",sv:9900,kd:63,wk35:12,wk36:7,aio:false,trend:[null,null,null,11,15,24,16,8,5,4,5,4,8,4,4,6,10,17,11,9,8,9,12,13,9,9,18,15,13,13,13,11,14,13,12,7]},
  {kw:"CSPM Vs DSPM",url:"https://www.fortinet.com/resources/cyberglossary/cspm-vs-dspm",sv:320,kd:14,wk35:4,wk36:5,aio:false,trend:[null,null,null,15,14,14,10,13,5,3,8,6,9,5,4,3,13,5,3,4,2,6,4,4,8,1,2,10,10,4,5,5,5,5,4,5]},
  {kw:"CTEM",url:"https://www.fortinet.com/resources/cyberglossary/ctem",sv:1600,kd:29,wk35:21,wk36:18,aio:false,trend:[null,null,null,5,4,9,5,6,6,11,16,6,5,11,9,10,8,13,15,19,16,14,19,17,23,21,22,26,24,35,33,31,20,18,21,18]},
  {kw:"Data Discovery",url:"https://www.fortinet.com/resources/cyberglossary/data-discovery",sv:1900,kd:30,wk35:78,wk36:51,aio:false,trend:[null,null,null,53,54,51,52,54,67,45,59,52,54,53,54,53,87,81,76,78,78,57,58,58,58,58,48,48,48,79,2,2,72,2,78,51]},
  {kw:"Data Matching",url:"https://www.fortinet.com/resources/cyberglossary/data-matching",sv:1300,kd:15,wk35:4,wk36:3,aio:false,trend:[null,null,null,11,11,12,9,9,11,10,6,8,9,5,6,11,8,8,7,7,7,7,8,7,9,10,9,8,8,3,4,4,4,2,4,3]},
  {kw:"Data Protection",url:"https://www.fortinet.com/resources/cyberglossary/data-protection",sv:6600,kd:50,wk35:2,wk36:2,aio:false,trend:[null,null,null,1,1,1,1,1,1,1,1,2,4,4,4,8,9,20,19,15,9,12,12,12,13,14,11,11,10,10,12,3,3,3,2,2]},
  {kw:"DCAP",url:"https://www.fortinet.com/resources/cyberglossary/dcap",sv:3600,kd:41,wk35:2,wk36:2,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,2,2,2,2,2,5,6,6,8,8,4,4,8,7,7,3,null,null,null,null,null,20,20,2,2]},
  {kw:"Device Control",url:"https://www.fortinet.com/resources/cyberglossary/device-control",sv:720,kd:30,wk35:43,wk36:45,aio:false,trend:[null,null,null,2,6,6,4,5,6,3,3,4,2,3,1,1,2,4,4,4,4,4,3,4,5,5,4,5,5,42,38,44,43,44,43,45]},
  {kw:"Digital Operational Resilience Act",url:"https://www.fortinet.com/resources/cyberglossary/digital-operational-resilience-act-dora",sv:140,kd:51,wk35:21,wk36:16,aio:false,trend:[null,null,null,null,null,17,21,8,20,23,19,18,20,19,16,16,16,16,27,15,16,19,18,21,19,36,30,43,31,14,17,16,15,17,21,16]},
  {kw:"DLP Monitoring",url:"https://www.fortinet.com/resources/cyberglossary/dlp-monitoring",sv:110,kd:27,wk35:1,wk36:1,aio:true,trend:[null,null,null,2,2,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"DLP Policy",url:"https://www.fortinet.com/resources/cyberglossary/dlp-policy",sv:720,kd:21,wk35:9,wk36:9,aio:false,trend:[null,null,null,7,7,7,7,8,8,7,6,8,2,6,8,6,2,6,5,5,6,5,5,3,5,4,3,2,2,16,14,16,12,7,9,9]},
  {kw:"DLP As A Service",url:"https://www.fortinet.com/resources/cyberglossary/dlpaas-and-dlp-as-a-managed-service",sv:50,kd:39,wk35:1,wk36:1,aio:false,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1]},
  {kw:"File Sharing Security",url:"https://www.fortinet.com/resources/cyberglossary/file-sharing-security",sv:40,kd:25,wk35:1,wk36:1,aio:false,trend:[null,null,null,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"GDPR",url:"https://www.fortinet.com/resources/cyberglossary/gdpr",sv:49500,kd:100,wk35:48,wk36:1,aio:false,trend:[null,null,null,1,1,13,13,13,13,48,39,39,39,39,39,57,79,79,79,78,1,1,42,42,40,41,40,42,41,71,68,44,2,2,48,1]},
  {kw:"Hipaa Compliance",url:"https://www.fortinet.com/resources/cyberglossary/hipaa-compliance",sv:22200,kd:76,wk35:16,wk36:13,aio:false,trend:[null,null,null,14,16,18,17,17,5,2,13,14,9,10,10,16,12,15,21,19,18,17,18,18,22,20,19,19,17,16,15,14,14,15,16,13]},
  {kw:"Identity Risk",url:"https://www.fortinet.com/resources/cyberglossary/identity-risk-prioritization",sv:170,kd:16,wk35:16,wk36:16,aio:false,trend:[null,null,null,5,3,6,4,5,5,4,3,3,3,1,1,1,1,1,1,2,7,5,5,9,9,8,11,14,10,12,13,19,9,10,16,16]},
  {kw:"Living Off The Land Attack",url:"https://www.fortinet.com/resources/cyberglossary/living-off-the-land-lotl",sv:320,kd:37,wk35:28,wk36:27,aio:false,trend:[null,null,null,4,8,8,8,8,2,4,4,4,2,3,7,3,3,2,2,2,2,2,2,2,3,4,2,4,3,25,29,28,27,24,28,27]},
  {kw:"National Vulnerability Database",url:"https://www.fortinet.com/resources/cyberglossary/national-vulnerability-database-nvd",sv:590,kd:25,wk35:5,wk36:5,aio:false,trend:[null,null,null,3,4,4,4,4,7,3,4,4,4,4,6,8,8,4,5,5,5,5,5,3,4,5,3,6,5,5,5,5,5,5,5,5]},
  {kw:"Network DLP",url:"https://www.fortinet.com/resources/cyberglossary/network-dlp",sv:320,kd:23,wk35:1,wk36:1,aio:true,trend:[null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Private 5G Warehousing",url:"https://www.fortinet.com/resources/cyberglossary/private-5g-warehousing",sv:0,kd:6,wk35:1,wk36:1,aio:false,trend:[null,null,null,3,3,3,2,2,1,3,2,1,1,2,3,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SAAS Security",url:"https://www.fortinet.com/resources/cyberglossary/saas-security",sv:1600,kd:40,wk35:3,wk36:3,aio:false,trend:[null,null,null,22,18,30,17,14,13,10,9,11,10,10,9,10,11,14,11,10,10,10,10,10,11,11,10,10,9,10,11,10,3,4,3,3]},
  {kw:"Secret Management",url:"https://www.fortinet.com/resources/cyberglossary/secret-management",sv:590,kd:39,wk35:25,wk36:23,aio:false,trend:[null,null,null,42,42,42,8,16,16,16,16,28,28,23,20,25,23,17,17,17,17,17,21,21,24,27,24,14,11,18,27,27,25,27,25,23]},
  {kw:"Security Misconfiguration",url:"https://www.fortinet.com/resources/cyberglossary/security-misconfiguration",sv:720,kd:30,wk35:7,wk36:7,aio:true,trend:[null,null,null,5,4,2,2,3,6,3,2,2,3,6,8,5,4,4,5,5,6,5,8,9,10,9,10,9,8,4,8,10,9,8,7,7]},
  {kw:"Software Defined Perimeter",url:"https://www.fortinet.com/resources/cyberglossary/what-is-a-software-defined-perimeter",sv:590,kd:27,wk35:5,wk36:7,aio:true,trend:[null,null,null,7,7,6,6,2,3,4,2,5,4,3,3,3,3,3,4,6,5,5,4,4,3,2,6,6,5,5,5,5,6,6,5,7]},
  {kw:"Threat Detection And Response",url:"https://www.fortinet.com/resources/cyberglossary/threat-detection-and-response",sv:1300,kd:31,wk35:12,wk36:12,aio:false,trend:[null,null,null,3,7,6,6,3,7,6,5,3,6,7,7,8,9,8,9,9,6,8,9,9,9,10,10,10,10,9,10,10,12,13,12,12]},
  {kw:"Remote Code Execution",url:"https://www.fortinet.com/resources/cyberglossary/remote-code-execution",sv:4400,kd:84,wk35:5,wk36:4,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,6,6,6,6,6,11,8,7,7,7,7,8,8,22,8,7,11,11,7,7,3,3,2,5,4]},
  {kw:"Data Poisoning",url:"https://www.fortinet.com/resources/cyberglossary/data-poisoning",sv:590,kd:39,wk35:24,wk36:26,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,5,5,4,6,5,5,5,10,19,18,14,18,30,31,29,23,28,28,24,27,27,27,30,24,26]},
  {kw:"Data Privacy",url:"https://www.fortinet.com/resources/cyberglossary/data-privacy",sv:6600,kd:88,wk35:null,wk36:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"Cloud Migration",url:"https://www.fortinet.com/resources/cyberglossary/cloud-migration",sv:480,kd:40,wk35:68,wk36:81,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,69,68,81]},
  {kw:"Cloud Workload Security",url:"https://www.fortinet.com/resources/cyberglossary/cloud-workload-security",sv:480,kd:23,wk35:10,wk36:9,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,7,7,8,6,10,14,12,18,10,5,7,8,8,8,8,9,9,10,10,9]},
  {kw:"Rise Of Cybersecurity Mesh",url:"https://www.fortinet.com/resources/cyberglossary/rise-of-cybersecurity-mesh",sv:170,kd:27,wk35:1,wk36:1,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,27,29,29,24,20,19,56,56,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"SAML",url:"https://www.fortinet.com/resources/cyberglossary/saml",sv:18100,kd:66,wk35:21,wk36:14,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9,15,14,14,13,16,15,16,16,15,16,21,17,17,17,17,21,21,21,14]},
  {kw:"NGFW Vs UTM",url:"https://www.fortinet.com/resources/cyberglossary/ngfw-vs-utm",sv:170,kd:7,wk35:1,wk36:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  {kw:"Cybersecurity Trends",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-trends-2026",sv:1300,kd:58,wk35:1,wk36:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,2,2,3,5,2,2,2,1,1]},
  {kw:"Cybersecurity Best Practices",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-best-practices",sv:40500,kd:67,wk35:4,wk36:6,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,4,18,7,10,12,4,6]},
  {kw:"Mlsecops",url:"https://www.fortinet.com/resources/cyberglossary/what-is-mlsecops",sv:100,kd:9,wk35:null,wk36:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"Quantum Cryptanalysis",url:"https://www.fortinet.com/resources/cyberglossary/quantum-cryptanalysis",sv:20,kd:30,wk35:4,wk36:4,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,3,3,4,4,4,4,4]},
  {kw:"Cybersecurity Risks",url:"https://www.fortinet.com/resources/cyberglossary/cybersecurity-risk",sv:590,kd:54,wk35:18,wk36:16,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,18,18,16]},
  {kw:"Quantum Cryptography",url:"https://www.fortinet.com/resources/cyberglossary/quantum-cryptography",sv:18100,kd:70,wk35:4,wk36:28,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,65,42,null,null,13,4,28]},
  {kw:"Red Teaming",url:"https://www.fortinet.com/resources/cyberglossary/red-teaming",sv:6600,kd:60,wk35:24,wk36:16,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,19,17,24,16]},
  {kw:"Prompt Injection Attack",url:"https://www.fortinet.com/resources/cyberglossary/prompt-injection",sv:1000,kd:75,wk35:15,wk36:18,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,17,24,15,18]},
  {kw:"AI Risk Management",url:"https://www.fortinet.com/resources/cyberglossary/ai-risk-management",sv:2800,kd:59,wk35:null,wk36:null,aio:false,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
  {kw:"SASE Firewall",url:"https://www.fortinet.com/resources/cyberglossary/sase",sv:40,kd:65,wk35:1,wk36:1,aio:true,trend:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,15,1,1]},
] as const as unknown as OKKw[]

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [slide, setSlide] = useState(0)
  const [pageIdx, setPageIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const currentSlide = SLIDES[slide]
  const currentPage  = currentSlide.pages[pageIdx]

  const goSlide = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return
    setSlide(next)
    setPageIdx(0)
    setAnimKey(k=>k+1)
  }
  const goPage = (idx: number) => {
    setPageIdx(idx)
    setAnimKey(k=>k+1)
  }

  // keyboard navigation
  useEffect(()=>{
    const handler = (e: KeyboardEvent) => {
      if (e.key==='ArrowRight'||e.key==='ArrowDown') goSlide(slide+1)
      if (e.key==='ArrowLeft'||e.key==='ArrowUp') goSlide(slide-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slide])

  return (
    <div style={{background:C.bg,color:C.text,fontFamily:C.sans,minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      {/* ambient grid */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
        backgroundImage:`linear-gradient(rgba(180,185,210,0.35) 1px,transparent 1px),linear-gradient(90deg,rgba(180,185,210,0.35) 1px,transparent 1px)`,
        backgroundSize:'48px 48px',
        WebkitMaskImage:'radial-gradient(ellipse 110% 55% at 50% 0%,black 0%,transparent 80%)',
        maskImage:'radial-gradient(ellipse 110% 55% at 50% 0%,black 0%,transparent 80%)'}}/>

      {/* ── TOPBAR ── */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'rgba(243,245,251,0.97)',
        backdropFilter:'blur(14px)',borderBottom:`1px solid ${C.line}`,
        display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 28px',
        boxShadow:'0 1px 0 rgba(0,0,0,0.04)'}}>

        {/* Brand */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:C.red,display:'flex',
            alignItems:'center',justifyContent:'center',fontFamily:C.sans,fontWeight:800,color:'#fff',fontSize:14,letterSpacing:'-0.02em'}}>F</div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:1}}>
            <span style={{fontFamily:C.sans,fontSize:15,fontWeight:700,color:C.text,letterSpacing:'-0.01em',lineHeight:1.1}}>Fortinet</span>
            <span style={{fontFamily:C.mono,fontSize:11.5,letterSpacing:'0.06em',color:C.textDim,textTransform:'uppercase' as const,lineHeight:1}}>SEO Intelligence</span>
          </div>
        </div>

        {/* Slide nav */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {SLIDES.map((s,i)=>(
            <button key={s.key} onClick={()=>goSlide(i)}
              style={{fontFamily:C.sans,fontSize:15,fontWeight:700,
                border:`1px solid ${i===slide?s.color:C.line}`,
                background:i===slide?`rgba(${hexToRgb(s.color)},0.1)`:C.surface2,
                color:i===slide?s.color:C.textMid,
                padding:'7px 16px',borderRadius:20,cursor:'pointer',transition:'all .18s',
                letterSpacing:'-0.01em'}}>
              {s.label}
            </button>
          ))}
          <div style={{width:1,height:18,background:C.line,margin:'0 4px'}}/>
          <button onClick={()=>goSlide(slide-1)} disabled={slide===0}
            style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.line}`,
              background:C.surface,color:slide===0?C.textDim:C.textMid,cursor:slide===0?'default':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s',
              boxShadow:slide===0?'none':'0 1px 3px rgba(0,0,0,0.06)'}}>
            ←
          </button>
          <span style={{fontFamily:C.mono,fontSize:12.5,color:C.textDim,minWidth:28,textAlign:'center' as const}}>
            {slide+1}/{SLIDES.length}
          </span>
          <button onClick={()=>goSlide(slide+1)} disabled={slide===SLIDES.length-1}
            style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.line}`,
              background:C.surface,color:slide===SLIDES.length-1?C.textDim:C.textMid,
              cursor:slide===SLIDES.length-1?'default':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all .15s',
              boxShadow:slide===SLIDES.length-1?'none':'0 1px 3px rgba(0,0,0,0.06)'}}>
            →
          </button>
        </div>

        {/* Week chip */}
        <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:C.mono,fontSize:12.5,
          color:C.teal,border:`1px solid ${C.teal}38`,background:`${C.teal}0e`,
          padding:'5px 12px',borderRadius:20,letterSpacing:'0.03em'}}>
          <span className="status-dot" style={{width:6,height:6,borderRadius:'50%',background:C.teal,
            boxShadow:`0 0 6px ${C.teal}88`,display:'inline-block'}}/>
          40 WEEKS
        </div>
      </div>

      {/* ── SLIDE ── */}
      <div style={{flex:1,position:'relative',zIndex:2,maxWidth:1200,width:'100%',margin:'0 auto',
        padding:'32px 28px 60px',display:'flex',flexDirection:'column',gap:0}}>

        {/* Slide header */}
        <div style={{marginBottom:22}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <div style={{width:4,height:36,background:currentSlide.color,borderRadius:2,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:C.mono,fontSize:12.5,color:currentSlide.color,
                textTransform:'uppercase' as const,letterSpacing:'0.12em',marginBottom:4,fontWeight:700}}>
                {String(slide+1).padStart(2,'0')} — {currentSlide.label}
              </div>
              <h1 style={{margin:0,fontSize:'clamp(22px,2.8vw,32px)',fontWeight:800,
                letterSpacing:'-0.025em',lineHeight:1.1,color:C.text,fontFamily:C.sans,
                display:'flex',flexDirection:'column' as const,alignItems:'flex-start',gap:2}}>
                <span>{currentPage.short}</span>
                {'sub' in currentPage && (currentPage as any).sub && (
                  <span style={{fontSize:'clamp(13px,1.4vw,16px)',fontWeight:600,color:C.textDim,letterSpacing:'0.01em',lineHeight:1}}>
                    {(currentPage as any).sub}
                  </span>
                )}
              </h1>
            </div>
          </div>
          <p style={{color:C.textDim,fontSize:15,margin:'6px 0 0 16px',maxWidth:700,lineHeight:1.6,fontWeight:600}}>
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Page selector buttons */}
        <div style={{display:'flex',gap:7,flexWrap:'wrap' as const,marginBottom:22}}>
          {currentSlide.pages.map((p,i)=>{
            const active=i===pageIdx
            return (
              <button key={p.title} onClick={()=>goPage(i)}
                style={{fontFamily:C.sans,fontSize:15,fontWeight:700,
                  border:`1px solid ${active?currentSlide.color:C.line}`,
                  background:active?`rgba(${hexToRgb(currentSlide.color)},0.10)`:C.surface,
                  color:active?currentSlide.color:C.textMid,
                  padding:'7px 16px',borderRadius:8,cursor:'pointer',
                  transition:'all .15s ease',letterSpacing:'-0.01em',
                  boxShadow:active?`0 0 0 1px ${currentSlide.color}20`:'0 1px 2px rgba(0,0,0,0.04)',
                  display:'flex',flexDirection:'column' as const,alignItems:'center',gap:1,lineHeight:1.2,
                }}>
                <span>{p.short}</span>
                {'sub' in p && (p as any).sub && (
                  <span style={{fontSize:11,fontWeight:600,opacity:0.75,letterSpacing:'0.01em'}}>
                    {(p as any).sub}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{height:1,background:`linear-gradient(90deg,${currentSlide.color}44,${C.lineSoft},transparent)`,marginBottom:24}}/>

        {/* Content */}
        <div key={animKey} className="section-anim" style={{flex:1}}>
          <SlideContent sectionTitle={currentPage.title} source={currentPage.source}/>
        </div>

        {/* Slide dots */}
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:32,paddingTop:20,
          borderTop:`1px solid ${C.lineSoft}`}}>
          {SLIDES.map((s,i)=>(
            <button key={s.key} onClick={()=>goSlide(i)}
              style={{width:i===slide?24:8,height:8,borderRadius:4,border:'none',
                background:i===slide?s.color:C.line,cursor:'pointer',
                transition:'all .2s ease',padding:0}}>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r=parseInt(hex.slice(1,3),16)
  const g=parseInt(hex.slice(3,5),16)
  const b=parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}
