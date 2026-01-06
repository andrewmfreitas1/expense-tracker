import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Por enquanto, retornar dados mocados já que não temos autenticação
    // Em produção, você filtraria por userId
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, category, date, description, fileName } = body;

    // Validações básicas
    if (!amount || !category || !date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Por enquanto, usar um userId fixo (em produção, pegar do auth)
    const userId = 'default-user';

    // Criar ou buscar usuário padrão
    let user = await prisma.user.findUnique({
      where: { email: 'default@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Usuário Padrão',
          password: 'temp', // Em produção, usar hash
        },
      });
    }

    const expense = await prisma.expense.create({
      data: {
        title: description || `Despesa - ${category}`,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        fileName,
        userId: user.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar despesa' },
      { status: 500 }
    );
  }
}
