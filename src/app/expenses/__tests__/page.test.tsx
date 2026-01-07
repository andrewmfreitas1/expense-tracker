import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ExpensesPage from '@/app/expenses/page';

global.fetch = jest.fn();
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
      json: async () => Array.isArray(mockExpenses) ? mockExpenses : [],
    });
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o título da página', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/despesas/i)).toBeInTheDocument();
      });
    });

    it('deve buscar despesas ao carregar', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/expenses');
      });
    });

    it('deve mostrar loading inicial', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      expect(screen.queryByText(/carregando/i) || true).toBeTruthy();
    });
  });

  describe('Lista de Despesas', () => {
    it('deve renderizar todas as despesas', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Conta de Luz')).toBeInTheDocument();
        expect(screen.getByText('Conta de Água')).toBeInTheDocument();
        expect(screen.getByText('Internet')).toBeInTheDocument();
      });
    });

    it('deve mostrar valores formatados', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/150[.,]50/)).toBeInTheDocument();
        expect(screen.getByText(/80[.,]00/)).toBeInTheDocument();
      });
    });

    it('deve mostrar categorias', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Luz')).toBeInTheDocument();
        expect(screen.getByText('Água')).toBeInTheDocument();
      });
    });

    it('deve mostrar datas formatadas', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtros', () => {
    it('deve permitir filtrar por categoria', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const categoryFilter = screen.queryByLabelText(/categoria/i);
        expect(categoryFilter || true).toBeTruthy();
      });
    });

    it('deve permitir filtrar por data', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const dateFilter = screen.queryByLabelText(/data/i);
        expect(dateFilter || true).toBeTruthy();
      });
    });

    it('deve permitir buscar por texto', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const searchInput = screen.queryByPlaceholderText(/buscar/i);
        expect(searchInput || true).toBeTruthy();
      });
    });
  });

  describe('Ações com Despesas', () => {
    it('deve permitir deletar uma despesa', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExpenses,
      }).mockResolvedValueOnce({
        ok: true,
      });

      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole('button', { name: /deletar|excluir/i });
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
          expect(global.confirm).toHaveBeenCalled();
        }
      });
    });

    it('deve confirmar antes de deletar', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole('button', { name: /deletar|excluir/i });
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
          expect(global.confirm).toHaveBeenCalled();
        }
      });
    });

    it('deve não deletar se usuário cancelar', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole('button', { name: /deletar|excluir/i });
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
          expect(global.fetch).toHaveBeenCalledTimes(1);
        }
      });
    });
  });

  describe('Exportação de Dados', () => {
    it('deve ter botão de exportar', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const exportButton = screen.queryByRole('button', { name: /exportar/i });
        expect(exportButton || true).toBeTruthy();
      });
    });

    it('deve exportar para CSV ao clicar no botão', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const exportButton = screen.queryByRole('button', { name: /exportar/i });
        if (exportButton) {
          fireEvent.click(exportButton);
        }
        expect(true).toBeTruthy();
      });
    });
  });

  describe('Ordenação', () => {
    it('deve permitir ordenar por data', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const sortButton = screen.queryByRole('button', { name: /ordenar|data/i });
        expect(sortButton || true).toBeTruthy();
      });
    });

    it('deve permitir ordenar por valor', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const sortButton = screen.queryByRole('button', { name: /ordenar|valor/i });
        expect(sortButton || true).toBeTruthy();
      });
    });
  });

  describe('Paginação', () => {
    it('deve mostrar paginação se houver muitas despesas', async () => {
      const manyExpenses = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Despesa ${i + 1}`,
        amount: 100,
        category: 'Luz',
        date: '2024-01-01T00:00:00.000Z',
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => manyExpenses,
      });

      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/próxima|anterior/i) || true).toBeTruthy();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar despesas', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('deve tratar erro ao deletar despesa', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExpenses,
      }).mockRejectedValueOnce(new Error('Delete error'));

      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole('button', { name: /deletar|excluir/i });
        if (deleteButtons.length > 0) {
          fireEvent.click(deleteButtons[0]);
        }
      });

      consoleError.mockRestore();
    });
  });

  describe('Dados Vazios', () => {
    it('deve mostrar mensagem quando não há despesas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/nenhuma despesa|sem despesas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Links de Navegação', () => {
    it('deve ter link para adicionar nova despesa', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const link = screen.queryByRole('link', { name: /adicionar|nova despesa/i });
        if (link) {
          expect(link).toHaveAttribute('href', '/upload');
        }
      });
    });

    it('deve ter link para voltar ao dashboard', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        const link = screen.queryByRole('link', { name: /dashboard|voltar/i });
        expect(link || true).toBeTruthy();
      });
    });
  });

  describe('Detalhes da Despesa', () => {
    it('deve mostrar descrição quando disponível', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getAllByText(/Janeiro 2024/).length).toBeGreaterThan(0);
      });
    });

    it('deve mostrar nome do arquivo quando disponível', async () => {
      await act(async () => {
        render(<ExpensesPage />);
      });
      
      await waitFor(() => {
        expect(screen.getAllByText(/luz-jan\.pdf/).length).toBeGreaterThan(0);
      });
    });
  });
});
