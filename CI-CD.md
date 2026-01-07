# 🚀 CI/CD e Deploy com Testes Automatizados

## ✅ Configuração Completa

Agora os testes **RODAM AUTOMATICAMENTE** antes de cada deploy!

## 📋 O que foi configurado?

### 1. **Script de Build Atualizado**
```json
"build": "npm run test:ci && prisma generate && next build"
```

✅ Os testes rodam **antes** do build  
✅ Se algum teste falhar, o deploy é **cancelado**  
✅ Build só acontece se todos os testes passarem

### 2. **GitHub Actions - 3 Workflows**

#### A. **tests.yml** - Testes em Múltiplas Versões
```yaml
Executa em: Push e Pull Request
Node versions: 18.x, 20.x
Tarefas:
  ✅ Roda testes unitários
  ✅ Gera relatório de cobertura
  ✅ Envia para Codecov
  ✅ Valida linter
```

#### B. **deploy.yml** - Pipeline de Deploy
```yaml
Executa em: Push na branch main
Etapas:
  1. ✅ Roda testes (obrigatório)
  2. ✅ Valida cobertura mínima (70%)
  3. ✅ Build da aplicação
  4. ✅ Deploy para Vercel
```

**⚠️ Deploy só acontece se:**
- Todos os testes passarem
- Cobertura >= 70%
- Build for bem-sucedido

#### C. **pr-check.yml** - Validação de Pull Request
```yaml
Executa em: Abertura de PR
Validações:
  ✅ Linter (ESLint)
  ✅ Type check (TypeScript)
  ✅ Testes unitários
  ✅ Comentário automático com cobertura
```

## 🔧 Como Ativar no Seu Projeto

### Passo 1: Enviar para GitHub
```bash
git add .
git commit -m "Add CI/CD with automated tests"
git push origin main
```

### Passo 2: Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**

Adicione os seguintes secrets:

```
DATABASE_URL = postgresql://...  (URL do Neon)
VERCEL_TOKEN = ...               (Token da Vercel)
VERCEL_ORG_ID = ...             (ID da organização Vercel)
VERCEL_PROJECT_ID = ...          (ID do projeto Vercel)
```

#### Como obter VERCEL_TOKEN:
1. Acesse: https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Copie o token

#### Como obter VERCEL_ORG_ID e VERCEL_PROJECT_ID:
```bash
npm i -g vercel
vercel login
vercel link
cat .vercel/project.json
```

### Passo 3: Ativar GitHub Actions

1. No GitHub, vá em **Actions**
2. Ative os workflows
3. Os testes rodarão automaticamente!

## 🎯 Fluxo de Trabalho

### Desenvolvimento Local
```bash
# Antes de commitar
npm test

# Ver cobertura
npm run test:coverage

# Watch mode (desenvolvimento)
npm run test:watch
```

### Pull Request
```
1. Criar PR
2. GitHub Actions roda:
   ✅ Linter
   ✅ Type check
   ✅ Testes
3. Comentário automático com cobertura
4. Revisor aprova
5. Merge para main
```

### Deploy Automático (Main Branch)
```
1. Push/Merge para main
2. GitHub Actions:
   ✅ Roda testes unitários
   ✅ Valida cobertura >= 70%
   ✅ Build da aplicação
   ✅ Deploy para Vercel
3. App online em 2-3 minutos! 🎉
```

## 📊 Badges no README

Adicione badges ao seu [README.md](README.md):

```markdown
![Tests](https://github.com/andrewmfreitas1/expense-tracker/actions/workflows/tests.yml/badge.svg)
![Deploy](https://github.com/andrewmfreitas1/expense-tracker/actions/workflows/deploy.yml/badge.svg)
[![codecov](https://codecov.io/gh/andrewmfreitas1/expense-tracker/branch/main/graph/badge.svg)](https://codecov.io/gh/andrewmfreitas1/expense-tracker)
```

## 🚨 Prevenção de Bugs em Produção

### Antes (SEM testes no deploy):
```
❌ Código com bug → Deploy → Produção quebrada 💥
```

### Agora (COM testes no deploy):
```
✅ Código → Testes falham → Deploy bloqueado → Bug não vai pra produção! 🛡️
```

## 🔍 Verificar Status dos Testes

### No GitHub:
- Vá em **Actions** para ver execuções
- Verde ✅ = Tudo OK
- Vermelho ❌ = Algo falhou

### Na Vercel:
- Builds só são criados se testes passarem
- Logs mostram execução dos testes

## ⚙️ Customizar Comportamento

### Desabilitar testes em build específico:
```bash
npm run build:skip-tests
```

### Ajustar threshold de cobertura:
Edite [jest.config.js](jest.config.js):
```javascript
coverageThreshold: {
  global: {
    branches: 80,    // Aumentar para 80%
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

### Rodar testes apenas em arquivos modificados:
```bash
npm test -- --onlyChanged
```

## 📈 Monitoramento Contínuo

### Codecov (Gratuito para projetos públicos):
1. Acesse: https://codecov.io
2. Conecte com GitHub
3. Selecione o repositório
4. Relatórios automáticos de cobertura!

### Métricas Importantes:
- **Coverage**: >= 70% (configurado)
- **Build Time**: ~2-3 minutos
- **Test Time**: ~30 segundos

## 🎓 Melhores Práticas

✅ **Nunca pule os testes**
```bash
# ❌ Evite
git push --no-verify

# ✅ Correto
git push
```

✅ **Teste localmente primeiro**
```bash
npm test
npm run build
```

✅ **Mantenha testes rápidos**
- Testes unitários < 5 segundos
- Suite completa < 1 minuto

✅ **Escreva testes para bugs**
1. Bug encontrado
2. Escreva teste que reproduz
3. Corrija o bug
4. Teste passa ✅

## 🆘 Troubleshooting

### "Tests failed in CI but pass locally"
```bash
# Use o mesmo comando do CI
npm run test:ci
```

### "Build is slow"
```bash
# Otimize testes
# Remova imports desnecessários
# Use mocks adequados
```

### "Coverage threshold not met"
```bash
# Veja quais arquivos não estão cobertos
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🎉 Resultado Final

Agora você tem:
- ✅ Testes rodando automaticamente no deploy
- ✅ Proteção contra bugs em produção
- ✅ Validação de cobertura de código
- ✅ Pipeline CI/CD profissional
- ✅ Deploy seguro e confiável

**Deploy bloqueado se:**
- ❌ Algum teste falhar
- ❌ Cobertura < 70%
- ❌ TypeScript errors
- ❌ ESLint errors

**Deploy autorizado apenas quando:**
- ✅ Todos os testes passarem
- ✅ Cobertura >= 70%
- ✅ Build bem-sucedido
- ✅ Sem erros de lint/type

---

**Agora seu código está protegido! 🛡️**
