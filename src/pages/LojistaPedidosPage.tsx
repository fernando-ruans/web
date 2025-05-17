import React, { useState } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function LojistaPedidosPage() {
  const { user } = useAuth();
  // Simulação de pedidos recebidos
  const [pedidos, setPedidos] = useState<any[]>([
    // Exemplo: { id: '1', cliente: 'João', total: 49.9, status: 'Pendente', itens: 'Pizza, Refri' }
  ]);

  // Funções para atualizar status, etc. podem ser adicionadas aqui

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaClipboardList size={24} /> Pedidos Recebidos
          </h2>
          <div className="text-gray-600 mb-2 text-center text-lg">Aqui você poderá visualizar e gerenciar os pedidos recebidos.</div>
          <div className="w-full grid grid-cols-1 gap-4">
            {pedidos.length === 0 ? (
              <div className="text-gray-400 text-center">Nenhum pedido recebido.</div>
            ) : (
              pedidos.map(pedido => (
                <div key={pedido.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center justify-between gap-2 border border-orange-100">
                  <div>
                    <div className="font-bold text-orange-600 text-lg">Pedido #{pedido.id}</div>
                    <div className="text-gray-600">Cliente: {pedido.cliente}</div>
                    <div className="text-gray-500 text-sm">Itens: {pedido.itens}</div>
                    <div className="text-green-600 font-bold">Total: R$ {pedido.total}</div>
                    <div className="text-xs text-orange-500 font-bold">Status: {pedido.status}</div>
                  </div>
                  {/* Botões de ação para atualizar status podem ser adicionados aqui */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
