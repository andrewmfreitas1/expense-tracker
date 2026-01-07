import { render, screen } from '@testing-library/react';
import AnomalyAlerts, { detectAnomalies } from '@/components/AnomalyAlerts';

describe('AnomalyAlerts Component', () => {
  describe('detectAnomalies função', () => {
    it('deve retornar array vazio quando não há despesas suficientes', () => {
      const expenses = [
        {
          id: '1',
          amount: 100,
          category: 'Água',
          date: '2024-01-01',
        },
      ];

      const alerts = detectAnomalies(expenses);
      expect(alerts).toEqual([]);
    });

    it('deve detectar anomalia de alta quando valor aumenta mais de 30%', () => {
      const expenses = [
        {
          id: '1',
          amount: 200, // Mês atual: 200
          category: 'Luz',
          date: '2024-03-01',
        },
        {
          id: '2',
          amount: 100, // Média anterior: 100
          category: 'Luz',
          date: '2024-02-01',
        },
        {
          id: '3',
          amount: 100,
          category: 'Luz',
          date: '2024-01-01',
        },
      ];

      const alerts = detectAnomalies(expenses);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe('Luz');
      expect(alerts[0].type).toBe('high');
      expect(alerts[0].currentMonth).toBe(200);
      expect(alerts[0].average).toBe(100);
      expect(alerts[0].variance).toBe(100); // 100% de aumento
    });

    it('deve detectar anomalia de baixa quando valor diminui mais de 30%', () => {
      const expenses = [
        {
          id: '1',
          amount: 50, // Mês atual: 50
          category: 'Internet',
          date: '2024-03-01',
        },
        {
          id: '2',
          amount: 100, // Média anterior: 100
          category: 'Internet',
          date: '2024-02-01',
        },
        {
          id: '3',
          amount: 100,
          category: 'Internet',
          date: '2024-01-01',
        },
      ];

      const alerts = detectAnomalies(expenses);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe('Internet');
      expect(alerts[0].type).toBe('low');
      expect(alerts[0].variance).toBe(-50); // 50% de redução
    });

    it('não deve detectar anomalia quando variação é menor que 30%', () => {
      const expenses = [
        {
          id: '1',
          amount: 120, // Variação de 20%
          category: 'Água',
          date: '2024-03-01',
        },
        {
          id: '2',
          amount: 100,
          category: 'Água',
          date: '2024-02-01',
        },
        {
          id: '3',
          amount: 100,
          category: 'Água',
          date: '2024-01-01',
        },
      ];

      const alerts = detectAnomalies(expenses);
      expect(alerts).toEqual([]);
    });

    it('deve analisar múltiplas categorias independentemente', () => {
      const expenses = [
        // Categoria Luz - anomalia alta
        { id: '1', amount: 200, category: 'Luz', date: '2024-03-01' },
        { id: '2', amount: 100, category: 'Luz', date: '2024-02-01' },
        
        // Categoria Água - sem anomalia
        { id: '3', amount: 110, category: 'Água', date: '2024-03-01' },
        { id: '4', amount: 100, category: 'Água', date: '2024-02-01' },
        
        // Categoria Internet - anomalia baixa
        { id: '5', amount: 50, category: 'Internet', date: '2024-03-01' },
        { id: '6', amount: 100, category: 'Internet', date: '2024-02-01' },
      ];

      const alerts = detectAnomalies(expenses);
      
      expect(alerts).toHaveLength(2);
      expect(alerts.find(a => a.category === 'Luz')).toBeDefined();
      expect(alerts.find(a => a.category === 'Internet')).toBeDefined();
      expect(alerts.find(a => a.category === 'Água')).toBeUndefined();
    });

    it('deve calcular média corretamente com múltiplos meses anteriores', () => {
      const expenses = [
        { id: '1', amount: 400, category: 'Luz', date: '2024-04-01' },
        { id: '2', amount: 100, category: 'Luz', date: '2024-03-01' },
        { id: '3', amount: 200, category: 'Luz', date: '2024-02-01' },
        { id: '4', amount: 150, category: 'Luz', date: '2024-01-01' },
      ];

      const alerts = detectAnomalies(expenses);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].average).toBe(150); // (100 + 200 + 150) / 3
      expect(alerts[0].monthsAnalyzed).toBe(3);
    });

    it('deve ordenar despesas por data corretamente', () => {
      const expenses = [
        { id: '1', amount: 100, category: 'Luz', date: '2024-01-01' },
        { id: '2', amount: 200, category: 'Luz', date: '2024-03-01' }, // Mais recente
        { id: '3', amount: 100, category: 'Luz', date: '2024-02-01' },
      ];

      const alerts = detectAnomalies(expenses);
      
      expect(alerts[0].currentMonth).toBe(200); // Deve usar o mais recente
    });
  });

  describe('AnomalyAlerts renderização', () => {
    it('deve mostrar mensagem positiva quando não há anomalias', () => {
      render(<AnomalyAlerts alerts={[]} />);
      
      expect(screen.getByText(/todas as despesas estão dentro do padrão/i)).toBeInTheDocument();
    });

    it('deve renderizar o título com contador de alertas', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
        {
          category: 'Água',
          currentMonth: 50,
          average: 100,
          variance: -50,
          type: 'low' as const,
          monthsAnalyzed: 3,
        },
      ];

      render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText(/alertas de variação \(2\)/i)).toBeInTheDocument();
    });

    it('deve renderizar alertas de alta com estilo correto', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
      ];

      const { container } = render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText('Luz')).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*200,00/)).toBeInTheDocument();
      expect(screen.getByText(/\+100(%|\.0%)/)).toBeInTheDocument();
      
      // Verificar se tem a classe de alerta alto
      const alertElement = container.querySelector('.border-l-4');
      expect(alertElement).toHaveClass('border-red-500');
    });

    it('deve renderizar alertas de baixa com estilo correto', () => {
      const alerts = [
        {
          category: 'Internet',
          currentMonth: 50,
          average: 100,
          variance: -50,
          type: 'low' as const,
          monthsAnalyzed: 3,
        },
      ];

      const { container } = render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText('Internet')).toBeInTheDocument();
      expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument();
      expect(screen.getByText(/-50(%|\.0%)/)).toBeInTheDocument();
      
      // Verificar se tem a classe de alerta baixo
      const alertElement = container.querySelector('.border-l-4');
      expect(alertElement).toHaveClass('border-blue-500');
    });

    it('deve renderizar múltiplos alertas', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
        {
          category: 'Água',
          currentMonth: 300,
          average: 150,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 4,
        },
      ];

      render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText('Luz')).toBeInTheDocument();
      expect(screen.getByText('Água')).toBeInTheDocument();
    });

    it('deve formatar valores monetários corretamente', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 1234.56,
          average: 987.65,
          variance: 25,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
      ];

      render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText(/R\$ 1\.234,56/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 987,65/)).toBeInTheDocument();
    });

    it('deve mostrar número de meses analisados', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 5,
        },
      ];

      render(<AnomalyAlerts alerts={alerts} />);
      
      expect(screen.getByText(/5 meses/i)).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter estrutura semântica adequada', () => {
      const alerts = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
      ];

      const { container } = render(<AnomalyAlerts alerts={alerts} />);
      
      expect(container.querySelector('h3')).toBeInTheDocument();
    });

    it('deve usar cores acessíveis para diferentes tipos de alerta', () => {
      const highAlert = [
        {
          category: 'Luz',
          currentMonth: 200,
          average: 100,
          variance: 100,
          type: 'high' as const,
          monthsAnalyzed: 2,
        },
      ];

      const { container: containerHigh } = render(<AnomalyAlerts alerts={highAlert} />);
      const highElement = containerHigh.querySelector('.border-red-500');
      expect(highElement).toBeInTheDocument();

      const lowAlert = [
        {
          category: 'Água',
          currentMonth: 50,
          average: 100,
          variance: -50,
          type: 'low' as const,
          monthsAnalyzed: 2,
        },
      ];

      const { container: containerLow } = render(<AnomalyAlerts alerts={lowAlert} />);
      const lowElement = containerLow.querySelector('.border-blue-500');
      expect(lowElement).toBeInTheDocument();
    });
  });
});
