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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // OCR simplificado - extrair de base64 ou usar serviço externo
    // Por enquanto, vamos fazer extração básica baseada no tipo de arquivo
    let extractedText = '';
    
    if (file.type.includes('image')) {
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
  
  const amounts: number[] = [];
  
  // Múltiplos padrões de regex para valores em reais
  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,           // R$ 1.234,56
    /R\$\s*(\d+,\d{2})/gi,                            // R$ 123,56
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,                   // 1.234,56
    /valor[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, // Valor: R$ 1.234,56
    /total[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi, // Total: R$ 1.234,56
    /(\d+,\d{2})/g,                                    // 123,56
  ];

  patterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const valueStr = match[1];
      const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));
      if (value > 0 && value < 1000000) { // Valores razoáveis
        amounts.push(value);
        console.log(`Padrão ${index + 1} encontrou: ${valueStr} = ${value}`);
      }
    }
  });

  // Remove duplicatas e ordena
  const uniqueAmounts = Array.from(new Set(amounts)).sort((a, b) => b - a);
  console.log('Todos os valores encontrados:', uniqueAmounts);

  // Regex para encontrar datas em diferentes formatos
  const dates: string[] = [];
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g,        // DD/MM/YYYY
    /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/g,        // YYYY/MM/DD
    /vencimento[:\s]+(\d{2})[\/\-](\d{2})[\/\-](\d{4})/gi, // Vencimento: DD/MM/YYYY
  ];

  datePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1].length === 4) {
        // YYYY/MM/DD
        dates.push(`${match[1]}-${match[2]}-${match[3]}`);
      } else {
        // DD/MM/YYYY
        dates.push(`${match[3]}-${match[2]}-${match[1]}`);
      }
    }
  });

  console.log('Datas encontradas:', dates);

  // Pegar o maior valor (geralmente é o valor total do boleto)
  const extractedAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : 100.00;
  
  const result = {
    amount: extractedAmount,
    date: dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0],
    description: text.length > 10 ? text.substring(0, 200).trim() : 'Despesa importada - ajuste os valores',
  };

  console.log('=== RESULTADO FINAL ===');
  console.log('Valor extraído:', result.amount);
  console.log('Data extraída:', result.date);
  console.log('======================');
  
  return result;
}
