import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker
registerSW({
    onNeedRefresh() {
        console.log('App out of date, please refresh');
    },
    onOfflineReady() {
        console.log('App ready to work offline');
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
