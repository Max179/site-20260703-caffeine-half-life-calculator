import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Button,
  Chip,
} from '@heroui/react'

const CAFFEINE_SOURCES = [
  { value: '95', label: 'Brewed coffee · 8 oz · ~95 mg' },
  { value: '63', label: 'Espresso · 1 shot · ~63 mg' },
  { value: '80', label: 'Energy drink · 8 oz · ~80 mg' },
  { value: '47', label: 'Black tea · 8 oz · ~47 mg' },
  { value: '30', label: 'Cola · 12 oz · ~30 mg' },
  { value: 'custom', label: 'Custom amount' },
]

const HALF_LIFE_OPTIONS = [
  { value: '3', label: 'Fast · ~3 hours' },
  { value: '5', label: 'Average · ~5 hours' },
  { value: '7', label: 'Slow · ~7 hours' },
]

const STEPS = [
  { title: 'Select source', text: 'Choose from common caffeine sources or enter a custom amount.' },
  { title: 'Set times', text: 'Enter your caffeine intake time and planned bedtime.' },
  { title: 'Choose metabolism', text: 'Select how quickly your body processes caffeine.' },
  { title: 'Get results', text: 'See caffeine remaining at bedtime and safe sleep times.' },
]

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How long does caffeine stay in your system?',
    a: 'Caffeine has an average half-life of about 5 hours in healthy adults. This means 5 hours after consumption, about 50% of the caffeine is still in your body. After 10 hours roughly 25% remains, and it can take 10-12 hours (or longer for slow metabolizers) for caffeine to drop to levels that no longer meaningfully affect sleep.',
  },
  {
    q: 'What is the half-life of caffeine?',
    a: 'The half-life of caffeine is the time it takes for your body to eliminate half of the caffeine you consumed. The population average is around 5 hours, but it ranges from roughly 3 hours in fast metabolizers to 7 hours or more in slow metabolizers. Pregnancy, certain medications, and liver conditions can extend it significantly.',
  },
  {
    q: 'How much caffeine will keep me awake?',
    a: 'Sleep research suggests that around 50 mg or more of caffeine remaining at bedtime can noticeably reduce sleep quality for many adults. Doses above 100 mg at bedtime are likely to significantly disrupt sleep. This calculator flags those thresholds so you can judge whether your bedtime is safe.',
  },
  {
    q: 'When should I stop drinking coffee before bed?',
    a: 'As a rule of thumb, avoid caffeine for at least 8 hours before bedtime. For a 23:00 bedtime with average metabolism, that means stopping caffeine by 15:00. If you are sensitive to caffeine, extend that to 10-12 hours. Use the calculator above to find the exact safe-sleep time for your dose and metabolism.',
  },
  {
    q: 'Is this caffeine calculator accurate?',
    a: 'This calculator uses the standard exponential decay model (remaining = dose × 0.5^(elapsed / half-life)) with widely cited half-life averages. It provides a good estimate for healthy adults, but individual caffeine metabolism varies based on genetics, age, pregnancy, medications, and liver function. Treat results as guidance, not medical advice.',
  },
]

const SEO_CONFIG = {
  title: 'Caffeine Half-Life Calculator',
  description:
    'Free caffeine half-life calculator. Find out how much caffeine is still in your body at bedtime and when it is safe to sleep after coffee, tea, or energy drinks.',
  keywords:
    'caffeine half life calculator, caffeine sleep calculator, how long does caffeine last, when can i sleep after coffee, caffeine metabolism, coffee sleep calculator, caffeine in system, caffeine decay calculator',
  url: 'https://Max179.github.io/site-20260703-caffeine-half-life-calculator',
  type: 'calculator' as const,
}

function parseTimeToMinutes(t: string): number {
  const parts = t.split(':')
  if (parts.length < 2) return NaN
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  return h * 60 + m
}

function formatClock(minutes: number): string {
  minutes = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  const suffix = h >= 12 ? 'PM' : 'AM'
  let h12 = h % 12
  if (h12 === 0) h12 = 12
  return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + suffix
}

type CalcResult =
  | { error: string; explanation: string }
  | {
      remaining: number
      percent: number
      level: 'High' | 'Moderate' | 'Low' | 'Minimal'
      advice: string
      doseNum: number
      consumeMin: number
      bedMin: number
      elapsedH: number
      halfLifeNum: number
      timeToSleep: number
      timeToClear: number
      sleepClockMin: number
      clearClockMin: number
    }

function computeCalculation(
  dose: string,
  consumeTime: string,
  bedtime: string,
  halfLife: string,
): CalcResult {
  const doseNum = parseFloat(dose)
  const halfLifeNum = parseFloat(halfLife)

  if (isNaN(doseNum) || doseNum <= 0) {
    return {
      error: 'Please enter a valid caffeine amount.',
      explanation: 'Enter how much caffeine you consumed to see your results.',
    }
  }
  if (!consumeTime || !bedtime || isNaN(halfLifeNum) || halfLifeNum <= 0) {
    return {
      error: 'Please fill in all times.',
      explanation: 'Provide the time you consumed caffeine and your planned bedtime.',
    }
  }

  const consumeMin = parseTimeToMinutes(consumeTime)
  let bedMin = parseTimeToMinutes(bedtime)
  if (bedMin <= consumeMin) bedMin += 1440
  const elapsedH = (bedMin - consumeMin) / 60
  const remaining = doseNum * Math.pow(0.5, elapsedH / halfLifeNum)
  const percent = (remaining / doseNum) * 100

  let level: 'High' | 'Moderate' | 'Low' | 'Minimal'
  let advice: string
  if (remaining >= 100) {
    level = 'High'
    advice = 'Likely to significantly disrupt sleep. Consider delaying bedtime or skipping late caffeine.'
  } else if (remaining >= 50) {
    level = 'Moderate'
    advice = 'May reduce sleep quality, especially for caffeine-sensitive people.'
  } else if (remaining >= 25) {
    level = 'Low'
    advice = 'Unlikely to noticeably affect sleep for most adults.'
  } else {
    level = 'Minimal'
    advice = 'Caffeine has largely cleared your system. Sleep should not be affected.'
  }

  const sleepThreshold = 50
  const clearThreshold = 25
  const timeToSleep = doseNum > sleepThreshold ? halfLifeNum * Math.log2(doseNum / sleepThreshold) : 0
  const timeToClear = doseNum > clearThreshold ? halfLifeNum * Math.log2(doseNum / clearThreshold) : 0
  const sleepClockMin = consumeMin + timeToSleep * 60
  const clearClockMin = consumeMin + timeToClear * 60

  return {
    remaining,
    percent,
    level,
    advice,
    doseNum,
    consumeMin,
    bedMin,
    elapsedH,
    halfLifeNum,
    timeToSleep,
    timeToClear,
    sleepClockMin,
    clearClockMin,
  }
}

function levelChipColor(level: string): 'danger' | 'warning' | 'success' | 'default' {
  switch (level) {
    case 'High': return 'danger'
    case 'Moderate': return 'warning'
    case 'Low': return 'success'
    case 'Minimal': return 'default'
    default: return 'default'
  }
}

function levelDot(level: string): string {
  switch (level) {
    case 'High': return 'bg-red-500'
    case 'Moderate': return 'bg-amber-500'
    case 'Low': return 'bg-emerald-500'
    case 'Minimal': return 'bg-slate-400'
    default: return 'bg-slate-400'
  }
}

declare global {
  interface Window {
    SiteSEO?: {
      setupSEO: (config: {
        title: string
        description: string
        keywords: string
        url: string
        type: string
      }) => void
    }
    SiteAnalytics?: {
      initAnalytics: (gaId: string) => void
      trackEvent: (name: string, params?: Record<string, unknown>) => void
    }
    SiteAds?: {
      initAds: (config: Record<string, unknown>) => void
      showAds: () => void
    }
  }
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 8h12v6a6 6 0 0 1-12 0V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calc')

  const [source, setSource] = useState<string>('95')
  const [customAmount, setCustomAmount] = useState<string>('100')
  const [dose, setDose] = useState<string>('95')
  const [consumeTime, setConsumeTime] = useState<string>('15:00')
  const [bedtime, setBedtime] = useState<string>('23:00')
  const [halfLife, setHalfLife] = useState<string>('5')
  const [hasCalculated, setHasCalculated] = useState<boolean>(false)

  const handleSourceChange = (val: string) => {
    setSource(val)
    if (val === 'custom') {
      if (customAmount) setDose(customAmount)
    } else {
      setDose(val)
    }
  }

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val)
    if (source === 'custom') setDose(val)
  }

  const calcResult = useMemo(
    () => computeCalculation(dose, consumeTime, bedtime, halfLife),
    [dose, consumeTime, bedtime, halfLife],
  )

  useEffect(() => {
    if (window.SiteSEO && typeof window.SiteSEO.setupSEO === 'function') {
      window.SiteSEO.setupSEO(SEO_CONFIG)
    } else {
      document.title = SEO_CONFIG.title
    }

    fetch('./shared/config.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((config) => {
        if (window.SiteAnalytics && typeof window.SiteAnalytics.initAnalytics === 'function') {
          window.SiteAnalytics.initAnalytics(config.gaId)
        }
        if (window.SiteAds && typeof window.SiteAds.initAds === 'function') {
          window.SiteAds.initAds(config)
        }
      })
      .catch(() => {})
  }, [])

  const handleCalculate = () => {
    setHasCalculated(true)
  }

  const handleCtaHeroClick = () => {
    setActiveTab('calc')
    const el = document.getElementById('calc-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isError = 'error' in calcResult
  const isCustom = source === 'custom'

  const tabBtn = (key: string, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        activeTab === key
          ? 'text-[oklch(0.55_0.18_250)] bg-[oklch(0.96_0.02_250)]'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
      }`}
    >
      {label}
    </button>
  )

  const primaryColor = 'oklch(0.55 0.18 250)'
  const borderColor = 'oklch(0.93_0.008_250)'

  return (
    <div className="min-h-screen text-slate-900 mesh-gradient-page">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[oklch(0.93_0.008_250)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 text-slate-900 no-underline">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
              <LogoMark className="w-4 h-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">CaffeineCalc</span>
          </a>
          <nav className="flex gap-1 bg-slate-100/50 p-1 rounded-xl">
            {tabBtn('calc', 'Calculator')}
            {tabBtn('howto', 'How to use')}
            {tabBtn('faq', 'FAQ')}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden mesh-gradient-light">
        <div className="absolute inset-0 animate-float-slow"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 55% 40% at 15% 25%, oklch(0.92 0.07 250) 0%, transparent 60%),
              radial-gradient(ellipse 45% 35% at 85% 20%, oklch(0.93 0.055 280) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 85%, oklch(0.94 0.045 320) 0%, transparent 65%),
              radial-gradient(ellipse 45% 35% at 20% 80%, oklch(0.92 0.06 230) 0%, transparent 60%)
            `,
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-white/70 backdrop-blur-sm border border-[oklch(0.93_0.008_250)] text-xs font-medium text-slate-600 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: primaryColor }} />
            Free · No sign-up · Mobile-friendly
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-5 text-slate-900 leading-tight">
            How much caffeine is still in your system?
          </h1>

          <p className="max-w-xl mx-auto mb-10 text-base md:text-lg text-slate-600 leading-relaxed">
            Estimate caffeine levels at bedtime and find the safest time to sleep after coffee, tea, or energy drinks.
          </p>

          <Button
            size="lg"
            className="text-white font-semibold px-8 py-4 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
            data-track="cta_hero_click"
            onPress={handleCtaHeroClick}
            style={{ background: primaryColor }}
          >
            Calculate now
          </Button>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums">5h</div>
              <div className="text-xs text-slate-500 mt-1.5">avg half-life</div>
            </div>
            <div className="text-center border-x border-slate-200/80">
              <div className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums">50mg</div>
              <div className="text-xs text-slate-500 mt-1.5">sleep threshold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums">100%</div>
              <div className="text-xs text-slate-500 mt-1.5">free to use</div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16" id="calc-section">
        {activeTab === 'calc' && (
          <Card className="shadow-md border border-[oklch(0.93_0.008_250)] bg-white overflow-hidden animate-fade-up">
            <CardHeader className="flex flex-col items-center pb-0 pt-8 px-8">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">
                Calculator
              </div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                Estimate bedtime caffeine
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 text-center">
                Fill in the fields below to see your results.
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 pt-6 p-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-700">
                  Caffeine source
                </label>
                <select
                  aria-label="Caffeine source"
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[oklch(0.93_0.008_250)] bg-slate-50/40 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.18_250)] focus:border-transparent transition-all hover:bg-slate-50"
                >
                  {CAFFEINE_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {isCustom && (
                <div className="flex flex-col gap-1.5 animate-fade-up">
                  <label className="text-[13px] font-medium text-slate-700">
                    Custom amount (mg)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    step={1}
                    value={customAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomAmountChange(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Total consumed (mg)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={2000}
                    step={1}
                    value={dose}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDose(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Metabolism
                  </label>
                  <select
                    aria-label="Caffeine metabolism"
                    value={halfLife}
                    onChange={(e) => setHalfLife(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[oklch(0.93_0.008_250)] bg-slate-50/40 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.18_250)] focus:border-transparent transition-all hover:bg-slate-50"
                  >
                    {HALF_LIFE_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Last intake time
                  </label>
                  <Input
                    type="time"
                    value={consumeTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsumeTime(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Planned bedtime
                  </label>
                  <Input
                    type="time"
                    value={bedtime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBedtime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                className="text-white font-semibold py-4 rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                data-track="calc_execute_click"
                onPress={handleCalculate}
                style={{ background: primaryColor }}
              >
                Calculate
              </Button>

              <div className="mt-2 p-6 md:p-8 rounded-2xl text-center" style={{ background: 'oklch(0.975 0.006 250)', border: `1px solid ${borderColor}` }}>
                <div className="text-[10px] font-semibold text-slate-500 mb-4 uppercase tracking-[0.15em]">
                  Caffeine remaining at bedtime
                </div>
                {hasCalculated && isError ? (
                  <div className="text-lg font-medium text-red-600">{calcResult.error}</div>
                ) : hasCalculated && !isError ? (
                  <div className="leading-tight animate-fade-up">
                    <div className="flex items-baseline justify-center gap-2 mb-3">
                      <span className="text-5xl md:text-6xl font-semibold tracking-tight tabular-nums" style={{ color: primaryColor }}>
                        {calcResult.remaining.toFixed(1)}
                      </span>
                      <span className="text-xl text-slate-500">mg</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-slate-600 font-medium">
                        {calcResult.percent.toFixed(1)}% of original dose
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${levelDot(calcResult.level)}`} />
                        <Chip
                          size="sm"
                          color={levelChipColor(calcResult.level)}
                          variant="flat"
                          className="font-medium"
                        >
                          {calcResult.level}
                        </Chip>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-5xl md:text-6xl font-semibold text-slate-300">
                    —
                  </div>
                )}
              </div>

              <div className="p-5 md:p-6 bg-white border border-[oklch(0.93_0.008_250)] rounded-2xl text-sm text-slate-600 leading-relaxed">
                {hasCalculated && isError ? (
                  <span>{calcResult.explanation}</span>
                ) : hasCalculated && !isError ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">
                        How this is calculated
                      </div>
                      <p className="mb-2">
                        Caffeine decays exponentially with a half-life of about{' '}
                        <strong className="text-slate-900">{calcResult.halfLifeNum} hours</strong>. You consumed{' '}
                        <strong className="text-slate-900">{calcResult.doseNum.toFixed(0)} mg</strong> at{' '}
                        <strong className="text-slate-900">{formatClock(calcResult.consumeMin)}</strong> and plan to sleep at{' '}
                        <strong className="text-slate-900">{formatClock(calcResult.bedMin % 1440)}</strong>{' '}
                        <span className="text-slate-500">({calcResult.elapsedH.toFixed(1)} h later)</span>.
                      </p>
                      <div className="p-3 bg-slate-50/60 rounded-lg font-mono text-[11px] text-slate-700 border border-[oklch(0.93_0.008_250)]">
                        remaining = dose × 0.5<sup>(elapsed ÷ half-life)</sup>
                        <br />
                        = {calcResult.doseNum.toFixed(0)} × 0.5<sup>({calcResult.elapsedH.toFixed(1)} ÷ {calcResult.halfLifeNum})</sup>
                        {' '}= <strong className="text-slate-900">{calcResult.remaining.toFixed(1)} mg</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border" style={{ background: 'oklch(0.975 0.006 250)', borderColor }}>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-1.5">
                        Recommendation
                      </div>
                      <p className="text-slate-700">{calcResult.advice}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 bg-white rounded-xl border border-[oklch(0.93_0.008_250)]">
                        <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mb-1">
                          Safe to sleep at
                        </div>
                        <div className="text-xl font-semibold text-slate-900 tabular-nums">{formatClock(calcResult.sleepClockMin)}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {calcResult.timeToSleep.toFixed(1)} h after intake · ≤ 50 mg
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-[oklch(0.93_0.008_250)]">
                        <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mb-1">
                          Fully cleared at
                        </div>
                        <div className="text-xl font-semibold text-slate-900 tabular-nums">{formatClock(calcResult.clearClockMin)}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {calcResult.timeToClear.toFixed(1)} h after intake · ≤ 25 mg
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">
                      Getting started
                    </div>
                    <p className="text-slate-600">
                      Enter your caffeine amount, intake time, bedtime, and metabolism type,
                      then tap <strong className="text-slate-900">Calculate</strong>. Caffeine has an average
                      half-life of about 5 hours.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'howto' && (
          <Card className="shadow-md border border-[oklch(0.93_0.008_250)] bg-white overflow-hidden animate-fade-up">
            <CardHeader className="flex flex-col items-center pb-0 pt-8 px-8">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">
                Guide
              </div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                How to use this calculator
              </h2>
            </CardHeader>
            <CardContent className="pt-6 p-8">
              <ol className="flex flex-col gap-3">
                {STEPS.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/40 border border-[oklch(0.93_0.008_250)]">
                    <span className="flex-shrink-0 text-lg font-semibold text-slate-300 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {activeTab === 'faq' && (
          <Card className="shadow-md border border-[oklch(0.93_0.008_250)] bg-white overflow-hidden animate-fade-up" id="faq">
            <CardHeader className="flex flex-col items-center pb-0 pt-8 px-8">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">
                FAQ
              </div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                Frequently asked questions
              </h2>
            </CardHeader>
            <CardContent className="pt-6 p-8">
              <div className="flex flex-col gap-2">
                {FAQ_ITEMS.map((item, idx) => (
                  <details key={idx} className="group border border-[oklch(0.93_0.008_250)] rounded-xl overflow-hidden">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-900 hover:bg-slate-50/60 flex items-center justify-between transition-colors">
                      <span>{item.q}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                    </summary>
                    <div className="px-5 pb-5 pt-4 text-sm text-slate-600 leading-relaxed border-t border-[oklch(0.93_0.008_250)] bg-slate-50/30">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0 p-8">
              <div className="w-full p-5 rounded-xl text-center" style={{ background: primaryColor }}>
                <p className="text-sm text-white/85 mb-3">Still have questions? Try the calculator.</p>
                <Button
                  size="sm"
                  className="bg-white hover:bg-slate-50 font-semibold rounded-lg shadow-sm hover:scale-105 transition-transform"
                  style={{ color: primaryColor }}
                  onPress={() => setActiveTab('calc')}
                >
                  Open calculator
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </main>

      <footer className="bg-slate-50 border-t border-[oklch(0.93_0.008_250)] text-slate-500 py-10 text-xs">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
              <LogoMark className="w-4 h-4 text-white" />
            </span>
            <span className="font-semibold text-slate-900 text-sm">CaffeineCalc</span>
          </div>
          <p className="text-slate-500 mb-1">
            &copy; 2026 Caffeine Half-Life Calculator. For informational purposes only — not medical advice.
          </p>
          <p className="text-slate-400">
            Built with React + HeroUI · Hosted on GitHub Pages
          </p>
        </div>
      </footer>
    </div>
  )
}
