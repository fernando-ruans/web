import React from 'react';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4 text-yellow-400">Estamos em manutenção</h1>
      <p className="text-lg mb-6">O sistema está passando por uma manutenção programada.<br />Por favor, tente novamente mais tarde.</p>
      <span className="text-gray-400">Se você for administrador, faça login normalmente para acessar o sistema.</span>
    </div>
  );
};

export default MaintenancePage;
