// Função utilitária para resumir o horário de funcionamento de um restaurante
// Exemplo de saída: "Seg a Sex: 08:00-18:00, Sáb: 08:00-12:00, Dom: Fechado"
export function resumoHorarioFuncionamento(horario: Record<string, string> | undefined | null): string {
  if (!horario) return '';
  // Ordem dos dias
  const ordem = [
    { key: 'segunda', label: 'Seg' },
    { key: 'terca', label: 'Ter' },
    { key: 'quarta', label: 'Qua' },
    { key: 'quinta', label: 'Qui' },
    { key: 'sexta', label: 'Sex' },
    { key: 'sabado', label: 'Sáb' },
    { key: 'domingo', label: 'Dom' },
  ];
  // Agrupa dias com horários iguais
  const grupos: { dias: string[]; horario: string }[] = [];
  for (const { key, label } of ordem) {
    const valor = (horario[key] || 'Fechado').trim();
    if (grupos.length === 0 || grupos[grupos.length - 1].horario !== valor) {
      grupos.push({ dias: [label], horario: valor });
    } else {
      grupos[grupos.length - 1].dias.push(label);
    }
  }
  // Monta string compacta
  return grupos
    .map(grupo => {
      if (grupo.dias.length === 1) {
        return `${grupo.dias[0]}: ${grupo.horario}`;
      } else {
        return `${grupo.dias[0]} a ${grupo.dias[grupo.dias.length - 1]}: ${grupo.horario}`;
      }
    })
    .join(', ');
}
