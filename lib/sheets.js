import { google } from 'googleapis'
import { resolvePollLabel, POLL_FIELDS } from './validation.js'

let sheetsClient = null

/**
 * Cliente do Google Sheets, autenticado como conta de serviço (JWT — sem
 * OAuth de usuário). Reaproveitado enquanto a instância serverless estiver
 * "quente"; um cold start recria o cliente, o que é barato.
 *
 * Retorna null se as variáveis de ambiente não estiverem configuradas.
 */
function getSheetsClient() {
  if (sheetsClient) return sheetsClient

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  // O valor colado nas variáveis de ambiente costuma vir com "\n" literal
  // (duas letras) no lugar de quebra de linha real — a chave PEM só é válida
  // com a quebra de verdade.
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) return null

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  sheetsClient = google.sheets({ version: 'v4', auth })
  return sheetsClient
}

/** true se as variáveis de ambiente do Google e o ID da planilha estiverem
 *  configurados — não confirma que a planilha foi compartilhada com a
 *  conta de serviço, só que as credenciais existem. */
export function isSheetsConfigured() {
  return Boolean(getSheetsClient() && process.env.GOOGLE_SHEET_ID)
}

/**
 * Grava uma linha na planilha com a resposta validada. Lança em caso de
 * falha — quem chama decide o que fazer (ver a resposta 502 em
 * api/responder.js).
 */
export async function appendResposta(data) {
  const sheets = getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!sheets || !spreadsheetId) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY/GOOGLE_SHEET_ID não configurados')
  }

  const row = [
    new Date().toISOString(),
    data.name,
    data.age,
    `${data.dial} ${data.phone}`.trim(),
    ...POLL_FIELDS.map((field) => resolvePollLabel(field, data[field])),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:A',
    // RAW, não USER_ENTERED: o WhatsApp começa com "+" e o Sheets trata
    // qualquer valor iniciado por "+" ou "=" como início de fórmula quando
    // USER_ENTERED tenta interpretar a entrada como se fosse digitada por
    // uma pessoa — resultava em #ERROR! na coluna do telefone. RAW grava o
    // texto exatamente como está, sem tentar interpretar nada.
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  })
}
