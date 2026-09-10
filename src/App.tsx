import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'

/* ------------------------------------------------------------------ */
/* i18n + data                                                         */
/* ------------------------------------------------------------------ */

type Lang = 'pt' | 'en'

type Choice = { key: string; label: string }

/* Uma pergunta da enquete com opções de escolha única, tiradas das fotos. */
type Poll = { field: string; title: string; hint?: string; options: Choice[] }

type Copy = {
  back: string
  press: string
  ok: string
  send: string
  sending: string
  review: string
  question: string
  of: string
  edit: string
  intro: { title: string; body: string; cta: string; time: string }
  name: { title: (who: string) => string; hint: string; placeholder: string }
  age: { title: (who: string) => string; hint: string; placeholder: string }
  phone: { title: (who: string) => string; hint: string; placeholder: string }
  polls: Poll[]
  reviewTitle: string
  reviewSub: string
  labels: { whatsapp: string; name: string; age: string }
  doneTitle: (first: string) => string
  doneBody: string
  again: string
  errors: {
    name: string
    age: string
    phone: string
    poll: string
    submit: string
    retry: string
  }
}

const DICT: Record<Lang, Copy> = {
  pt: {
    back: '← Voltar',
    press: 'pressione',
    ok: 'OK',
    send: 'Enviar respostas',
    sending: 'Enviando…',
    review: 'Revisão',
    question: 'Pergunta',
    of: 'de',
    edit: 'editar',
    intro: {
      title: 'Enquete com atletas de futevôlei',
      body: 'Responda algumas perguntas rápidas sobre o seu perfil, rotina de treinos e objetivos no futevôlei. Suas respostas ajudam a entender melhor a comunidade da modalidade.',
      cta: 'Começar',
      time: 'Leva cerca de 2 minutos',
    },
    name: { title: () => 'Qual é o seu nome?', hint: 'Assim sabemos quem está respondendo.', placeholder: 'Digite seu nome...' },
    age: { title: (who) => `${who} quantos anos você tem?`.trim(), hint: 'Só o número da sua idade.', placeholder: 'Ex: 24' },
    phone: { title: (who) => `${who} qual o seu WhatsApp?`.trim(), hint: 'Usaremos apenas para eventuais contatos sobre a enquete. Sem spam.', placeholder: '(62) 99999-9999' },
    polls: [
      {
        field: 'duration',
        title: 'Há quanto tempo você pratica futevôlei?',
        options: [
          { key: 'A', label: 'Menos de 6 meses' },
          { key: 'B', label: '6 meses a 2 anos' },
          { key: 'C', label: 'Mais de 2 anos' },
        ],
      },
      {
        field: 'frequency',
        title: 'Com que frequência você treina por semana?',
        options: [
          { key: 'A', label: '1 a 2x por semana' },
          { key: 'B', label: '3 a 4x por semana' },
          { key: 'C', label: '5x ou mais por semana' },
        ],
      },
      {
        field: 'goal',
        title: 'Qual é o seu principal objetivo na modalidade hoje?',
        options: [
          { key: 'A', label: 'Lazer, saúde e socialização' },
          { key: 'B', label: 'Evolução técnica e jogos de fim de semana' },
          { key: 'C', label: 'Competir em torneios amadores/regionais' },
          { key: 'D', label: 'Seguir carreira profissional no esporte' },
        ],
      },
      {
        field: 'strength',
        title: 'Qual fundamento do jogo você considera o seu maior ponto forte?',
        options: [
          { key: 'A', label: 'Recepção / Defesa' },
          { key: 'B', label: 'Levantamento / Segundo toque' },
          { key: 'C', label: 'Ataque de chão (curtas, paralelas, diagonais)' },
          { key: 'D', label: 'Golpes de cabeça / Tubarão' },
        ],
      },
      {
        field: 'improve',
        title: 'E qual fundamento você sente que precisa melhorar mais?',
        options: [
          { key: 'A', label: 'Leitura de jogo e posicionamento' },
          { key: 'B', label: 'Constância no levantamento' },
          { key: 'C', label: 'Potência e variação no ataque' },
          { key: 'D', label: 'Condicionamento físico e resistência na areia' },
        ],
      },
      {
        field: 'prep',
        title: 'Como é a sua rotina de preparação física e cuidados fora da quadra?',
        options: [
          { key: 'A', label: 'Faço apenas os treinos na areia' },
          { key: 'B', label: 'Faço musculação ou fortalecimento específico' },
          { key: 'C', label: 'Acompanho rotina com treino físico + mobilidade/alongamento' },
          { key: 'D', label: 'Tenho acompanhamento profissional completo (físico, nutricional e fisioterapêutico)' },
        ],
      },
      {
        field: 'injury',
        title: 'Você já sofreu alguma lesão decorrente da prática do futevôlei?',
        options: [
          { key: 'A', label: 'Não, nunca me machuquei' },
          { key: 'B', label: 'Sim, dor/desconforto leve (articular ou muscular)' },
          { key: 'C', label: 'Sim, lesão moderada/grave (tornozelo, joelho, ombro, cotovelo/lombar)' },
        ],
      },
      {
        field: 'motivation',
        title: 'O que mais te motiva a continuar no futevôlei?',
        options: [
          { key: 'A', label: 'A comunidade, os amigos e a resenha' },
          { key: 'B', label: 'O desafio constante de evoluir na técnica' },
          { key: 'C', label: 'O clima de competição dos torneios' },
          { key: 'D', label: 'O estilo de vida saudável e ao ar livre' },
        ],
      },
    ],
    reviewTitle: 'Está tudo certo?',
    reviewSub: 'Confira suas respostas antes de enviar. Você pode editar qualquer item.',
    labels: { whatsapp: 'WhatsApp', name: 'Nome', age: 'Idade' },
    doneTitle: (first) => `Obrigado${first ? `, ${first}` : ''}!`,
    doneBody: 'Suas respostas foram registradas. Valeu por contribuir com a comunidade do futevôlei!',
    again: 'Responder novamente',
    errors: {
      name: 'Informe o seu nome.',
      age: 'Informe uma idade válida.',
      phone: 'Informe um WhatsApp completo com DDD.',
      poll: 'Escolha uma opção para continuar.',
      submit: 'Não foi possível registrar sua resposta. Tente novamente.',
      retry: 'Tentar novamente',
    },
  },
  en: {
    back: '← Back',
    press: 'press',
    ok: 'OK',
    send: 'Send answers',
    sending: 'Sending…',
    review: 'Review',
    question: 'Question',
    of: 'of',
    edit: 'edit',
    intro: {
      title: 'Footvolley athletes survey',
      body: 'Answer a few quick questions about your profile, training routine and goals in footvolley. Your answers help us better understand the community around the sport.',
      cta: 'Get started',
      time: 'Takes about 2 minutes',
    },
    name: { title: () => "What's your name?", hint: 'So we know who is answering.', placeholder: 'Type your name...' },
    age: { title: (who) => `${who} how old are you?`.trim(), hint: 'Just your age as a number.', placeholder: 'e.g. 24' },
    phone: { title: (who) => `${who} what's your WhatsApp?`.trim(), hint: "We'll only use it for occasional contact about the survey. No spam.", placeholder: '(62) 99999-9999' },
    polls: [
      {
        field: 'duration',
        title: 'How long have you played footvolley?',
        options: [
          { key: 'A', label: 'Less than 6 months' },
          { key: 'B', label: '6 months to 2 years' },
          { key: 'C', label: 'More than 2 years' },
        ],
      },
      {
        field: 'frequency',
        title: 'How often do you train per week?',
        options: [
          { key: 'A', label: '1 to 2x per week' },
          { key: 'B', label: '3 to 4x per week' },
          { key: 'C', label: '5x or more per week' },
        ],
      },
      {
        field: 'goal',
        title: "What's your main goal in the sport today?",
        options: [
          { key: 'A', label: 'Leisure, health and socializing' },
          { key: 'B', label: 'Technical progress and weekend games' },
          { key: 'C', label: 'Competing in amateur/regional tournaments' },
          { key: 'D', label: 'Pursuing a professional career in the sport' },
        ],
      },
      {
        field: 'strength',
        title: 'Which fundamental do you consider your greatest strength?',
        options: [
          { key: 'A', label: 'Reception / Defense' },
          { key: 'B', label: 'Setting / Second touch' },
          { key: 'C', label: 'Ground attack (shots, lines, diagonals)' },
          { key: 'D', label: 'Header shots / Shark attack' },
        ],
      },
      {
        field: 'improve',
        title: 'And which fundamental do you feel you need to improve the most?',
        options: [
          { key: 'A', label: 'Game reading and positioning' },
          { key: 'B', label: 'Consistency in setting' },
          { key: 'C', label: 'Power and variety in the attack' },
          { key: 'D', label: 'Fitness and endurance on the sand' },
        ],
      },
      {
        field: 'prep',
        title: 'What is your physical prep and off-court care routine like?',
        options: [
          { key: 'A', label: 'I only do the training on the sand' },
          { key: 'B', label: 'I do strength or specific conditioning work' },
          { key: 'C', label: 'I follow a routine with fitness + mobility/stretching' },
          { key: 'D', label: 'I have full professional support (physical, nutritional and physiotherapy)' },
        ],
      },
      {
        field: 'injury',
        title: 'Have you ever had an injury from playing footvolley?',
        options: [
          { key: 'A', label: 'No, never got hurt' },
          { key: 'B', label: 'Yes, mild pain/discomfort (joint or muscular)' },
          { key: 'C', label: 'Yes, moderate/severe injury (ankle, knee, shoulder, elbow/lower back)' },
        ],
      },
      {
        field: 'motivation',
        title: 'What motivates you most to keep playing footvolley?',
        options: [
          { key: 'A', label: 'The community, the friends and the vibe' },
          { key: 'B', label: 'The constant challenge of improving technically' },
          { key: 'C', label: 'The competitive atmosphere of tournaments' },
          { key: 'D', label: 'The healthy, outdoor lifestyle' },
        ],
      },
    ],
    reviewTitle: 'Is everything correct?',
    reviewSub: 'Review your answers before sending. You can edit any item.',
    labels: { whatsapp: 'WhatsApp', name: 'Name', age: 'Age' },
    doneTitle: (first) => `Thank you${first ? `, ${first}` : ''}!`,
    doneBody: 'Your answers have been recorded. Thanks for contributing to the footvolley community!',
    again: 'Answer again',
    errors: {
      name: 'Please enter your name.',
      age: 'Please enter a valid age.',
      phone: 'Please enter a full WhatsApp number with area code.',
      poll: 'Choose an option to continue.',
      submit: 'Could not register your answer. Please try again.',
      retry: 'Try again',
    },
  },
}

/* ------------------------------------------------------------------ */
/* Preloader                                                           */
/* ------------------------------------------------------------------ */

function Preloader({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1000)
    const t2 = setTimeout(() => onDone(), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="paper-grid paper-wash fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-canvas"
      style={{
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <span
        className="block rounded-full border-2 border-line border-t-ink"
        style={{
          width: 44,
          height: 44,
          animation: 'star-spin 0.9s linear infinite',
          transformOrigin: 'center',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

/* 3 campos pessoais + 8 perguntas de múltipla escolha das fotos. */
const TOTAL = 11

const DIAL_CODES = [
  { flag: 'BR', code: '+55' },
  { flag: 'PT', code: '+351' },
  { flag: 'US', code: '+1' },
  { flag: 'AR', code: '+54' },
]

type Form = {
  name: string
  age: string
  dial: string
  phone: string
  duration: string
  frequency: string
  goal: string
  strength: string
  improve: string
  prep: string
  injury: string
  motivation: string
}

const EMPTY: Form = {
  name: '',
  age: '',
  dial: '+55',
  phone: '',
  duration: '',
  frequency: '',
  goal: '',
  strength: '',
  improve: '',
  prep: '',
  injury: '',
  motivation: '',
}

/* ------------------------------------------------------------------ */
/* Chrome                                                             */
/* ------------------------------------------------------------------ */

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-line/80 bg-surface/70 text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
    >
      {children}
    </button>
  )
}

function Header({
  step,
  t,
  lang,
  dark,
  onToggleLang,
  onToggleDark,
}: {
  step: number
  t: Copy
  lang: Lang
  dark: boolean
  onToggleLang: () => void
  onToggleDark: () => void
}) {
  const progress = step === 0 ? 0 : Math.min(step / TOTAL, 1)

  return (
    <header className="fixed inset-x-0 top-0 z-20">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span aria-hidden />
        <div className="flex items-center gap-3">
          {step > 0 && (
            <p className="hidden text-[13px] text-muted sm:block">
              {step > TOTAL ? t.review : (
                <>
                  {t.question} <span className="font-bold text-ink-2">{step}</span> {t.of} {TOTAL}
                </>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={onToggleLang}
            className="rounded-full border border-line/80 bg-surface/70 px-3 py-1.5 text-[12px] font-bold text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
            aria-label="Toggle language"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
          <IconButton onClick={onToggleDark} label="Toggle theme">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </IconButton>
        </div>
      </div>
      <div className="relative h-[3px] w-full bg-line/60">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #6c7ba6 0%, #8f9fc2 100%)',
          }}
        />
      </div>
    </header>
  )
}

function StepBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-ink-2">
      {children}
    </span>
  )
}

function Question({
  badge,
  title,
  hint,
  error,
  children,
}: {
  badge: ReactNode
  title: ReactNode
  hint?: ReactNode
  error?: string | null
  children?: ReactNode
}) {
  return (
    <div className="step-in w-full max-w-[720px]">
      <StepBadge>{badge}</StepBadge>
      <h1 className="mt-5 text-[clamp(1.7rem,4vw,2.5rem)] font-extrabold leading-[1.12] tracking-[-0.028em] text-ink">
        {title}
      </h1>
      {hint && <p className="mt-3 max-w-[600px] text-[15px] leading-relaxed text-ink-2/80">{hint}</p>}
      {children && <div className="mt-10">{children}</div>}
      {error && <p className="mt-4 text-[13px] font-semibold text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

const lineInput =
  'w-full border-b border-line bg-transparent pb-3 text-[clamp(1.25rem,2.6vw,1.6rem)] font-medium text-ink outline-none transition-colors placeholder:text-faint focus:border-ink/60'

function OptionList({ options, value, onPick }: { options: Choice[]; value: string; onPick: (key: string) => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      {options.map((option) => {
        const active = value === option.key
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onPick(option.key)}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
              active
                ? 'border-accent bg-surface shadow-[0_12px_28px_-20px_rgba(0,0,0,0.5)]'
                : 'border-line/80 bg-surface/70 hover:border-line hover:bg-surface'
            }`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                active ? 'bg-ink text-canvas' : 'bg-canvas-2 text-muted'
              }`}
            >
              {option.key}
            </span>
            <span className="text-[16px] font-semibold leading-snug text-ink">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Footer({
  onBack,
  onNext,
  label,
  t,
  hintKey = true,
  disabled = false,
}: {
  onBack?: () => void
  onNext: () => void
  label: string
  t: Copy
  hintKey?: boolean
  disabled?: boolean
}) {
  return (
    <div className="fixed bottom-0 left-0 z-20 flex items-center gap-4 px-6 py-7 sm:px-16">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-[15px] font-medium text-ink-2 transition-opacity hover:opacity-60"
        >
          {t.back}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-2xl bg-ink px-7 py-3.5 text-[15px] font-bold text-canvas shadow-[0_10px_24px_-14px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
      >
        {label} <span className="ml-1">→</span>
      </button>
      {hintKey && (
        <p className="hidden items-center gap-2 text-[13px] text-faint sm:flex">
          {t.press}
          <kbd className="rounded-md bg-canvas-2 px-2 py-0.5 text-[12px] font-semibold text-muted">Enter</kbd>
          <span className="text-[11px]">⏎</span>
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const head = d.slice(0, 2)
  const rest = d.slice(2)
  if (rest.length <= 4) return `(${head}) ${rest}`
  if (rest.length <= 8) return `(${head}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${head}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

function digitsOf(value: string) {
  return value.replace(/\D/g, '')
}

/* ------------------------------------------------------------------ */
/* App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState(0) // 0 = intro, 1..11 = perguntas, 12 = revisão, 13 = enviado
  const [form, setForm] = useState<Form>(EMPTY)
  const [lang, setLang] = useState<Lang>('pt')
  const [dark, setDark] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const t = DICT[lang]

  const REVIEW = TOTAL + 1 // 12
  const DONE = TOTAL + 2 // 13

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // A cada troca de pergunta, começa sem erro visível — mas um erro
  // levantado pela própria tentativa de avançar (mesma pergunta) permanece.
  useEffect(() => {
    setStepError(null)
  }, [step])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setStepError(null)
  }

  const first = form.name.trim().split(' ')[0]
  const who = first ? `${first},` : ''

  /** Valida a pergunta `s` (1..11). Retorna a mensagem de erro, ou null se ok. */
  const validateStep = (s: number): string | null => {
    if (s === 1) return form.name.trim() ? null : t.errors.name
    if (s === 2) {
      const age = Number(form.age)
      return form.age && Number.isInteger(age) && age >= 5 && age <= 99 ? null : t.errors.age
    }
    if (s === 3) return digitsOf(form.phone).length >= 10 ? null : t.errors.phone
    if (s >= 4 && s <= TOTAL) {
      const poll = t.polls[s - 4]
      const value = form[poll.field as keyof Form]
      return value ? null : t.errors.poll
    }
    return null
  }

  const hasMissing = useMemo(() => {
    for (let s = 1; s <= TOTAL; s++) {
      if (validateStep(s)) return true
    }
    return false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, t])

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    setSending(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setSubmitError(json?.error || t.errors.submit)
        return
      }
      setStep(DONE)
    } catch {
      setSubmitError(t.errors.submit)
    } finally {
      setSending(false)
    }
  }

  /** Avança respeitando validação (perguntas) e envio (revisão). */
  const next = () => {
    if (step === 0) {
      setStep(1)
      return
    }
    if (step >= 1 && step <= TOTAL) {
      const error = validateStep(step)
      if (error) {
        setStepError(error)
        return
      }
      setStep(step + 1)
      return
    }
    if (step === REVIEW) {
      if (hasMissing || sending) return
      void submit()
    }
  }

  const onEnter = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    next()
  }

  const labelForPoll = (poll: Poll) =>
    poll.options.find((o) => o.key === form[poll.field as keyof Form])?.label ?? ''

  const summary = useMemo(() => {
    const rows: { label: string; value: string; go: number; missing: boolean }[] = [
      { label: t.labels.name, value: form.name, go: 1, missing: validateStep(1) !== null },
      { label: t.labels.age, value: form.age, go: 2, missing: validateStep(2) !== null },
      { label: t.labels.whatsapp, value: `${form.dial} ${form.phone}`.trim(), go: 3, missing: validateStep(3) !== null },
    ]
    t.polls.forEach((poll, index) => {
      rows.push({ label: poll.title, value: labelForPoll(poll), go: 4 + index, missing: validateStep(4 + index) !== null })
    })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, t])

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
    <div className="relative min-h-screen overflow-hidden bg-canvas" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
      <div className="paper-wash pointer-events-none absolute inset-0" />
      <div className="paper-grid pointer-events-none absolute inset-0" />

      <Header
        step={step}
        t={t}
        lang={lang}
        dark={dark}
        onToggleLang={() => setLang((l) => (l === 'pt' ? 'en' : 'pt'))}
        onToggleDark={() => setDark((d) => !d)}
      />

      <main
        className="relative z-10 mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-6 pb-40 pt-32 sm:px-10"
        onKeyDown={onEnter}
      >
        {step === 0 && (
          <div className="step-in mx-auto max-w-[720px] text-center">
            <h1 className="text-[clamp(2.1rem,5.6vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
              {t.intro.title}
            </h1>
            <p className="mx-auto mt-6 max-w-[600px] text-[15px] leading-[1.75] text-ink-2/80">
              {t.intro.body}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={next}
                className="rounded-2xl bg-ink px-8 py-4 text-[15px] font-bold text-canvas shadow-[0_14px_30px_-16px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-px"
              >
                {t.intro.cta} <span className="ml-1">→</span>
              </button>
              <p className="flex items-center gap-2 text-[13px] text-faint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {t.intro.time}
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <Question badge={<>{step} →</>} title={t.name.title(who)} hint={t.name.hint} error={stepError}>
            <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t.name.placeholder} className={lineInput} />
          </Question>
        )}

        {step === 2 && (
          <Question badge={<>{step} →</>} title={t.age.title(who)} hint={t.age.hint} error={stepError}>
            <input
              autoFocus
              inputMode="numeric"
              value={form.age}
              onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder={t.age.placeholder}
              className={`${lineInput} max-w-[220px]`}
            />
          </Question>
        )}

        {step === 3 && (
          <Question badge={<>{step} →</>} title={t.phone.title(who)} hint={t.phone.hint} error={stepError}>
            <div className="flex items-end gap-5">
              <div className="relative shrink-0">
                <select
                  value={form.dial}
                  onChange={(e) => set('dial', e.target.value)}
                  className="w-[110px] appearance-none border-b border-line bg-transparent pb-3 pr-6 text-[clamp(1.25rem,2.6vw,1.6rem)] font-medium text-ink outline-none focus:border-ink/60"
                >
                  {DIAL_CODES.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.flag} {d.code}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute bottom-4 right-1 text-muted">▾</span>
              </div>
              <input
                autoFocus
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone', maskPhone(e.target.value))}
                placeholder={t.phone.placeholder}
                className={lineInput}
              />
            </div>
          </Question>
        )}

        {step >= 4 && step <= TOTAL && (() => {
          const poll = t.polls[step - 4]
          const field = poll.field as keyof Form
          return (
            <Question badge={<>{step} →</>} title={poll.title} hint={poll.hint} error={stepError}>
              <OptionList options={poll.options} value={form[field]} onPick={(key) => set(field, key)} />
            </Question>
          )
        })()}

        {step === REVIEW && (
          <div className="step-in mx-auto w-full max-w-[720px]">
            <StepBadge>{t.review}</StepBadge>
            <h1 className="mt-5 text-[clamp(2rem,4.8vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
              {t.reviewTitle}
            </h1>
            <p className="mt-3 text-[15px] text-ink-2/80">{t.reviewSub}</p>

            <ul className="mt-10 overflow-hidden rounded-2xl border border-line/70 bg-surface/70">
              {summary.map((row, index) => (
                <li
                  key={index}
                  className={`grid grid-cols-[1fr_auto] items-start gap-4 px-6 py-4 ${
                    index > 0 ? 'border-t border-line/60' : ''
                  }`}
                >
                  <div>
                    <span className="block text-[13px] leading-snug text-muted">{row.label}</span>
                    <span
                      className={`mt-1 block text-[15px] font-semibold ${
                        row.missing ? 'text-red-500 dark:text-red-400' : 'text-ink'
                      }`}
                    >
                      {row.value || <span className={row.missing ? '' : 'text-faint'}>—</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(row.go)}
                    className="text-[13px] font-medium text-ink-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
                  >
                    {t.edit}
                  </button>
                </li>
              ))}
            </ul>

            {submitError && (
              <p className="mt-5 text-[13px] font-semibold text-red-500 dark:text-red-400">{submitError}</p>
            )}
          </div>
        )}

        {step === DONE && (
          <div className="step-in mx-auto max-w-[620px] text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-ink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="mt-8 text-[clamp(2rem,5vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
              {t.doneTitle(first)}
            </h1>
            <p className="mx-auto mt-5 max-w-[480px] text-[15px] leading-[1.75] text-ink-2/80">
              {t.doneBody}
            </p>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY)
                setSubmitError(null)
                setStep(0)
              }}
              className="mt-10 text-[14px] font-medium text-muted underline underline-offset-4 hover:text-ink-2"
            >
              {t.again}
            </button>
          </div>
        )}
      </main>

      {step >= 1 && step <= TOTAL && <Footer onBack={step > 1 ? back : undefined} onNext={next} label={t.ok} t={t} />}
      {step === REVIEW && (
        <Footer onBack={back} onNext={next} label={sending ? t.sending : t.send} t={t} disabled={sending} />
      )}
    </div>
    </>
  )
}
