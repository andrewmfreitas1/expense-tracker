import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseStatement, filterExpenses } from '@/lib/parsers/statement-parser';

export async function POST(request: Request) {
  try {
    // Validar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Processar form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Processar arquivo
    const result = await parseStatement(file);
    const expenses = filterExpenses(result.transactions);

    // Importar despesas para o banco
    const imported: any[] = [];
    
    for (const transaction of expenses) {
      // Verificar duplicatas (mesma data + valor + descrição)
      const existing = await prisma.expense.findFirst({
        where: {
          userId: session.user.id,
          amount: Math.abs(transaction.amount),
          dueDate: transaction.date,
          description: transaction.description
        }
      });

      if (existing) {
        console.log('Despesa duplicada, pulando:', transaction.description);
        continue;
      }

      // Criar despesa
      const expense = await prisma.expense.create({
        data: {
          userId: session.user.id,
          title: transaction.description,
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          category: transaction.category || 'Outros',
          date: transaction.date,
          dueDate: transaction.date,
          isPaid: false,
          source: 'BANK_STATEMENT'
        }
      });

      imported.push(expense);
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: expenses.length,
      duplicates: expenses.length - imported.length,
      format: result.format
    });

  } catch (error) {
    console.error('Erro ao importar extrato:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
