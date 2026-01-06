import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createWorker } from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Extrair texto usando OCR (para imagens)
    let extractedText = '';
    
    if (file.type.includes('image')) {
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(filePath);
      extractedText = text;
      await worker.terminate();
    } else if (file.type.includes('pdf')) {
      // Para PDFs, seria necessário uma biblioteca como pdf-parse
      // Por enquanto, vamos retornar dados simulados
      extractedText = 'PDF processing - simulado';
    }

    // Extrair informações do texto
    const extracted = extractDataFromText(extractedText);

    return NextResponse.json({
      success: true,
      fileName,
      filePath: `/uploads/${fileName}`,
      extracted,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
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
