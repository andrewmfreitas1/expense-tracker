import Link from 'next/link';
import { FileUp, BarChart3, List } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Expense Tracker
          </h1>
          <p className="text-xl text-gray-600">
            Gerencie suas despesas mensais com facilidade
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link href="/upload" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <FileUp className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-semibold mb-2">Upload</h2>
                <p className="text-gray-600">
                  Faça upload de suas contas e boletos em PDF ou imagem
                </p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <BarChart3 className="w-16 h-16 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
                <p className="text-gray-600">
                  Visualize gráficos e estatísticas das suas despesas
                </p>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <List className="w-16 h-16 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-semibold mb-2">Despesas</h2>
                <p className="text-gray-600">
                  Consulte e gerencie todas as suas despesas cadastradas
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4">Como funciona?</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Faça upload das suas contas (água, luz, internet, boletos)</li>
            <li>O sistema extrai automaticamente os valores usando OCR</li>
            <li>Confirme ou edite as informações extraídas</li>
            <li>Visualize gráficos e relatórios das suas despesas mensais</li>
            <li>Acompanhe seu histórico e identifique padrões de gastos</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
