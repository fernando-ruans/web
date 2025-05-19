import React, { useState, useEffect } from 'react';

interface Adicional {
  id: number;
  nome: string;
  preco: number;
  quantidadeMax: number;
}

interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
}

interface AdicionaisSelecionados {
  adicionalId: number;
  quantidade: number;
  nome: string;
  preco: number;
}

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (quantidade: number, adicionaisSelecionados: AdicionaisSelecionados[]) => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose, onAddToCart }: ProductDetailsModalProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<AdicionaisSelecionados[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      fetch(`/api/lojista/adicionais?productId=${product.id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setAdicionais(data);
          setAdicionaisSelecionados([]);
        })
        .catch(error => {
          console.error('Erro ao carregar adicionais:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1) {
      setQuantidade(novaQuantidade);
    }
  };

  const handleAdicionalChange = (adicional: Adicional, delta: number) => {
    const atual = adicionaisSelecionados.find(a => a.adicionalId === adicional.id);
    const novaQuantidade = (atual?.quantidade || 0) + delta;

    // Não permite quantidade menor que 0 ou maior que o máximo permitido
    if (novaQuantidade < 0 || novaQuantidade > adicional.quantidadeMax) {
      if (novaQuantidade > adicional.quantidadeMax) {
        setModalError(`Quantidade máxima permitida para ${adicional.nome} é ${adicional.quantidadeMax}`);
        setTimeout(() => setModalError(null), 3000);
      }
      return;
    }

    setModalError(null);

    if (novaQuantidade === 0) {
      setAdicionaisSelecionados(prev => 
        prev.filter(a => a.adicionalId !== adicional.id)
      );
    } else {
      setAdicionaisSelecionados(prev => {
        if (atual) {
          return prev.map(a => 
            a.adicionalId === adicional.id 
              ? { ...a, quantidade: novaQuantidade }
              : a
          );
        }
        return [...prev, {
          adicionalId: adicional.id,
          quantidade: novaQuantidade,
          nome: adicional.nome,
          preco: adicional.preco
        }];
      });
    }
  };

  const calcularTotal = () => {
    const precoBase = product.preco * quantidade;
    const precoAdicionais = adicionaisSelecionados.reduce(
      (total, a) => total + (a.preco * a.quantidade),
      0
    );
    return precoBase + precoAdicionais;
  };

  return (    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative overflow-hidden">
        <div className="p-6 max-h-[90vh] overflow-y-auto"><div className="pr-8">
            <h2 className="text-2xl font-bold text-orange-500 mb-4">{product.nome}</h2>
            <button
              onClick={onClose}className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {product.imagem && (
            <img
              src={product.imagem}
              alt={product.nome}
              className="w-full h-48 object-cover rounded-lg mb-4 bg-orange-50"
            />
          )}

          <p className="text-gray-600 mb-4">{product.descricao}</p>

          <div className="border-t border-b py-4 my-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Quantidade:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantidadeChange(-1)}
                  className="bg-orange-500 text-white w-8 h-8 rounded-full"
                >
                  -
                </button>
                <span className="text-lg">{quantidade}</span>
                <button
                  onClick={() => handleQuantidadeChange(1)}
                  className="bg-orange-500 text-white w-8 h-8 rounded-full"
                >
                  +
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-center py-4">Carregando adicionais...</p>
            ) : adicionais.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Adicionais:</h3>
                {adicionais.map(adicional => {
                  const selecionado = adicionaisSelecionados.find(
                    a => a.adicionalId === adicional.id
                  );
                  return (
                    <div key={adicional.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{adicional.nome}</p>
                        <p className="text-sm text-gray-500">
                          R$ {adicional.preco.toFixed(2)} | Máx: {adicional.quantidadeMax}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdicionalChange(adicional, -1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full"
                        >
                          -
                        </button>
                        <span>{selecionado?.quantidade || 0}</span>
                        <button
                          onClick={() => handleAdicionalChange(adicional, 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {modalError && (
            <div className="text-red-500 text-center mb-4">
              {modalError}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-xl font-bold text-orange-500">
              R$ {calcularTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              onAddToCart(quantidade, adicionaisSelecionados);
              onClose();
            }}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
