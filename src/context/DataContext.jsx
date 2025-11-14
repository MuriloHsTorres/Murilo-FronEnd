import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; 

const API_BASE_URL = 'http://localhost:8080/api';

// 1. Criar o Contexto
const DataContext = createContext(null);

// 2. Criar o "Provedor"
export function DataProvider({ children }) {
  // --- CORREÇÃO PRINCIPAL AQUI ---
  // Tentamos pegar 'user'. Se o seu AuthContext usa 'utilizador', nós renomeamos aqui para padronizar.
  // Assim garantimos que funciona independentemente do nome lá.
  const { user, utilizador } = useAuth();
  
  // Quem é o cliente logado? (Usa o que estiver disponível)
  const usuarioLogado = user || utilizador; 

  // O nosso estado global de DADOS
  const [contas, setContas] = useState([]);
  const [metas, setMetas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true); 

  // --- Funções de Fetch (Callbacks) ---

  const fetchContas = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/contas/cliente/${id}`);
      setContas(response.data);
      console.log('✅ (DataCtx) Contas:', response.data.length);
    } catch (error) {
      console.error('❌ (DataCtx) Erro Contas:', error);
    }
  }, []);

  const fetchMetas = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metas/cliente/${id}`);
      setMetas(response.data);
    } catch (error) {
      console.error('❌ (DataCtx) Erro Metas:', error);
    }
  }, []);

  const fetchTransacoes = useCallback(async (id) => {
     try {
      const response = await axios.get(`${API_BASE_URL}/transacoes/cliente/${id}`);
      setTransacoes(response.data);
    } catch (error) {
      console.error('❌ (DataCtx) Erro Transações:', error);
    }
  }, []);

  const fetchCategorias = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categorias/cliente/${id}`);
      setCategorias(response.data);
      console.log('✅ (DataCtx) Categorias:', response.data.length);
    } catch (error) {
      console.error('❌ (DataCtx) Erro Categorias:', error);
    }
  }, []);

  // --- Funções de "Refresh" (Públicas) ---
  
  const refreshDadosTransacao = useCallback(() => {
    if (usuarioLogado) {
      fetchContas(usuarioLogado.id);
      fetchTransacoes(usuarioLogado.id);
    }
  }, [usuarioLogado, fetchContas, fetchTransacoes]);
  
  const refreshMetas = useCallback(() => {
    if (usuarioLogado) {
      fetchMetas(usuarioLogado.id);
    }
  }, [usuarioLogado, fetchMetas]);

  const refreshAposTransferencia = useCallback(() => {
    if (usuarioLogado) {
      fetchContas(usuarioLogado.id);
      fetchMetas(usuarioLogado.id);
      fetchTransacoes(usuarioLogado.id);
    }
  }, [usuarioLogado, fetchContas, fetchMetas, fetchTransacoes]);

  const refreshContas = useCallback(() => {
    if (usuarioLogado) {
      fetchContas(usuarioLogado.id);
    }
  }, [usuarioLogado, fetchContas]);

  const refreshCategorias = useCallback(() => {
    if (usuarioLogado) {
      fetchCategorias(usuarioLogado.id);
    }
  }, [usuarioLogado, fetchCategorias]);


  // --- O Efeito Principal (Vigia o Login) ---
  useEffect(() => {
    if (usuarioLogado) {
      const id = usuarioLogado.id;
      console.log('🔄 (DataCtx) Login detectado. Buscando dados para ID:', id);
      setLoading(true);
      
      Promise.all([
        fetchContas(id),
        fetchMetas(id),
        fetchTransacoes(id),
        fetchCategorias(id)
      ]).then(() => {
        setLoading(false);
        console.log('✨ (DataCtx) Dados carregados com sucesso.');
      });
    } else {
      // Logout: Limpa tudo
      console.log('👋 (DataCtx) Sem usuário. Limpando dados.');
      setContas([]);
      setMetas([]);
      setTransacoes([]);
      setCategorias([]);
      setLoading(false);
    }
  }, [usuarioLogado, fetchContas, fetchMetas, fetchTransacoes, fetchCategorias]);

  
  // O 'value' é o que partilhamos com toda a app
  const value = {
    clienteId: usuarioLogado?.id, // <-- Adicionei isto para facilitar o acesso ao ID
    contas,
    metas,
    transacoes,
    categorias,
    loading,
    refreshDadosTransacao,
    refreshMetas,
    refreshAposTransferencia,
    refreshContas,
    refreshCategorias
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// 3. Hook
export function useData() {
  return useContext(DataContext);
}