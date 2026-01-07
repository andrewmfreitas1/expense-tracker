import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para processar

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    console.log('Arquivo recebido:', file.name, file.type, file.size);

    // Processar o arquivo em memória (Vercel não tem filesystem persistente)
    // Compatível com Node.js (Buffer) e Browser (File API)
    let buffer: Buffer;
    if (typeof file.arrayBuffer === 'function') {
      // Browser/File API compatible
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (file instanceof Buffer) {
      // NodeJS/multipart
      buffer = file;
    } else if ('buffer' in file) {
      // Some multer/file-api implementations
      buffer = Buffer.from((file as any).buffer);
    } else {
      throw new Error('Tipo de arquivo não suportado para processamento');
    }

    // Extrair texto baseado no tipo de arquivo
    let extractedText = '';
    
    if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      // Processar PDF
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        console.log('PDF processado - texto extraído:', extractedText.length, 'caracteres');
      } catch (pdfError) {
        console.error('Erro ao processar PDF:', pdfError);
        extractedText = '';
      }
    } else if (file.type.includes('image')) {
      // Para imagens, tentar extrair com Tesseract (se disponível)
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('por', 1, {
          logger: (m) => console.log(m),
        });
        
        // Converter buffer para formato que Tesseract aceita
        const { data: { text } } = await worker.recognize(buffer);
        extractedText = text;
        await worker.terminate();
        console.log('OCR concluído:', extractedText.substring(0, 100));
      } catch (ocrError) {
        console.error('Erro no OCR:', ocrError);
        // Se OCR falhar, continuar sem ele
        extractedText = '';
      }
    }

    // Extrair informações do texto
    const extracted = extractDataFromText(extractedText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      extracted,
      debug: {
        fileSize: file.size,
        fileType: file.type,
        textLength: extractedText.length,
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar arquivo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

function extractDataFromText(text: string) {
  console.log('=== INICIANDO EXTRAÇÃO DE DADOS ===');
  console.log('Texto completo recebido:', text);
  console.log('Tamanho do texto:', text.length);
  
  const amounts: { value: number; priority: number; match: string }[] = [];
  
  // Padrões com prioridade (maior = mais importante)
  const patterns = [
    { regex: /(?:valor\s+a\s+pagar|total\s+a\s+pagar|valor\s+total)[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, priority: 100 },
    { regex: /(?:vencimento|valor)[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, priority: 90 },
    { regex: /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, priority: 50 },
    { regex: /total[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, priority: 80 },
    { regex: /(\d{1,3}(?:\.\d{3})*,\d{2})/g, priority: 10 },
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const valueStr = match[1];
      const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));
      if (value > 0 && value < 1000000) {
        amounts.push({ 
          value, 
          priority: pattern.priority,
          match: match[0]
        });
        console.log(`Encontrado [prioridade ${pattern.priority}]: ${match[0]} = ${value}`);
      }
    }
  });

  // Ordena por prioridade (maior primeiro), depois por valor (maior primeiro)
  amounts.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.value - a.value;
  });

  console.log('Valores ordenados por prioridade:', amounts.map(a => `${a.value} (${a.priority})`));

  // Regex para datas com prioridade
  const dates: { date: string; priority: number }[] = [];
  const datePatterns = [
    { regex: /(?:VENCIMENTO|vencimento|Data\s+de\s+Vencimento|data\s+de\s+vencimento|Pagar\s+este\s+documento\s+até)[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/gi, priority: 100 },
    { regex: /(?:venc\.|VENC\.)[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/gi, priority: 95 },
    { regex: /(?:VENCIMENTO|vencimento)[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/gi, priority: 90 },
    { regex: /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g, priority: 50 },
    { regex: /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/g, priority: 40 },
  ];

  datePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      let dateStr;
      if (match[1].length === 4) {
        // YYYY/MM/DD
        dateStr = `${match[1]}-${match[2]}-${match[3]}`;
      } else if (match[3] && match[3].length === 4) {
        // DD/MM/YYYY
        dateStr = `${match[3]}-${match[2]}-${match[1]}`;
      } else if (match[3] && match[3].length === 2) {
        // DD/MM/YY - assumir 20XX
        const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
        dateStr = `${year}-${match[2]}-${match[1]}`;
      } else {
        continue;
      }
      
      dates.push({ date: dateStr, priority: pattern.priority });
      console.log(`Data encontrada [prioridade ${pattern.priority}]: ${match[0]}`);
    }
  });

  // Ordena por prioridade
  dates.sort((a, b) => b.priority - a.priority);

  // Pegar o valor e data com maior prioridade
  const extractedAmount = amounts.length > 0 ? amounts[0].value : 100.00;
  const extractedDate = dates.length > 0 ? dates[0].date : new Date().toISOString().split('T')[0];
  
  const result = {
    amount: extractedAmount,
    date: extractedDate,
    description: text.length > 10 ? text.substring(0, 200).trim() : 'Despesa importada - ajuste os valores',
  };

  console.log('=== RESULTADO FINAL ===');
  console.log('Valor extraído:', result.amount, amounts.length > 0 ? `(de: ${amounts[0].match})` : '');
  console.log('Data extraída:', result.date);
  console.log('======================');
  
  return result;
}
