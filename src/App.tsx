import React from 'react';
import logo from './logo.svg';
import './App.css';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold text-blue-400 mb-4">Tailwind funcionando!</h1>
      <p className="text-gray-200">Edite <code>src/App.tsx</code> e salve para recarregar.</p>
      <a className="text-blue-500 underline mt-4" href="https://tailwindcss.com/docs/installation" target="_blank" rel="noopener noreferrer">Documentação Tailwind</a>
    </div>
  );
}

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
