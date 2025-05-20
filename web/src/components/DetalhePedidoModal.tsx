import React from 'react';
import Modal from './Modal';
import { formatCurrency } from '../utils/format';

interface DetalhePedidoModalProps {
  open: boolean;
  onClose: () => void;
  pedido: {
    id: number;
    status: string;
    createdAt: string;
    usuario: {
      nome: string;
      telefone: string;
    };
    items: Array<{
      id: number;
      quantidade: number;
      nome: string;
      preco: number;
      adicionais?: Array<{
        id: number;
        nome: string;
        preco: number;
        quantidade: number;
      }>;
    }>;
    taxa_entrega: number;
    observacao?: string;
    endereco: {
      rua: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  statusNomes: Record<string, string>;
}

const DetalhePedidoModal: React.FC<DetalhePedidoModalProps> = ({ open, onClose, pedido, statusNomes }) => {
  const calcularTotalItem = (item: DetalhePedidoModalProps['pedido']['items'][0]) => {
    const totalAdicionais = item.adicionais?.reduce((acc, adicional) => {
      return acc + (adicional.preco * adicional.quantidade);
    }, 0) ?? 0;
    return (item.preco * item.quantidade) + totalAdicionais;
  };

  const calcularTotal = () => {
    const subtotal = pedido.items.reduce((acc, item) => acc + calcularTotalItem(item), 0);
    return subtotal + pedido.taxa_entrega;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <Modal open={open} onClose={onClose} title={`Pedido #${pedido.id}`}>
      <div className="text-gray-600 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Status</h3>
          <p>{statusNomes[pedido.status] || pedido.status}</p>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">Data do Pedido</h3>
          <p>{formatarData(pedido.createdAt)}</p>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">Cliente</h3>
          <p>{pedido.usuario?.nome || 'Nome não disponível'}</p>
          <p>{pedido.usuario?.telefone || 'Telefone não disponível'}</p>
        </div>

        {pedido.endereco && (
          <div>
            <h3 className="font-bold text-gray-900">Endereço de Entrega</h3>
            <p>{pedido.endereco.rua}, {pedido.endereco.numero}</p>
            {pedido.endereco.complemento && <p>Complemento: {pedido.endereco.complemento}</p>}
            <p>{pedido.endereco.bairro}</p>
            <p>{pedido.endereco.cidade} - {pedido.endereco.estado}</p>
            <p>CEP: {pedido.endereco.cep}</p>
          </div>
        )}

        <div>
          <h3 className="font-bold text-gray-900">Itens do Pedido</h3>
          <div className="space-y-2">
            {pedido.items.map((item) => (
              <div key={item.id} className="border-b border-gray-200 pb-2">
                <p className="font-medium text-gray-900">{item.quantidade}x {item.nome}</p>
                <p className="text-sm">{formatCurrency(item.preco)} cada</p>
                {item.adicionais && item.adicionais.length > 0 && (
                  <div className="ml-4 text-sm text-gray-500">
                    <p className="font-medium text-gray-700">Adicionais:</p>
                    {item.adicionais.map((adicional) => (
                      <p key={adicional.id}>
                        {adicional.quantidade}x {adicional.nome} - {formatCurrency(adicional.preco)} cada
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-right text-orange-500 font-semibold">
                  Subtotal: {formatCurrency(calcularTotalItem(item))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {pedido.observacao && (
          <div>
            <h3 className="font-bold text-gray-900">Observações</h3>
            <p>{pedido.observacao}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <span>Taxa de Entrega:</span>
            <span>{formatCurrency(pedido.taxa_entrega)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Total:</span>
            <span className="text-orange-500">{formatCurrency(calcularTotal())}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DetalhePedidoModal;
