'use client';

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface AnomalyAlert {
  category: string;
  currentMonth: number;
  average: number;
  variance: number;
  type: 'high' | 'low';
  monthsAnalyzed: number;
}

export function detectAnomalies(expenses: Expense[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  
  // Agrupar por categoria
  const byCategory = new Map<string, Expense[]>();
  expenses.forEach(expense => {
    if (!byCategory.has(expense.category)) {
      byCategory.set(expense.category, []);
    }
    byCategory.get(expense.category)!.push(expense);
  });

  // Analisar cada categoria
  byCategory.forEach((categoryExpenses, category) => {
    if (categoryExpenses.length < 2) return; // Precisa de pelo menos 2 registros

    // Ordenar por data (mais recente primeiro)
    const sorted = categoryExpenses.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Pegar valor do mês atual
    const currentMonth = sorted[0];
    
    // Calcular média dos meses anteriores (excluindo o atual)
    const previousMonths = sorted.slice(1);
    if (previousMonths.length === 0) return;

    const average = previousMonths.reduce((sum, e) => sum + e.amount, 0) / previousMonths.length;
    const variance = ((currentMonth.amount - average) / average) * 100;

    // Alerta se variação for maior que 30% (para cima ou para baixo)
    if (Math.abs(variance) > 30) {
      alerts.push({
        category,
        currentMonth: currentMonth.amount,
        average,
        variance,
        type: variance > 0 ? 'high' : 'low',
        monthsAnalyzed: previousMonths.length,
      });
    }
  });

  return alerts;
}

interface AnomalyAlertsProps {
  alerts: AnomalyAlert[];
}

export default function AnomalyAlerts({ alerts }: AnomalyAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-green-800 font-medium">
            ✓ Todas as despesas estão dentro do padrão esperado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Alertas de Variação ({alerts.length})
        </h3>
      </div>

      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`
            border-l-4 p-4 rounded-r-lg
            ${alert.type === 'high' 
              ? 'bg-red-50 border-red-500' 
              : 'bg-blue-50 border-blue-500'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {alert.type === 'high' ? (
                  <TrendingUp className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                )}
                <h4 className={`font-semibold ${
                  alert.type === 'high' ? 'text-red-900' : 'text-blue-900'
                }`}>
                  {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                </h4>
              </div>

              <div className="space-y-1 text-sm">
                <p className={alert.type === 'high' ? 'text-red-800' : 'text-blue-800'}>
                  <span className="font-medium">Valor atual:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alert.currentMonth)}
                </p>
                <p className={alert.type === 'high' ? 'text-red-700' : 'text-blue-700'}>
                  <span className="font-medium">Média histórica:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alert.average)}
                  <span className="text-xs ml-2">
                    ({alert.monthsAnalyzed} {alert.monthsAnalyzed === 1 ? 'mês' : 'meses'})
                  </span>
                </p>
              </div>
            </div>

            <div className={`
              px-3 py-1 rounded-full text-sm font-bold
              ${alert.type === 'high' 
                ? 'bg-red-200 text-red-900' 
                : 'bg-blue-200 text-blue-900'
              }
            `}>
              {alert.variance > 0 ? '+' : ''}{alert.variance.toFixed(0)}%
            </div>
          </div>

          <p className={`text-xs mt-2 ${
            alert.type === 'high' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {alert.type === 'high' 
              ? `⚠️ Despesa ${Math.abs(alert.variance).toFixed(0)}% acima da média` 
              : `✓ Economia de ${Math.abs(alert.variance).toFixed(0)}% em relação à média`
            }
          </p>
        </div>
      ))}
    </div>
  );
}
