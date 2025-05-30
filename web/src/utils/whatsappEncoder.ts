// Função para converter emojis em texto equivalente que funciona no WhatsApp
export function convertEmojiToText(text: string): string {
  const emojiToTextMap: Record<string, string> = {
    // Emojis principais -> Texto equivalente
    '🛒': '[PEDIDO]',
    '👤': '[CLIENTE]', 
    '📍': '[ENDERECO]',
    '🏠': '[RUA]',
    '📮': '[CEP]',
    '🍽️': '[ITENS]',
    '🍽': '[ITENS]',
    '🔸': '•',
    '➕': '+ ',
    '💰': '[RESUMO]',
    '💵': 'R$',
    '🚚': '[ENTREGA]',
    '🧾': '[TOTAL]',
    '💳': '[PAGAMENTO]',
    '📝': '[OBS]',
    '🚀': '[DELIVERYX]',
    '⏰': '[HORARIO]',
    '📋': '[DETALHES]',
    '🏪': '[RESTAURANTE]',
    '🆔': '#',
    '❌': '[ERRO]',
    '💴': 'R$',
    '📱': '[PIX]',
    
    // Emojis de status
    '🍳': '[PREPARANDO]',
    '🏍️': '[ENTREGA]',
    '🛵': '[ENTREGADOR]',
    '✅': '[ENTREGUE]',
    '🔔': '[NOTIFICACAO]',
    '👋': 'Ola',
    '📦': '[PEDIDO]',
    '📊': '[STATUS]',
    '👨‍🍳': '[COZINHA]',
    '⏱️': '[TEMPO]',
    '⭐': '[AVALIACAO]',
    '😔': '',
    '📞': '[CONTATO]',
    '⏳': '[AGUARDE]',
    
    // Emojis extras que podem aparecer
    '😊': ':)',
    '😋': ':P',
    '🍕': '[PIZZA]',
    '🟢': '[WHATSAPP]'
  };

  let result = text;
  
  // Substituir emojis por texto
  Object.entries(emojiToTextMap).forEach(([emoji, textReplacement]) => {
    const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, textReplacement);
  });

  // Remover qualquer emoji restante usando ranges simples compatíveis
  result = result
    // Emojis básicos
    .replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]/g, '[EMOJI]') // Emojis Unicode
    .replace(/[\u2600-\u26FF]/g, '[EMOJI]')                // Símbolos diversos
    .replace(/[\u2700-\u27BF]/g, '[EMOJI]')                // Dingbats  
    .replace(/[\uFE00-\uFE0F]/g, '')                       // Variation selectors
    .replace(/\s+/g, ' ')                                  // Limpar espaços extras
    .trim();

  return result;
}

// Função principal que será usada nos componentes
export function encodeWhatsAppMessage(message: string): string {
  // Converter emojis para texto
  const textMessage = convertEmojiToText(message);
  
  // Codificar para URL
  return encodeURI(textMessage);
}
