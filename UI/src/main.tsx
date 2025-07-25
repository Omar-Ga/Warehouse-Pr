import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            padding: '16px',
            fontSize: '1.1rem',
          },
        }}
      />
    </AppProvider>
  </StrictMode>
);