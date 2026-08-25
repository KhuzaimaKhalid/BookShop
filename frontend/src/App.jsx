import React from 'react';
import { HashRouter } from 'react-router-dom';   // was BrowserRouter
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <HashRouter>                                   
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>                                
  );
}

export default App;