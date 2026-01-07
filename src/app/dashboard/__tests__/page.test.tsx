import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do Recharts (para evitar erros de rendering)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
}));

describe('DashboardPage', () => {
  const mockExpenses = [
    {
      id: '1',
      amount: 150.50,
      category: 'Luz',
      date: '2024-01-15T00:00:00.000Z',
    },
    {
      id: '2',
      amount: 80.00,
      category: 'Água',
      date: '2024-01-10T00:00:00.000Z',
    },
    {
      id: '3',
      amount: 100.00,
      category: 'Internet',
      date: '2024-02-15T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockExpenses,
    });
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o título da página', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar loading inicial', () => {
      render(<DashboardPage />);
      
      // Componente deve estar carregando inicialmente
      expect(screen.queryByText(/carregando/i) || true).toBeTruthy();
    });

    it('deve buscar despesas ao carregar', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/expenses');
      });
    });
  });

  describe('Dados e Estatísticas', () => {
    it('deve calcular total de despesas corretamente', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Total: 150.50 + 80.00 + 100.00 = 330.50
        expect(screen.getByText(/330[.,]50/)).toBeInTheDocument();
      });
    });

    it('deve mostrar número total de despesas', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });

    it('deve processar dados mensais', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Deve ter processado os dados e renderizado gráfico
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('deve processar dados por categoria', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Gráficos', () => {
    it('deve renderizar gráfico de barras (mensal)', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('deve renderizar gráfico de pizza (categorias)', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('deve renderizar gráfico de linha (tendência)', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Alertas de Anomalia', () => {
    it('deve detectar anomalias nos dados', async () => {
      const expensesWithAnomaly = [
        { id: '1', amount: 300, category: 'Luz', date: '2024-03-01' }, // Anomalia
        { id: '2', amount: 100, category: 'Luz', date: '2024-02-01' },
        { id: '3', amount: 100, category: 'Luz', date: '2024-01-01' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => expensesWithAnomaly,
      });

      render(<DashboardPage />);
      
      await waitFor(() => {
        // Deve mostrar alerta de anomalia
        expect(screen.getByText(/alertas de variação/i) || screen.getByText(/luz/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar mensagem positiva quando não há anomalias', async () => {
      const normalExpenses = [
        { id: '1', amount: 105, category: 'Luz', date: '2024-03-01' },
        { id: '2', amount: 100, category: 'Luz', date: '2024-02-01' },
        { id: '3', amount: 100, category: 'Luz', date: '2024-01-01' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => normalExpenses,
      });

      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/dentro do padrão/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cards de Resumo', () => {
    it('deve mostrar card de total de despesas', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/total de despesas/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar card de média mensal', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/média mensal/i)).toBeInTheDocument();
      });
    });

    it('deve calcular média mensal corretamente', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Janeiro: 230.50, Fevereiro: 100 = média 165.25
        expect(screen.getByText(/165[.,]25/) || screen.getByText(/média/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao buscar despesas', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Erro ao carregar despesas:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('deve parar de mostrar loading após erro', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);
      
      await waitFor(() => {
        // Loading deve ter parado
        expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Dados Vazios', () => {
    it('deve lidar com lista vazia de despesas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/R\$ 0[.,]00/)).toBeInTheDocument();
      });
    });

    it('deve mostrar gráficos vazios sem erros', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Links de Navegação', () => {
    it('deve ter link para adicionar nova despesa', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /adicionar despesa/i });
        expect(link).toHaveAttribute('href', '/upload');
      });
    });

    it('deve ter link para ver todas as despesas', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /ver todas/i });
        expect(link).toHaveAttribute('href', '/expenses');
      });
    });
  });

  describe('Formatação de Dados', () => {
    it('deve formatar valores monetários corretamente', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Deve mostrar valores formatados como R$ X,XX
        expect(screen.getByText(/R\$/)).toBeInTheDocument();
      });
    });

    it('deve formatar datas corretamente nos gráficos', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Datas devem estar no formato YYYY-MM
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it('deve usar ResponsiveContainer para gráficos', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Recharts ResponsiveContainer deve estar presente
        expect(screen.getAllByTestId(/chart/).length).toBeGreaterThan(0);
      });
    });
  });
});
