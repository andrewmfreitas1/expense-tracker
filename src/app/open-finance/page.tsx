'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Building2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface BankConnection {
  id: string;
  institutionName: string;
  institutionId: string | null;
  consentExpiresAt: string;
  lastSyncAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ERROR';
  createdAt: string;
}

export default function OpenFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadConnections();
    }
  }, [session]);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/open-finance/connections');
      const data = await response.json();
      
      if (data.success) {
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    setShowConsentModal(true);
  };

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      const response = await fetch('/api/open-finance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}`);
        await loadConnections();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erro ao sincronizar');
    } finally {
      setSyncing(null);
    }
  };

  const handleRevoke = async (connectionId: string, institutionName: string) => {
    if (!confirm(`Tem certeza que deseja revogar o acesso ao ${institutionName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/open-finance/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Conexão revogada com sucesso');
        await loadConnections();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erro ao revogar conexão');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'REVOKED':
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'EXPIRED':
        return 'Expirado';
      case 'REVOKED':
        return 'Revogado';
      case 'ERROR':
        return 'Erro';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Open Finance</h1>
            <p className="text-gray-600 mt-2">
              Conecte suas contas bancárias para importar despesas automaticamente
            </p>
          </div>
          <button
            onClick={handleConnectBank}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Conectar Banco
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Como funciona?</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>✓ Conecte-se de forma segura ao seu banco</li>
                <li>✓ Seus boletos e despesas são importados automaticamente</li>
                <li>✓ Dados sempre atualizados sem trabalho manual</li>
                <li>✓ Você pode revogar o acesso a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connections List */}
        {connections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma conexão bancária
            </h3>
            <p className="text-gray-500 mb-6">
              Conecte seu banco para começar a importar despesas automaticamente
            </p>
            <button
              onClick={handleConnectBank}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Conectar Primeiro Banco
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {connection.institutionName}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(connection.status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(connection.status)}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-500">
                        <p>
                          Conectado em: {formatDate(connection.createdAt)}
                        </p>
                        {connection.lastSyncAt && (
                          <p>
                            Última sincronização: {formatDate(connection.lastSyncAt)}
                          </p>
                        )}
                        <p>
                          Consentimento expira em: {formatDate(connection.consentExpiresAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {connection.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleSync(connection.id)}
                        disabled={syncing === connection.id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${syncing === connection.id ? 'animate-spin' : ''}`}
                        />
                        {syncing === connection.id ? 'Sincronizando...' : 'Sincronizar'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(connection.id, connection.institutionName)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Revogar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consent Modal */}
        {showConsentModal && (
          <ConsentModal onClose={() => setShowConsentModal(false)} onSuccess={loadConnections} />
        )}
      </div>
    </div>
  );
}

// Consent Modal Component
function ConsentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!accepted) {
      alert('Por favor, aceite os termos de consentimento');
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrar com Pluggy Connect Widget
      // Por enquanto, apenas mostramos uma mensagem
      alert('⚠️ Integração com Pluggy SDK será implementada quando a biblioteca estiver disponível.\n\nPor enquanto, esta é uma demonstração da interface.');
      onClose();
    } catch (error) {
      alert('❌ Erro ao conectar banco');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Consentimento LGPD</h2>
          <p className="text-gray-600 mt-2">
            Leia atentamente antes de autorizar o acesso aos seus dados bancários
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Dados que serão acessados:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Lista de boletos registrados no seu CPF</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Transações bancárias dos últimos 12 meses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Dados de faturas de cartão de crédito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Informações da conta (nome, CPF, agência, número)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Finalidade:</h3>
            <p className="text-gray-700">
              Os dados serão utilizados exclusivamente para importação automática de despesas no
              sistema de gerenciamento financeiro pessoal.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Prazo de validade:</h3>
            <p className="text-gray-700">
              O consentimento tem validade de <strong>12 meses</strong> a partir da autorização.
              Você poderá renová-lo ou revogá-lo a qualquer momento.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Seus direitos:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Revogar o consentimento a qualquer momento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Solicitar exclusão de todos os seus dados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Acessar o histórico de acessos aos seus dados</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                Li e aceito os termos de consentimento. Autorizo o acesso aos meus dados bancários
                conforme descrito acima, e estou ciente que posso revogar este consentimento a
                qualquer momento.
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleProceed}
            disabled={!accepted || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Conectando...' : 'Conectar Banco'}
          </button>
        </div>
      </div>
    </div>
  );
}
