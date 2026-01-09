# Planejamento: Integração Open Finance
## Sistema de Importação Automática de Boletos e Despesas

---

## 📋 RESUMO EXECUTIVO

**Objetivo:** Implementar integração com Open Finance para importação automática de boletos, transações bancárias e despesas sem upload manual.

**Solução Escolhida:** Pluggy API (agregador Open Finance)

**Prazo Estimado:** 2-3 semanas

**Investimento Inicial:** R$ 0 (plano gratuito até 25 conexões)

---

## 🏗️ ARQUITETURA DE SEGURANÇA

### 1. Modelo de Segurança em Camadas

```
┌─────────────────────────────────────────────┐
│  Camada 1: Frontend (Next.js)               │
│  - Nenhum token armazenado                  │
│  - Apenas session cookies httpOnly          │
└─────────────────────────────────────────────┘
              ↓ HTTPS Only
┌─────────────────────────────────────────────┐
│  Camada 2: API Routes (Autenticada)        │
│  - Rate limiting                            │
│  - Validação de usuário                     │
│  - Logs de auditoria                        │
└─────────────────────────────────────────────┘
              ↓ Server-side
┌─────────────────────────────────────────────┐
│  Camada 3: Business Logic                  │
│  - Gerenciamento de consentimentos          │
│  - Criptografia de tokens                   │
│  - Validação de dados                       │
└─────────────────────────────────────────────┘
              ↓ Encrypted
┌─────────────────────────────────────────────┐
│  Camada 4: Banco de Dados                  │
│  - Tokens criptografados (AES-256-GCM)      │
│  - Dados sensíveis hasheados                │
│  - Backup automático                        │
└─────────────────────────────────────────────┘
              ↓ API Key
┌─────────────────────────────────────────────┐
│  Camada 5: Pluggy API (Externo)            │
│  - OAuth2 com bancos                        │
│  - Certificações Open Finance               │
│  - Ambiente homologado Banco Central        │
└─────────────────────────────────────────────┘
```

---

## 🔒 REQUISITOS DE SEGURANÇA

### 1. Armazenamento de Credenciais

**Problema:** Tokens de acesso bancário são extremamente sensíveis

**Solução:**
```typescript
// Criptografia AES-256-GCM
- Chave de criptografia: variável de ambiente (32 bytes)
- IV único por registro
- Tag de autenticação
- Rotação de chaves a cada 90 dias
```

**Schema Prisma:**
```prisma
model BankConnection {
  id                String    @id @default(cuid())
  userId            String
  itemId            String    // ID da conexão no Pluggy
  accessTokenEnc    String    // Token criptografado
  accessTokenIV     String    // IV para descriptografia
  accessTokenTag    String    // Tag de autenticação
  institutionName   String
  consentExpiresAt  DateTime
  lastSyncAt        DateTime?
  status            String    // ACTIVE, EXPIRED, REVOKED
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id])
  
  @@unique([userId, itemId])
  @@index([userId])
}

model ConsentLog {
  id            String   @id @default(cuid())
  userId        String
  action        String   // GRANTED, RENEWED, REVOKED
  itemId        String?
  institution   String?
  ipAddress     String
  userAgent     String
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

model SyncLog {
  id              String   @id @default(cuid())
  userId          String
  connectionId    String
  syncType        String   // BILLS, TRANSACTIONS, ACCOUNTS
  status          String   // SUCCESS, ERROR, PARTIAL
  itemsImported   Int      @default(0)
  errorMessage    String?
  duration        Int      // milissegundos
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### 2. Gerenciamento de Consentimentos (LGPD)

**Requisitos Legais:**
- ✅ Consentimento explícito e específico
- ✅ Possibilidade de revogação a qualquer momento
- ✅ Transparência sobre uso de dados
- ✅ Logs de todas as ações
- ✅ Expiração automática de acessos

**Implementação:**
```typescript
// Tela de consentimento com:
1. Lista clara de dados acessados
2. Prazo de validade (máx. 12 meses)
3. Finalidade específica
4. Direito de revogação
5. Checkbox de aceite
6. Timestamp de consentimento
```

### 3. Autenticação e Autorização

**Fluxo OAuth2 + NextAuth:**
```
1. Usuário clica "Conectar Banco"
2. Sistema verifica autenticação NextAuth
3. Redireciona para Pluggy Connect Widget
4. Usuário escolhe banco e autoriza
5. Pluggy retorna accessToken (servidor)
6. Sistema criptografa e armazena token
7. Inicia sincronização em background
8. Notifica usuário do sucesso
```

**Validações:**
- Usuário autenticado via NextAuth
- CSRF token em todas as requisições
- Rate limiting: 10 req/min por usuário
- IP whitelist para webhooks Pluggy

### 4. Comunicação Segura

**HTTPS Obrigatório:**
```javascript
// next.config.js
headers: [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
]
```

**API Routes Protegidas:**
```typescript
// Middleware padrão para rotas /api/open-finance/*
export async function validateRequest(req: Request) {
  // 1. Verificar sessão NextAuth
  const session = await getServerSession(authOptions);
  if (!session) throw new UnauthorizedError();
  
  // 2. Rate limiting
  await checkRateLimit(session.user.id);
  
  // 3. Validar CSRF
  await validateCsrfToken(req);
  
  // 4. Log de auditoria
  await logApiAccess(session.user.id, req);
  
  return session;
}
```

### 5. Criptografia de Dados

**Biblioteca:** `crypto` (Node.js nativo)

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, tag: string) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    KEY, 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 6. Variáveis de Ambiente Sensíveis

```bash
# .env.local (NUNCA commitar!)
PLUGGY_CLIENT_ID=seu_client_id
PLUGGY_CLIENT_SECRET=seu_client_secret
ENCRYPTION_KEY=chave_aleatoria_64_caracteres_hex
WEBHOOK_SECRET=secret_para_validar_webhooks

# Gerar chave de criptografia:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO

### FASE 1: Setup Inicial (2-3 dias)

**1.1 Cadastro Pluggy**
- [ ] Criar conta em https://pluggy.ai
- [ ] Obter credenciais sandbox
- [ ] Configurar ambiente de desenvolvimento
- [ ] Testar autenticação API

**1.2 Dependências**
```bash
npm install pluggy-sdk
npm install @types/node  # para crypto
```

**1.3 Variáveis de Ambiente**
```bash
# Adicionar ao .env.local
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=
ENCRYPTION_KEY=
WEBHOOK_SECRET=
```

**1.4 Schema Database**
```bash
# Criar migration
npx prisma migrate dev --name add_open_finance
```

---

### FASE 2: Infraestrutura de Segurança (3-4 dias)

**2.1 Módulo de Criptografia**
- [ ] Criar `lib/encryption.ts`
- [ ] Testes unitários de encrypt/decrypt
- [ ] Validação de integridade (auth tag)
- [ ] Tratamento de erros

**2.2 Middleware de Segurança**
- [ ] Rate limiting (express-rate-limit ou upstash)
- [ ] CSRF protection
- [ ] Validação de sessão
- [ ] Logs de auditoria

**2.3 Webhooks Seguros**
- [ ] Endpoint `/api/webhooks/pluggy`
- [ ] Validação de assinatura HMAC
- [ ] Processamento assíncrono
- [ ] Retry logic

---

### FASE 3: Integração Pluggy (4-5 dias)

**3.1 Serviço Pluggy**
```typescript
// lib/pluggy/client.ts
import { PluggyClient } from 'pluggy-sdk';

export const pluggy = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID!,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
});
```

**3.2 API Routes**

```typescript
// app/api/open-finance/connect/route.ts
POST /api/open-finance/connect
- Gera Connect Token para widget
- Retorna URL de autenticação

// app/api/open-finance/connections/route.ts
GET /api/open-finance/connections
- Lista conexões bancárias do usuário
- Status de cada conexão

// app/api/open-finance/sync/route.ts
POST /api/open-finance/sync
- Força sincronização manual
- Importa boletos e transações

// app/api/open-finance/revoke/route.ts
DELETE /api/open-finance/revoke/:connectionId
- Revoga consentimento
- Deleta tokens
- Log LGPD
```

**3.3 Background Jobs**
```typescript
// Sincronização automática diária
// Usar Vercel Cron ou node-cron

// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-open-finance",
    "schedule": "0 6 * * *"  // 6h da manhã
  }]
}
```

---

### FASE 4: Interface do Usuário (3-4 dias)

**4.1 Página de Conexões**
```
/app/open-finance/page.tsx
- Lista de bancos conectados
- Botão "Adicionar Banco"
- Status de sincronização
- Última atualização
- Botão de revogar
```

**4.2 Widget de Consentimento**
```typescript
// Componente modal com:
- Termos de consentimento LGPD
- Lista de dados acessados
- Prazo de validade
- Pluggy Connect Widget (iframe)
```

**4.3 Dashboard Atualizado**
```
- Badge "Importado automaticamente" em despesas
- Filtro: "Apenas importadas" vs "Uploadadas"
- Indicador de próxima sincronização
```

---

### FASE 5: Processamento de Dados (3-4 dias)

**5.1 Importação de Boletos**
```typescript
// lib/pluggy/import-bills.ts
async function importBills(connectionId: string) {
  // 1. Buscar bills do Pluggy
  const bills = await pluggy.fetchBills(itemId);
  
  // 2. Filtrar apenas novos
  const newBills = await filterNewBills(bills);
  
  // 3. Categorizar automaticamente
  const categorized = await autoCategorizeBills(newBills);
  
  // 4. Criar expenses no banco
  await createExpensesFromBills(categorized);
  
  // 5. Notificar usuário
  await notifyUser(userId, newBills.length);
}
```

**5.2 Categorização Automática**
```typescript
// Regras de mapeamento
const categoryMap = {
  'ELECTRICITY': 'Luz',
  'WATER': 'Água',
  'INTERNET': 'Internet',
  'PHONE': 'Telefone',
  'CREDIT_CARD': 'Cartão de Crédito',
  'RENT': 'Aluguel',
  'CONDOMINIUM': 'Condomínio'
};
```

**5.3 Detecção de Duplicatas**
```typescript
// Validar por:
- Código de barras do boleto
- Valor + data + categoria
- Evitar duplicação upload + importação
```

---

### FASE 6: Testes de Segurança (2-3 dias)

**6.1 Testes Unitários**
```typescript
// __tests__/lib/encryption.test.ts
- Encrypt/decrypt corretamente
- Falhar com chave errada
- Falhar com tag modificada
- Diferentes tamanhos de entrada
```

**6.2 Testes de Integração**
```typescript
// __tests__/api/open-finance.test.ts
- Conexão sem autenticação → 401
- Rate limiting → 429
- Token inválido → 403
- Webhook com assinatura inválida → 401
```

**6.3 Teste de Penetração**
```bash
# Checklist básico:
- [ ] SQL Injection (Prisma protege)
- [ ] XSS (React protege)
- [ ] CSRF token funciona
- [ ] Rate limiting efetivo
- [ ] Tokens expirados rejeitados
- [ ] Não é possível acessar dados de outro usuário
```

**6.4 Auditoria de Segurança**
```bash
npm audit
npm audit fix
```

---

### FASE 7: Documentação e Compliance (2 dias)

**7.1 Documentação Técnica**
- [ ] README com setup
- [ ] Diagrama de arquitetura
- [ ] Fluxo de dados
- [ ] Variáveis de ambiente

**7.2 Política de Privacidade (LGPD)**
```markdown
# Adicionar seção ao site:
- Dados coletados (Open Finance)
- Finalidade (gestão de despesas)
- Prazo de armazenamento
- Direito de acesso/exclusão
- Contato do DPO
```

**7.3 Termos de Consentimento**
```
Modal antes de conectar banco:
"Ao conectar sua conta bancária, você autoriza 
este sistema a acessar:
- Lista de boletos registrados
- Transações bancárias dos últimos 12 meses
- Dados de faturas de cartão de crédito

Finalidade: importação automática de despesas
Validade: 12 meses (renovável)
Você pode revogar a qualquer momento em Configurações"

[ ] Li e aceito os termos
```

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Vazamento de Tokens
**Mitigação:**
- Criptografia AES-256-GCM
- Tokens nunca no frontend
- Logs não contêm tokens
- Rotação periódica

### Risco 2: Acesso Não Autorizado
**Mitigação:**
- NextAuth obrigatório
- Rate limiting agressivo
- IP whitelist para webhooks
- CSRF protection

### Risco 3: Falha na Sincronização
**Mitigação:**
- Retry logic (3 tentativas)
- Fallback para upload manual
- Notificação de erros
- Logs detalhados

### Risco 4: Não Conformidade LGPD
**Mitigação:**
- Consentimento explícito
- Logs de todas as ações
- Revogação imediata
- Exclusão de dados ao cancelar

### Risco 5: Dependência de Terceiros (Pluggy)
**Mitigação:**
- Timeout de 30s em chamadas
- Fallback para modo offline
- Cache de dados críticos
- Monitoramento de uptime

---

## 📊 MONITORAMENTO E ALERTAS

### Métricas Chave
```typescript
// Dashboards para monitorar:
1. Taxa de sucesso de sincronizações
2. Tempo médio de sincronização
3. Número de tokens expirados
4. Erros de API Pluggy
5. Tentativas de acesso não autorizado
```

### Alertas Críticos
```
- Token de criptografia não encontrado → EMAIL IMEDIATO
- Taxa de erro > 10% → Slack/Email
- Webhook com assinatura inválida → Log de segurança
- Mais de 5 falhas de login → Possível ataque
```

---

## 💰 CUSTOS ESTIMADOS

### Desenvolvimento
- Tempo: 2-3 semanas (80-120 horas)
- Custo desenvolvedor: variável

### Operação (mensal)
- Pluggy Free: R$ 0 (até 25 conexões)
- Pluggy Starter: R$ 299/mês (até 100 conexões)
- Pluggy Growth: R$ 999/mês (até 1000 conexões)
- Database: R$ 0 (Neon free tier)
- Hosting: R$ 0 (Vercel free tier)

### ROI
- Economia de tempo: ~15min/usuário/semana
- Redução de erros: ~30% (sem OCR)
- Satisfação do usuário: +50%

---

## ✅ CHECKLIST FINAL

### Segurança
- [ ] Tokens criptografados com AES-256-GCM
- [ ] Chave de criptografia em variável de ambiente
- [ ] HTTPS obrigatório
- [ ] Rate limiting implementado
- [ ] CSRF protection
- [ ] Logs de auditoria
- [ ] Validação de webhooks
- [ ] Testes de segurança passando

### LGPD
- [ ] Consentimento explícito
- [ ] Política de privacidade atualizada
- [ ] Logs de consentimento
- [ ] Possibilidade de revogação
- [ ] Exclusão de dados ao revogar
- [ ] Expiração automática (12 meses)

### Funcionalidade
- [ ] Conexão com banco funcionando
- [ ] Importação de boletos
- [ ] Importação de transações
- [ ] Categorização automática
- [ ] Detecção de duplicatas
- [ ] Sincronização automática
- [ ] Notificações de novos boletos

### Qualidade
- [ ] Testes unitários > 80% cobertura
- [ ] Testes de integração passando
- [ ] Documentação completa
- [ ] Code review
- [ ] Performance < 3s por sincronização

### Deploy
- [ ] Variáveis de ambiente em produção
- [ ] Webhooks configurados
- [ ] Cron jobs ativos
- [ ] Monitoramento configurado
- [ ] Alertas configurados

---

## 📅 CRONOGRAMA SUGERIDO

```
Semana 1:
├─ Dia 1-2: Setup inicial + Schema banco
├─ Dia 3-4: Infraestrutura de segurança
└─ Dia 5: Integração Pluggy básica

Semana 2:
├─ Dia 1-2: API Routes completas
├─ Dia 3-4: Interface do usuário
└─ Dia 5: Processamento de dados

Semana 3:
├─ Dia 1-2: Testes de segurança
├─ Dia 3: Documentação
├─ Dia 4: Testes em sandbox
└─ Dia 5: Deploy e monitoramento

TOTAL: 15 dias úteis
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Aprovação do Planejamento**
   - Revisar arquitetura de segurança
   - Validar requisitos LGPD
   - Confirmar orçamento

2. **Setup Ambiente**
   - Criar conta Pluggy
   - Gerar chaves de criptografia
   - Configurar variáveis de ambiente

3. **Início da Implementação**
   - Criar branch `feature/open-finance`
   - Implementar Fase 1
   - Code review contínuo

---

## 📚 REFERÊNCIAS

- [Pluggy Documentation](https://docs.pluggy.ai)
- [Open Finance Brasil](https://openbankingbrasil.org.br)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)

---

**Pronto para começar? 🚀**
