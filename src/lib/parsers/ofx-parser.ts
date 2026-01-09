/**
 * Parser para extratos bancários no formato OFX (Open Financial Exchange)
 * Formato universal suportado pela maioria dos bancos
 */

import { ParsedTransaction } from './csv-parser';

interface OFXTransaction {
  TRNTYPE: string; // DEBIT, CREDIT, etc
  DTPOSTED: string; // Data
  TRNAMT: string; // Valor
  FITID: string; // ID único
  MEMO?: string; // Descrição
  NAME?: string; // Nome do beneficiário
}

/**
 * Parse arquivo OFX
 */
export async function parseOFX(content: string): Promise<ParsedTransaction[]> {
  const transactions: ParsedTransaction[] = [];
  
  // Normalizar line breaks
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Extrair todas as transações <STMTTRN>...</STMTTRN>
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  const matches = normalized.matchAll(transactionRegex);
  
  for (const match of matches) {
    const transactionBlock = match[1];
    
    try {
      const transaction = parseOFXTransaction(transactionBlock);
      transactions.push(transaction);
    } catch (error) {
      console.error('Erro ao processar transação OFX:', error);
      continue;
    }
  }
  
  return transactions;
}

/**
 * Parse bloco de uma transação OFX
 */
function parseOFXTransaction(block: string): ParsedTransaction {
  const data: Partial<OFXTransaction> = {};
  
  // Extrair campos
  const fields = ['TRNTYPE', 'DTPOSTED', 'TRNAMT', 'FITID', 'MEMO', 'NAME'];
  
  for (const field of fields) {
    const regex = new RegExp(`<${field}>([^<]+)`);
    const match = block.match(regex);
    if (match) {
      data[field as keyof OFXTransaction] = match[1].trim();
    }
  }
  
  // Validar campos obrigatórios
  if (!data.DTPOSTED || !data.TRNAMT) {
    throw new Error('Transação OFX inválida: faltando data ou valor');
  }
  
  // Converter data OFX (formato: YYYYMMDDHHMMSS ou YYYYMMDD)
  const dateStr = data.DTPOSTED.substring(0, 8); // YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Mês é 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day);
  
  // Converter valor
  const amount = parseFloat(data.TRNAMT);
  
  // Descrição (prioridade: NAME > MEMO)
  const description = data.NAME || data.MEMO || 'Transação sem descrição';
  
  // Tipo
  const type = amount < 0 ? 'debit' : 'credit';
  
  return {
    date,
    description,
    amount,
    type
  };
}

/**
 * Valida se conteúdo é OFX válido
 */
export function isValidOFX(content: string): boolean {
  return content.includes('<OFX>') || content.includes('OFXHEADER:');
}

/**
 * Extrai informações da conta do OFX
 */
export function extractAccountInfo(content: string): {
  bankId?: string;
  accountId?: string;
  accountType?: string;
} {
  const bankIdMatch = content.match(/<BANKID>([^<]+)/);
  const accountIdMatch = content.match(/<ACCTID>([^<]+)/);
  const accountTypeMatch = content.match(/<ACCTTYPE>([^<]+)/);
  
  return {
    bankId: bankIdMatch?.[1]?.trim(),
    accountId: accountIdMatch?.[1]?.trim(),
    accountType: accountTypeMatch?.[1]?.trim()
  };
}
