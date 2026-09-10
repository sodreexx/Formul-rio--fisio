// Validação das respostas da enquete de futevôlei.
// Espelha as regras do front-end (src/App.tsx) como segunda linha de
// defesa: qualquer chamada direta à API também passa por aqui.

// Uma entrada por pergunta de múltipla escolha, na mesma ordem do
// front-end. `labels` é o texto canônico (PT) de cada opção — a planilha
// sempre grava em português, mesmo que a pessoa responda em inglês, pra
// ficar consistente pra quem for analisar depois. O texto exibido na tela
// (PT/EN) mora só no front-end (src/App.tsx); esta cópia existe apenas
// para resolver a chave escolhida num texto legível ao gravar na planilha.
const POLLS = [
  {
    field: 'duration',
    labels: { A: 'Menos de 6 meses', B: '6 meses a 2 anos', C: 'Mais de 2 anos' },
  },
  {
    field: 'frequency',
    labels: { A: '1 a 2x por semana', B: '3 a 4x por semana', C: '5x ou mais por semana' },
  },
  {
    field: 'goal',
    labels: {
      A: 'Lazer, saúde e socialização',
      B: 'Evolução técnica e jogos de fim de semana',
      C: 'Competir em torneios amadores/regionais',
      D: 'Seguir carreira profissional no esporte',
    },
  },
  {
    field: 'strength',
    labels: {
      A: 'Recepção / Defesa',
      B: 'Levantamento / Segundo toque',
      C: 'Ataque de chão (curtas, paralelas, diagonais)',
      D: 'Golpes de cabeça / Tubarão',
    },
  },
  {
    field: 'improve',
    labels: {
      A: 'Leitura de jogo e posicionamento',
      B: 'Constância no levantamento',
      C: 'Potência e variação no ataque',
      D: 'Condicionamento físico e resistência na areia',
    },
  },
  {
    field: 'prep',
    labels: {
      A: 'Faço apenas os treinos na areia',
      B: 'Faço musculação ou fortalecimento específico',
      C: 'Acompanho rotina com treino físico + mobilidade/alongamento',
      D: 'Tenho acompanhamento profissional completo (físico, nutricional e fisioterapêutico)',
    },
  },
  {
    field: 'injury',
    labels: {
      A: 'Não, nunca me machuquei',
      B: 'Sim, dor/desconforto leve (articular ou muscular)',
      C: 'Sim, lesão moderada/grave (tornozelo, joelho, ombro, cotovelo/lombar)',
    },
  },
  {
    field: 'motivation',
    labels: {
      A: 'A comunidade, os amigos e a resenha',
      B: 'O desafio constante de evoluir na técnica',
      C: 'O clima de competição dos torneios',
      D: 'O estilo de vida saudável e ao ar livre',
    },
  },
]

function digitsOf(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/**
 * Valida o payload recebido em POST /api/responder.
 * Retorna { ok: true, data } com os campos normalizados, ou
 * { ok: false, errors } com um erro por campo inválido/ausente.
 */
export function validateResposta(body) {
  const errors = {}
  const b = body && typeof body === 'object' ? body : {}

  const name = String(b.name ?? '').trim()
  if (!name) {
    errors.name = 'Informe o nome.'
  }

  const ageRaw = String(b.age ?? '').trim()
  const age = Number(ageRaw)
  if (!ageRaw || !Number.isInteger(age) || age < 5 || age > 99) {
    errors.age = 'Informe uma idade válida (entre 5 e 99).'
  }

  const dial = String(b.dial ?? '').trim()
  const phone = String(b.phone ?? '').trim()
  if (digitsOf(phone).length < 10) {
    errors.phone = 'Informe um WhatsApp completo com DDD.'
  }

  const answers = {}
  for (const poll of POLLS) {
    const value = String(b[poll.field] ?? '').trim().toUpperCase()
    if (!poll.labels[value]) {
      errors[poll.field] = 'Selecione uma opção.'
    } else {
      answers[poll.field] = value
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    data: { name, age: ageRaw, dial, phone, ...answers },
  }
}

/** Resolve a chave escolhida (A/B/C/D) no texto canônico em PT da opção,
 *  para gravar na planilha de forma legível. */
export function resolvePollLabel(field, key) {
  const poll = POLLS.find((p) => p.field === field)
  return poll?.labels[key] ?? key
}

/** Ordem e nomes das colunas da planilha, exportado pra lib/sheets.js não
 *  precisar duplicar a lista de campos de enquete. */
export const POLL_FIELDS = POLLS.map((p) => p.field)

