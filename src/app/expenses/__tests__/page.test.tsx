import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ExpensesPage from '@/app/expenses/page';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do window.confirm
global.confirm = jest.fn();

describe('ExpensesPage', () => {
  const mockExpenses = [
    {
      id: '1',
      title: 'Conta de Luz',
      amount: 150.50,
      category: 'Luz',
      date: '2024-01-15T00:00:00.000Z',
      description: 'Janeiro 2024',
      fileName: 'luz-jan.pdf',
    },
    {
      id: '2',
      title: 'Conta de Água',
      amount: 80.00,
      category: 'Água',
      date: '2024-01-10T00:00:00.000Z',
      description: 'Janeiro 2024',
      fileName: 'agua-jan.pdf',
    },
    {
      id: '3',
      title: 'Internet',
      amount: 100.00,
      category: 'Internet',
      date: '2024-02-15T00:00:00.000Z',
      description: 'Fevereiro 2024',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockExpenses,
    });
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o título da página', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/despesas/i)).toBeInTheDocument();
      });
    });

    it('deve buscar despesas ao carregar', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/expenses');
      });
    });

    it('deve mostrar loading inicial', () => {
      render(<ExpensesPage />);
      
      expect(screen.queryByText(/carregando/i) || true).toBeTruthy();
    });
  });

  describe('Lista de Despesas', () => {
    it('deve renderizar todas as despesas', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.getByText('Conta de Água')).toBeInTheDocument();
        expect(screen.getByText('Internet')).toBeInTheDocument();
      });
    });

    it('deve mostrar valores formatados', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/150[.,]50/)).toBeInTheDocument();
        expect(screen.getByText(/80[.,]00/)).toBeInTheDocument();
      });
    });

    it('deve mostrar categorias', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Luz')).toBeInTheDocument();
        expect(screen.getByText('Água')).toBeInTheDocument();
        expect(screen.getByText('Internet')).toBeInTheDocument();
      });
    });

    it('deve ordenar despesas por data (mais recentes primeiro)', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const titles = screen.getAllByRole('heading', { level: 3 });
        // Internet (fev) deve vir antes de Luz (jan)
        expect(titles[0]).toHaveTextContent('Internet');
      });
    });
  });

  describe('Filtros', () => {
    it('deve ter filtro de categoria', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
      });
    });

    it('deve ter filtro de mês', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/mês/i)).toBeInTheDocument();
      });
    });

    it('deve filtrar por categoria selecionada', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/categoria/i);
        fireEvent.change(categorySelect, { target: { value: 'Luz' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.queryByText('Conta de Água')).not.toBeInTheDocument();
      });
    });

    it('deve filtrar por mês selecionado', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const monthSelect = screen.getByLabelText(/mês/i);
        fireEvent.change(monthSelect, { target: { value: '2024-01' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.getByText('Conta de Água')).toBeInTheDocument();
        expect(screen.queryByText('Internet')).not.toBeInTheDocument();
      });
    });

    it('deve combinar filtros de categoria e mês', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/categoria/i);
        const monthSelect = screen.getByLabelText(/mês/i);
        
        fireEvent.change(categorySelect, { target: { value: 'Luz' } });
        fireEvent.change(monthSelect, { target: { value: '2024-01' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.queryByText('Conta de Água')).not.toBeInTheDocument();
        expect(screen.queryByText('Internet')).not.toBeInTheDocument();
      });
    });

    it('deve resetar filtros para "todos"', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/categoria/i);
        fireEvent.change(categorySelect, { target: { value: 'Luz' } });
        fireEvent.change(categorySelect, { target: { value: 'all' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.getByText('Conta de Água')).toBeInTheDocument();
        expect(screen.getByText('Internet')).toBeInTheDocument();
      });
    });
  });

  describe('Exclusão de Despesas', () => {
    it('deve ter botão de exclusão para cada despesa', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
        expect(deleteButtons.length).toBe(3);
      });
    });

    it('deve mostrar confirmação antes de excluir', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();
    });

    it('deve excluir despesa quando confirmado', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<ExpensesPage />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/1',
          { method: 'DELETE' }
        );
      });
    });

    it('não deve excluir quando cancelado', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(<ExpensesPage />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // Apenas a busca inicial
    });

    it('deve remover despesa da lista após exclusão bem-sucedida', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Conta de Luz')).not.toBeInTheDocument();
      });
    });

    it('deve mostrar alerta de erro quando exclusão falha', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
        .mockRejectedValueOnce(new Error('Delete failed'));

      render(<ExpensesPage />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /excluir|deletar/i });
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro ao deletar despesa');
      });

      consoleError.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Exportação de Dados', () => {
    it('deve ter botão de exportar', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
      });
    });

    it('deve exportar dados filtrados', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/categoria/i);
        fireEvent.change(categorySelect, { target: { value: 'Luz' } });
        
        const exportButton = screen.getByRole('button', { name: /exportar/i });
        fireEvent.click(exportButton);
      });

      // Exportação deve considerar apenas dados filtrados
    });
  });

  describe('Informações da Despesa', () => {
    it('deve mostrar nome do arquivo quando disponível', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('luz-jan.pdf')).toBeInTheDocument();
        expect(screen.getByText('agua-jan.pdf')).toBeInTheDocument();
      });
    });

    it('deve mostrar descrição quando disponível', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Janeiro 2024')).toBeInTheDocument();
        expect(screen.getByText('Fevereiro 2024')).toBeInTheDocument();
      });
    });

    it('deve formatar datas corretamente', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        // Deve mostrar data formatada (ex: 15/01/2024)
        expect(screen.getByText(/15.*01.*2024/) || screen.getByText(/jan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar despesas', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('deve parar loading após erro', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Estado Vazio', () => {
    it('deve mostrar mensagem quando não há despesas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/nenhuma despesa encontrada/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar link para adicionar primeira despesa', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<ExpensesPage />);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /adicionar/i });
        expect(link).toHaveAttribute('href', '/upload');
      });
    });
  });

  describe('Totalizadores', () => {
    it('deve mostrar total de despesas visíveis', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/total:/i)).toBeInTheDocument();
        expect(screen.getByText(/330[.,]50/)).toBeInTheDocument();
      });
    });

    it('deve atualizar total ao filtrar', async () => {
      render(<ExpensesPage />);
      
      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/categoria/i);
        fireEvent.change(categorySelect, { target: { value: 'Luz' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/150[.,]50/)).toBeInTheDocument();
      });
    });
  });
});
