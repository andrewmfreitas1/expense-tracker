'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, PieChartIcon } from 'lucide-react';
import AnomalyAlerts, { detectAnomalies } from '@/components/AnomalyAlerts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface MonthlyData {
  month: string;
  total: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [anomalyAlerts, setAnomalyAlerts] = useState<ReturnType<typeof detectAnomalies>>([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      setExpenses(data);
      processData(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: Expense[]) => {
    // Total de despesas
    const total = data.reduc

    // Detectar anomalias
    const alerts = detectAnomalies(data);
    setAnomalyAlerts(alerts);e((sum, expense) => sum + expense.amount, 0);
    setTotalExpenses(total);

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

    // Dados por categoria
    const categoryMap = new Map<string, number>();
    data.forEach((expense) => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setCategoryData(categories);
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
          <hAlertas de Anomalias */}
        <div className="mb-8">
          <AnomalyAlerts alerts={anomalyAlerts} />
        </div>

        {/* 1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visualize suas despesas e estatísticas</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Despesas</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalExpenses.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Contas</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Categorias</p>
                <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
              </div>
              <PieChartIcon className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Média Mensal</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {monthlyData.length > 0 ? (totalExpenses / monthlyData.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
