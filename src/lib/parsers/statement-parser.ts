/**
 * Parser principal que detecta formato e delega para parser específico
 */

import { parseCSV, categorizeTransaction, type ParsedTransaction } from './csv-parser';
import { parseOFX, isValidOFX } from './ofx-parser';

export type { ParsedTransaction };

export interface ProcessedStatement {
  transactions: ParsedTransaction[];
  format: 'csv' | 'ofx' | 'pdf';
  bankName?: string;
  accountInfo?: {
    bankId?: string;
    accountId?: string;
  };
}

/**
 * Processa arquivo de extrato bancário
 */
export async function parseStatement(
  file: File
): Promise<ProcessedStatement> {
  const content = await file.text();
  const format = detectFormat(file, content);
  
  let transactions: ParsedTransaction[];
  let bankName: string | undefined;
  
  switch (format) {
    case 'ofx':
      transactions = await parseOFX(content);
      break;
      
    case 'csv':
      transactions = await parseCSV(content);
      break;
      
    case 'pdf':
      throw new Error('Formato PDF deve ser processado via OCR endpoint');
      
    default:
      throw new Error('Formato de arquivo não suportado');
  }
  
  // Categorizar transações
  transactions = transactions.map(t => ({
    ...t,
    category: t.category || categorizeTransaction(t.description)
  }));
  
  return {
    transactions,
    format,
    bankName
  };
}

/**
 * Detecta formato do arquivo
 */
function detectFormat(file: File, content: string): 'csv' | 'ofx' | 'pdf' {
  // Por extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (extension === 'ofx' || extension === 'qfx') {
    return 'ofx';
  }
  
  // Por conteúdo
  if (isValidOFX(content)) {
    return 'ofx';
  }
  
  // Default: CSV
  return 'csv';
}

/**
 * Valida se arquivo é suportado
 */
export function isValidStatementFile(file: File): boolean {
  const validExtensions = ['csv', 'ofx', 'qfx', 'pdf'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Filtra apenas despesas (débitos)
 */
export function filterExpenses(
  transactions: ParsedTransaction[]
): ParsedTransaction[] {
  return transactions.filter(t => t.type === 'debit');
}

/**
 * Agrupa transações por categoria
 */
export function groupByCategory(
  transactions: ParsedTransaction[]
): Record<string, ParsedTransaction[]> {
  return transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(transaction);
    return acc;
  }, {} as Record<string, ParsedTransaction[]>);
}

/**
 * Calcula totais por categoria
 */
export function calculateTotals(
  transactions: ParsedTransaction[]
): Record<string, number> {
  const grouped = groupByCategory(transactions);
  
  return Object.entries(grouped).reduce((acc, [category, items]) => {
    acc[category] = items.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    return acc;
  }, {} as Record<string, number>);
}
