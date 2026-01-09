import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const { id } = params;

    // Verificar se a despesa pertence ao usuário
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      );
    }

    if (expense.userId !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar despesa' },
      { status: 500 }
    );
  }
}
