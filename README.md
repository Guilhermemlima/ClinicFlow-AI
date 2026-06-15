# ClinicFlow AI

SaaS de automação da jornada do paciente para clínicas médicas, odontológicas e de estética. Reduz no-shows em até 35% via lembretes automáticos pelo WhatsApp com IA.

## Funcionalidades

- **Dashboard com ROI em tempo real** — calcula receita recuperada por no-shows evitados
- **Lembretes automáticos via WhatsApp** — 48h e 2h antes da consulta
- **Classificação de intenção com IA** — confirma ou cancela consultas automaticamente ao receber resposta do paciente
- **Reativação de pacientes inativos** — dispara mensagens para pacientes sem visita há 90+ dias
- **Relatórios de desempenho** — taxa de confirmação, receita recuperada, distribuição de horários
- **Gestão completa de pacientes e consultas**

## Requisitos

- Node.js 18+
- Docker e Docker Compose (para PostgreSQL e Evolution API)
- npm

## Setup Inicial

### 1. Instale as dependências

```bash
cd clinicflow-ai
npm install
```

### 2. Suba o banco de dados e WhatsApp API

```bash
docker-compose up -d
```

Aguarde os containers iniciarem (~30 segundos).

### 3. Configure as variáveis de ambiente

Copie e edite o `.env.local`:

```bash
cp .env.local .env.local.example
```

Edite `.env.local` com suas credenciais:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinicflow"
NEXTAUTH_SECRET="gere com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."          # opcional — usa fallback local sem isso
STRIPE_SECRET_KEY="sk_test_..."  # opcional — cadastro funciona sem
EVOLUTION_API_KEY="clinicflow-secret-key"
EVOLUTION_API_URL="http://localhost:8080"
```

### 4. Execute as migrations e o seed

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

**Credenciais de acesso após o seed:**
- Email: `carlos@odontoclinicasilva.com.br`
- Senha: `clinicflow123`

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do Projeto

```
clinicflow-ai/
├── app/
│   ├── (auth)/          # Login e cadastro
│   ├── (dashboard)/     # Dashboard, consultas, pacientes, automações, relatórios
│   └── api/             # API routes
├── components/          # Componentes React
├── jobs/               # Cron jobs (lembretes, reativação)
├── lib/                # Clientes (Prisma, WhatsApp, OpenAI, Stripe)
├── prisma/             # Schema e seed
├── types/              # TypeScript types
└── __tests__/          # Testes Vitest
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Rodar os cron jobs (em processo separado em produção)
npx ts-node jobs/scheduler.ts

# Testes
npm test

# Prisma
npx prisma studio          # Interface visual do banco
npx prisma db push         # Aplicar schema sem migration
npx prisma db seed         # Popular banco com dados de teste
npx prisma generate        # Regenerar cliente Prisma

# Docker
docker-compose up -d       # Subir PostgreSQL + Evolution API
docker-compose down        # Parar os containers
docker-compose logs -f     # Ver logs
```

## Conectar o WhatsApp (Evolution API)

1. Acesse **Configurações → WhatsApp** no dashboard
2. Clique em "Gerar QR Code"
3. Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
4. Escaneie o QR Code
5. O status muda para "Conectado" em verde

## Deploy

### Frontend (Vercel)

```bash
# Configure as variáveis de ambiente no painel da Vercel
vercel deploy
```

### Jobs (Railway)

```bash
# Crie um serviço no Railway apontando para jobs/scheduler.ts
# Configure as mesmas variáveis de ambiente
```

## Planos e Preços

| Plano   | Preço/mês  | Profissionais |
|---------|-----------|---------------|
| Solo    | R$ 197    | 1             |
| Clínica | R$ 597    | Até 5         |
| Premium | R$ 1.197  | Até 15        |

Todos os planos incluem 14 dias de teste gratuito.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Banco:** PostgreSQL
- **Auth:** NextAuth.js v5
- **WhatsApp:** Evolution API
- **IA:** OpenAI gpt-4o-mini
- **Pagamentos:** Stripe
- **Jobs:** node-cron
- **Email:** Resend
- **Testes:** Vitest
