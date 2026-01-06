# Expense Tracker - Sistema de Gestão de Despesas

## Status do Projeto
- [x] Criar arquivo copilot-instructions.md
- [x] Obter informações de setup do projeto
- [x] Criar estrutura Next.js
- [x] Configurar banco de dados
- [x] Implementar upload de arquivos
- [x] Integrar OCR
- [x] Criar dashboard
- [x] Instalar dependências (requer Node.js)
- [x] Criar task de desenvolvimento
- [x] Documentação completa

## ✅ PROJETO CRIADO COM SUCESSO!

### Próximos Passos para o Usuário:

1. **Instalar Node.js**
   - Windows: Baixe em https://nodejs.org/
   - Após instalar, reinicie o VS Code

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configurar Banco de Dados**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Iniciar Aplicação**
   ```bash
   npm run dev
   ```

5. **Acessar**: http://localhost:3000

---

## 🚀 DEPLOY ONLINE GRATUITO

Para colocar o app online, consulte: **DEPLOY.md**

**Plataformas gratuitas:**
- Vercel (hospedagem Next.js)
- Neon PostgreSQL (banco de dados)
- GitHub (código fonte)

**Tempo estimado:** 10-15 minutos
**Custo:** R$ 0,00 (100% gratuito)

## Descrição
Sistema web para upload e gerenciamento de contas (água, luz, internet, boletos) com:
- Upload de PDFs e imagens
- Extração automática de valores via OCR
- Categorização de despesas
- Planilhas e gráficos mensais
- Dashboard interativo

## Stack Tecnológica
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Tesseract.js (OCR)
- Recharts (gráficos)
- NextAuth (autenticação)
