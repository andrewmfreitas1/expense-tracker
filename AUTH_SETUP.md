# 🔐 Sistema de Autenticação

## Setup Inicial

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados (obtenha em https://neon.tech)
DATABASE_URL="postgresql://usuario:senha@host:5432/database"

# NextAuth - Gere a secret com:
# npx openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### 2. Rodar Migração do Banco de Dados

```bash
npx prisma migrate dev --name add_auth_models
npx prisma generate
```

### 3. Iniciar Aplicação

```bash
npm run dev
```

## Funcionalidades de Autenticação

### ✅ Implementado

- **Registro de Usuários**
  - Validação de email único
  - Senha mínima de 6 caracteres
  - Hash seguro com bcrypt (12 rounds)
  
- **Login Seguro**
  - Credenciais (email + senha)
  - Verificação de senha com bcrypt
  - Sessões JWT
  
- **Proteção de Rotas**
  - Middleware protege: `/dashboard`, `/expenses`, `/upload`
  - Redirecionamento automático para `/login`
  
- **Gestão de Sessão**
  - Informações do usuário na sidebar
  - Botão de logout
  - Auto-refresh após login
  
- **Isolamento de Dados**
  - Cada usuário vê apenas suas próprias despesas
  - Verificação de ownership em operações de delete
  - Queries filtradas por `userId`

### 🔒 Segurança

| Recurso | Status | Descrição |
|---------|--------|-----------|
| Password Hashing | ✅ | Bcrypt com 12 salt rounds |
| JWT Sessions | ✅ | Tokens assinados com secret |
| Protected Routes | ✅ | Middleware NextAuth |
| User Isolation | ✅ | Queries com userId filter |
| HTTPS Only | ✅ | Cookies secure em produção |
| Authorization | ✅ | 401/403 HTTP codes |

## Endpoints da API

### Autenticação

```typescript
// Registro
POST /api/register
Body: { name?: string, email: string, password: string }
Response: { user: {...}, message: "Usuário criado" }

// Login (NextAuth)
POST /api/auth/callback/credentials
Body: { email: string, password: string }
Response: Session com tokens

// Logout
POST /api/auth/signout
```

### Despesas (Protegidas)

```typescript
// Listar (apenas do usuário logado)
GET /api/expenses
Headers: { Cookie: session-token }
Response: Expense[]

// Criar
POST /api/expenses
Headers: { Cookie: session-token }
Body: { amount, category, date, description }

// Deletar (apenas próprias despesas)
DELETE /api/expenses/[id]
Headers: { Cookie: session-token }
```

## Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth routes
│   │   ├── register/            # User registration
│   │   ├── expenses/            # Protected expense endpoints
│   │   └── upload/              # Protected upload endpoint
│   ├── login/                   # Login/Register page
│   └── layout.tsx               # SessionProvider wrapper
├── lib/
│   └── auth.ts                  # NextAuth configuration
├── components/
│   ├── AuthProvider.tsx         # Client session provider
│   └── Sidebar.tsx              # User info + logout
├── middleware.ts                # Route protection
└── types/
    └── next-auth.d.ts           # TypeScript types

prisma/
└── schema.prisma                # User, Account, Session models
```

## Testes Locais

```bash
# 1. Criar usuário de teste
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'

# 2. Fazer login via navegador
# Acesse: http://localhost:3000/login

# 3. Criar despesa (após login)
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-token" \
  -d '{"amount":100,"category":"Luz","date":"2026-01-07"}'
```

## Deploy no Vercel

### Variáveis de Ambiente Necessárias

No dashboard da Vercel, adicione:

```
DATABASE_URL = sua-url-postgresql-production
NEXTAUTH_URL = https://seu-app.vercel.app
NEXTAUTH_SECRET = sua-chave-secreta-production
```

### Comandos de Deploy

```bash
# O Vercel roda automaticamente:
npm run build  # Já configurado sem testes
npx prisma generate
npx prisma migrate deploy  # Em produção
```

## Migração de Dados Existentes

Se você já tinha despesas sem usuário:

```sql
-- 1. Criar usuário admin
INSERT INTO "User" (id, email, name, password, "createdAt", "updatedAt")
VALUES ('admin-id', 'admin@example.com', 'Admin', 'hash-aqui', NOW(), NOW());

-- 2. Atualizar despesas órfãs
UPDATE "Expense"
SET "userId" = 'admin-id'
WHERE "userId" IS NULL;
```

## Troubleshooting

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "NEXTAUTH_SECRET missing"
```bash
npx openssl rand -base64 32
# Adicione ao .env
```

### Erro: "Email já existe"
- Use email diferente ou delete usuário existente no banco

### Sessão não persiste
- Verifique se `NEXTAUTH_URL` está correto
- Em produção, deve ser HTTPS

## Próximos Passos (Opcional)

- [ ] Verificação de email
- [ ] Reset de senha
- [ ] OAuth (Google, GitHub)
- [ ] Two-Factor Authentication (2FA)
- [ ] Rate limiting em login
- [ ] Audit log de logins
