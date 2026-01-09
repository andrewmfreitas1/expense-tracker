import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
      },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar ou criar usuário
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Usuário',
        }
      });
    }

    const body = await request.json();
    const { amount, category, date, description, fileName } = body;

    // Validações básicas
    if (!amount || !category || !date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
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
