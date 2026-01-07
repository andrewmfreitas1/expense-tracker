// Arquivo de exemplo mostrando casos de uso dos testes

// ============================================
// EXEMPLO 1: Testando Componente React
// ============================================
import { render, screen, fireEvent } from '@testing-library/react';
import MyButton from './MyButton';

describe('MyButton', () => {
  it('deve executar callback ao clicar', () => {
    const handleClick = jest.fn();
    render(<MyButton onClick={handleClick}>Clique</MyButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// EXEMPLO 2: Testando Hook Customizado
// ============================================
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('deve incrementar contador', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});

// ============================================
// EXEMPLO 3: Testando Função Utilitária
// ============================================
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('deve formatar valor em reais', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  
  it('deve lidar com valores negativos', () => {
    expect(formatCurrency(-100)).toBe('-R$ 100,00');
  });
  
  it('deve arredondar centavos', () => {
    expect(formatCurrency(10.999)).toBe('R$ 11,00');
  });
});

// ============================================
// EXEMPLO 4: Testando com Mock de API
// ============================================
import { fetchUser } from './api';

global.fetch = jest.fn();

describe('fetchUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('deve buscar dados do usuário', async () => {
    const mockUser = { id: 1, name: 'João' };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });
    
    const user = await fetchUser(1);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });
  
  it('deve lançar erro em caso de falha', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    
    await expect(fetchUser(1)).rejects.toThrow('Network error');
  });
});

// ============================================
// EXEMPLO 5: Testando Componente Assíncrono
// ============================================
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  it('deve carregar e mostrar dados do usuário', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Maria', email: 'maria@test.com' }),
    });
    
    render(<UserProfile userId="123" />);
    
    // Verifica loading
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    
    // Aguarda dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Maria')).toBeInTheDocument();
      expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    });
    
    // Verifica que loading sumiu
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });
});

// ============================================
// EXEMPLO 6: Testando Formulário
// ============================================
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  it('deve validar campos obrigatórios', async () => {
    const handleSubmit = jest.fn();
    render(<ContactForm onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  it('deve enviar dados válidos', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/nome/i), 'João Silva');
    await user.type(screen.getByLabelText(/email/i), 'joao@test.com');
    await user.type(screen.getByLabelText(/mensagem/i), 'Olá!');
    
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'João Silva',
      email: 'joao@test.com',
      message: 'Olá!',
    });
  });
});

// ============================================
// EXEMPLO 7: Testando com Context
// ============================================
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import ThemedButton from './ThemedButton';

describe('ThemedButton', () => {
  it('deve aplicar tema claro', () => {
    render(
      <ThemeProvider value="light">
        <ThemedButton>Botão</ThemedButton>
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'text-black');
  });
  
  it('deve aplicar tema escuro', () => {
    render(
      <ThemeProvider value="dark">
        <ThemedButton>Botão</ThemedButton>
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-black', 'text-white');
  });
});

// ============================================
// EXEMPLO 8: Testando com Prisma Mock
// ============================================
import { mockPrisma } from '@/__mocks__/prisma';
import { createExpense } from './expenseService';

describe('expenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('deve criar despesa no banco', async () => {
    const expenseData = {
      amount: 100,
      category: 'Luz',
      date: new Date(),
    };
    
    const mockExpense = { id: '1', ...expenseData };
    mockPrisma.expense.create.mockResolvedValue(mockExpense);
    
    const result = await createExpense(expenseData);
    
    expect(mockPrisma.expense.create).toHaveBeenCalledWith({
      data: expenseData,
    });
    expect(result).toEqual(mockExpense);
  });
});

// ============================================
// EXEMPLO 9: Testando Redirecionamento
// ============================================
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProtectedPage from './ProtectedPage';

jest.mock('next/navigation');

describe('ProtectedPage', () => {
  it('deve redirecionar usuário não autenticado', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    render(<ProtectedPage isAuthenticated={false} />);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

// ============================================
// EXEMPLO 10: Testando Snapshot
// ============================================
import { render } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('deve corresponder ao snapshot', () => {
    const { container } = render(
      <Card title="Título" content="Conteúdo" />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ============================================
// DICAS E BOAS PRÁTICAS
// ============================================

/*
1. SEMPRE limpe mocks entre testes:
   beforeEach(() => jest.clearAllMocks());

2. Use screen queries semânticas:
   ✅ screen.getByRole('button', { name: /enviar/i })
   ❌ container.querySelector('button')

3. Prefira user-event para interações:
   ✅ await user.click(button)
   ⚠️ fireEvent.click(button)

4. Use waitFor para operações assíncronas:
   await waitFor(() => {
     expect(screen.getByText('Sucesso')).toBeInTheDocument();
   });

5. Teste comportamento, não implementação:
   ✅ expect(screen.getByText('Total: R$ 100')).toBeInTheDocument();
   ❌ expect(component.state.total).toBe(100);

6. Organize testes com describe:
   describe('MyComponent', () => {
     describe('quando autenticado', () => {
       it('deve mostrar perfil', () => {});
     });
     
     describe('quando não autenticado', () => {
       it('deve mostrar login', () => {});
     });
   });

7. Teste casos extremos (edge cases):
   - Listas vazias
   - Valores null/undefined
   - Strings muito longas
   - Números muito grandes
   - Datas inválidas

8. Use data-testid apenas quando necessário:
   <div data-testid="custom-element">
   screen.getByTestId('custom-element')

9. Mock apenas o necessário:
   - APIs externas
   - Bibliotecas pesadas
   - Funções com efeitos colaterais

10. Mantenha testes independentes:
    - Cada teste deve funcionar sozinho
    - Não confie em ordem de execução
    - Limpe estado global
*/
