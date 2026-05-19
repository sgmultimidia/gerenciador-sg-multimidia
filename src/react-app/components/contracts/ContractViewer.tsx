import { useState } from 'react';
import { Download, Send, CheckCircle, Edit2, Save } from 'lucide-react';
import ResponsiveModal from '../ResponsiveModal';
import { generateContractPDF } from '@/react-app/utils/pdfGenerator';

interface Contract {
  id: number;
  quote_id: number;
  template_id: number;
  contract_number: string;
  content: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  quote_number?: string;
  quote_total?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
}

export default function ContractViewer({ isOpen, onClose, contract }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(contract.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
          status: contract.status,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        onClose();
      } else {
        alert('Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsSent = async () => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Contrato marcado como enviado!');
        onClose();
      } else {
        alert('Erro ao marcar como enviado');
      }
    } catch (error) {
      console.error('Error marking as sent:', error);
      alert('Erro ao marcar como enviado');
    }
  };

  const handleMarkAsSigned = async () => {
    if (!confirm('Confirma que o contrato foi assinado pelo cliente?')) return;

    try {
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        alert('Contrato marcado como assinado!');
        onClose();
      } else {
        alert('Erro ao marcar como assinado');
      }
    } catch (error) {
      console.error('Error marking as signed:', error);
      alert('Erro ao marcar como assinado');
    }
  };

  const handleDownloadPDF = () => {
    try {
      generateContractPDF({
        contract_number: contract.contract_number,
        client_name: contract.client_name || 'Cliente',
        content: editedContent,
        created_at: contract.created_at,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const handleSendWhatsApp = () => {
    if (!contract.client_name) {
      alert('Dados do cliente não encontrados');
      return;
    }

    const message = encodeURIComponent(
      `Olá ${contract.client_name}!\n\n` +
      `Segue o contrato ${contract.contract_number} para sua análise e assinatura.\n\n` +
      `Por favor, revise o documento e confirme sua concordância.\n\n` +
      `Qualquer dúvida, estou à disposição!`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={contract.contract_number}
    >
      <div className="space-y-4">
        {/* Status and Actions */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div>
            <p className="text-sm text-slate-400">Cliente</p>
            <p className="text-white font-medium">{contract.client_name}</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            )}
          </div>
        </div>

        {/* Contract Content */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          ) : (
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
              {editedContent}
            </pre>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {contract.status === 'draft' && (
              <>
                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar WhatsApp
                </button>
                <button
                  onClick={handleMarkAsSent}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Marcar como Enviado
                </button>
              </>
            )}
            {contract.status === 'sent' && (
              <button
                onClick={handleMarkAsSigned}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Assinado
              </button>
            )}
            {contract.status === 'signed' && (
              <div className="flex-1 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Contrato Assinado
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
