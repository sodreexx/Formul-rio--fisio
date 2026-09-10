import { validateResposta } from '../lib/validation.js'
import { appendResposta } from '../lib/sheets.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const result = validateResposta(req.body)
  if (!result.ok) {
    return res.status(400).json({ ok: false, errors: result.errors })
  }

  try {
    await appendResposta(result.data)
    return res.status(200).json({ ok: true })
  } catch (err) {
    // Aqui, diferente do agendamento Sod Tech, não existe um segundo canal
    // (sem e-mail, sem banco à parte) — a planilha é a única fonte de
    // registro. Falhou, então não tem "salvou em outro lugar" pra confiar:
    // o erro precisa mesmo voltar pro usuário tentar de novo.
    console.error('[responder] falha ao gravar na planilha:', err)
    return res.status(502).json({
      ok: false,
      error: 'Não foi possível registrar sua resposta. Tente novamente mais tarde.',
    })
  }
}
