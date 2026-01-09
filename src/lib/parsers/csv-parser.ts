/**
 * Parser para extratos bancários CSV
 * Suporta formatos de: Nubank, Inter, Itaú, Bradesco, C6, etc
 */

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number; // Positivo = entrada, Negativo = saída
  category?: string;
  type: 'debit' | 'credit';
}

interface CSVParserConfig {
  delimiter: string;
  dateColumn: string | number;
  descriptionColumn: string | number;
  amountColumn: string | number;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
}

// Configurações por banco
const BANK_CONFIGS: Record<string, CSVParserConfig> = {
  nubank: {
    delimiter: ',',
    dateColumn: 0, // primeira coluna
    descriptionColumn: 2,
    amountColumn: 1,
    dateFormat: 'YYYY-MM-DD'
  },
  inter: {
    delimiter: ',',
    dateColumn: 'Data',
    descriptionColumn: 'Descrição',
    amountColumn: 'Valor',
    dateFormat: 'DD/MM/YYYY'
  },
  itau: {
    delimiter: ';',
    dateColumn: 'data',
    descriptionColumn: 'descricao',
    amountColumn: 'valor',
    dateFormat: 'DD/MM/YYYY'
  },
  bradesco: {
    delimiter: ';',
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    dateFormat: 'DD/MM/YYYY'
  },
  c6: {
    delimiter: ',',
    dateColumn: 'Data da transação',
    descriptionColumn: 'Descrição',
    amountColumn: 'Valor',
    dateFormat: 'DD/MM/YYYY'
  }
};

/**
 * Detecta banco automaticamente pelo conteúdo do CSV
 */
function detectBank(content: string): string | null {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('nubank') || lowerContent.match(/\d{4}-\d{2}-\d{2}/)) {
    return 'nubank';
  }
  if (lowerContent.includes('inter') || lowerContent.includes('banco inter')) {
    return 'inter';
  }
  if (lowerContent.includes('itaú') || lowerContent.includes('itau')) {
    return 'itau';
  }
  if (lowerContent.includes('bradesco')) {
    return 'bradesco';
  }
  if (lowerContent.includes('c6 bank') || lowerContent.includes('c6')) {
    return 'c6';
  }
  
  return null;
}

/**
 * Converte string de data para Date
 */
function parseDate(dateStr: string, format: string): Date {
  const cleaned = dateStr.trim();
  
  if (format === 'YYYY-MM-DD') {
    return new Date(cleaned);
  }
  
  if (format === 'DD/MM/YYYY') {
    const [day, month, year] = cleaned.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === 'MM/DD/YYYY') {
    const [month, day, year] = cleaned.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return new Date(cleaned);
}

/**
 * Converte string de valor para número
 */
function parseAmount(amountStr: string): number {
  // Remove símbolos de moeda e espaços
  let cleaned = amountStr
    .replace(/R\$|USD|\$|€/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // Detecta se usa vírgula ou ponto como decimal
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasComma && hasDot) {
    // Formato brasileiro: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // Formato brasileiro sem milhares: 1234,56
    cleaned = cleaned.replace(',', '.');
  }
  // Senão, já está no formato correto: 1234.56
  
  return parseFloat(cleaned);
}

/**
 * Parse CSV genérico
 */
export async function parseCSV(
  content: string,
  bankName?: string
): Promise<ParsedTransaction[]> {
  const detectedBank = bankName || detectBank(content);
  
  if (!detectedBank || !BANK_CONFIGS[detectedBank]) {
    throw new Error(
      `Banco não suportado. Formatos aceitos: ${Object.keys(BANK_CONFIGS).join(', ')}`
    );
  }
  
  const config = BANK_CONFIGS[detectedBank];
  const lines = content.split('\n').filter(line => line.trim());
  
  // Primeira linha pode ser header
  const hasHeader = isNaN(parseFloat(lines[0].split(config.delimiter)[0]));
  const startLine = hasHeader ? 1 : 0;
  
  const transactions: ParsedTransaction[] = [];
  
  // Se tem header, mapear nomes de colunas
  let columnMap: Record<string, number> = {};
  if (hasHeader) {
    const headers = lines[0].split(config.delimiter).map(h => h.trim().toLowerCase());
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });
  }
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(config.delimiter);
    
    try {
      // Pegar índice da coluna
      const getColumnIndex = (col: string | number): number => {
        if (typeof col === 'number') return col;
        return columnMap[col.toLowerCase()] ?? -1;
      };
      
      const dateIdx = getColumnIndex(config.dateColumn);
      const descIdx = getColumnIndex(config.descriptionColumn);
      const amountIdx = getColumnIndex(config.amountColumn);
      
      if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
        console.warn(`Linha ${i + 1}: colunas não encontradas`);
        continue;
      }
      
      const dateStr = columns[dateIdx]?.trim();
      const description = columns[descIdx]?.trim();
      const amountStr = columns[amountIdx]?.trim();
      
      if (!dateStr || !description || !amountStr) {
        continue;
      }
      
      const date = parseDate(dateStr, config.dateFormat);
      const amount = parseAmount(amountStr);
      
      transactions.push({
        date,
        description,
        amount,
        type: amount < 0 ? 'debit' : 'credit'
      });
    } catch (error) {
      console.error(`Erro ao processar linha ${i + 1}:`, error);
      continue;
    }
  }
  
  return transactions;
}

/**
 * Categoriza transação automaticamente
 */
export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  
  // Energia
  if (desc.includes('enel') || desc.includes('cemig') || desc.includes('light') || 
      desc.includes('copel') || desc.includes('eletropaulo')) {
    return 'Luz';
  }
  
  // Água
  if (desc.includes('sabesp') || desc.includes('cedae') || desc.includes('sanepar') ||
      desc.includes('água') || desc.includes('agua')) {
    return 'Água';
  }
  
  // Internet/TV
  if (desc.includes('vivo') || desc.includes('claro') || desc.includes('tim') ||
      desc.includes('oi') || desc.includes('net') || desc.includes('sky')) {
    return 'Internet';
  }
  
  // Streaming
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon prime') ||
      desc.includes('disney') || desc.includes('youtube premium')) {
    return 'Assinaturas';
  }
  
  // Mercado
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('extra') ||
      desc.includes('carrefour') || desc.includes('pão de açúcar')) {
    return 'Alimentação';
  }
  
  // Restaurante
  if (desc.includes('restaurante') || desc.includes('ifood') || desc.includes('rappi') ||
      desc.includes('uber eats') || desc.includes('delivery')) {
    return 'Alimentação';
  }
  
  // Farmácia
  if (desc.includes('farmácia') || desc.includes('farmacia') || desc.includes('drogaria') ||
      desc.includes('droga') || desc.includes('pague menos')) {
    return 'Saúde';
  }
  
  // Gasolina
  if (desc.includes('posto') || desc.includes('shell') || desc.includes('ipiranga') ||
      desc.includes('petrobras') || desc.includes('br distribuidora')) {
    return 'Transporte';
  }
  
  // Uber/99
  if (desc.includes('uber') || desc.includes('99') || desc.includes('cabify')) {
    return 'Transporte';
  }
  
  return 'Outros';
}
