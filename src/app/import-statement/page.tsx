'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, FileText, AlertCircle, CheckCircle2, 
  TrendingDown, Calendar, DollarSign, Tag 
} from 'lucide-react';
import { 
  parseStatement, 
  isValidStatementFile,
  filterExpenses,
  calculateTotals,
  type ParsedTransaction 
} from '@/lib/parsers/statement-parser';

export default function ImportStatementPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedTransaction[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setPreview(null);
    setSummary(null);

    // Validar arquivo
    if (!isValidStatementFile(selectedFile)) {
      setError('Formato não suportado. Use CSV, OFX ou PDF.');
      return;
    }

    // Validar tamanho (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 5MB.');
      return;
    }

    setFile(selectedFile);

    // Processar preview
    if (selectedFile.name.endsWith('.pdf')) {
      // PDF será processado via API (OCR já existe)
      return;
    }

    try {
      setLoading(true);
      const result = await parseStatement(selectedFile);
      const expenses = filterExpenses(result.transactions);
      
      setPreview(expenses.slice(0, 10)); // Mostrar primeiras 10
      setSummary(calculateTotals(expenses));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', 'BANK_STATEMENT');

      const response = await fetch('/api/import-statement', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao importar');
      }

      const { imported } = await response.json();

      // Redirecionar para expenses
      alert(`${imported} despesas importadas com sucesso!`);
      router.push('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Importar Extrato Bancário
          </h1>
          <p className="mt-2 text-gray-600">
            Faça upload do extrato do seu banco (CSV, OFX ou PDF) e importe suas despesas automaticamente.
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📋 Como funciona:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Acesse o site do seu banco (Nubank, Inter, Itaú, etc)</li>
            <li>Baixe o extrato em formato CSV ou OFX</li>
            <li>Faça upload aqui e aguarde o processamento</li>
            <li>Confira o preview e confirme a importação</li>
          </ol>
        </div>

        {/* Formatos suportados */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Formatos Aceitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">CSV</p>
                <p className="text-xs text-gray-500">Nubank, Inter, Itaú, C6</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">OFX</p>
                <p className="text-xs text-gray-500">Formato universal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">PDF</p>
                <p className="text-xs text-gray-500">Com OCR automático</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            `}>
              <input
                type="file"
                accept=".csv,.ofx,.qfx,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              
              {file ? (
                <div>
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                      setPreview(null);
                      setSummary(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Trocar arquivo
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    Clique para selecionar arquivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV, OFX ou PDF até 5MB
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Erro</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-blue-900">Processando arquivo...</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Resumo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary).slice(0, 4).map(([category, total]) => (
                <div key={category} className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-600">{category}</p>
                  <p className="text-lg font-bold text-gray-900">
                    R$ {total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            {Object.keys(summary).length > 4 && (
              <p className="text-xs text-gray-500 mt-3">
                + {Object.keys(summary).length - 4} categorias
              </p>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Preview ({preview.length} de {preview.length} despesas)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Descrição
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((transaction, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {transaction.date.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.category || 'Outros'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-right text-red-600">
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botão de Importar */}
        {file && !error && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setSummary(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
