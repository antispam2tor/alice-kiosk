import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ActivatePage } from './pages/ActivatePage';
import { KioskPage } from './pages/KioskPage';
import { AdminPage } from './pages/AdminPage';
import './styles.css';

function App() {
  return (
    <Routes>
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/activate" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
);
