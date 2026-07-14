# CRM Veron & Arena 360

Sistema de CRM em produção para as duas marcas (Veron Produções e Arena 360),
construído a partir do briefing (`briefing-crm-veron.md`) e reaproveitando o
layout/comportamento validado no protótipo (`crm-prototipo.jsx`).

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + SWR
- **Backend**: API Routes do próprio Next.js
- **Banco de dados**: PostgreSQL via Prisma ORM
- **Autenticação**: NextAuth.js (Credentials + JWT), com perfis Admin / Comercial / Financeiro
- **Armazenamento de arquivos**: local (`/public/uploads`) em dev — trocar por S3/R2/Supabase Storage em produção (ver `src/lib/storage.ts`)
- **IA**: SDK da Anthropic chamado **somente no servidor** (`src/lib/ai.ts` + `src/app/api/ai/analyze`), com `ANTHROPIC_API_KEY` em variável de ambiente

## 🟢 Caminho fácil — sem usar terminal (recomendado se você não conhece linha de comando)

Essa forma usa só os sites do GitHub, Supabase e Vercel pelo navegador. O
próprio Vercel instala as dependências e cria as tabelas do banco
automaticamente durante o deploy — você não precisa rodar `npm install`,
`prisma` nem `git` na sua máquina.

**1. Crie o banco no Supabase**
1. Acesse https://supabase.com → crie uma conta → "New Project"
2. Escolha um nome, uma senha forte (guarde-a) e a região mais próxima
3. Aguarde o projeto ficar pronto (uns 2 minutos)
4. Vá em **Project Settings → Database → Connection string**, aba **Session pooler**, e copie a URL (troque `[YOUR-PASSWORD]` pela senha que você criou). Guarde essa URL — é a sua `DATABASE_URL`.

**2. Suba o código para o GitHub (sem usar git)**
1. Extraia o arquivo `crm-veron.zip` no seu computador
2. Acesse https://github.com/new, crie um repositório (pode ser privado) chamado `crm-veron` e clique em "Create repository" **sem** marcar nenhuma opção de inicialização
3. Na página do repositório recém-criado, clique em **"uploading an existing file"**
4. Arraste a pasta `crm-veron` inteira (com todo o conteúdo dentro) para a área de upload do navegador — o Chrome e o Edge preservam as subpastas automaticamente
5. Role até o fim e clique em **"Commit changes"**

**3. Faça o deploy no Vercel**
1. Acesse https://vercel.com/new e conecte sua conta do GitHub
2. Selecione o repositório `crm-veron`
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a URL copiada no passo 1 |
| `NEXTAUTH_URL` | deixe em branco por enquanto — depois do deploy, copie a URL final que o Vercel gerar e volte aqui para preencher |
| `NEXTAUTH_SECRET` | `Sos48WzoTpDBjOeGdEPG3m3sKyplzL7FDyIzjO9x3pE=` (já pronta — ou gere outra em https://generate-secret.vercel.app/32) |
| `SETUP_SECRET` | invente uma frase secreta qualquer, ex: `abrir-o-crm-2026` (você vai usar essa mesma frase no próximo passo) |
| `ANTHROPIC_API_KEY` | sua chave em https://console.anthropic.com |

4. Clique em **Deploy** e aguarde (o Vercel instala tudo e já cria as tabelas do banco sozinho nesse processo)
5. Quando terminar, copie a URL do projeto (ex: `https://crm-veron-xxxx.vercel.app`), volte em **Settings → Environment Variables**, edite `NEXTAUTH_URL` com essa URL, e clique em **Redeploy** (Deployments → menu "..." → Redeploy)

**4. Crie o primeiro usuário Administrador (pelo navegador, sem terminal)**
1. Acesse `https://SUA-URL.vercel.app/setup`
2. Preencha o "Código de configuração" com a mesma frase que você colocou em `SETUP_SECRET`, seu nome, e-mail e senha
3. Clique em "Criar conta de Administrador" — essa tela só funciona uma vez; depois disso, novos usuários são criados dentro do próprio sistema (tela Configurações)
4. Você será redirecionado para `/login` — entre com o e-mail e senha que acabou de criar

Pronto — o CRM está no ar, com banco de dados real e login funcionando. As
colunas padrão do Kanban (Leads, Primeiro Contato, etc.) já são criadas
automaticamente nesse mesmo passo.

> Se quiser popular o sistema com os clientes de exemplo do protótipo (para
> testar), isso exige rodar `npm run db:seed` localmente (veja a seção
> abaixo) — não é obrigatório para usar o sistema em produção.

---

## Caminho avançado — rodando localmente com terminal

Pré-requisitos: Node.js 20+, um banco PostgreSQL (local, Supabase ou Railway).

```bash
npm install
cp .env.example .env
# edite .env com sua DATABASE_URL, NEXTAUTH_SECRET e ANTHROPIC_API_KEY

npx prisma migrate dev --name init   # cria as tabelas
npm run db:seed                      # popula usuários, colunas do kanban e clientes de exemplo

npm run dev
```

Acesse `http://localhost:3000`. Login de teste após o seed:

- **Admin**: `marina@veronproducoes.com.br` / `veron@2026`
- **Comercial**: `rafael@veronproducoes.com.br` / `veron@2026`
- **Financeiro**: `diego@veronproducoes.com.br` / `veron@2026`

Gere um `NEXTAUTH_SECRET` com `openssl rand -base64 32`.

## Estrutura

```
prisma/schema.prisma        modelo de dados completo (Client, Activity, EmailSubscription, Task, etc.)
prisma/seed.ts              usuários + colunas do kanban + clientes de exemplo
src/lib/                     auth, permissões, domínio (marcas/origens/atividades), tema, storage, IA, auditoria
src/middleware.ts            protege rotas por autenticação e por perfil (admin-only em /settings, /api/users, /api/columns)
src/app/api/                 rotas de backend (clientes, kanban, assinaturas, relatórios, IA, tarefas, usuários)
src/app/(dashboard)/         páginas autenticadas (dashboard, kanban, clients, emails, reports, ai, tasks, agenda, settings)
src/components/views/        as "telas" do protótipo, agora ligadas ao backend real via SWR
src/components/kanban/       ClientCard, KanbanColumn, filtros — visual idêntico ao protótipo
src/components/modals/       ClientModal (Dados/Histórico/Arquivos) e AddLeadModal
```

## Mapeamento com o briefing

| Módulo do briefing | Onde está |
|---|---|
| 3.1 Dashboard | `DashboardView` + `/api/clients` |
| 3.2 Kanban de Leads | `KanbanView`, `KanbanColumn`, `/api/columns`, drag-and-drop com posição real |
| 3.3 Cadastro de Clientes | `ClientsView` + `AddLeadModal` (sem campo Segmento, conforme decisão do cliente) |
| 3.4 Modal de detalhes (Dados/Histórico) | `ClientModal`; regra "Descartado → Perdido" em `/api/clients/[id]/history` |
| 3.5 E-mails (assinatura por marca) | `EmailsView` + `/api/subscriptions` (chave única `clientId+brand`) |
| 3.6 Relatórios | `ReportsView` + `/api/reports/emails` (CSV só com a coluna e-mail) |
| 3.7 Análise por IA | `AIAnalysisView` + `/api/ai/analyze` (chave da Anthropic só no servidor) |
| 3.8 Configurações | `SettingsView` (usuários/perfis); colunas do kanban editáveis na própria tela de Leads |
| 3.9 Tarefas / Agenda / Arquivos / Auditoria | `TasksView`, `AgendaView`, upload em `ClientModal` (aba Arquivos), `AuditLog` automático em todas as rotas de escrita |

Ainda **não implementados** (fora do escopo deste MVP, conforme observado no
próprio briefing): notificações automáticas, importação de clientes via
Excel/CSV, exportação de relatórios em Excel/PDF, backup automático (delegar
ao provedor gerenciado de Postgres) e envio de e-mail em massa (Resend/SendGrid).

## Produção / Deploy

1. **Banco**: crie um Postgres gerenciado (Supabase, Railway, RDS) e rode `npm run db:deploy` (usa `prisma migrate deploy`).
2. **Arquivos**: implemente o branch `s3` de `src/lib/storage.ts` com Cloudflare R2 ou S3 antes de ir a produção — o driver local (`/public/uploads`) não é durável em hospedagens serverless como a Vercel.
3. **Variáveis de ambiente**: configure `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` e `ANTHROPIC_API_KEY` no provedor de hospedagem (nunca no código ou no frontend).
4. **Hospedagem**: Vercel funciona bem para o Next.js completo (frontend + API routes) neste projeto; não é necessário um backend separado, mas a arquitetura em API Routes permite migrar para um servidor Express dedicado se preferir.
5. **E-mail em massa real**: se decidirem avançar além do controle de assinatura, integrar Resend/SendGrid/Mailgun com domínio autenticado (SPF/DKIM).
6. **LGPD**: página `/privacidade` com política básica; adicione o fluxo de solicitação de exclusão de titular conforme o processo interno da empresa.

## Permissões por perfil

- **Administrador**: acesso total, inclusive gestão de usuários e colunas do kanban.
- **Comercial**: Clientes, Kanban, Histórico, Agenda, Tarefas (sem gestão de usuários/colunas).
- **Financeiro**: consulta e exportações (relatórios), sem editar clientes ou mover o kanban.

A lógica está centralizada em `src/lib/permissions.ts` e aplicada tanto no
backend (rotas de API) quanto no frontend (botões/ações ocultos conforme o perfil).
