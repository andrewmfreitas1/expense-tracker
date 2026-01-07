# Guia de Testes Unitários

## 📋 Visão Geral

Este projeto utiliza **Jest** e **React Testing Library** para testes unitários, seguindo as melhores práticas da indústria.

## 🚀 Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Executar testes no CI/CD
npm run test:ci
```

## 📁 Estrutura de Testes

```
src/
├── components/
│   ├── Sidebar.tsx
│   ├── AnomalyAlerts.tsx
│   └── __tests__/
│       ├── Sidebar.test.tsx
│       └── AnomalyAlerts.test.tsx
├── app/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── __tests__/
│   │       └── page.test.tsx
│   ├── expenses/
│   │   ├── page.tsx
│   │   └── __tests__/
│   │       └── page.test.tsx
│   └── api/
│       ├── expenses/
│       │   ├── route.ts
│       │   └── __tests__/
│       │       └── route.test.ts
│       └── upload/
│           ├── route.ts
│           └── __tests__/
│               └── route.test.ts
└── __mocks__/
    ├── prisma.ts
    └── next-navigation.ts
```

## 🧪 Cobertura de Testes

### Componentes React
- ✅ **Sidebar** (18 testes)
  - Renderização de menu
  - Navegação e links
  - Menu mobile responsivo
  - Acessibilidade

- ✅ **AnomalyAlerts** (21 testes)
  - Detecção de anomalias
  - Cálculo de variações
  - Alertas visuais
  - Formatação de dados

### Páginas
- ✅ **Dashboard** (20 testes)
  - Carregamento de dados
  - Gráficos (barras, pizza, linha)
  - Alertas de anomalias
  - Cards de resumo

- ✅ **Expenses** (25 testes)
  - Listagem de despesas
  - Filtros (categoria e mês)
  - Exclusão de despesas
  - Exportação de dados

### API Routes
- ✅ **GET/POST /api/expenses** (22 testes)
  - Busca de despesas
  - Criação de despesas
  - Validações
  - Tratamento de erros

- ✅ **POST /api/upload** (15 testes)
  - Upload de arquivos
  - OCR de imagens
  - Parsing de PDF
  - Extração de valores

**Total: 121+ testes**

## 🎯 Metas de Cobertura

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  }
}
```

## 🛠️ Mocks Disponíveis

### Prisma Client
```typescript
import { mockPrisma } from '@/__mocks__/prisma';

// Uso em testes
mockPrisma.expense.findMany.mockResolvedValue([...]);
```

### Next.js Navigation
```typescript
import { useRouter, usePathname } from 'next/navigation';

// Já mockado automaticamente
```

### Fetch Global
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## 📝 Exemplos de Teste

### Componente React
```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### API Route
```typescript
import { GET } from '@/app/api/example/route';

describe('API /api/example', () => {
  it('deve retornar dados', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
```

### Teste com Mock
```typescript
import { mockPrisma } from '@/__mocks__/prisma';

it('deve buscar dados do banco', async () => {
  mockPrisma.expense.findMany.mockResolvedValue([
    { id: '1', amount: 100 },
  ]);
  
  const result = await fetchExpenses();
  expect(result).toHaveLength(1);
});
```

## ✅ Boas Práticas Implementadas

### 1. **Arrange-Act-Assert (AAA)**
```typescript
it('deve calcular total', () => {
  // Arrange (preparar)
  const expenses = [{ amount: 100 }, { amount: 200 }];
  
  // Act (executar)
  const total = calculateTotal(expenses);
  
  // Assert (verificar)
  expect(total).toBe(300);
});
```

### 2. **Testes Isolados**
- Cada teste limpa mocks: `beforeEach(() => jest.clearAllMocks())`
- Sem dependências entre testes
- Estado limpo para cada execução

### 3. **Testes Descritivos**
```typescript
it('deve retornar erro 400 quando amount está faltando', () => {
  // Teste claro e específico
});
```

### 4. **Cobertura de Edge Cases**
- Dados vazios
- Valores extremos
- Erros de rede
- Inputs inválidos

### 5. **Testes de Acessibilidade**
```typescript
it('deve ter elementos semânticos corretos', () => {
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### 6. **Mock de Bibliotecas Externas**
- Recharts (gráficos)
- Tesseract.js (OCR)
- pdf-parse
- Next.js navigation

### 7. **Testes Assíncronos**
```typescript
it('deve carregar dados', async () => {
  await waitFor(() => {
    expect(screen.getByText('Dados')).toBeInTheDocument();
  });
});
```

## 🔍 Verificando Cobertura

Após executar `npm run test:coverage`, abra:
```
coverage/lcov-report/index.html
```

### Métricas de Cobertura
- **Statements**: Linhas de código executadas
- **Branches**: Condições if/else testadas
- **Functions**: Funções chamadas
- **Lines**: Linhas testadas

## 🐛 Debug de Testes

### Ver output de componente
```typescript
import { render, screen } from '@testing-library/react';

const { debug } = render(<MyComponent />);
debug(); // Imprime HTML no console
```

### Testar apenas um arquivo
```bash
npm test Sidebar.test.tsx
```

### Testar apenas um caso
```typescript
it.only('deve testar apenas este', () => {
  // Apenas este teste será executado
});
```

## 📊 Relatórios

### Console
```bash
npm run test:coverage
```

### HTML
```bash
open coverage/lcov-report/index.html
```

### CI/CD
```bash
npm run test:ci
# Gera relatório para integração contínua
```

## 🔧 Configuração

### jest.config.js
- Configuração do Jest
- Mapeamento de módulos (@/)
- Threshold de cobertura

### jest.setup.js
- Configuração global
- Mocks de APIs do navegador
- Importação do @testing-library/jest-dom

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Padrões de Teste

### Nomenclatura
- Arquivos: `*.test.tsx` ou `*.test.ts`
- Describe blocks: Nome do componente/função
- It blocks: "deve + ação + resultado esperado"

### Organização
```typescript
describe('ComponentName', () => {
  describe('Feature 1', () => {
    it('deve comportamento 1', () => {});
    it('deve comportamento 2', () => {});
  });
  
  describe('Feature 2', () => {
    it('deve comportamento 3', () => {});
  });
});
```

## 🚨 Troubleshooting

### Erro: Cannot find module '@/...'
```bash
# Verificar jest.config.js moduleNameMapper
```

### Erro: IntersectionObserver is not defined
```bash
# Já configurado em jest.setup.js
```

### Erro: window.matchMedia is not a function
```bash
# Já configurado em jest.setup.js
```

## ✨ Próximos Passos

1. **Integração Contínua**
   - Adicionar GitHub Actions
   - Rodar testes em cada PR

2. **Testes E2E**
   - Playwright ou Cypress
   - Testar fluxos completos

3. **Testes de Performance**
   - React Testing Library performance
   - Lighthouse CI

4. **Snapshot Testing**
   - Componentes visuais
   - Estrutura de dados

---

**Desenvolvido com ❤️ seguindo as melhores práticas de teste**
