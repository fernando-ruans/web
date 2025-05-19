import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white/90 border-t border-orange-100 py-4 shadow-inner fixed bottom-0 left-0 z-30">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2 text-sm text-gray-500">
        <span>&copy; {new Date().getFullYear()} DeliveryX. Todos os direitos reservados.</span>
        <span>Feito com <span className="text-orange-500">♥</span> por sua equipe</span>
      </div>
    </footer>
  );
}
