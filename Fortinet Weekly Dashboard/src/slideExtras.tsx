import { useState } from 'react'
import {
  SECTIONS, CG_CATS, CWV_DESKTOP, CWV_MOBILE, OVERALL_RANKING_PAGES,
  keyTakeawaysCards, KEY_TAKEAWAYS_PRIORITIES,
} from './dashboardData'
import type { Metric, Section, OKKw } from './dashboardData'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const INK = '#0b1220', MID = '#1f2937', DIM = '#475569', LINE = '#dde1ed'
const MONO = "'JetBrains Mono','Courier New',monospace"
const SANS = "'Inter',-apple-system,sans-serif"

const G = '#16a34a', B = '#1d4ed8', O = '#ea580c', P = '#9333ea', R = '#dc2626', GRAY = '#94a3b8', TEAL = '#0891b2'
const BRAND_COLORS = ['#ee3124', '#d97706', '#0284c7', '#6366f1', '#16a34a', '#ea580c', '#a21caf', '#0f766e', '#64748b']

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Tone = 'win' | 'info' | 'warn'
export type Insight = { tone: Tone; title: string; text: string }
export type Slice = { label: string; value: number; color: string; display: string }
export type Ref = { label: string; display: string }
export type PieCfg = {
  heading: string; sub: string
  centerValue: string; centerLabel: string
  slices: Slice[]; refs?: Ref[]
  total?: 'int' | 'compact' | 'none'
  showShare?: boolean
  maxVisible?: number
}
export type Extras = { insights: Insight[]; pies: PieCfg[]; pieAfterMetrics: boolean }
export type ExtrasCtx = { cg: OKKw[]; art: OKKw[] }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const N = 40
const sec = (t: string) => SECTIONS.find(s => s.title === t)
const cur = (m: Metric) => m.values[N] ?? 0
const prv = (m: Metric) => m.values[N - 1] ?? 0
const isPctName = (n: string) => /%|CTR/i.test(n)
const lowerBetter = (n: string) => /Avg\. Position|Category Rank/i.test(n)
const int = (n: number) => Math.round(n).toLocaleString('en-US')
const abs = Math.abs
const pctOf = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100)

function compact(n: number): string {
  const a = abs(n)
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e5) return Math.round(n / 1e3) + 'K'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
function cardValue(name: string, n: number): string {
  if (/%|CTR/i.test(name)) return (n * 100).toFixed(2) + '%'
  if (abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toFixed(2)
}
const fmtMetric = (name: string, n: number) => (isPctName(name) ? (n * 100).toFixed(1) + '%' : compact(n))
const shareTxt = (v: number, total: number) => {
  const p = pctOf(v, total)
  return p > 0 && p < 0.1 ? '<0.1%' : p.toFixed(1) + '%'
}
const cleanName = (n: string) => n.replace(/ %$/, '').replace(/ Organic Traffic$/, ' organic traffic')

type V = { c: number; p: number }
const val = (s: Section, name: string): V | null => {
  const m = s.metrics.find(x => x.name === name)
  return m ? { c: cur(m), p: prv(m) } : null
}

// ─── INSIGHT BUILDERS ────────────────────────────────────────────────────────
function positionExtras(s: Section, o: { heading: string; sub: string; beyondLabel: string }): Pick<Extras, 'insights' | 'pies'> {
  const p1 = val(s, 'Position 1')!, p23 = val(s, 'Position 2-3')!, p410 = val(s, 'Position 4-10')!
  const page1 = val(s, 'Total Keywords on Page 1')!, overall = val(s, 'Overall Number of Keywords')!
  const aio = val(s, 'Keywords in AI Overview'), nr = val(s, 'Keywords without Ranking')
  const explicit = val(s, 'Total Kws on Page 2-10')
  const pages = OVERALL_RANKING_PAGES[s.title]
  const p210: V = explicit ?? {
    c: overall.c - page1.c - (nr?.c ?? 0),
    p: overall.p - page1.p - (nr?.p ?? 0),
  }
  const goal = s.metrics.find(m => m.name === 'Total Keywords on Page 1')?.goal ?? null
  const d = (x: V) => x.c - x.p

  const buckets = [
    { n: 'Position 1', v: p1 }, { n: 'Position 2–3', v: p23 }, { n: 'Position 4–10', v: p410 },
  ]
  const gains = buckets.filter(b => d(b.v) > 0).sort((a, b) => d(b.v) - d(a.v))
  const losses = buckets.filter(b => d(b.v) < 0).sort((a, b) => d(a.v) - d(b.v))

  const dPage1 = d(page1)
  let t1 = `${int(page1.c)} of ${int(overall.c)} tracked keywords rank on Page 1 (${shareTxt(page1.c, overall.c)}). That is ${
    dPage1 === 0 ? 'unchanged from' : `${int(abs(dPage1))} ${dPage1 > 0 ? 'more than' : 'fewer than'}`} last week.`
  if (goal) t1 += ` The ${int(goal)} goal is ${page1.c >= goal ? `exceeded by ${int(page1.c - goal)}` : `${int(goal - page1.c)} keywords away`}.`

  const oppText = pages
    ? `${pages.map(page => `${int(page.value)} keywords on ${page.label}`).join(' and ')} — the nearest opportunity to push onto Page 1.`
    : explicit
    ? `${int(p210.c)} keywords sit on Pages 2–10 (positions 11–100) — the nearest opportunity to push onto Page 1.`
    : `${int(p210.c)} keywords rank beyond Page 1 (${shareTxt(p210.c, overall.c)} of the set) — the main room for growth.`

  const insights: Insight[] = [{ tone: dPage1 >= 0 ? 'win' : 'warn', title: 'THIS WEEK ON PAGE 1', text: t1 }]
  if (gains.length) {
    const g = gains[0]
    insights.push({ tone: 'win', title: `BIGGEST IMPROVEMENT: ${g.n.toUpperCase()}`,
      text: `${g.n} increased from ${int(g.v.p)} to ${int(g.v.c)}, a gain of ${int(d(g.v))} keywords this week.` })
  } else if (losses.length) {
    const l = losses[0]
    insights.push({ tone: 'warn', title: `BIGGEST DECLINE: ${l.n.toUpperCase()}`,
      text: `${l.n} decreased from ${int(l.v.p)} to ${int(l.v.c)}, a loss of ${int(abs(d(l.v)))} keywords. No ranking band improved this week.` })
  } else {
    insights.push({ tone: 'info', title: 'RANKINGS STEADY', text: 'All position ranges held their numbers versus last week.' })
  }
  if (gains.length && losses.length) {
    const l = losses[0]
    insights.push({ tone: 'warn', title: `NEEDS ATTENTION: ${l.n.toUpperCase()}`,
      text: `${l.n} decreased from ${int(l.v.p)} to ${int(l.v.c)}. ${oppText}` })
  } else {
    insights.push({ tone: 'info', title: explicit ? 'PAGE 2–10 OPPORTUNITY' : 'ROOM TO GROW', text: oppText })
  }

  const slices: Slice[] = [
    { label: 'Position 1', value: p1.c, color: G, display: int(p1.c) },
    { label: 'Position 2–3', value: p23.c, color: B, display: int(p23.c) },
    { label: 'Position 4–10', value: p410.c, color: O, display: int(p410.c) },
  ]
  if (pages) {
    pages.forEach((page, i) => slices.push({
      ...page, color: [P, TEAL][i], display: int(page.value),
    }))
    const remaining = overall.c - slices.reduce((sum, slice) => sum + slice.value, 0) - (nr?.c ?? 0)
    slices.push({ label: 'Page 4–10', value: remaining, color: GRAY, display: int(remaining) })
  } else {
    slices.push({ label: o.beyondLabel, value: p210.c, color: P, display: int(p210.c) })
  }
  if (nr) slices.push({ label: 'Not ranking', value: nr.c, color: '#475569', display: int(nr.c) })
  const refs: Ref[] = [
    { label: 'Total keywords on Page 1', display: int(page1.c) },
    { label: 'Overall keywords', display: int(overall.c) },
  ]
  if (aio) refs.push({ label: 'Keywords in AI Overview', display: int(aio.c) })

  return {
    insights,
    pies: [{
      heading: o.heading,
      sub: o.sub,
      centerValue: int(overall.c), centerLabel: 'keywords', slices, refs,
    }],
  }
}

function genericMetricExtras(s: Section): Insight[] {
  const rows = s.metrics.map(m => {
    const c = cur(m), p = prv(m)
    const chg = p === 0 ? 0 : ((c - p) / abs(p)) * 100
    const good = lowerBetter(m.name) ? -chg : chg
    return { m, c, p, chg, good }
  })
  const used = new Set<string>()
  const out: Insight[] = []
  const take = (i: Insight, key: string) => { out.push(i); used.add(key) }

  // goal progress
  const goalRow = rows.find(r => r.m.goal)
  if (goalRow) {
    const g = goalRow.m.goal as number
    const prog = pctOf(goalRow.c, g)
    take({
      tone: goalRow.c >= g ? 'win' : 'info',
      title: `GOAL PROGRESS: ${cleanName(goalRow.m.name).toUpperCase()}`,
      text: `${fmtMetric(goalRow.m.name, goalRow.c)} this week — ${prog.toFixed(0)}% of the ${fmtMetric(goalRow.m.name, g)} goal (${fmtMetric(goalRow.m.name, abs(g - goalRow.c))} ${goalRow.c >= g ? 'above' : 'to go'}).`,
    }, goalRow.m.name)
  } else {
    const h = rows[0]
    take({
      tone: h.good >= 0 ? 'win' : 'warn',
      title: cleanName(h.m.name).toUpperCase(),
      text: `${fmtMetric(h.m.name, h.c)} this week, ${abs(h.chg) < 0.05 ? 'flat' : `${h.good >= 0 ? 'up' : 'down'} ${abs(h.chg).toFixed(1)}%`} vs ${fmtMetric(h.m.name, h.p)} last week.`,
    }, h.m.name)
  }

  const pool = () => rows.filter(r => !used.has(r.m.name))
  const best = [...pool()].sort((a, b) => b.good - a.good)[0]
  if (best && best.good > 0.05) {
    take({
      tone: 'win', title: `BIGGEST GAIN: ${cleanName(best.m.name).toUpperCase()}`,
      text: `${cleanName(best.m.name)} ${lowerBetter(best.m.name) ? 'improved' : 'rose'} ${abs(best.chg).toFixed(1)}% to ${fmtMetric(best.m.name, best.c)} (from ${fmtMetric(best.m.name, best.p)}).`,
    }, best.m.name)
  }
  const worst = [...pool()].sort((a, b) => a.good - b.good)[0]
  if (worst && worst.good < -0.05) {
    take({
      tone: 'warn', title: `WATCH: ${cleanName(worst.m.name).toUpperCase()}`,
      text: `${cleanName(worst.m.name)} ${lowerBetter(worst.m.name) ? 'worsened' : 'fell'} ${abs(worst.chg).toFixed(1)}% to ${fmtMetric(worst.m.name, worst.c)} (from ${fmtMetric(worst.m.name, worst.p)}).`,
    }, worst.m.name)
  }
  if (out.length < 2 && rows.length > 1) {
    const r = pool()[0]
    if (r) take({
      tone: 'info', title: cleanName(r.m.name).toUpperCase(),
      text: `${fmtMetric(r.m.name, r.c)} this week, ${abs(r.chg) < 0.05 ? 'flat' : `${r.chg >= 0 ? 'up' : 'down'} ${abs(r.chg).toFixed(1)}%`} vs last week.`,
    }, r.m.name)
  }
  if (out.length < 3) {
    const m = rows[0].m
    const vals = m.values.filter((x): x is number => x !== null)
    const peak = Math.max(...vals)
    const peakIdx = m.values.indexOf(peak)
    const WK = ['Jan 05','Jan 12','Jan 19','Jan 26','Feb 02','Feb 09','Feb 16','Feb 23','Mar 02','Mar 09','Mar 16','Mar 23','Mar 30','Apr 06','Apr 13','Apr 20','Apr 27','May 04','May 11','May 18','May 25','Jun 01','Jun 08','Jun 15','Jun 22','Jun 29','Jul 06','Jul 13','Jul 20','Jul 27','Aug 03','Aug 10','Aug 17','Aug 24','Aug 31','Sep 07','Sep 14','Sep 21','Sep 28','Oct 05','Oct 12']
    if (!lowerBetter(m.name)) {
      const now = cur(m)
      out.push({
        tone: now >= peak ? 'win' : 'info', title: `41-WEEK PEAK: ${cleanName(m.name).toUpperCase()}`,
        text: now >= peak
          ? `${fmtMetric(m.name, now)} is the highest value of the 41-week series.`
          : `Peak was ${fmtMetric(m.name, peak)} (${WK[peakIdx]}); today's ${fmtMetric(m.name, now)} is ${pctOf(now, peak).toFixed(0)}% of that high.`,
      })
    }
  }
  return out.slice(0, 3)
}

// Fortinet vs competitors on % metrics (AI Visibility / Share of Voice / Citation Rate)
function brandExtras(s: Section, o: { heading: string; sub: string; metric: string }): Pick<Extras, 'insights' | 'pies'> {
  const rows = s.metrics.map(m => ({ name: m.name.replace(' %', ''), c: cur(m), p: prv(m) }))
  const sorted = [...rows].sort((a, b) => b.c - a.c)
  const f = rows.find(r => r.name === 'Fortinet')!
  const rank = sorted.findIndex(r => r.name === 'Fortinet') + 1
  const pts = (x: number) => (abs(x) * 100).toFixed(1)
  const dF = f.c - f.p
  const others = sorted.filter(r => r.name !== 'Fortinet')
  const nearest = others[0]
  const movers = others.map(r => ({ ...r, d: r.c - r.p })).sort((a, b) => b.d - a.d)
  const topMover = movers[0]

  const insights: Insight[] = [
    {
      tone: rank === 1 ? 'win' : 'info',
      title: rank === 1 ? `FORTINET LEADS ${o.metric.toUpperCase()}` : `FORTINET RANKS #${rank}`,
      text: `Fortinet is #${rank} of ${rows.length} brands at ${(f.c * 100).toFixed(1)}%, ${abs(dF) < 0.0005 ? 'flat' : `${dF > 0 ? 'up' : 'down'} ${pts(dF)} pts`} vs last week.`,
    },
    rank === 1
      ? { tone: 'info', title: 'NEAREST RIVAL', text: `${nearest.name} is next at ${(nearest.c * 100).toFixed(1)}% — Fortinet leads by ${pts(f.c - nearest.c)} pts.` }
      : { tone: 'warn', title: `GAP TO ${sorted[0].name.toUpperCase()}`, text: `${sorted[0].name} leads at ${(sorted[0].c * 100).toFixed(1)}% — ${pts(sorted[0].c - f.c)} pts ahead of Fortinet.` },
    topMover.d > dF + 0.0005
      ? { tone: 'warn', title: 'COMPETITOR MOMENTUM', text: `${topMover.name} gained the most this week (+${pts(topMover.d)} pts to ${(topMover.c * 100).toFixed(1)}%), more than Fortinet.` }
      : { tone: 'win', title: 'MOMENTUM', text: `No competitor out-gained Fortinet this week; the biggest competitor move was ${topMover.d >= 0 ? '+' : '−'}${pts(topMover.d)} pts (${topMover.name}).` },
  ]

  const slices: Slice[] = sorted.map(r => ({
    label: r.name, value: r.c, color: BRAND_COLORS[rows.findIndex(x => x.name === r.name) % BRAND_COLORS.length],
    display: (r.c * 100).toFixed(1) + '%',
  }))
  return {
    insights,
    pies: [{
      heading: o.heading, sub: o.sub, centerValue: (f.c * 100).toFixed(1) + '%', centerLabel: 'Fortinet',
      slices, total: 'none',
    }],
  }
}

function focusedExtras(s: Section): Pick<Extras, 'insights' | 'pies'> {
  const f = s.metrics.find(m => m.name === 'Fortinet %')!
  const c = s.metrics.find(m => m.name !== 'Fortinet %')!
  const rival = c.name.replace(' %', '')
  const fc = cur(f), fp = prv(f), cc = cur(c), cp = prv(c)
  const pts = (x: number) => (abs(x) * 100).toFixed(1)
  const gap = fc - cc, gapPrev = fp - cp
  const leads = gap >= 0
  const widened = abs(gap) > abs(gapPrev)
  const insights: Insight[] = [
    {
      tone: leads ? 'win' : 'warn', title: leads ? 'FORTINET LEADS' : `${rival.toUpperCase()} LEADS`,
      text: `Fortinet ${(fc * 100).toFixed(1)}% vs ${rival} ${(cc * 100).toFixed(1)}% — Fortinet is ${pts(gap)} pts ${leads ? 'ahead' : 'behind'}.`,
    },
    {
      tone: fc - fp >= 0 ? 'win' : 'warn', title: 'FORTINET THIS WEEK',
      text: `${abs(fc - fp) < 0.0005 ? 'Flat' : `${fc > fp ? 'Up' : 'Down'} ${pts(fc - fp)} pts`} from ${(fp * 100).toFixed(1)}% last week.`,
    },
    {
      tone: (leads ? widened : !widened) ? 'win' : 'warn', title: widened ? 'GAP WIDENING' : 'GAP NARROWING',
      text: `${rival} ${cc - cp >= 0 ? 'rose' : 'fell'} ${pts(cc - cp)} pts to ${(cc * 100).toFixed(1)}%; the gap ${widened ? 'widened' : 'narrowed'} from ${pts(gapPrev)} to ${pts(gap)} pts.`,
    },
  ]
  return {
    insights,
    pies: [{
      heading: `Head-to-Head: Fortinet vs ${rival}`,
      sub: `Share of the two brands' combined AI visibility · ${s.title}`,
      centerValue: (fc * 100).toFixed(1) + '%', centerLabel: 'Fortinet',
      slices: [
        { label: 'Fortinet', value: fc, color: '#ee3124', display: (fc * 100).toFixed(1) + '%' },
        { label: rival, value: cc, color: '#2563eb', display: (cc * 100).toFixed(1) + '%' },
      ],
      total: 'none',
    }],
  }
}

function aioCompetitionExtras(s: Section): Pick<Extras, 'insights' | 'pies'> {
  const brand = (m: Metric) => m.name.replace(/ AIO (Keywords|Traffic)$/, '')
  const kws = s.metrics.filter(m => m.name.endsWith('AIO Keywords'))
  const trf = s.metrics.filter(m => m.name.endsWith('AIO Traffic'))
  const rankOf = (arr: Metric[]) => [...arr].sort((a, b) => cur(b) - cur(a))
  const kSorted = rankOf(kws), tSorted = rankOf(trf)
  const fk = kws.find(m => brand(m) === 'Fortinet')!, ft = trf.find(m => brand(m) === 'Fortinet')!
  const kRank = kSorted.findIndex(m => m === fk) + 1
  const tRank = tSorted.findIndex(m => m === ft) + 1
  const ftChg = ((cur(ft) - prv(ft)) / prv(ft)) * 100
  const lead = tSorted[0]
  const leadChg = ((cur(lead) - prv(lead)) / prv(lead)) * 100
  const insights: Insight[] = [
    {
      tone: kRank <= 2 ? 'win' : 'info', title: 'AIO KEYWORD PRESENCE',
      text: `Fortinet ranks #${kRank} of ${kws.length} brands with ${int(cur(fk))} AI Overview keywords (${cur(fk) >= prv(fk) ? '+' : '−'}${int(abs(cur(fk) - prv(fk)))} vs last week).`,
    },
    {
      tone: ftChg >= 0 ? 'win' : 'warn', title: 'AIO TRAFFIC',
      text: `Fortinet AIO traffic is ${compact(cur(ft))}, ${ftChg >= 0 ? 'up' : 'down'} ${abs(ftChg).toFixed(1)}% vs ${compact(prv(ft))} last week — rank #${tRank} of ${trf.length}.`,
    },
    {
      tone: 'info', title: `${brand(lead).toUpperCase()} LEADS TRAFFIC`,
      text: `${brand(lead)} captures ${compact(cur(lead))} AIO traffic (${leadChg >= 0 ? 'up' : 'down'} ${abs(leadChg).toFixed(1)}%) — ${(cur(lead) / cur(ft)).toFixed(1)}× Fortinet.`,
    },
  ]
  const colorOf = (arr: Metric[]) => (m: Metric) => BRAND_COLORS[arr.indexOf(m) % BRAND_COLORS.length]
  const mk = (arr: Metric[], sorted: Metric[], heading: string, sub: string, centerLabel: string): PieCfg => {
    const sum = arr.reduce((a, m) => a + cur(m), 0)
    const f = arr.find(m => brand(m) === 'Fortinet')!
    return {
      heading, sub, centerValue: shareTxt(cur(f), sum), centerLabel,
      slices: sorted.map(m => ({ label: brand(m), value: cur(m), color: colorOf(arr)(m), display: compact(cur(m)) })),
      total: 'compact',
    }
  }
  return {
    insights,
    pies: [
      mk(kws, kSorted, 'Who Shows Up in AI Overviews', 'AIO keywords by brand · Fortinet share in center', 'Fortinet share'),
      mk(trf, tSorted, 'Who Gets the AI Overview Traffic', 'AIO traffic by brand · Fortinet share in center', 'Fortinet share'),
    ],
  }
}

function currentMetricPie(m: Metric, o: { heading: string; sub: string; unit: string; refs?: Ref[] }): PieCfg {
  const value = cur(m)
  return {
    heading: o.heading,
    sub: o.sub,
    centerValue: compact(value),
    centerLabel: o.unit,
    slices: [{ label: m.name, value, color: '#0284c7', display: compact(value) }],
    refs: o.refs,
    total: 'none',
  }
}

// ─── MAIN ENTRY ──────────────────────────────────────────────────────────────
export function getSlideExtras(title: string, ctx: ExtrasCtx): Extras {
  const s = sec(title)
  const wrap = (e: Pick<Extras, 'insights' | 'pies'>, after = false): Extras => ({ ...e, pieAfterMetrics: after })

  switch (title) {
    case 'Ranking Insights — Overall Keywords':
      return wrap(positionExtras(s!, { heading: 'Where Fortinet Ranks on Google', sub: 'Semrush keyword set · current week (Oct 12)', beyondLabel: 'Beyond Page 1' }), true)
    case 'Ranking Insights — Bing (Overall Keywords)':
      return wrap(positionExtras(s!, { heading: 'Where Fortinet Ranks on Bing', sub: 'Bing Webmaster keyword set · current week (Oct 12)', beyondLabel: 'Beyond Page 1' }), true)
    case 'Ranking Insights — Cyberglossary (Overall Keywords)':
      return wrap(positionExtras(s!, { heading: 'Cyberglossary Ranking Spread', sub: 'All Cyberglossary keywords · current week (Oct 12)', beyondLabel: 'Beyond Page 1' }), true)
    case 'Ranking Insights — Cyberglossary (Priority Keywords)':
      return wrap(positionExtras(s!, { heading: 'Priority Glossary Keywords: Position Mix', sub: 'Cyberglossary primary keywords · current week (Oct 12)', beyondLabel: 'Page 2–10' }), true)
    case 'Ranking Insights — Articles (Priority Keywords)':
      return wrap(positionExtras(s!, { heading: 'Priority Articles: Position Mix', sub: 'Articles primary keywords · current week (Oct 12)', beyondLabel: 'Page 2–10' }), true)

    case 'Cyberglossary (Category)': {
      const tot = CG_CATS.reduce((a, c) => a + c.total, 0)
      const p1 = CG_CATS.reduce((a, c) => a + c.page1, 0)
      const bestRank = [...CG_CATS].sort((a, b) => a.avgRank - b.avgRank)[0]
      const mostGain = [...CG_CATS].sort((a, b) => b.gaining - a.gaining)[0]
      const worst = [...CG_CATS].sort((a, b) => b.avgRank - a.avgRank)[0]
      const mostDecl = [...CG_CATS].sort((a, b) => b.declining - a.declining)[0]
      const insights: Insight[] = [
        { tone: 'win', title: 'CATEGORY COVERAGE', text: `${CG_CATS.length} categories tracked: ${int(p1)} of ${int(tot)} keywords (${shareTxt(p1, tot)}) rank on Page 1.` },
        { tone: 'win', title: `MOST IMPROVING: ${mostGain.cat.toUpperCase()}`, text: `${mostGain.cat} has ${mostGain.gaining} keywords moving up this week. Best average rank: ${bestRank.cat} (${bestRank.avgRank.toFixed(1)}).` },
        { tone: 'warn', title: `NEEDS ATTENTION: ${worst.cat.toUpperCase()}`, text: `${worst.cat} has the weakest average rank (${worst.avgRank.toFixed(1)}). ${mostDecl.cat} has the most keywords dropping (${mostDecl.declining}).` },
      ]
      return wrap({ insights, pies: [] })
    }

    case 'Position Trackers & Movers': {
      const kws = ctx.cg
      const pos = (v: number | null | undefined) => (v ?? 101)
      const rows = kws.map(k => ({ kw: k.kw, a: pos(k.trend[N - 1]), b: pos(k.trend[N]) }))
      const up = rows.filter(r => r.b < r.a), down = rows.filter(r => r.b > r.a)
      const same = rows.filter(r => r.b === r.a)
      const ranked = (r: { a: number; b: number }) => r.a <= 100 && r.b <= 100
      const topUp = [...up.filter(ranked)].sort((x, y) => (y.a - y.b) - (x.a - x.b))[0]
      const topDown = [...down.filter(ranked)].sort((x, y) => (y.b - y.a) - (x.b - x.a))[0]
      const entered = up.filter(r => r.a > 100).length, dropped = down.filter(r => r.b > 100).length
      const solid = kws.filter(k => k.trend.slice(-10).every(v => v === 1)).length
      const insights: Insight[] = [
        { tone: 'win', title: 'KEYWORDS MOVING UP', text: `${up.length} keywords improved vs last week${entered ? `, including ${entered} newly ranked` : ''}.${topUp ? ` Biggest climb: “${topUp.kw}” from #${topUp.a} to #${topUp.b} (+${topUp.a - topUp.b}).` : ''}` },
        { tone: 'warn', title: 'KEYWORDS SLIPPING', text: `${down.length} keywords dropped${dropped ? `, including ${dropped} that fell out of the rankings` : ''}.${topDown ? ` Biggest fall: “${topDown.kw}” from #${topDown.a} to #${topDown.b} (−${topDown.b - topDown.a}).` : ''}` },
        { tone: 'info', title: 'ROCK-SOLID #1', text: `${solid} keywords have held Position 1 for 10 weeks straight; ${int(same.length)} keywords were unchanged this week.` },
      ]
      return wrap({ insights, pies: [{
        heading: 'Week-over-Week Rank Movement', sub: 'Cyberglossary primary keywords · Oct 05 → Oct 12', centerValue: int(rows.length), centerLabel: 'keywords',
        slices: [
          { label: 'Improved', value: up.length, color: G, display: int(up.length) },
          { label: 'No change', value: same.length, color: GRAY, display: int(same.length) },
          { label: 'Declined', value: down.length, color: R, display: int(down.length) },
        ],
      }] })
    }

    case 'Primary Keywords Explorer': {
      const all = [...ctx.cg, ...ctx.art]
      const inR = (k: OKKw, lo: number, hi: number) => k.wk41 !== null && k.wk41 !== 101 && k.wk41 >= lo && k.wk41 <= hi
      const p1 = all.filter(k => k.wk41 === 1).length, p23 = all.filter(k => inR(k, 2, 3)).length
      const p410 = all.filter(k => inR(k, 4, 10)).length, p210 = all.filter(k => inR(k, 11, 100)).length
      const nr = all.filter(k => k.wk41 === 101).length
      const page1 = p1 + p23 + p410
      const moves = all.map(k => ({ kw: k.kw, a: k.wk40 ?? 101, b: k.wk41 ?? 101 }))
      const topUp = [...moves].sort((x, y) => (y.a - y.b) - (x.a - x.b))[0]
      const topDown = [...moves].sort((x, y) => (y.b - y.a) - (x.b - x.a))[0]
      const insights: Insight[] = [
        { tone: 'win', title: 'PAGE 1 COVERAGE', text: `${int(page1)} of ${int(all.length)} tracked keywords (${shareTxt(page1, all.length)}) rank on Page 1; ${int(p210)} more sit on Pages 2–10.` },
        { tone: 'win', title: 'TOP GAINER', text: `“${topUp.kw}” climbed from ${topUp.a > 100 ? 'unranked' : '#' + topUp.a} to #${topUp.b} this week.` },
        { tone: 'warn', title: 'TOP DECLINER', text: `“${topDown.kw}” fell from #${topDown.a} to ${topDown.b > 100 ? 'unranked' : '#' + topDown.b} — worth a content check.` },
      ]
      return wrap({ insights, pies: [{
        heading: 'Tracked Keywords by Position', sub: 'Cyberglossary + Articles primary keywords · current week', centerValue: int(all.length), centerLabel: 'keywords',
        slices: [
          { label: 'Position 1', value: p1, color: G, display: int(p1) },
          { label: 'Position 2–3', value: p23, color: B, display: int(p23) },
          { label: 'Position 4–10', value: p410, color: O, display: int(p410) },
          { label: 'Page 2–10', value: p210, color: P, display: int(p210) },
          { label: 'Not ranking', value: nr, color: '#475569', display: int(nr) },
        ],
        refs: [{ label: 'Total keywords on Page 1', display: int(page1) }, { label: 'Keywords in AI Overview', display: int(all.filter(k => k.aio).length) }],
      }] })
    }

    case 'Featured Snippets': {
      const m = s!.metrics[0]
      const insights = genericMetricExtras(s!)
      return wrap({ insights, pies: [currentMetricPie(m, { heading: 'Featured Snippets This Week', sub: 'Current-week metric card value · Oct 12', unit: 'snippets won' })] }, true)
    }

    // ── TRAFFIC ──
    case 'Traffic Growth': {
      const g = (n: string) => cur(s!.metrics.find(m => m.name === n)!)
      const overall = g('Overall Traffic'), nb = g('Non-Branded Organic Traffic'), br = g('Branded Organic Traffic')
      return wrap({ insights: genericMetricExtras(s!), pies: [{
        heading: 'Where Our Website Traffic Comes From', sub: 'Non-branded vs branded organic vs all other channels · current week',
        centerValue: compact(overall), centerLabel: 'total traffic',
        slices: [
          { label: 'Non-branded organic', value: nb, color: TEAL, display: compact(nb) },
          { label: 'Branded organic', value: br, color: O, display: compact(br) },
          { label: 'All other traffic', value: Math.max(overall - nb - br, 0), color: GRAY, display: compact(Math.max(overall - nb - br, 0)) },
        ],
        refs: ['Organic Traffic', 'Cyberglossary Organic Traffic', 'Products Organic Traffic', 'Blog Organic Traffic', 'International Pages Organic Traffic'].map(n => ({ label: n.replace(' Traffic', ''), display: compact(g(n)) })),
        total: 'compact',
      }] }, true)
    }
    case 'Direct Traffic': {
      const g = (n: string) => cur(s!.metrics.find(m => m.name === n)!)
      const overall = g('Overall Traffic'), direct = g('Direct Traffic'), noEmail = g('Direct (W/O Email & Live Chat)'), valid = g('Direct (Valid W/O /Download URLs)')
      return wrap({ insights: genericMetricExtras(s!), pies: [{
        heading: 'Anatomy of Direct Traffic', sub: 'Direct traffic split into clean vs filtered segments · current week',
        centerValue: compact(direct), centerLabel: 'direct traffic',
        slices: [
          { label: 'Valid direct', value: valid, color: G, display: compact(valid) },
          { label: 'Direct to /download URLs', value: noEmail - valid, color: O, display: compact(noEmail - valid) },
          { label: 'Email & live chat', value: direct - noEmail, color: P, display: compact(direct - noEmail) },
          { label: 'Non-direct traffic', value: overall - direct, color: GRAY, display: compact(overall - direct) },
        ],
        refs: [{ label: 'Overall traffic', display: compact(overall) }, { label: 'Direct traffic', display: compact(direct) }],
        total: 'compact',
      }] }, true)
    }
    case 'GSC Click Growth': {
      const g = (n: string) => cur(s!.metrics.find(m => m.name === n)!)
      const clicks = g('GSC Clicks'), imp = g('GSC Impressions')
      return wrap({ insights: genericMetricExtras(s!), pies: [{
        heading: 'From Impression to Click', sub: 'Google Search Console · current week', centerValue: (g('GSC CTR %') * 100).toFixed(1) + '%', centerLabel: 'click-through',
        slices: [
          { label: 'Clicks', value: clicks, color: '#1a73e8', display: compact(clicks) },
          { label: 'Impressions without a click', value: imp - clicks, color: '#cbd5e1', display: compact(imp - clicks) },
        ],
        refs: [{ label: 'Total impressions', display: compact(imp) }, { label: 'Average position', display: g('GSC Avg. Position').toFixed(1) }],
        total: 'compact',
      }] }, true)
    }
    case 'Bing Traffic Growth': {
      const g = (n: string) => cur(s!.metrics.find(m => m.name === n)!)
      const clicks = g('Bing Clicks'), imp = g('Bing Impressions')
      return wrap({ insights: genericMetricExtras(s!), pies: [{
        heading: 'From Impression to Click on Bing', sub: 'Bing Webmaster Tools · current week', centerValue: (g('Bing CTR %') * 100).toFixed(1) + '%', centerLabel: 'click-through',
        slices: [
          { label: 'Clicks', value: clicks, color: '#008373', display: compact(clicks) },
          { label: 'Impressions without a click', value: imp - clicks, color: '#cbd5e1', display: compact(imp - clicks) },
        ],
        refs: [{ label: 'Total impressions', display: compact(imp) }, { label: 'Bing organic traffic', display: compact(g('Bing Organic Traffic')) }, { label: 'Average position', display: g('Bing Avg. Position').toFixed(1) }],
        total: 'compact',
      }] }, true)
    }

    // ── LLMs & AI ──
    case 'Search-Generated Engagement (AI Overviews)': {
      const m = s!.metrics[0]
      return wrap({ insights: genericMetricExtras(s!), pies: [currentMetricPie(m, {
        heading: 'AI Overview Keywords This Week', sub: 'Semrush AIO keyword count · Oct 12', unit: 'AIO keywords',
        refs: s!.metrics.slice(1).map(x => ({ label: x.name, display: compact(cur(x)) })),
      })] }, true)
    }
    case 'AIO Competition':
      return wrap(aioCompetitionExtras(s!))
    case 'Bing AI Performance': {
      const m = s!.metrics[0]
      return wrap({ insights: genericMetricExtras(s!), pies: [currentMetricPie(m, {
        heading: 'Bing AI Citations This Week', sub: 'Current-week Bing citation count · Oct 12', unit: 'citations',
        refs: s!.metrics.slice(1).map(x => ({ label: x.name, display: compact(cur(x)) })),
      })] }, true)
    }
    case 'LLM Traffic': {
      const cols = [ '#10a37f', '#20808d', '#4285f4', '#d97757', '#6366f1']
      const sum = s!.metrics.reduce((a, m) => a + cur(m), 0)
      return wrap({ insights: genericMetricExtras(s!), pies: [{
        heading: 'AI Referral Traffic by Engine', sub: 'Sessions sent by each AI assistant · current week', centerValue: compact(sum), centerLabel: 'AI sessions',
        slices: s!.metrics.map((m, i) => ({ label: m.name, value: cur(m), color: cols[i % cols.length], display: compact(cur(m)) })), total: 'compact',
      }] }, true)
    }

    // ── LLM METRICS ──
    case 'AI Visibility %':
      return wrap(brandExtras(s!, { heading: 'Who AI Assistants Mention Most', sub: 'Relative share of AI visibility among 9 tracked brands', metric: 'AI visibility' }))
    case 'Share of Voice %':
      return wrap(brandExtras(s!, { heading: 'Who Owns the AI Conversation', sub: 'Relative share of voice among 9 tracked brands', metric: 'share of voice' }))
    case 'Citation Rate %':
      return wrap(brandExtras(s!, { heading: 'Who AI Assistants Cite as a Source', sub: 'Relative citation rate among 9 tracked brands', metric: 'citation rate' }))

    // ── WEBSITE SCORE ──
    case 'Website Performance Score': {
      const d = s!.metrics.find(m => m.name === 'Desktop Score')!, mo = s!.metrics.find(m => m.name === 'Mobile Score')!
      const band = (v: number) => (v >= 90 ? G : v >= 50 ? '#d97706' : R)
      const insights = genericMetricExtras(s!).slice(0, 2)
      insights.push({ tone: 'warn', title: 'GAP TO “GOOD” (90+)', text: `Desktop needs +${90 - cur(d)} pts and Mobile needs +${90 - cur(mo)} pts to reach Google's 90+ “Good” band.` })
      const mkPie = (m: Metric, label: string): PieCfg => ({
        heading: `${label} Score`, sub: 'PageSpeed score out of 100 · current week', centerValue: String(cur(m)), centerLabel: '/ 100',
        slices: [
          { label: `${label} score`, value: cur(m), color: band(cur(m)), display: String(cur(m)) },
          { label: 'Gap to 100', value: 100 - cur(m), color: '#e2e8f0', display: String(100 - cur(m)) },
        ], total: 'none',
      })
      return wrap({ insights, pies: [mkPie(d, 'Desktop'), mkPie(mo, 'Mobile')] })
    }
    case 'Core Web Vitals': {
      const n = CWV_DESKTOP.length
      const dp = CWV_DESKTOP.filter(v => v === 'Pass').length, mp = CWV_MOBILE.filter(v => v === 'Pass').length
      const insights: Insight[] = [
        { tone: dp === 0 ? 'warn' : 'win', title: 'DESKTOP', text: `${dp} of ${n} weeks passed Core Web Vitals on desktop — ${n - dp} weeks failed.` },
        { tone: mp === 0 ? 'warn' : 'win', title: 'MOBILE', text: `${mp} of ${n} weeks passed Core Web Vitals on mobile — ${n - mp} weeks failed.` },
        { tone: 'info', title: 'WHY IT MATTERS', text: 'Core Web Vitals are a confirmed Google ranking signal; failing them caps how far rankings can climb.' },
      ]
      const mk = (label: string, pass: number): PieCfg => ({
        heading: `${label}: Pass vs Fail`, sub: `Weekly Core Web Vitals status · ${n} weeks`, centerValue: `${pass}/${n}`, centerLabel: 'weeks passed',
        slices: [
          { label: 'Weeks passed', value: pass, color: G, display: String(pass) },
          { label: 'Weeks failed', value: n - pass, color: R, display: String(n - pass) },
        ], total: 'int',
      })
      return wrap({ insights, pies: [mk('Desktop', dp), mk('Mobile', mp)] })
    }

    // ── GAIN & LOSS ──
    case 'GL — Gain 2':
      return wrap({
        insights: [
          { tone: 'win', title: 'INTERNATIONAL ORGANIC UP 9%', text: 'International organic traffic rose from 49.8K to 54.5K sessions (+4,678).' },
          { tone: 'info', title: 'US PAGE DATA UNAVAILABLE', text: 'The Oct 12 Gain and Loss file contains no populated US organic page rows.' },
          { tone: 'warn', title: 'SOURCE DISAGREEMENT', text: 'Gain/Loss reports organic traffic at 447K while Leadership Metrics reports 444K for Oct 12.' },
        ],
        pies: [{
          heading: 'International Organic Traffic: Base + Gain', sub: 'International pages, Oct 05 vs Oct 12', centerValue: '54.5K', centerLabel: 'sessions',
          slices: [
            { label: 'Carried-over traffic', value: 49.788, color: '#0284c7', display: '49.8K' },
            { label: 'New gain', value: 4.678, color: G, display: '+4.7K' },
          ], total: 'none',
        }],
      })
    case 'GL — GSC Keywords':
      return wrap({
        insights: [
          { tone: 'info', title: 'BRANDED CLICKS', text: 'Top-10 branded keywords drove 72.2K clicks at an average rank of 1.2; “fortinet” alone brought 43.3K.' },
          { tone: 'win', title: 'NON-BRANDED CLICKS', text: 'Top-10 non-branded keywords drove 48.2K clicks at an average rank of 4.0, led by “proxy server” (20.2K).' },
          { tone: 'info', title: 'BRAND DEPENDENCE', text: 'Branded terms deliver 60% of the top-20 keyword clicks — non-branded growth is the lever to pull.' },
        ],
        pies: [{
          heading: 'Where Top-Keyword Clicks Come From', sub: 'GSC top-10 branded vs top-10 non-branded · previous supplied snapshot', centerValue: '120.4K', centerLabel: 'clicks',
          slices: [
            { label: 'Branded keywords', value: 72.2, color: '#ee3124', display: '72.2K' },
            { label: 'Non-branded keywords', value: 48.2, color: '#1d4ed8', display: '48.2K' },
          ], total: 'none',
        }],
      })

    case 'Key Takeaways': {
      const counts = { win: 0, warn: 0, critical: 0, neutral: 0 }
      keyTakeawaysCards.forEach(c => c.bullets.forEach(b => { counts[b.status]++ }))
      const total = counts.win + counts.warn + counts.critical + counts.neutral
      const insights: Insight[] = KEY_TAKEAWAYS_PRIORITIES.slice(0, 3).map(p => ({
        tone: (p.rank === 1 ? 'warn' : p.rank === 2 ? 'info' : 'info') as Tone,
        title: `PRIORITY ${p.rank}`, text: p.label,
      }))
      return wrap({ insights, pies: [{
        heading: 'Scorecard: Wins vs Watch-Outs', sub: 'All takeaway points across the dashboard', centerValue: String(total), centerLabel: 'takeaways',
        slices: [
          { label: 'Wins', value: counts.win, color: G, display: String(counts.win) },
          { label: 'Watch', value: counts.warn, color: '#d97706', display: String(counts.warn) },
          { label: 'Critical', value: counts.critical, color: R, display: String(counts.critical) },
          { label: 'Neutral', value: counts.neutral, color: GRAY, display: String(counts.neutral) },
        ],
      }] })
    }
  }

  // Focused-category pages (two brands, % metrics)
  if (s && s.metrics.length === 2 && s.metrics.some(m => m.name === 'Fortinet %')) return wrap(focusedExtras(s))

  return { insights: s ? genericMetricExtras(s) : [], pies: [], pieAfterMetrics: false }
}

// ─── UI: KEY INSIGHTS ────────────────────────────────────────────────────────
const TONE = {
  win:  { bg: '#ecfdf3', border: '#86efac', head: '#15803d' },
  info: { bg: '#eff6ff', border: '#93c5fd', head: '#1d4ed8' },
  warn: { bg: '#fff7ed', border: '#fdba74', head: '#c2410c' },
} as const

function ToneIcon({ tone }: { tone: Tone }) {
  const c = TONE[tone].head
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (tone === 'win') return (
    <svg {...common}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
  )
  if (tone === 'info') return (
    <svg {...common}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
  )
  return (
    <svg {...common}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
  )
}

export function KeyInsights({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, color: INK, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Key Insights</span>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: DIM }}>Wk41</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${insights.length}, minmax(0,1fr))`, gap: 14 }}>
        {insights.map((it, i) => (
          <div key={i} style={{
            background: TONE[it.tone].bg, border: `1.5px solid ${TONE[it.tone].border}`, borderRadius: 14,
            padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}><ToneIcon tone={it.tone} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 800, color: TONE[it.tone].head, letterSpacing: '0.03em', marginBottom: 6, lineHeight: 1.25 }}>{it.title}</div>
              <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 500, color: MID, lineHeight: 1.5 }}>{it.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── UI: DONUT CARD ──────────────────────────────────────────────────────────
function DonutCard({ cfg }: { cfg: PieCfg }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const size = 196, cx = size / 2, r = 72, sw = 28
  const ROW_H = 38
  const scrolls = cfg.maxVisible !== undefined && cfg.slices.length > cfg.maxVisible
  const circ = 2 * Math.PI * r
  const visible = cfg.slices.map((s, i) => ({ s, i })).filter(o => o.s.value > 0)
  const allSum = cfg.slices.reduce((a, x) => a + x.value, 0)
  const sum = visible.reduce((a, o) => a + o.s.value, 0)

  let offset = 0
  const arcs = visible.map(o => {
    const frac = sum === 0 ? 0 : o.s.value / sum
    const gap = visible.length > 1 ? 2.5 : 0
    const len = Math.max(frac * circ - gap, 0.8)
    const arc = { ...o, len, start: offset }
    offset += frac * circ
    return arc
  })

  const toggle = (i: number) => setSelected(prev => (prev === i ? null : i))

  const active = selected !== null ? cfg.slices[selected] : null
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 10px rgba(15,23,42,0.06)', minWidth: 0 }}>
      <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 800, color: INK, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{cfg.heading}</div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: DIM, marginTop: 4, marginBottom: 18 }}>{cfg.sub}</div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
            <g transform={`rotate(-90 ${cx} ${cx})`}>
              {arcs.map(a => (
                <circle key={a.i} cx={cx} cy={cx} r={r} fill="none" stroke={a.s.color}
                  strokeWidth={hover === a.i || selected === a.i ? sw + 6 : sw}
                  strokeDasharray={`${a.len} ${circ - a.len}`} strokeDashoffset={-a.start}
                  style={{ transition: 'stroke-width .15s', cursor: 'pointer' }}
                  onMouseEnter={() => setHover(a.i)} onMouseLeave={() => setHover(null)} onClick={() => toggle(a.i)} />
              ))}
            </g>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center', padding: 36 }}>
            {!active && cfg.centerValue && (<>
              <div style={{ fontFamily: SANS, fontSize: 26, fontWeight: 800, color: INK, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{cfg.centerValue}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: DIM, marginTop: 3, lineHeight: 1.2 }}>{cfg.centerLabel}</div>
            </>)}
            {active && (<>
              <div style={{ fontFamily: SANS, fontSize: 26, fontWeight: 800, color: active.color, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{active.display}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: DIM, marginTop: 3, lineHeight: 1.2 }}>{active.label}</div>
            </>)}
          </div>
        </div>

        <div style={{ flex: '1 1 240px', minWidth: 220 }}>
          <div className={scrolls ? 'donut-legend-scroll' : undefined}
            style={scrolls ? { maxHeight: cfg.maxVisible! * ROW_H, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable', paddingRight: 6 } : undefined}>
          {cfg.slices.map((s, i) => {
            const off = false
            return (
              <div key={i} onClick={() => toggle(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, boxSizing: 'border-box', height: scrolls ? ROW_H : undefined, flexShrink: 0, cursor: 'pointer', userSelect: 'none',
                  background: hover === i || selected === i ? '#f1f5f9' : 'transparent', opacity: off ? 0.4 : 1,
                }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: MID, flex: 1, minWidth: 0, textDecoration: off ? 'line-through' : 'none' }}>{s.label}</span>
                {cfg.showShare !== false && (
                  <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: DIM, minWidth: 44, textAlign: 'right' }}>
                    {shareTxt(s.value, sum)}
                  </span>
                )}
                <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 800, color: INK, minWidth: 62, textAlign: 'right' }}>{s.display}</span>
              </div>
            )
          })}
          </div>
          {cfg.total !== 'none' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${LINE}`, marginTop: 8, padding: '12px 8px 0' }}>
              <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 700, color: DIM }}>Total</span>
              <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: INK, paddingRight: scrolls ? 6 : 0 }}>
                {cfg.total === 'compact' ? compact(allSum) : int(allSum)}
              </span>
            </div>
          )}
          <div style={{ fontFamily: MONO, fontSize: 11, color: DIM, marginTop: 10, paddingLeft: 8 }}>
            Click a row or slice to show its value in the center{scrolls ? ` · scroll for ${cfg.slices.length - cfg.maxVisible!} more` : ''}
          </div>
        </div>

        {cfg.refs && cfg.refs.length > 0 && (
          <div style={{ flex: '0 1 230px', minWidth: 190, borderLeft: `1px solid ${LINE}`, paddingLeft: 22 }}>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 800, color: DIM, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Also this week</div>
            {cfg.refs.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: i === cfg.refs!.length - 1 ? 'none' : `1px dashed ${LINE}` }}>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: MID }}>{r.label}</span>
                <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, color: INK }}>{r.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PieRow({ pies }: { pies: PieCfg[] }) {
  if (!pies.length) return null
  return (
    <div style={{
      display: 'grid', gap: 16, marginBottom: 20,
      gridTemplateColumns: pies.length > 1 ? 'repeat(auto-fit,minmax(460px,1fr))' : '1fr',
    }}>
      {pies.map((p, i) => <DonutCard key={p.heading + i} cfg={p} />)}
    </div>
  )
}

const shortLabel = (n: string) => n.length <= 26 ? n : n
  .replace('International Pages', 'Int Pages')
  .replace('AI Overview', 'AIO')
  .replace('Organic', 'Org')

export function CurrentValueDonut({ title, items, overall }: { title: string; items: { label: string; value: number; display: string }[]; overall?: { label: string; display: string } }) {
  return (
    <PieRow pies={[{
      heading: `${title} — Current Week`,
      sub: 'Current-week metric-card values · Oct 12',
      centerValue: overall?.display ?? '',
      centerLabel: overall?.label ?? '',
      slices: items.map((it, index) => ({ ...it, color: BRAND_COLORS[index % BRAND_COLORS.length] })),
      total: 'none',
      showShare: false,
      maxVisible: 5,
    }]} />
  )
}

export function CurrentMetricDonut({ title, metrics }: { title: string; metrics: Metric[] }) {
  const total = metrics.find(metric => /^Overall/i.test(metric.name))
  return (
    <CurrentValueDonut title={title}
      overall={total ? { label: total.name.replace('Overall Number of Keywords', 'Overall Keywords'), display: cardValue(total.name, cur(total)) } : undefined}
      items={metrics.filter(metric => !/^Overall/i.test(metric.name)).map(metric => {
      const value = cur(metric)
      return { label: shortLabel(metric.name), value, display: cardValue(metric.name, value) }
    })} />
  )
}
