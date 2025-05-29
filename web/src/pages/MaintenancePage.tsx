import React from 'react';
import { FiTool, FiSettings, FiAlertTriangle, FiClock } from 'react-icons/fi';

// Corrige o import para acessar a logo da pasta public
const logo = process.env.PUBLIC_URL ? process.env.PUBLIC_URL + '/logo192.png' : '/logo192.png';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-gray-800 p-4">
      <div className="bg-white/95 rounded-3xl shadow-2xl px-10 py-12 flex flex-col items-center max-w-xl w-full border-2 border-blue-200 relative">
        <img src={logo} alt="Logo DeliveryX" className="w-20 h-20 mb-5 drop-shadow-lg" />
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-blue-100 rounded-full p-4 shadow text-blue-400">
            <FiTool size={36} />
          </span>
          <span className="bg-blue-100 rounded-full p-4 shadow text-blue-400">
            <FiSettings size={36} />
          </span>
          <span className="bg-blue-100 rounded-full p-4 shadow text-blue-400">
            <FiClock size={36} />
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mb-3 text-blue-700 text-center tracking-tight drop-shadow">Manutenção Programada</h1>
        <p className="text-base mb-7 text-center text-gray-600 font-medium leading-relaxed">
          Estamos realizando melhorias e ajustes para oferecer uma experiência ainda melhor.<br />
          O sistema estará temporariamente indisponível.<br />
          <span className="text-blue-700 font-semibold">Agradecemos sua compreensão!</span>
        </p>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mt-2 shadow-inner">
          <FiAlertTriangle className="w-6 h-6 text-yellow-500" />
          <span className="text-blue-800 font-semibold text-base">Se você for administrador, faça login normalmente para acessar o sistema.</span>
        </div>
        {/* Removido o balãozinho azul "DeliveryX" */}
      </div>
    </div>
  );
};

export default MaintenancePage;
