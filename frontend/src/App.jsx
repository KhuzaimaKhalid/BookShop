import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';   // was BrowserRouter
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import api from './services/api';

function App() {
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const res = await api.get('/business/name');
        if (res?.data?.business?.name) {
          document.title = res.data.business.name;
        }
      } catch (err) {
        console.error('Failed to fetch business name for title:', err);
      }
    };

    fetchBusinessName();
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;