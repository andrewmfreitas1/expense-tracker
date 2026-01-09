'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, PieChartIcon, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnomalyAlerts, { detectAnomalies } from '@/components/AnomalyAlerts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  title?: string;
}

interface MonthlyData {
  month: string;
  total: number;
}

interface CategoryData {
  name: string;
  value: number;
  count: number;
  items: Expense[];
}

interface GroupedCategory {
  name: string;
  value: number;
  subcategories: { name: string; value: number; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

// Função para categorizar despesas de forma mais inteligente
function categorizeExpense(expense: Expense): string {
  const desc = (expense.description || expense.title || '').toLowerCase();
  
  // PIX
  if (desc.includes('pix') || desc.includes('transferencia')) {
    return 'PIX e Transferências';
  }
  
  // Cartão de crédito
  if (desc.includes('cartao') || desc.includes('credito') || desc.includes('mastercard') || desc.includes('visa')) {
    return 'Compras com Cartão';
  }
  
  // Impostos
  if (desc.includes('iptu') || desc.includes('ipva') || desc.includes('imposto') || desc.includes('taxa')) {
    return 'Impostos e Taxas';
  }
  
  // Boletos por tipo
  if (desc.includes('boleto') || desc.includes('fatura')) {
    if (desc.includes('luz') || desc.includes('energia') || desc.includes('eletric')) {
      return 'Boleto - Energia';
    }
    if (desc.includes('agua') || desc.includes('saneamento') || desc.includes('sabesp')) {
      return 'Boleto - Água';
    }
    if (desc.includes('internet') || desc.includes('telefone') || desc.includes('celular')) {
      return 'Boleto - Telecom';
    }
    if (desc.includes('gas')) {
      return 'Boleto - Gás';
    }
    if (desc.includes('condominio')) {
      return 'Boleto - Condomínio';
    }
    if (desc.includes('aluguel')) {
      return 'Boleto - Aluguel';
    }
    return 'Boletos Diversos';
  }
  
  // Alimentação
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('restaurante') || desc.includes('lanche')) {
    return 'Alimentação';
  }
  
  // Transporte
  if (desc.includes('uber') || desc.includes('99') || desc.includes('combustivel') || desc.includes('gasolina') || desc.includes('estacionamento')) {
    return 'Transporte';
  }
  
  // Saúde
  if (desc.includes('farmacia') || desc.includes('medico') || desc.includes('plano') || desc.includes('consulta')) {
    return 'Saúde';
  }
  
  // Educação
  if (desc.includes('escola') || desc.includes('curso') || desc.includes('faculdade') || desc.includes('livro')) {
    return 'Educação';
  }
  
  // Lazer
  if (desc.includes('cinema') || desc.includes('streaming') || desc.includes('netflix') || desc.includes('spotify')) {
    return 'Lazer e Entretenimento';
  }
  
  // Fallback para categoria original
  return expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [anomalyAlerts, setAnomalyAlerts] = useState<ReturnType<typeof detectAnomalies>>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; items: Expense[]; total: number } | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      setExpenses(data);
      
      // Extrair meses disponíveis
      const months = Array.from(
        new Set(
          data.map((e: Expense) => {
            const date = new Date(e.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          })
        )
      ).sort().reverse() as string[];
      setAvailableMonths(months);
      
      // Definir mês atual como padrão se não houver seleção
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (months.includes(currentMonth) && selectedMonth === 'all') {
        setSelectedMonth(currentMonth);
        processData(data, currentMonth);
      } else {
        processData(data, selectedMonth || 'all');
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: Expense[], monthFilter: string) => {
    // Filtrar por mês se necessário
    let filteredData = data;
    if (monthFilter !== 'all' && monthFilter !== 'current') {
      filteredData = data.filter((expense) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    } else if (monthFilter === 'current') {
      // Filtrar apenas mês atual
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredData = data.filter((expense) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === currentMonth;
      });
    }

    // Total de despesas
    const total = filteredData.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalExpenses(total);

    // Detectar anomalias (sempre com todos os dados)
    const alerts = detectAnomalies(data);
    setAnomalyAlerts(alerts);

    // Dados mensais
    const monthlyMap = new Map<string, number>();
    data.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + expense.amount);
    });

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Últimos 6 meses

    setMonthlyData(monthly);

    // Dados por categoria com agrupamento inteligente
    const categoryMap = new Map<string, Expense[]>();
    filteredData.forEach((expense) => {
      const category = categorizeExpense(expense);
      const items = categoryMap.get(category) || [];
      items.push(expense);
      categoryMap.set(category, items);
    });

    const categories = Array.from(categoryMap.entries()).map(([name, items]) => ({
      name,
      value: items.reduce((sum, item) => sum + item.amount, 0),
      count: items.length,
      items,
    })).sort((a, b) => b.value - a.value);

    setCategoryData(categories);

    // Agrupar boletos, PIX, Cartão
    const grouped: GroupedCategory[] = [];
    
    const boletoCategories = categories.filter(c => c.name.startsWith('Boleto'));
    if (boletoCategories.length > 0) {
      grouped.push({
        name: 'Pagamentos de Boletos',
        value: boletoCategories.reduce((sum, c) => sum + c.value, 0),
        subcategories: boletoCategories.map(c => ({
          name: c.name.replace('Boleto - ', ''),
          value: c.value,
          count: c.count,
        })),
      });
    }

    const pixCategory = categories.find(c => c.name === 'PIX e Transferências');
    if (pixCategory) {
      grouped.push({
        name: 'PIX e Transferências',
        value: pixCategory.value,
        subcategories: [{ name: 'Total de transferências', value: pixCategory.value, count: pixCategory.count }],
      });
    }

    const cardCategory = categories.find(c => c.name === 'Compras com Cartão');
    if (cardCategory) {
      grouped.push({
        name: 'Compras com Cartão',
        value: cardCategory.value,
        subcategories: [{ name: 'Total de compras', value: cardCategory.value, count: cardCategory.count }],
      });
    }

    const taxCategory = categories.find(c => c.name === 'Impostos e Taxas');
    if (taxCategory) {
      grouped.push({
        name: 'Impostos e Taxas',
        value: taxCategory.value,
        subcategories: [{ name: 'Total de impostos', value: taxCategory.value, count: taxCategory.count }],
      });
    }

    setGroupedCategories(grouped.sort((a, b) => b.value - a.value));
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    processData(expenses, month);
  };

  const openModal = (title: string, items: Expense[], total: number) => {
    setModalData({ title, items, total });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Visualize suas despesas e estatísticas</p>
            </div>
            
            {/* Filtro de Mês */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="current">📅 Mês atual</option>
                  <option value="all">Todos os meses</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Anomalias */}
        <div className="mb-8">
          <AnomalyAlerts alerts={anomalyAlerts} />
        </div>

        {/* Cards de resumo - Agora clicáveis */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => {
              const filtered = selectedMonth === 'all' ? expenses : expenses.filter((e) => {
                const date = new Date(e.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === selectedMonth;
              });
              openModal('Total de Despesas', filtered, totalExpenses);
            }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Despesas</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalExpenses.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-2">Clique para detalhes</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600" />
            </div>
          </button>

          <button
            onClick={() => {
              const filtered = selectedMonth === 'all' ? expenses : expenses.filter((e) => {
                const date = new Date(e.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === selectedMonth;
              });
              openModal('Todas as Contas', filtered, totalExpenses);
            }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Contas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedMonth === 'all' ? expenses.length : expenses.filter((e) => {
                    const date = new Date(e.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return monthKey === selectedMonth;
                  }).length}
                </p>
                <p className="text-xs text-green-600 mt-2">Clique para detalhes</p>
              </div>
              <Calendar className="w-12 h-12 text-green-600" />
            </div>
          </button>

          <button
            onClick={() => {
              const details = categoryData.flatMap(c => c.items);
              openModal('Todas as Categorias', details, totalExpenses);
            }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Categorias</p>
                <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
                <p className="text-xs text-purple-600 mt-2">Clique para detalhes</p>
              </div>
              <PieChartIcon className="w-12 h-12 text-purple-600" />
            </div>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Média Mensal</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {monthlyData.length > 0 ? (expenses.reduce((sum, e) => sum + e.amount, 0) / monthlyData.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Agrupamentos Inteligentes */}
        {groupedCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Análise por Tipo de Despesa</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {groupedCategories.map((group, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const items = categoryData
                      .filter(c => group.subcategories.some(sub => c.name.includes(sub.name) || c.name.includes(group.name)))
                      .flatMap(c => c.items);
                    openModal(group.name, items, group.value);
                  }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {group.value.toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {group.subcategories.map((sub, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{sub.name}:</span>
                        <span className="font-medium">{sub.count}x</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">Clique para ver detalhes</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gráfico de barras - Despesas mensais */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Despesas Mensais</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de pizza - Por categoria */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Despesas por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de linha - Tendência */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tendência de Gastos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} name="Total Mensal" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {expenses.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center mt-8">
            <p className="text-gray-600 mb-4">Nenhuma despesa cadastrada ainda.</p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Fazer Upload de Conta
            </Link>
          </div>
        )}

        {/* Modal de Detalhes */}
        {modalOpen && modalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{modalData.title}</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-700">
                    Total: <span className="text-blue-600">R$ {modalData.total.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {modalData.items.length} {modalData.items.length === 1 ? 'transação' : 'transações'}
                  </p>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(90vh-240px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modalData.items
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(item.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.description || item.title || 'Sem descrição'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {categorizeExpense(item)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                              R$ {item.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
