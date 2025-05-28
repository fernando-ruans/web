import React, { useState, useEffect } from 'react';
import { FaVolumeUp, FaVolumeMute, FaCog, FaPlay } from 'react-icons/fa';
import { useNotificationSound } from '../hooks/useNotificationSound';

interface NotificationSettingsProps {
  onSettingsChange?: (settings: NotificationSettings) => void;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
  showDesktopNotifications: boolean;
}

const STORAGE_KEY = 'lojista-notification-settings';

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    volume: 0.8,
    showDesktopNotifications: true
  });

  const { testSound, isSupported, hasUserInteracted } = useNotificationSound({
    enabled: settings.soundEnabled,
    volume: settings.volume
  });

  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        onSettingsChange?.(parsedSettings);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, [onSettingsChange]);

  // Salvar configurações
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    onSettingsChange?.(updatedSettings);
  };

  const handleTestSound = () => {
    testSound();
  };

  if (!isOpen) {
    return (      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        title="Configurações de Notificação"
      >
        <FaCog color="white" size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Som */}        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.soundEnabled ? <FaVolumeUp color="#f97316" size={16} /> : <FaVolumeMute color="#9ca3af" size={16} />}
            <span className="text-sm font-medium">Alerta Sonoro</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Volume */}
        {settings.soundEnabled && (
          <div className="ml-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Volume</span>              <button
                onClick={handleTestSound}
                disabled={!isSupported || !hasUserInteracted}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <FaPlay color={!isSupported || !hasUserInteracted ? "#9ca3af" : "#f97316"} size={10} />
                Testar
              </button>
            </div>            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${settings.volume * 100}%, #e5e7eb ${settings.volume * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="text-xs text-gray-500 mt-1">{Math.round(settings.volume * 100)}%</div>
          </div>
        )}

        {/* Status do áudio */}
        {settings.soundEnabled && (
          <div className="ml-6 text-xs space-y-1">
            <div className={`flex items-center gap-2 ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isSupported ? 'Áudio suportado' : 'Áudio não suportado'}
            </div>
            <div className={`flex items-center gap-2 ${hasUserInteracted ? 'text-green-600' : 'text-orange-600'}`}>
              <div className={`w-2 h-2 rounded-full ${hasUserInteracted ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              {hasUserInteracted ? 'Pronto para tocar' : 'Clique em qualquer lugar'}
            </div>
          </div>
        )}

        {/* Notificações do navegador */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-medium">Notificações Desktop</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showDesktopNotifications}
              onChange={(e) => updateSettings({ showDesktopNotifications: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
