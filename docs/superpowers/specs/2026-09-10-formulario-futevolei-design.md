# Enquete de atletas de futevôlei (projeto "formulario-fisio")

**Data:** 2026-09-10
**Status:** Aprovado, aguardando plano de implementação

## Contexto e motivação

Repetir o processo do projeto Sod Tech (formulário de agendamento: front-end
React/Vite + back-end serverless na Vercel, validação client+server, i18n,
tema claro/escuro, mobile-first) para um novo formulário, a partir de um
design já pronto no Figma Make
(`https://www.figma.com/make/MhTkjoW3TK1LVkqu2h8GS7/formulario-fisio`).

Duas diferenças em relação ao Sod Tech:

1. **Armazenamento:** Google Sheets em vez de Supabase — cada envio vira uma
   linha na planilha, sem banco de dados dedicado.
2. **Conteúdo:** apesar do nome do arquivo ("formulario-fisio"), o design
   final (versão 15 do histórico do Figma Make) não é sobre fisioterapia — é
   uma **enquete com atletas de futevôlei** (nome, idade, WhatsApp + 8
   perguntas de múltipla escolha sobre prática esportiva). O histórico mostra
   que o arquivo começou como cópia do Sod Tech, passou por uma versão de
   "atividade extracurricular de fisioterapia" e foi reescrito para a enquete
   de futevôlei, que é a versão atual. A pasta do projeto se chama
   `formulario-fisio` por preferência do usuário, mesmo o conteúdo sendo
   sobre futevôlei.

Projeto novo e independente do Sod Tech: pasta e repositório Git próprios em
`C:\Users\WINDOWS\Desktop\Trabalho\formulario-fisio\`, deploy próprio na
Vercel.

## Arquitetura

Mesma base do Sod Tech (React + Vite no front-end, funções serverless na
Vercel no back-end, mesma origem, sem CORS), mas mais simples: sem
Supabase (não há rate-limit nesta primeira versão — decisão consciente,
volume esperado bem menor que o Sod Tech) e sem Nodemailer/Gmail (não há
aviso por e-mail — a planilha é o único registro).

```
Browser → POST /api/responder (mesma origem)
              │
              ├─→ valida payload (nome, idade, WhatsApp + 8 respostas)
              └─→ grava uma linha no Google Sheets (via conta de serviço)
```

**Google Sheets via conta de serviço:** a função serverless autentica como
uma conta de serviço do Google (JWT, sem OAuth de usuário) usando a
biblioteca `googleapis`, e grava com `spreadsheets.values.append`. A
planilha é compartilhada com o e-mail da conta de serviço (permissão de
Editor) — mesmo padrão da `service_role key` do Supabase: uma credencial de
servidor, nunca exposta ao cliente.

## Conteúdo do formulário

Reconstituído do histórico de edições do Figma Make (versão 15, a atual).

**Dados básicos (3 passos):**
1. Nome completo
2. Idade
3. WhatsApp

**8 perguntas de múltipla escolha (uma por tela, badge A/B/C/D):**
1. Há quanto tempo você pratica futevôlei? — *Menos de 6 meses / 6 meses a 2
   anos / Mais de 2 anos*
2. Com que frequência você treina por semana? — *1 a 2x / 3 a 4x / 5x ou
   mais*
3. Objetivo na modalidade
4. Maior ponto forte
5. Fundamento a melhorar
6. Rotina de preparação física
7. Histórico de lesões
8. Motivação para continuar

Depois: tela de **revisão** (cada resposta com link "editar", voltando pra
pergunta e retornando pra revisão ao confirmar — mesmo padrão do Sod Tech) →
tela de **confirmação**.

**Visual mantido do design do Figma Make:** papel quadriculado de fundo,
barra de progresso em gradiente azul, preloader com spinner (a estrela do
Sod Tech foi removida nesse design), tema claro/escuro, alternância PT/EN,
navegação por Enter/Voltar. Sem logo em nenhuma tela (removida
explicitamente no histórico de edições).

**Pendência para a implementação:** o painel de código do Figma Make (aba
"Código") travou carregando durante o brainstorming e não foi possível ler
o `App.tsx` fonte diretamente — o conteúdo acima vem do resumo das mudanças
no histórico de chat do Figma Make, não do arquivo em si. Isso é suficiente
para fechar a estrutura (campos, tipos de pergunta, quantidade de opções),
mas o texto exato das opções A-D de cada pergunta precisa ser confirmado
lendo o código-fonte real (nova tentativa do painel, ou exportação/cópia
manual) antes de escrever o front-end definitivo — não inventar cópia.

## Schema da planilha (Google Sheets)

Uma linha por envio, colunas:

| Coluna | Conteúdo |
|---|---|
| `Data/Hora` | timestamp do envio |
| `Nome` | nome completo |
| `Idade` | número |
| `WhatsApp` | telefone com DDD |
| `Tempo de prática` | resposta 1 |
| `Frequência semanal` | resposta 2 |
| `Objetivo` | resposta 3 |
| `Maior ponto forte` | resposta 4 |
| `Fundamento a melhorar` | resposta 5 |
| `Preparação física` | resposta 6 |
| `Histórico de lesões` | resposta 7 |
| `Motivação` | resposta 8 |

Cada envio é uma linha nova; a planilha cresce naturalmente e é, ela mesma,
a fonte de dados final para análise — diferente do Supabase do Sod Tech,
não existe aqui uma tabela "enxuta" para manter limpa.

## Setup da conta de serviço Google

1. Criar um projeto no Google Cloud Console (gratuito)
2. Ativar a Google Sheets API
3. Criar uma conta de serviço, gerar a chave JSON — vira
   `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` nas
   variáveis de ambiente da Vercel
4. Criar a planilha (Google Sheets normal, na conta do usuário) e
   compartilhá-la com o e-mail da conta de serviço (permissão de Editor) —
   sem isso a função serverless não consegue escrever
5. `GOOGLE_SHEET_ID` (extraído da URL da planilha) também vai nas variáveis
   de ambiente

## Validação

- **Nome:** obrigatório, texto
- **Idade:** obrigatório, número entre 5 e 99
- **WhatsApp:** obrigatório, mínimo 10 dígitos (mesma regra do Sod Tech)
- **8 perguntas de múltipla escolha:** todas obrigatórias, uma opção A-D
  cada

Duas camadas, como no Sod Tech: front-end (impede avançar sem responder) e
back-end (segunda linha de defesa contra chamada direta à API).

## Fluxo de `POST /api/responder` e tratamento de erro

Só existe um canal de gravação (a planilha) — sem plano B independente
como o par lead+e-mail do Sod Tech:

1. Valida o payload → inválido: `400 { ok:false, errors }`
2. Tenta gravar a linha na planilha via `spreadsheets.values.append`
3. Falha (Google fora do ar, credencial errada, planilha não compartilhada)
   → `502 { ok:false, error }`, pede para tentar de novo; detalhe do erro só
   no log do servidor
4. Sucesso → `200 { ok:true }`

`GET /api/health` confere se as variáveis de ambiente do Google estão
configuradas (`sheetsConfigured: true/false`), sem escrever na planilha a
cada chamada.

## Plano de teste

Sem suíte automatizada (mesmo padrão do Sod Tech) — verificação manual via
`curl` e navegador, depois que a planilha e as credenciais existirem:

1. `GET /api/health` → `sheetsConfigured: true`
2. Payload inválido → `400` com os erros certos
3. Envio válido → `200`, confirma a linha aparecendo na planilha real
4. Credencial errada simulada de propósito → `502` tratado sem quebrar o
   restante da aplicação
5. Fluxo completo pelo navegador: nome → idade → WhatsApp → 8 perguntas →
   revisão → confirmação
6. `npx tsc --noEmit` e `npm run build` limpos

## Fora de escopo (YAGNI)

- Rate limiting / controle de envios repetidos (sem Supabase nesta versão;
  decisão consciente diante do volume esperado)
- Aviso por e-mail a cada resposta
- Criação automática do cabeçalho da planilha pelo código (o usuário cria
  manualmente ao configurar a planilha)
- Dashboard ou consulta às respostas fora da própria planilha
