'use client';

import { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ExtractedData {
  amount?: number;
  date?: string;
  description?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [category, setCategory] = useState('outros');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setExtractedData(data.extracted);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          category,
          fileName: file?.name,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setFile(null);
          setExtractedData(null);
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Upload de Contas</h1>
          <p className="text-gray-600 mt-2">
            Faça upload de PDFs ou imagens das suas contas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-sm text-gray-500">
                  PDF, JPG, JPEG ou PNG
                </p>
              </label>
            </div>
          )}

          {file && !extractedData && !success && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                {file.type.includes('pdf') ? (
                  <FileText className="w-8 h-8 text-blue-600" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-blue-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Processar Arquivo'
                )}
              </button>

              <button
                onClick={() => setFile(null)}
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          )}

          {extractedData && !success && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ Dados extraídos com sucesso!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="agua">Água</option>
                    <option value="luz">Luz</option>
                    <option value="internet">Internet</option>
                    <option value="telefone">Telefone</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="condominio">Condomínio</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.amount || ''}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={extractedData.date || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, date: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={extractedData.description || ''}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Salvar Despesa
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setExtractedData(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Despesa salva com sucesso!
              </h3>
              <p className="text-gray-600">
                Você pode fazer upload de outra conta agora.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
