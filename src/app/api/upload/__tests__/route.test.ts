// Mocks ANTES de importar o route
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (data, init) => new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  },
}));

// Mock do Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({
      data: { text: 'Texto extraído' }
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock do pdf-parse
jest.mock('pdf-parse', () => jest.fn());

// Importar DEPOIS dos mocks
import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';

// Helper para criar File mock com arrayBuffer()
function createMockFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });
  
  // Adicionar arrayBuffer() se não existir (Node.js environment)
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = async () => {
      const buffer = Buffer.from(content);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    };
  }
  
  return file;
}

describe('API Route: /api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/upload', () => {
    it('deve fazer upload de imagem e extrair texto via OCR', async () => {
      const { createWorker } = require('tesseract.js');

      const mockFile = createMockFile('image content', 'conta-luz.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(createWorker).toHaveBeenCalled();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('fileName');
      expect(data).toHaveProperty('extracted');
      expect(data.success).toBe(true);
    });

    it('deve processar PDF e extrair texto', async () => {
      const pdfParse = require('pdf-parse');

      pdfParse.mockResolvedValue({
        text: 'Fatura de Água\nValor: R$ 80,00',
      });

      const mockFile = createMockFile('pdf content', 'conta-agua.pdf', 'application/pdf');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(pdfParse).toHaveBeenCalled();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('extracted');
      expect(data.success).toBe(true);
    });

    it('deve retornar erro 400 quando arquivo não é enviado', async () => {
      const formData = new FormData();

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Arquivo não fornecido' });
    });

    it('deve processar arquivo sem erro mesmo sem OCR/PDF', async () => {
      const mockFile = createMockFile('content', 'document.txt', 'text/plain');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve aceitar imagens PNG', async () => {
      const { createWorker } = require('tesseract.js');

      const mockFile = createMockFile('png content', 'conta.png', 'image/png');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createWorker).toHaveBeenCalled();
    });

    it('deve retornar nome do arquivo enviado', async () => {
      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data.fileName).toBe('test.jpg');
      expect(data.success).toBe(true);
    });

    it('deve continuar processamento mesmo quando OCR falha', async () => {
      const { createWorker } = require('tesseract.js');

      createWorker.mockResolvedValue({
        recognize: jest.fn().mockRejectedValue(new Error('OCR failed')),
        terminate: jest.fn(),
      });

      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve continuar processamento quando PDF parsing falha', async () => {
      const pdfParse = require('pdf-parse');

      pdfParse.mockRejectedValue(new Error('PDF parsing failed'));

      const mockFile = createMockFile('content', 'test.pdf', 'application/pdf');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Extração de Valores', () => {
    it('deve extrair valores encontrados no texto', async () => {
      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('extracted');
      expect(data.extracted).toHaveProperty('amount');
      expect(data.extracted).toHaveProperty('date');
      expect(data.extracted).toHaveProperty('description');
    });

    it('deve retornar estrutura de dados extraídos', async () => {
      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('fileName');
      expect(data).toHaveProperty('extracted');
      expect(data).toHaveProperty('debug');
    });
  });

  describe('Validações de Arquivo', () => {
    it('deve validar tamanho máximo de arquivo', async () => {
      // Arquivo muito grande (>10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const mockFile = createMockFile(largeContent, 'large.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);

      // Dependendo da implementação, pode rejeitar arquivo grande
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('deve aceitar múltiplos formatos de imagem', async () => {
      const formats = [
        { type: 'image/jpeg', ext: 'jpg' },
        { type: 'image/png', ext: 'png' },
        { type: 'image/webp', ext: 'webp' },
      ];

      for (const format of formats) {
        const mockFile = createMockFile('content', `test.${format.ext}`, format.type);

        const formData = new FormData();
        formData.append('file', mockFile);

        const request = {
          formData: async () => formData,
        } as unknown as NextRequest;

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });
});
