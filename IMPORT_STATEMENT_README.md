# 📊 Importação de Extrato Bancário

## ✅ Implementado com Sucesso!

Sistema de importação de extratos bancários (CSV/OFX/PDF) com categorização automática e detecção de duplicatas.

---

## 🎯 Funcionalidades

### Upload de Arquivos
- ✅ CSV (Nubank, Inter, Itaú, Bradesco, C6)
- ✅ OFX (formato universal bancário)
- ✅ PDF (integrado com OCR existente)

### Processamento Automático
- ✅ Detecção automática do banco
- ✅ Categorização inteligente (14 categorias)
- ✅ Detecção de duplicatas
- ✅ Extração de data, valor, descrição

### Interface
- ✅ Preview de transações
- ✅ Resumo por categoria
- ✅ Validação de arquivo (tipo e tamanho)
- ✅ Feedback de importação

---

## 📁 Arquivos Criados

### Parsers
```
src/lib/parsers/
├── csv-parser.ts        # Parser para CSV (5 bancos)
├── ofx-parser.ts        # Parser OFX universal
└── statement-parser.ts  # Orquestrador principal
```

### Frontend
```
src/app/import-statement/
└── page.tsx             # UI de upload e preview
```

### Backend
```
src/app/api/import-statement/
└── route.ts             # Endpoint POST
```

### Navegação
```
src/components/
└── Sidebar.tsx          # + Link "Importar Extrato"
```

### Banco de Dados
```
prisma/schema.prisma     # + source: BANK_STATEMENT
prisma/migrations/       # + dueDate field
```

---

## 🏦 Bancos Suportados (CSV)

### 1. Nubank
```csv
date,category,amount,description
2024-01-15,alimentacao,-50.00,Mercado
```
- Delimitador: `,`
- Formato data: `YYYY-MM-DD`
- Decimal: `.`

### 2. Inter
```csv
Data;Descrição;Valor;Categoria
15/01/2024;Mercado;-50,00;Alimentação
```
- Delimitador: `;`
- Formato data: `DD/MM/YYYY`
- Decimal: `,`

### 3. Itaú
```csv
data;descricao;valor;tipo
15/01/2024;Mercado;-50,00;Débito
```
- Delimitador: `;`
- Formato data: `DD/MM/YYYY`
- Decimal: `,`

### 4. Bradesco
```csv
Data,Histórico,Valor,Tipo
15/01/2024,Mercado,-50.00,D
```
- Delimitador: `,`
- Formato data: `DD/MM/YYYY`
- Decimal: `.`

### 5. C6 Bank
```csv
Data;Descrição;Valor
15/01/2024;Mercado;-50,00
```
- Delimitador: `;`
- Formato data: `DD/MM/YYYY`
- Decimal: `,`

---

## 📋 Formato OFX (Universal)

Todos os bancos que exportam OFX são suportados:

```xml
<OFX>
  <BANKTRANLIST>
    <STMTTRN>
      <TRNTYPE>DEBIT</TRNTYPE>
      <DTPOSTED>20240115</DTPOSTED>
      <TRNAMT>-50.00</TRNAMT>
      <MEMO>Mercado</MEMO>
    </STMTTRN>
  </BANKTRANLIST>
</OFX>
```

---

## 🎨 Categorias Automáticas

| Categoria | Palavras-chave |
|-----------|----------------|
| **Luz** | luz, energia, eletric |
| **Água** | agua, saneamento, sabesp |
| **Internet** | internet, fibra, telecom, net, vivo, claro, tim |
| **Telefone** | telefone, celular, recarga, vivo, claro, tim, oi |
| **Gás** | gas, ultragaz, liquigas |
| **Aluguel** | aluguel, condominio, locacao |
| **Transporte** | uber, 99, combustivel, gasolina, estacionamento |
| **Alimentação** | mercado, supermercado, restaurante, ifood, rappi |
| **Saúde** | farmacia, drogaria, hospital, medic, laboratorio |
| **Educação** | escola, faculdade, curso, livro |
| **Lazer** | cinema, teatro, streaming, netflix, spotify |
| **Vestuário** | roupa, calcado, loja |
| **Seguros** | seguro, protecao |
| **Outros** | tudo que não se encaixa |

---

## 🚀 Como Usar

### 1. Baixe o Extrato do Banco

**Nubank:**
1. App Nubank → Extrato
2. Ícone de compartilhar (canto superior direito)
3. "Exportar extrato"
4. Escolha formato CSV

**Inter:**
1. Super App → Extrato
2. Filtrar período
3. "Exportar" → CSV

**Itaú:**
1. iToken → Contas → Extratos
2. Selecionar período
3. "Exportar para Excel" (CSV)

**Bradesco:**
1. Internet Banking → Consultas
2. Extrato de conta corrente
3. "Exportar" → CSV

**Outros Bancos:**
- Procure por "Exportar extrato" ou "Baixar OFX"
- OFX funciona com qualquer banco

### 2. Acesse a Aplicação

```
http://localhost:3000/import-statement
```

### 3. Faça Upload

- Arraste o arquivo OU clique em "Selecionar arquivo"
- Aguarde processamento
- Revise preview e resumo
- Clique em "Confirmar Importação"

### 4. Verifique em Despesas

```
http://localhost:3000/expenses
```

Transações aparecerão com:
- Badge "Importado automaticamente"
- Ícone de banco (Building2)
- Categoria atribuída
- Duplicatas ignoradas

---

## 🔍 Detecção de Duplicatas

Compara 3 campos para identificar duplicatas:
1. **Data** (mesmo dia)
2. **Valor** (mesmo montante)
3. **Descrição** (texto similar)

Se encontrar duplicata:
- ❌ Não importa novamente
- ℹ️ Mostra na mensagem de resultado

**Exemplo:**
```
Importadas: 45 transações
Total: 50 transações
Duplicatas: 5 ignoradas
```

---

## ⚙️ Configurações

### Tamanho Máximo
```typescript
// src/app/import-statement/page.tsx
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Formatos Aceitos
```typescript
const ACCEPTED_FORMATS = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/x-ofx',
  'application/pdf'
];
```

### Tipos de Transação
```typescript
// Apenas débitos são importados
if (transaction.amount < 0) {
  expenses.push(transaction);
}
```

---

## 🧪 Testes

```bash
npm test
```

**Cobertura:**
- Parsers: Pendente (próxima iteração)
- API: Pendente (próxima iteração)
- UI: Pendente (próxima iteração)

**Testes atuais:**
- ✅ 124 testes passando
- ⏭️ 2 skipped (Open Finance)

---

## 🐛 Troubleshooting

### Erro: "Formato não suportado"
**Causa:** Banco não reconhecido
**Solução:** Use OFX (universal) ou contate suporte

### Erro: "Arquivo muito grande"
**Causa:** Arquivo > 5MB
**Solução:** 
1. Reduza período do extrato
2. Divida em múltiplos arquivos

### Erro: "Nenhuma transação encontrada"
**Causa:** 
- Apenas créditos no período
- Formato CSV incompatível
**Solução:**
1. Verifique se há débitos
2. Tente exportar como OFX

### Transações não categorizadas
**Causa:** Descrição não contém palavras-chave
**Solução:**
1. Ficam em "Outros"
2. Edite manualmente em /expenses
3. OU adicione keywords em `csv-parser.ts`

---

## 🔐 Segurança

### Dados Locais
- ✅ Arquivos processados no servidor
- ✅ Não armazenados permanentemente
- ✅ Apenas transações salvas no banco

### Privacidade
- ✅ Sem tokens bancários (diferente de Open Finance)
- ✅ Dados ficam apenas no seu banco Neon
- ✅ Nenhum serviço terceiro

### LGPD
- ✅ Usuário controla seus dados
- ✅ Pode deletar despesas
- ✅ Exportação disponível (TODO)

---

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas)
- [ ] Testes para parsers
- [ ] Testes para API
- [ ] Exportar despesas (CSV/OFX)
- [ ] Edição em lote

### Médio Prazo (1 mês)
- [ ] Adicionar mais bancos CSV
- [ ] Importação programada (cron)
- [ ] Notificações de despesas altas
- [ ] Relatórios mensais

### Longo Prazo (3+ meses)
- [ ] Open Finance automático (se viável)
- [ ] Machine Learning para categorização
- [ ] Detecção de anomalias
- [ ] Orçamento por categoria

---

## 📊 Comparação: Manual vs Open Finance

| Feature | Upload Manual | Open Finance |
|---------|---------------|--------------|
| **Custo** | R$ 0 | R$ 3-5/usuário/mês |
| **Setup** | ✅ Pronto | ⏳ Sandbox disponível |
| **Automático** | ❌ Manual | ✅ Automático |
| **Bancos** | Todos (CSV/OFX) | Depende do agregador |
| **Segurança** | ✅ Dados locais | ⚠️ Requer tokens |
| **Manutenção** | ✅ Baixa | ⚠️ Alta (APIs mudam) |

**Recomendação:** 
- 0-100 usuários: **Upload Manual**
- 100-1000 usuários: **Open Finance Sandbox** (testes)
- 1000+ usuários: **Open Finance Produção** (R$ 3k-5k/mês)

---

## 💡 Dicas

### Performance
- Limite extratos a 3 meses por vez
- CSV é mais rápido que PDF (OCR)
- OFX é mais confiável que CSV

### UX
- Instrua usuários a exportar mensalmente
- Crie templates por banco (prints)
- Adicione FAQ na UI

### Manutenção
- Log de importações
- Métricas: quantos usam? quais bancos?
- Feedback para adicionar novos bancos

---

## 📞 Suporte

**Código:**
- `src/lib/parsers/` - Lógica de parsing
- `src/app/import-statement/` - UI
- `src/app/api/import-statement/` - Backend

**Documentação:**
- `OPEN_FINANCE_FREE.md` - Alternativas gratuitas
- `README.md` - Setup geral

**Contato:**
- GitHub Issues (TODO: adicionar link)
- Email (TODO: adicionar)

---

**Última Atualização:** 09/01/2026  
**Versão:** 1.0.0  
**Status:** ✅ Produção
