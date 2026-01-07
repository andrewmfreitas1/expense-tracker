// Mock do NextRequest e NextResponse - ANTES de importar o route
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (data, init) => new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  },
}));

// Mock do prisma - ANTES de importar o route
jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Importar DEPOIS dos mocks
import { GET, POST } from '@/app/api/expenses/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type assertions para acessar os mocks
const mockExpenseFind = prisma.expense.findMany as jest.MockedFunction<typeof prisma.expense.findMany>;
const mockExpenseCreate = prisma.expense.create as jest.MockedFunction<typeof prisma.expense.create>;
const mockUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockUserCreate = prisma.user.create as jest.MockedFunction<typeof prisma.user.create>;

describe('API Route: /api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/expenses', () => {
    it('deve retornar lista de despesas com sucesso', async () => {
      const mockExpenses = [
        {
          id: '1',
          title: 'Conta de Luz',
          amount: 150.50,
          category: 'Luz',
          date: new Date('2024-01-15'),
          description: 'Janeiro 2024',
          fileName: 'luz-jan.pdf',
          filePath: '/uploads/luz-jan.pdf',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Conta de Água',
          amount: 80.00,
          category: 'Água',
          date: new Date('2024-01-10'),
          description: 'Janeiro 2024',
          fileName: 'agua-jan.pdf',
          filePath: '/uploads/agua-jan.pdf',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockExpenseFind.mockResolvedValue(mockExpenses);

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(mockExpenseFind).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
        take: 100,
      });
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        id: '1',
        title: 'Conta de Luz',
        amount: 150.50,
        category: 'Luz',
      });
    });

    it('deve retornar array vazio quando não há despesas', async () => {
      mockExpenseFind.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('deve retornar erro 500 quando o banco falha', async () => {
      mockExpenseFind.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Erro ao buscar despesas' });
    });

    it('deve ordenar despesas por data decrescente', async () => {
      const mockExpenses = [
        { id: '1', date: new Date('2024-03-01'), amount: 100 },
        { id: '2', date: new Date('2024-02-01'), amount: 200 },
        { id: '3', date: new Date('2024-01-01'), amount: 300 },
      ];

      mockExpenseFind.mockResolvedValue(mockExpenses);

      const request = new NextRequest('http://localhost:3000/api/expenses');
      await GET(request);

      expect(mockExpenseFind).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
        take: 100,
      });
    });

    it('deve limitar resultados a 100 registros', async () => {
      mockExpenseFind.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/expenses');
      await GET(request);

      expect(mockExpenseFind).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('POST /api/expenses', () => {
    const validExpenseData = {
      amount: '150.50',
      category: 'Luz',
      date: '2024-01-15',
      description: 'Conta de Luz Janeiro',
      fileName: 'luz-jan.pdf',
    };

    const mockUser = {
      id: 'user-123',
      email: 'default@example.com',
      name: 'Usuário Padrão',
      password: 'temp',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve criar uma despesa com sucesso', async () => {
      const mockExpense = {
        id: '1',
        title: validExpenseData.description,
        amount: 150.50,
        category: validExpenseData.category,
        date: new Date(validExpenseData.date),
        description: validExpenseData.description,
        fileName: validExpenseData.fileName,
        filePath: null,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue(mockExpense);

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'default@example.com' },
      });
      expect(mockExpenseCreate).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(data.amount).toBe(150.50);
    });

    it('deve criar usuário padrão se não existir', async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      await POST(request);

      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          email: 'default@example.com',
          name: 'Usuário Padrão',
          password: 'temp',
        },
      });
    });

    it('deve retornar erro 400 quando amount está faltando', async () => {
      const invalidData = { ...validExpenseData, amount: undefined };

      const request = {
        json: async () => invalidData,
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Dados incompletos' });
    });

    it('deve retornar erro 400 quando category está faltando', async () => {
      const invalidData = { ...validExpenseData, category: undefined };

      const request = {
        json: async () => invalidData,
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Dados incompletos' });
    });

    it('deve retornar erro 400 quando date está faltando', async () => {
      const invalidData = { ...validExpenseData, date: undefined };

      const request = {
        json: async () => invalidData,
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Dados incompletos' });
    });

    it('deve criar título padrão quando description não é fornecida', async () => {
      const dataWithoutDescription = { ...validExpenseData, description: undefined };
      
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => dataWithoutDescription,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Despesa - Luz',
          }),
        })
      );
    });

    it('deve converter amount de string para float', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 150.50,
          }),
        })
      );
    });

    it('deve converter date string para Date object', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: expect.any(Date),
          }),
        })
      );
    });

    it('deve retornar erro 500 quando criação falha', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockRejectedValue(new Error('Database error'));

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Erro ao criar despesa' });
    });

    it('deve incluir fileName quando fornecido', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => validExpenseData,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileName: 'luz-jan.pdf',
          }),
        })
      );
    });
  });

  describe('Validações e Edge Cases', () => {
    it('deve lidar com valores numéricos extremos', async () => {
      const extremeData = {
        amount: '999999.99',
        category: 'Teste',
        date: '2024-01-01',
      };

      mockUserFindUnique.mockResolvedValue({} as any);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => extremeData,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 999999.99,
          }),
        })
      );
    });

    it('deve lidar com categorias especiais', async () => {
      const specialCategory = {
        amount: '100',
        category: 'Categoria & Especial / com "aspas"',
        date: '2024-01-01',
      };

      mockUserFindUnique.mockResolvedValue({} as any);
      mockExpenseCreate.mockResolvedValue({} as any);

      const request = {
        json: async () => specialCategory,
      } as NextRequest;

      await POST(request);

      expect(mockExpenseCreate).toHaveBeenCalled();
    });
  });
});
