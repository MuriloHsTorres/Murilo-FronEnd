// src/context/AuthContext.jsx

import React, { createContext, useState, useContext } from 'react';

// 1. Criar o Contexto
// Isto é como criar a "caixa" que vai guardar os dados
const AuthContext = createContext(null);

// 2. Criar o "Provedor" (Provider)
// Este é o componente que vai "embrulhar" a nossa aplicação
// e fornecer os dados de login a todos os componentes-filhos.
export function AuthProvider({ children }) {
  const [utilizador, setUtilizador] = useState(null); // 'null' = deslogado

  // Função para o LoginPage chamar
  const login = (dadosUtilizador) => {
    // dadosUtilizador será o objeto que a nossa API retorna (id, nome, email)
    setUtilizador(dadosUtilizador);
    // TODO: Poderíamos guardar isto no localStorage para manter o login
  };

  // Função para o botão de "Sair" chamar
  const logout = () => {
    setUtilizador(null);
    // TODO: Limpar o localStorage
  };

  // O 'value' é o que partilhamos com toda a app:
  // - O 'utilizador' (null ou o objeto)
  // - A função 'login'
  // - A função 'logout'
  const value = { utilizador, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Criar o "Consumidor" (Hook)
// Este é um atalho que os nossos componentes (como o App.jsx)
// usarão para "ler" os dados da "caixa".
export function useAuth() {
  return useContext(AuthContext);
}