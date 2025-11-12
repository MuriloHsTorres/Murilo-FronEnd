// src/context/DataContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Vamos precisar de saber quem está logado

const API_BASE_URL = 'http://localhost:8080/api';

// 1. Criar o Contexto
const DataContext = createContext(null);

// 2. Criar o "Provedor"
export function DataProvider({ children }) {
  const { utilizador } = useAuth(); // Lê o utilizador logado

  // O nosso estado global de DADOS
  const [contas, setContas] = useState([]);
  const [metas, setMetas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de "a carregar"

  // --- Funções de Fetch (Callbacks) ---

  const fetchContas = useCallback(async (clienteId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/contas/cliente/${clienteId}`);
      setContas(response.data);
      console.log('(DataCtx) Contas encontradas:', response.data);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  }, []);

  const fetchMetas = useCallback(async (clienteId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metas/cliente/${clienteId}`);
      setMetas(response.data);
      console.log('(DataCtx) Metas encontradas:', response.data);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    }
  }, []);

  const fetchTransacoes = useCallback(async (clienteId) => {
     try {
      const response = await axios.get(`${API_BASE_URL}/transacoes/cliente/${clienteId}`);
      setTransacoes(response.data);
      console.log('(DataCtx) Transações encontradas:', response.data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  }, []);

  const fetchCategorias = useCallback(async (clienteId) => {
    try {
      // O seu backend (CategoriaController) já lida com esta rota
      const response = await axios.get(`${API_BASE_URL}/categorias/cliente/${clienteId}`);
      setCategorias(response.data);
      console.log('(DataCtx) Categorias encontradas:', response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }, []);

  // --- Funções de "Refresh" ---
  
  const refreshDadosTransacao = useCallback(() => {
    if (utilizador) {
      fetchContas(utilizador.id);
      fetchTransacoes(utilizador.id);
    }
  }, [utilizador, fetchContas, fetchTransacoes]);
  
  const refreshMetas = useCallback(() => {
    if (utilizador) {
      fetchMetas(utilizador.id);
    }
  }, [utilizador, fetchMetas]);

  const refreshAposTransferencia = useCallback(() => {
    if (utilizador) {
      fetchContas(utilizador.id);
      fetchMetas(utilizador.id);
      fetchTransacoes(utilizador.id);
    }
  }, [utilizador, fetchContas, fetchMetas, fetchTransacoes]);

  const refreshContas = useCallback(() => {
    if (utilizador) {
      fetchContas(utilizador.id);
    }
  }, [utilizador, fetchContas]);

  // 1. ADICIONAR A NOVA FUNÇÃO DE REFRESH
  const refreshCategorias = useCallback(() => {
    if (utilizador) {
      fetchCategorias(utilizador.id); // Recarrega apenas a lista de categorias
    }
  }, [utilizador, fetchCategorias]);


  // --- O Efeito Principal ---
  useEffect(() => {
    if (utilizador) {
      const clienteId = utilizador.id;
      console.log('(DataCtx) A buscar todos os dados para o cliente ID:', clienteId);
      setLoading(true);
      
      Promise.all([
        fetchContas(clienteId),
        fetchMetas(clienteId),
        fetchTransacoes(clienteId),
        fetchCategorias(clienteId)
      ]).then(() => {
        setLoading(false);
      });
    } else {
      setContas([]);
      setMetas([]);
      setTransacoes([]);
      setCategorias([]);
      setLoading(false);
    }
  }, [utilizador, fetchContas, fetchMetas, fetchTransacoes, fetchCategorias]);

  
  // O 'value' é o que partilhamos com toda a app
  const value = {
    contas,
    metas,
    transacoes,
    categorias,
    loading,
    refreshDadosTransacao,
    refreshMetas,
    refreshAposTransferencia,
    refreshContas,
    refreshCategorias // 2. EXPOR A NOVA FUNÇÃO
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// 3. Criar o "Consumidor" (Hook)
export function useData() {
  return useContext(DataContext);
}