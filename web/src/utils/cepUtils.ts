interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function buscarCEP(cep: string): Promise<EnderecoViaCEP | null> {
  try {
    // Remove qualquer caractere não numérico do CEP
    const cepNumerico = cep.replace(/\D/g, '');
    
    if (cepNumerico.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

export function formatarEndereco(endereco: EnderecoViaCEP): string {
  const partes = [
    endereco.logradouro,
    endereco.bairro,
    `${endereco.localidade} - ${endereco.uf}`,
    endereco.cep
  ];
  
  return partes.filter(Boolean).join(', ');
}
