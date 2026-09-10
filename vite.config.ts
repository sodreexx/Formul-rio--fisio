// Só usado em dev: carrega .env pro process.env do processo Node que roda
// este arquivo, pra que api/*.js (executadas via vercelApiEmulator, abaixo)
// enxerguem GOOGLE_SERVICE_ACCOUNT_EMAIL etc. Em produção a Vercel injeta
// essas variáveis diretamente no ambiente das funções — dotenv nunca entra
// ali.
import 'dotenv/config'

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Vite config — https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelApiEmulator()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

/**
 * Roda as funções de `api/*.js` localmente durante `vite dev`, do mesmo
 * jeito que a Vercel roda em produção: um arquivo por rota, exportando
 * `export default function handler(req, res) {}`.
 *
 * Existe pra `npm run dev` continuar sendo um único comando sem precisar da
 * CLI da Vercel (que exigiria `vercel login` + `vercel link` — fricção
 * desnecessária só pra desenvolver localmente). Em produção a Vercel ignora
 * isto por completo e executa `api/*.js` na própria infraestrutura dela;
 * `apply: 'serve'` garante que este plugin nunca entra no build.
 *
 * O import usa um parâmetro `?t=` que muda a cada requisição pra furar o
 * cache de módulos do Node — assim, editar um arquivo em api/ ou lib/ reflete
 * na próxima requisição, sem precisar reiniciar o `vite dev`.
 */
function vercelApiEmulator(): Plugin {
  return {
    name: 'vercel-api-emulator',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (!url.startsWith('/api/')) return next()

        const name = url.slice('/api/'.length).replace(/\/+$/, '')
        if (!/^[a-z0-9-]+$/i.test(name)) return next()

        const filePath = path.resolve(__dirname, 'api', `${name}.js`)
        if (!fs.existsSync(filePath)) return next()

        try {
          await attachBody(req)
          attachResponseHelpers(res)

          const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`)
          await mod.default(req, res)
        } catch (err) {
          console.error(`[vercel-api-emulator] erro em /api/${name}:`, err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'Erro interno.' }))
          }
        }
      })
    },
  }
}

/** Lê o corpo bruto da requisição e, se for JSON, expõe em `req.body` — a
 *  mesma conveniência que o runtime Node da Vercel já dá aos handlers. */
async function attachBody(req: IncomingMessage & { body?: unknown }) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method ?? '')) return

  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf-8')

  const contentType = String(req.headers['content-type'] || '')
  req.body = contentType.includes('application/json') && raw ? JSON.parse(raw) : raw
}

/** Adiciona `.status()`/`.json()` à resposta nativa do Node — o mínimo que
 *  as funções em api/*.js esperam da `VercelResponse`. */
function attachResponseHelpers(
  res: ServerResponse & { status?: (code: number) => ServerResponse; json?: (body: unknown) => void },
) {
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (body: unknown) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }
}
