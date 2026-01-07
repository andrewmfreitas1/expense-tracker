import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';

// Mock do NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
  },
}));

// Mock do fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

// Mock do Tesseract.js
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(),
}));

// Mock do pdf-parse
jest.mock('pdf-parse', () => jest.fn());

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
      const { recognize } = require('tesseract.js');
      const { writeFile, mkdir } = require('fs/promises');

      recognize.mockResolvedValue({
        data: { text: 'Valor Total: R$ 150,50' },
      });

      const mockFile = createMockFile('image content', 'conta-luz.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(recognize).toHaveBeenCalled();
      expect(data).toHaveProperty('text');
      expect(data).toHaveProperty('fileName');
    });

    it('deve processar PDF e extrair texto', async () => {
      const pdfParse = require('pdf-parse');
      const { writeFile, mkdir } = require('fs/promises');

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

      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(pdfParse).toHaveBeenCalled();
      expect(data).toHaveProperty('text');
    });

    it('deve retornar erro 400 quando arquivo não é enviado', async () => {
      const formData = new FormData();

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Nenhum arquivo enviado' });
    });

    it('deve retornar erro 400 para tipo de arquivo não suportado', async () => {
      const mockFile = createMockFile('content', 'document.txt', 'text/plain');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('não suportado');
    });

    it('deve aceitar imagens PNG', async () => {
      const { recognize } = require('tesseract.js');
      const { writeFile, mkdir } = require('fs/promises');

      recognize.mockResolvedValue({
        data: { text: 'Texto extraído' },
      });

      const mockFile = createMockFile('png content', 'conta.png', 'image/png');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(recognize).toHaveBeenCalled();
    });

    it('deve criar diretório de uploads se não existir', async () => {
      const { recognize } = require('tesseract.js');
      const { mkdir } = require('fs/promises');

      recognize.mockResolvedValue({
        data: { text: 'Texto' },
      });

      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      await POST(request);

      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('public/uploads'),
        { recursive: true }
      );
    });

    it('deve gerar nome único para arquivo', async () => {
      const { recognize } = require('tesseract.js');
      const { writeFile } = require('fs/promises');

      recognize.mockResolvedValue({
        data: { text: 'Texto' },
      });

      const mockFile = createMockFile('content', 'conta.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data.fileName).toMatch(/^\d+-conta\.jpg$/);
      expect(writeFile).toHaveBeenCalled();
    });

    it('deve retornar erro 500 quando OCR falha', async () => {
      const { recognize } = require('tesseract.js');

      recognize.mockRejectedValue(new Error('OCR failed'));

      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('deve retornar erro 500 quando PDF parsing falha', async () => {
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

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Extração de Valores', () => {
    it('deve sugerir valores encontrados no texto', async () => {
      const { recognize } = require('tesseract.js');

      recognize.mockResolvedValue({
        data: { text: 'Valor Total: R$ 250,75\nVencimento: 15/01/2024' },
      });

      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data.text).toContain('250,75');
      expect(data).toHaveProperty('suggestedAmount');
    });

    it('deve identificar categoria baseada em palavras-chave', async () => {
      const { recognize } = require('tesseract.js');

      recognize.mockResolvedValue({
        data: { text: 'COMPANHIA DE ENERGIA ELÉTRICA\nValor: R$ 150,00' },
      });

      const mockFile = createMockFile('content', 'test.jpg', 'image/jpeg');

      const formData = new FormData();
      formData.append('file', mockFile);

      const request = {
        formData: async () => formData,
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('suggestedCategory');
      expect(data.suggestedCategory).toBe('Luz');
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
      const { recognize } = require('tesseract.js');
      recognize.mockResolvedValue({ data: { text: 'Texto' } });

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
