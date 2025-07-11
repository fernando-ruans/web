import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import RootApp from './App';
import reportWebVitals from './reportWebVitals';
import RouterApp from './RouterApp';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WebSocketProvider } from './context/WebSocketContext';

import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <WebSocketProvider>
          <RouterApp />
        </WebSocketProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
