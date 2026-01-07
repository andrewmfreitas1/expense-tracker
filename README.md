# 💰 Expense Tracker - Sistema de Gestão de Despesas

Sistema web completo para upload, gerenciamento e acompanhamento de despesas mensais com extração automática de dados usando OCR.

## 🚀 Funcionalidades

- 🔐 **Autenticação Segura**: Login/registro com NextAuth.js e bcrypt
- ✅ **Upload de Arquivos**: Faça upload de PDFs e imagens (JPG, PNG) de contas e boletos
- 🤖 **Extração Automática**: OCR (Tesseract.js) extrai valores e datas automaticamente
- 📊 **Dashboard Interativo**: Visualize gráficos de barras, pizza e linha
- 📈 **Análise Mensal**: Acompanhe gastos mês a mês
- 🏷️ **Categorização**: Organize despesas por categoria (água, luz, internet, etc.)
- 📋 **Listagem Completa**: Visualize todas as despesas com filtros
- 💾 **Exportação**: Exporte dados para CSV
- 👤 **Dados Privados**: Cada usuário vê apenas suas próprias despesas
- 🎨 **Interface Moderna**: Design responsivo com Tailwind CSS

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Autenticação**: NextAuth.js com bcrypt
- **Estilização**: Tailwind CSS
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **OCR**: Tesseract.js
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Formatação de Datas**: date-fns
- **Segurança**: Password hashing (12 rounds), JWT sessions, protected routes

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)

### Instalando Node.js

**Windows:**
1. Baixe o instalador em: https://nodejs.org/
2. Execute o instalador e siga as instruções
3. Verifique a instalação:
```bash
node --version
npm --version
```

**macOS (usando Homebrew):**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

## 🔧 Instalação e Configuração

### 1. Clone o repositório (ou use o diretório atual)
```bash
# Se ainda não estiver no diretório do projeto
cd c:\repo\pessoal
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:5432/database"

# Autenticação NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-com-comando-abaixo"
```

Gere a secret:
```bash
npx openssl rand -base64 32
```

### 4. Configure o banco de dados
```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Criar o banco de dados e executar migrations
npm run prisma:migrate
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3000**

### 6. Primeiro Acesso

1. Acesse: http://localhost:3000/login
2. Clique em "Registro" e crie sua conta
3. Faça login e comece a usar!

📚 **Documentação completa de autenticação**: Veja [AUTH_SETUP.md](AUTH_SETUP.md)

## 📁 Estrutura do Projeto

```
c:\repo\pessoal\
├── .github/
│   └── copilot-instructions.md    # Instruções do projeto
├── prisma/
│   └── schema.prisma              # Schema do banco de dados
├── public/
│   └── uploads/                   # Arquivos enviados (criado automaticamente)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── expenses/          # API de despesas
│   │   │   │   ├── route.ts       # GET e POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # DELETE
│   │   │   └── upload/
│   │   │       └── route.ts       # Upload e OCR
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard com gráficos
│   │   ├── expenses/
│   │   │   └── page.tsx           # Listagem de despesas
│   │   ├── upload/
│   │   │   └── page.tsx           # Página de upload
│   │   ├── globals.css            # Estilos globais
│   │   ├── layout.tsx             # Layout principal
│   │   └── page.tsx               # Página inicial
│   └── lib/
│       └── prisma.ts              # Cliente Prisma
├── .eslintrc.json                 # Configuração ESLint
├── .gitignore                     # Arquivos ignorados pelo Git
├── next.config.js                 # Configuração Next.js
├── package.json                   # Dependências do projeto
├── postcss.config.js              # Configuração PostCSS
├── tailwind.config.ts             # Configuração Tailwind
├── tsconfig.json                  # Configuração TypeScript
└── README.md                      # Este arquivo
```

## 🎯 Como Usar

### 1. Página Inicial
- Acesse http://localhost:3000
- Escolha entre Upload, Dashboard ou Despesas

### 2. Upload de Contas
- Clique em "Upload"
- Selecione um arquivo PDF ou imagem
- Clique em "Processar Arquivo"
- O sistema extrairá automaticamente valores e datas
- Confirme ou edite as informações
- Selecione a categoria
- Clique em "Salvar Despesa"

### 3. Dashboard
- Visualize gráficos de:
  - Despesas mensais (gráfico de barras)
  - Despesas por categoria (gráfico de pizza)
  - Tendência de gastos (gráfico de linha)
- Veja cards com totais e médias

### 4. Listagem de Despesas
- Visualize todas as despesas em tabela
- Filtre por categoria e mês
- Exporte para CSV
- Delete despesas individuais

## 🗄️ Banco de Dados

O projeto usa SQLite com Prisma ORM. O schema inclui:

### Models:
- **User**: Usuários do sistema
- **Expense**: Despesas cadastradas
- **Category**: Categorias de despesas

### Comandos Úteis do Prisma:
```bash
# Ver banco de dados visualmente
npm run prisma:studio

# Criar nova migration
npm run prisma:migrate

# Resetar banco de dados
npx prisma migrate reset
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build           # Compila o projeto para produção
npm run start           # Inicia servidor de produção

# Linting
npm run lint            # Executa ESLint

# Prisma
npm run prisma:generate # Gera o cliente Prisma
npm run prisma:migrate  # Executa migrations
npm run prisma:studio   # Abre interface visual do banco
```

## 🎨 Categorias de Despesas

O sistema suporta as seguintes categorias:
- 💧 Água
- 💡 Luz
- 🌐 Internet
- 📱 Telefone
- 🏠 Aluguel
- 🏢 Condomínio
- 📦 Outros

## 🤖 Como Funciona o OCR

O sistema usa **Tesseract.js** para extrair texto de imagens:

1. Arquivo é enviado via upload
2. Tesseract processa a imagem
3. Regex extrai valores monetários (R$ XX,XX)
4. Regex extrai datas (DD/MM/AAAA)
5. Sistema retorna os dados para confirmação
6. Usuário pode editar antes de salvar

**Suporte:**
- ✅ Imagens: JPG, JPEG, PNG
- ⚠️ PDF: Implementação básica (recomenda-se converter para imagem)

## 🚧 Próximos Passos / Melhorias

- [ ] Implementar autenticação (NextAuth)
- [ ] Melhorar extração de dados de PDFs
- [ ] Adicionar mais categorias personalizáveis
- [ ] Implementar notificações de vencimento
- [ ] Adicionar comparação entre meses
- [ ] Criar relatórios em PDF
- [ ] Implementar modo escuro
- [ ] Adicionar suporte a múltiplos idiomas

## � Deploy Gratuito Online

Quer colocar seu app na internet? Veja o guia completo em [DEPLOY.md](DEPLOY.md)

**Resumo rápido:**
1. Crie conta no GitHub e suba o código
2. Crie banco PostgreSQL gratuito no Neon (https://neon.tech)
3. Faça deploy na Vercel (https://vercel.com)
4. Configure a variável `DATABASE_URL`
5. Seu app estará online! 🎉

**Plataformas 100% gratuitas:**
- ✅ Vercel (hospedagem)
- ✅ Neon PostgreSQL (banco de dados)
- ✅ 100GB banda/mês
- ✅ Domínio .vercel.app incluído

---

## �🐛 Troubleshooting

### Erro: "npx não é reconhecido"
- **Solução**: Instale o Node.js (veja seção de pré-requisitos)

### Erro: "Module not found"
- **Solução**: Execute `npm install` novamente

### Erro no Prisma
- **Solução**: Execute:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Porta 3000 em uso
- **Solução**: Mude a porta ou libere a porta 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### OCR não funciona corretamente
- **Solução**: 
  - Certifique-se que a imagem está nítida
  - Tente aumentar o contraste
  - Converta PDF para imagem de alta qualidade

## 📝 Licença

Este projeto é de código aberto e está disponível para uso pessoal e comercial.

## � Deploy e CI/CD

### Integração Contínua
- **GitHub Actions** roda testes automaticamente em cada push e PR
- Workflows configurados:
  - `tests.yml` - Executa suite completa de testes
  - `pr-check.yml` - Valida Pull Requests

### Deploy Automático
- **Vercel** realiza deploy automático a cada commit na branch `main`
- Integração nativa GitHub ↔ Vercel
- Preview deployments para cada PR
- Sem necessidade de configurar secrets ou workflows adicionais

📖 Guia completo: [DEPLOY.md](DEPLOY.md)

## �👤 Autor

Sistema desenvolvido para gerenciamento pessoal de despesas.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer um fork do projeto
2. Criar uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abrir um Pull Request

## 📞 Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Consulte a documentação do Next.js: https://nextjs.org/docs
- Documentação do Prisma: https://www.prisma.io/docs

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Tailwind CSS**
