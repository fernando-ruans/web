import { useEffect, useRef, useState } from 'react';

interface UseNotificationSoundOptions {
  enabled?: boolean;
  volume?: number;
  soundPath?: string;
}

export const useNotificationSound = (options: UseNotificationSoundOptions = {}) => {
  const {
    enabled = true,
    volume = 0.8,
    soundPath = '/sounds/orderSound.mp3'
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Inicializar o áudio
  useEffect(() => {
    try {
      audioRef.current = new Audio(soundPath);
      audioRef.current.volume = volume;
      audioRef.current.preload = 'auto';
      
      // Verificar se o áudio pode ser carregado
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Som de notificação carregado com sucesso');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Erro ao carregar som de notificação:', e);
        setIsSupported(false);
      });
    } catch (error) {
      console.error('Erro ao inicializar áudio:', error);
      setIsSupported(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplaythrough', () => {});
        audioRef.current.removeEventListener('error', () => {});
      }
    };
  }, [soundPath, volume]);

  // Detectar primeira interação do usuário (necessário para autoplay)
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      // Remover listeners após primeira interação
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const playSound = async () => {
    if (!enabled || !isSupported || !hasUserInteracted || !audioRef.current) {
      console.log('Som não pode ser reproduzido:', {
        enabled,
        isSupported,
        hasUserInteracted,
        audioExists: !!audioRef.current
      });
      return false;
    }

    try {
      // Reset do áudio para permitir reprodução múltipla
      audioRef.current.currentTime = 0;
      
      // Tentar reproduzir o som
      await audioRef.current.play();
      console.log('Som de novo pedido reproduzido');
      return true;
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
      return false;
    }
  };

  const testSound = () => {
    playSound();
  };

  return {
    playSound,
    testSound,
    isSupported,
    hasUserInteracted,
    enabled: enabled && isSupported && hasUserInteracted
  };
};
