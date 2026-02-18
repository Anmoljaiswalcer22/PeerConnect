import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initThemeSync } from './stores/themeStore';
import './styles/index.css';

initThemeSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
