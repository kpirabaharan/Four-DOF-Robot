import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Toaster } from '@/components/ui/toaster.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute='class' defaultTheme='dark'>
      <Toaster />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
