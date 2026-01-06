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
  // Regex para encontrar valores em reais
  const amountRegex = /R\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/g;
  const amounts: number[] = [];
  let match;

  while ((match = amountRegex.exec(text)) !== null) {
    const value = parseFloat(match[1].replace('.', '').replace(',', '.'));
    amounts.push(value);
  }

  // Regex para encontrar datas
  const dateRegex = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g;
  const dates: string[] = [];
  
  while ((match = dateRegex.exec(text)) !== null) {
    const [, day, month, year] = match;
    dates.push(`${year}-${month}-${day}`);
  }

  // Retornar dados extraídos
  return {
    amount: amounts.length > 0 ? Math.max(...amounts) : undefined,
    date: dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0],
    description: text.substring(0, 200).trim() || 'Despesa importada',
  };
}
