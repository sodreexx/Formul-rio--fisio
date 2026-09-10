# Deploy — Enquete de Futevôlei

Front-end e back-end no mesmo deploy Vercel (funções serverless em `/api`),
sem CORS pra configurar. Armazenamento é uma planilha do Google Sheets.

---

## 0. Pré-requisito: subir o código pro GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/formulario-fisio.git
git branch -M main
git push -u origin main
```

---

## 1. Google Sheets + conta de serviço

1. Crie a planilha em https://sheets.google.com — pode deixar em branco, ou
   já criar a primeira linha com os cabeçalhos (Data/Hora, Nome, Idade,
   WhatsApp, e os 8 títulos das perguntas).
2. Copie o **ID da planilha**: é o trecho da URL entre `/d/` e `/edit`
   (ex.: `https://docs.google.com/spreadsheets/d/AQUI-O-ID/edit`).
3. Acesse https://console.cloud.google.com → crie um projeto novo
   (gratuito).
4. **APIs e serviços → Biblioteca** → procure e ative a **Google Sheets
   API**.
5. **APIs e serviços → Credenciais → Criar credenciais → Conta de
   serviço**. Dê um nome qualquer, conclua a criação.
6. Abra a conta de serviço criada → **Chaves → Adicionar chave → Criar nova
   chave → JSON**. Isso baixa um arquivo `.json` — abra-o, você vai usar
   dois campos:
   - `client_email` → vira `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → vira `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (cole
     exatamente como está no JSON, incluindo os `\n`)
7. **Volte na planilha** (passo 1) → botão **Compartilhar** → cole o
   `client_email` da conta de serviço → permissão de **Editor**. Sem isso a
   função serverless não consegue escrever.

---

## 2. Front-end + back-end na Vercel

1. https://vercel.com/new → conecte o GitHub → importe o repositório.
2. Detecta Vite automaticamente (build `npm run build`, output `dist`) e as
   funções em `/api/*.js` — nada a configurar.
3. Antes de clicar em **Deploy**, adicione as variáveis de ambiente:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
4. **Deploy**. Ao final, você recebe uma URL tipo
   `https://formulario-fisio.vercel.app`.

---

## 3. Testar no ar

1. `GET /api/health` deve responder `sheetsConfigured: true`.
2. Preencha o formulário completo e confirme.
3. Confira a linha nova aparecendo na planilha.

---

## Desenvolvimento local

`npm run dev` já sobe front-end e as funções de `/api` juntos (veja
`vercelApiEmulator` em [`vite.config.ts`](vite.config.ts)). Crie um `.env`
na raiz (veja `.env.example`) com as mesmas variáveis do passo 2.3.
