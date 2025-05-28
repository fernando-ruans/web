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
    formaPagamento?: string;
    trocoPara?: number;
    review?: {
      nota: number;
      comentario: string;
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

  const handlePrintRecibo = () => {
    const reciboWindow = window.open('', '_blank', 'width=400,height=600');
    if (!reciboWindow) return;
    const endereco = pedido.endereco
      ? `${pedido.endereco.rua}, ${pedido.endereco.numero} ${pedido.endereco.complemento ? ' - ' + pedido.endereco.complemento : ''}, ${pedido.endereco.bairro}, ${pedido.endereco.cidade} - ${pedido.endereco.estado} | CEP: ${pedido.endereco.cep}`
      : 'Não informado';
    const reciboHtml = `
      <html>
        <head>
          <title>Recibo Pedido #${pedido.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h2 { margin-bottom: 8px; }
            .info { margin-bottom: 8px; font-size: 14px; }
            .itens { margin-bottom: 8px; }
            .item { margin-bottom: 4px; }
            .adicional { font-size: 12px; color: #555; margin-left: 12px; }
            .total { font-weight: bold; font-size: 16px; margin-top: 12px; }
            .obs { background: #fffbe6; padding: 6px; border-radius: 4px; margin-top: 8px; font-size: 13px; }
            .print-btn { display: inline-block; margin-bottom: 16px; padding: 6px 16px; background: #f97316; color: #fff; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Imprimir</button>
          <h2>Pedido #${pedido.id}</h2>
          <div class="info"><b>Cliente:</b> ${pedido.usuario.nome}</div>
          <div class="info"><b>Telefone:</b> ${pedido.usuario.telefone}</div>
          <div class="info"><b>Data:</b> ${formatarData(pedido.createdAt)}</div>
          <div class="info"><b>Endereço:</b> ${endereco}</div>
          <div class="itens">
            <b>Itens:</b>
            <ul style="padding-left: 18px;">
              ${pedido.items.map(item => `
                <li class="item">${item.quantidade}x ${item.nome} (${formatCurrency(item.preco)})
                  ${item.adicionais && item.adicionais.length > 0 ? `<ul>${item.adicionais.map(ad => `<li class='adicional'>+ ${ad.quantidade}x ${ad.nome} (${formatCurrency(ad.preco)})</li>`).join('')}</ul>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="info"><b>Taxa de Entrega:</b> ${formatCurrency(pedido.taxa_entrega)}</div>
          <div class="total">Total: ${formatCurrency(calcularTotal())}</div>
          ${pedido.observacao ? `<div class="obs"><b>Obs:</b> ${pedido.observacao}</div>` : ''}
        </body>
      </html>
    `;
    reciboWindow.document.write(reciboHtml);
    reciboWindow.document.close();
    reciboWindow.focus();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Pedido #${pedido.id}`}>
      <div className="text-gray-600 space-y-6">
        {/* Botão de imprimir recibo */}
        <div className="flex justify-end">
          <button
            onClick={() => handlePrintRecibo()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold shadow text-sm mb-2"
          >
            Imprimir Recibo
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500 block">Status</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
              pedido.status === 'preparando' ? 'bg-blue-100 text-blue-800' :
              pedido.status === 'pronto' ? 'bg-yellow-100 text-yellow-800' :
              pedido.status === 'entregue' ? 'bg-green-100 text-green-800' :
              pedido.status === 'cancelado' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusNomes[pedido.status] || pedido.status}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block">Data do Pedido</span>
            <span className="text-gray-900">{formatarData(pedido.createdAt)}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-2">Cliente</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{pedido.usuario.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{pedido.usuario.telefone}</span>
            </div>
          </div>
        </div>

        {pedido.endereco && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Endereço de Entrega</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-gray-900">{pedido.endereco.rua}, {pedido.endereco.numero}</p>
                  {pedido.endereco.complemento && (
                    <p className="text-gray-600">Complemento: {pedido.endereco.complemento}</p>
                  )}
                  <p className="text-gray-600">{pedido.endereco.bairro}</p>
                  <p className="text-gray-600">{pedido.endereco.cidade} - {pedido.endereco.estado}</p>
                  <p className="text-gray-600">CEP: {pedido.endereco.cep}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Itens do Pedido</h3>
          <div className="space-y-4">
            {pedido.items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.quantidade}x {item.nome}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.preco)} cada</p>
                  </div>
                  <p className="text-orange-500 font-medium">
                    {formatCurrency(item.preco * item.quantidade)}
                  </p>
                </div>
                
                {item.adicionais && item.adicionais.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Adicionais:</p>
                    <div className="space-y-1">
                      {item.adicionais.map((adicional) => (
                        <div key={adicional.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {adicional.quantidade}x {adicional.nome}
                          </span>
                          <span className="text-gray-900">
                            {formatCurrency(adicional.preco * adicional.quantidade)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {pedido.observacao && (
          <div className="bg-orange-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Observações
            </h3>
            <p className="text-gray-600">{pedido.observacao}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 mt-6">
          {/* Forma de Pagamento antes da taxa de entrega */}
          {pedido.formaPagamento && (
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Forma de Pagamento:</span>
              <span className="font-semibold">{pedido.formaPagamento.charAt(0).toUpperCase() + pedido.formaPagamento.slice(1)}</span>
            </div>
          )}
          {pedido.formaPagamento && pedido.trocoPara && (
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Troco para:</span>
              <span className="font-semibold">R$ {Number(pedido.trocoPara).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Taxa de Entrega:</span>
            <span>{formatCurrency(pedido.taxa_entrega)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total:</span>
            <span className="text-orange-500">{formatCurrency(calcularTotal())}</span>
          </div>
        </div>

        {/* Avaliação do Cliente */}
        {pedido.review && (
          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
              Avaliação do Cliente
            </h3>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < pedido.review!.nota ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
              ))}
            </div>
            {pedido.review.comentario && (
              <p className="text-gray-700 text-sm mt-1">{pedido.review.comentario}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DetalhePedidoModal;
