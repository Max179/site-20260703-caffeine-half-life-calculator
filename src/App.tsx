import { useEffect, useMemo, useState } from 'react'
import {
  HeroUIProvider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionItem,
  Tabs,
  Tab,
} from '@heroui/react'

/* ============================================================
 * 静态数据:caffeine source / half-life / 步骤 / FAQ
 * 全部从原 HTML 迁移,文案保持一致
 * ========================================================== */

const CAFFEINE_SOURCES = [
  { value: '95', label: 'Brewed coffee (8 oz, ~95 mg)' },
  { value: '63', label: 'Espresso (1 shot, ~63 mg)' },
  { value: '80', label: 'Energy drink (8 oz, ~80 mg)' },
  { value: '47', label: 'Black tea (8 oz, ~47 mg)' },
  { value: '30', label: 'Cola (12 oz, ~30 mg)' },
  { value: 'custom', label: 'Custom amount' },
]

const HALF_LIFE_OPTIONS = [
  { value: '3', label: 'Fast metabolizer (~3 hours)' },
  { value: '5', label: 'Average metabolizer (~5 hours)' },
  { value: '7', label: 'Slow metabolizer (~7 hours)' },
]

const STEPS = [
  'Pick your caffeine source, or choose Custom amount to enter your own milligrams.',
  'Set the total amount consumed, the time you last had caffeine, and your planned bedtime.',
  'Choose your metabolism speed: fast (~3 h), average (~5 h), or slow (~7 h) half-life.',
  'Click Calculate to see how much caffeine is left at bedtime and when it is safe to sleep.',
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
    a: 'This calculator uses the standard exponential decay model (remaining = dose x 0.5^(elapsed / half-life)) with widely cited half-life averages. It provides a good estimate for healthy adults, but individual caffeine metabolism varies based on genetics, age, pregnancy, medications, and liver function. Treat results as guidance, not medical advice.',
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

/* ============================================================
 * 计算辅助函数(从原 HTML <script> 迁移,逻辑保持一致)
 * ========================================================== */

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

/* ============================================================
 * HeroUI Chip 颜色映射
 * ========================================================== */
function levelChipColor(level: string): 'danger' | 'warning' | 'success' | 'primary' {
  switch (level) {
    case 'High':
      return 'danger'
    case 'Moderate':
      return 'warning'
    case 'Low':
      return 'success'
    case 'Minimal':
      return 'primary'
    default:
      return 'primary'
  }
}

/* ============================================================
 * 全局类型声明(shared/* 脚本挂载的 window 对象)
 * ========================================================== */
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

/* ============================================================
 * App 主组件
 * ========================================================== */
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calc')

  // 表单状态
  const [source, setSource] = useState<string>('95')
  const [customAmount, setCustomAmount] = useState<string>('100')
  const [dose, setDose] = useState<string>('95')
  const [consumeTime, setConsumeTime] = useState<string>('15:00')
  const [bedtime, setBedtime] = useState<string>('23:00')
  const [halfLife, setHalfLife] = useState<string>('5')
  const [hasCalculated, setHasCalculated] = useState<boolean>(false)

  // onSourceChange 迁移:custom 切换时同步 dose
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

  // 计算逻辑用 useMemo 实现(响应式派生)
  const calcResult = useMemo(
    () => computeCalculation(dose, consumeTime, bedtime, halfLife),
    [dose, consumeTime, bedtime, halfLife],
  )

  // SEO 元数据 + JSON-LD 通过 useEffect 注入 document.head
  useEffect(() => {
    // canonical link 注入(原 HTML head 中存在,需在 React 中保留)
    const existingCanonical = document.querySelector('link[rel="canonical"]')
    if (!existingCanonical) {
      const link = document.createElement('link')
      link.rel = 'canonical'
      link.href = SEO_CONFIG.url
      document.head.appendChild(link)
    }

    // twitter:card meta 注入(原 HTML head 中存在)
    const existingTwitter = document.querySelector('meta[name="twitter:card"]')
    if (!existingTwitter) {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:card')
      meta.setAttribute('content', 'summary_large_image')
      document.head.appendChild(meta)
    }

    // 调用 shared/seo.js 注入 title / meta description / keywords / og / JSON-LD
    if (window.SiteSEO && typeof window.SiteSEO.setupSEO === 'function') {
      window.SiteSEO.setupSEO(SEO_CONFIG)
    } else {
      // seo.js 尚未就绪时回退:直接设置基础 meta
      document.title = SEO_CONFIG.title
    }

    // 加载 shared/config.json 并初始化 analytics / ads(原 init() 逻辑迁移)
    const DEFAULT_CONFIG = {
      siteName: 'Caffeine Half-Life Calculator',
      gaId: '',
      ads: { enabled: false },
    }
    fetch('./shared/config.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => ({ ...DEFAULT_CONFIG, ...json }))
      .then((config) => {
        if (window.SiteAnalytics && typeof window.SiteAnalytics.initAnalytics === 'function') {
          window.SiteAnalytics.initAnalytics(config.gaId)
        }
        if (window.SiteAds && typeof window.SiteAds.initAds === 'function') {
          window.SiteAds.initAds(config)
        }
      })
      .catch(() => {
        /* 配置加载失败时静默回退,不影响页面渲染 */
      })
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

  return (
    <HeroUIProvider>
      <div className="min-h-screen flex flex-col bg-[#f7f8fa] text-[#1a1a1a]">
        {/* ===== Header ===== */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-gray-900 no-underline">
              Caffeine Half-Life Calculator
            </a>
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('calc')}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Calculator
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                FAQ
              </button>
            </nav>
          </div>
        </header>

        {/* ===== Hero ===== */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-center py-12 px-4 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Caffeine Half-Life Calculator
          </h1>
          <p className="max-w-2xl mx-auto mb-6 text-base md:text-lg opacity-95">
            Estimate how much caffeine remains in your system at bedtime and find the safest
            time to sleep after your last coffee, tea, or energy drink. Based on an average
            5-hour half-life.
          </p>
          <Button
            color="primary"
            size="lg"
            variant="shadow"
            data-track="cta_hero_click"
            onPress={handleCtaHeroClick}
          >
            Calculate Now
          </Button>
        </section>

        {/* ===== Main content via Tabs ===== */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-10" id="calc-section">
          <Tabs
            aria-label="Calculator sections"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            color="primary"
            variant="underlined"
            classNames={{ tabList: 'flex-wrap' }}
          >
            {/* ---------- Calculator Tab ---------- */}
            <Tab key="calc" title="Calculator">
              <Card className="mt-4 shadow-md" id="calc-card">
                <CardHeader className="flex justify-center pb-0">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    Online Calculator
                  </h2>
                </CardHeader>
                <CardBody className="flex flex-col gap-4 pt-2">
                  {/* Caffeine source */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Caffeine source
                    </label>
                    <Select
                      aria-label="Caffeine source"
                      selectedKeys={[source]}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      variant="bordered"
                    >
                      {CAFFEINE_SOURCES.map((s) => (
                        <SelectItem key={s.value}>{s.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Custom amount (条件显示) */}
                  {isCustom && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">
                        Caffeine per serving (mg)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        step={1}
                        value={customAmount}
                        onValueChange={handleCustomAmountChange}
                        variant="bordered"
                      />
                    </div>
                  )}

                  {/* Total caffeine consumed */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Total caffeine consumed (mg)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={2000}
                      step={1}
                      value={dose}
                      onValueChange={setDose}
                      variant="bordered"
                    />
                  </div>

                  {/* Time of last caffeine intake */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Time of last caffeine intake
                    </label>
                    <Input
                      type="time"
                      value={consumeTime}
                      onValueChange={setConsumeTime}
                      variant="bordered"
                    />
                  </div>

                  {/* Planned bedtime */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Planned bedtime
                    </label>
                    <Input
                      type="time"
                      value={bedtime}
                      onValueChange={setBedtime}
                      variant="bordered"
                    />
                  </div>

                  {/* Half-life */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Your caffeine metabolism (half-life)
                    </label>
                    <Select
                      aria-label="Caffeine metabolism half-life"
                      selectedKeys={[halfLife]}
                      onChange={(e) => setHalfLife(e.target.value)}
                      variant="bordered"
                    >
                      {HALF_LIFE_OPTIONS.map((h) => (
                        <SelectItem key={h.value}>{h.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <Button
                    color="primary"
                    size="lg"
                    variant="shadow"
                    fullWidth
                    data-track="calc_execute_click"
                    onPress={handleCalculate}
                  >
                    Calculate
                  </Button>

                  {/* ===== Result box ===== */}
                  <div className="mt-2 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-2">
                      Caffeine remaining at bedtime
                    </div>
                    {hasCalculated && isError ? (
                      <div className="text-lg md:text-xl font-semibold text-red-600 break-words">
                        {calcResult.error}
                      </div>
                    ) : hasCalculated && !isError ? (
                      <div className="leading-tight">
                        <span className="text-2xl md:text-3xl font-bold text-blue-900 break-words">
                          {calcResult.remaining.toFixed(1)} mg
                        </span>
                        <div className="mt-1 text-sm font-medium text-gray-600">
                          {calcResult.percent.toFixed(1)}% of original dose{' '}
                          <span className="mx-1">&middot;</span>{' '}
                          <Chip
                            size="sm"
                            color={levelChipColor(calcResult.level)}
                            variant="flat"
                            className="ml-1"
                          >
                            {calcResult.level}
                          </Chip>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl md:text-3xl font-bold text-gray-400">
                        &mdash;
                      </div>
                    )}
                  </div>

                  {/* ===== Explanation box ===== */}
                  <div className="p-4 md:p-5 bg-gray-50 border-l-4 border-blue-600 rounded-r-lg text-sm text-gray-700 leading-relaxed">
                    {hasCalculated && isError ? (
                      <span>{calcResult.explanation}</span>
                    ) : hasCalculated && !isError ? (
                      <>
                        Caffeine decays exponentially with a half-life of about{' '}
                        {calcResult.halfLifeNum} hours. You consumed{' '}
                        {calcResult.doseNum.toFixed(0)} mg at{' '}
                        {formatClock(calcResult.consumeMin)} and plan to sleep at{' '}
                        {formatClock(calcResult.bedMin % 1440)} (
                        {calcResult.elapsedH.toFixed(1)} h later).
                        <br />
                        <br />
                        Formula: remaining = dose &times; 0.5
                        <sup>
                          (elapsed &divide; half-life)
                        </sup>{' '}
                        = {calcResult.doseNum.toFixed(0)} &times; 0.5
                        <sup>
                          ({calcResult.elapsedH.toFixed(1)} &divide;{' '}
                          {calcResult.halfLifeNum})
                        </sup>{' '}
                        = <strong>{calcResult.remaining.toFixed(1)} mg</strong>.
                        <br />
                        <br />
                        Recommendation: {calcResult.advice}
                        <br />
                        <br />
                        Caffeine drops below 50 mg (sleep-safe zone) at approximately{' '}
                        <strong>{formatClock(calcResult.sleepClockMin)}</strong> (
                        {calcResult.timeToSleep.toFixed(1)} h after intake).
                        <br />
                        Caffeine drops below 25 mg (minimal effect) at approximately{' '}
                        <strong>{formatClock(calcResult.clearClockMin)}</strong> (
                        {calcResult.timeToClear.toFixed(1)} h after intake).
                      </>
                    ) : (
                      <>
                        Enter your caffeine amount, intake time, bedtime, and metabolism type,
                        then tap <strong>Calculate</strong>. Caffeine has an average half-life of
                        about 5 hours, meaning half of the dose is still active in your body 5
                        hours after you consume it.
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Tab>

            {/* ---------- How to Use Tab ---------- */}
            <Tab key="howto" title="How to Use">
              <Card className="mt-4 shadow-md">
                <CardHeader className="flex justify-center pb-0">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    How to Use
                  </h2>
                </CardHeader>
                <CardBody className="pt-4">
                  <ol className="flex flex-col gap-3 list-none p-0 m-0">
                    {STEPS.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-b-0 text-gray-700"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                          {idx + 1}
                        </span>
                        <span className="text-sm md:text-base leading-relaxed pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardBody>
              </Card>
            </Tab>

            {/* ---------- FAQ Tab ---------- */}
            <Tab key="faq" title="FAQ" id="faq">
              <Card className="mt-4 shadow-md">
                <CardHeader className="flex flex-col items-center pb-0">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                </CardHeader>
                <CardBody className="pt-2">
                  <Accordion variant="splitted" selectionMode="multiple">
                    {FAQ_ITEMS.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        aria-label={item.q}
                        title={item.q}
                        className="text-gray-800"
                      >
                        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardBody>
                <CardFooter className="pt-0">
                  <Divider />
                </CardFooter>
              </Card>
            </Tab>
          </Tabs>
        </main>

        {/* ===== Footer ===== */}
        <footer className="bg-gray-900 text-gray-400 text-center py-6 text-xs md:text-sm">
          <p>&copy; 2026 Caffeine Half-Life Calculator. All rights reserved.</p>
        </footer>
      </div>
    </HeroUIProvider>
  )
}
