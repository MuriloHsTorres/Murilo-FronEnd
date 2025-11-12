// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext' // 1. IMPORTAR
import { BrowserRouter } from 'react-router-dom'; // 2. IMPORTAR O ROUTER

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. "EMBRULHAR" COM O ROUTER (nível mais alto) */}
    <BrowserRouter>
      <AuthProvider>
        {/* 4. "EMBRULHAR" COM O DATA_PROVIDER (dentro do Auth) */}
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)