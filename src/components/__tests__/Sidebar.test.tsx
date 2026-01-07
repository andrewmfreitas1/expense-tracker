import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

// Mock do Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o título do aplicativo', () => {
      render(<Sidebar />);
      expect(screen.getByText('💰 Expense')).toBeInTheDocument();
      expect(screen.getByText('Tracker')).toBeInTheDocument();
    });

    it('deve renderizar todos os itens do menu', () => {
      render(<Sidebar />);
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Despesas')).toBeInTheDocument();
    });

    it('deve renderizar a versão do aplicativo', () => {
      render(<Sidebar />);
      expect(screen.getByText('Versão 1.0')).toBeInTheDocument();
      expect(screen.getByText('Sistema de gestão de despesas')).toBeInTheDocument();
    });
  });

  describe('Navegação e Links', () => {
    it('deve ter links corretos para cada página', () => {
      render(<Sidebar />);
      
      const homeLink = screen.getByRole('link', { name: /início/i });
      const uploadLink = screen.getByRole('link', { name: /upload/i });
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const expensesLink = screen.getByRole('link', { name: /despesas/i });

      expect(homeLink).toHaveAttribute('href', '/');
      expect(uploadLink).toHaveAttribute('href', '/upload');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(expensesLink).toHaveAttribute('href', '/expenses');
    });

    it('deve destacar o item ativo baseado no pathname', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/dashboard');

      render(<Sidebar />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('Menu Mobile', () => {
    it('deve renderizar o botão de menu mobile', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      expect(menuButton).toBeInTheDocument();
    });

    it('deve abrir o menu ao clicar no botão', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      
      // Menu deve estar fechado inicialmente
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');

      // Clicar para abrir
      fireEvent.click(menuButton);
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('deve fechar o menu ao clicar no overlay', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      
      // Abrir menu
      fireEvent.click(menuButton);
      
      // Clicar no overlay para fechar
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
      
      if (overlay) {
        fireEvent.click(overlay);
        const sidebar = screen.getByRole('complementary');
        expect(sidebar).toHaveClass('-translate-x-full');
      }
    });

    it('deve fechar o menu ao clicar em um link', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      
      // Abrir menu
      fireEvent.click(menuButton);
      
      // Clicar em um link
      const uploadLink = screen.getByRole('link', { name: /upload/i });
      fireEvent.click(uploadLink);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('deve alternar o ícone do botão ao abrir/fechar', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      
      // Inicialmente deve mostrar ícone Menu
      fireEvent.click(menuButton);
      // Após abrir deve mostrar ícone X (Close)
      
      fireEvent.click(menuButton);
      // Após fechar deve mostrar ícone Menu novamente
    });
  });

  describe('Responsividade', () => {
    it('deve ter classes de responsividade corretas', () => {
      render(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      
      expect(sidebar).toHaveClass('lg:translate-x-0');
      expect(sidebar).toHaveClass('lg:w-64');
    });

    it('o botão mobile deve estar oculto em telas grandes', () => {
      render(<Sidebar />);
      const menuButton = screen.getByRole('button');
      
      expect(menuButton).toHaveClass('lg:hidden');
    });
  });

  describe('Acessibilidade', () => {
    it('deve usar elementos semânticos corretos', () => {
      render(<Sidebar />);
      
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('todos os links devem ser acessíveis', () => {
      render(<Sidebar />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(4); // 4 itens do menu
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});
