// src/pages/TransacoesPage.jsx (CORRIGIDO)

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import FormCriarTransacao from '../components/FormCriarTransacao';
import axios from 'axios';
// (Removi o import do CSS Module, já que não o estamos a usar)

const API_BASE_URL = 'http://localhost:8080/api';

function formatarData(dataISO) {
  if (!dataISO) return '';
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function TransacoesPage() {
  // 1. A CORREÇÃO (PUXAR OS DADOS AQUI)
  // O seu código antigo estava a esquecer-se de puxar 'contas' e 'categorias'
  const { 
    contas, 
    categorias, 
    transacoes, 
    loading, 
    refreshDadosTransacao 
  } = useData();
  
  const { utilizador } = useAuth();
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const transacoesOrdenadas = useMemo(() => {
    return [...transacoes]
      .sort((a, b) => new Date(b.dataOperacao) - new Date(a.dataOperacao)); 
  }, [transacoes]);

  const visibleTransacoes = useMemo(() => {
    if (mostrarTodas) return transacoesOrdenadas;
    return transacoesOrdenadas.slice(0, 10);
  }, [transacoesOrdenadas, mostrarTodas]);

  const handleDeletar = async (transacaoId) => {
    // (A sua lógica de 'deletar' está correta)
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/transacoes/${transacaoId}`, {
        data: { clienteId: utilizador.id }
      });
      alert('Transação deletada com sucesso!');
      refreshDadosTransacao();
    } catch (error) {
      alert('Erro ao deletar: ' + (error.response?.data || 'Erro desconhecido.'));
    }
  };

  const mapCategorias = useMemo(() => new Map(categorias.map(c => [c.id, c.nome])), [categorias]);
  const mapContas = useMemo(() => new Map(contas.map(c => [c.id, c.nome])), [contas]);

  if (loading) return <div>A carregar dados...</div>;

  return (
    <>
      <div className="page-header">
        <h2>Histórico de Transações</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-secondary'}`}
        >
          {mostrarForm ? 'Fechar Formulário' : 'Adicionar Transação'}
        </button>
      </div>

      {mostrarForm && (
        <div className="card">
          
          {/* 2. A CORREÇÃO (PASSAR AS PROPS) */}
          <FormCriarTransacao
            clienteId={utilizador.id} // Passa o ID do utilizador
            contas={contas} // Passa a lista de contas
            categorias={categorias} // Passa a lista de categorias
            onTransacaoCriada={() => {
              refreshDadosTransacao();
              setMostrarForm(false);
            }}
          />
        </div>
      )}

      {/* 4. LISTA DE TRANSAÇÕES (sem mudança) */}
      <ul className="transacoes-list">
        {visibleTransacoes.length > 0 ? (
          visibleTransacoes.map(transacao => {
            const isReceita = transacao.valor >= 0; // Lógica corrigida (Passo 152)
            const nomeCategoria = mapCategorias.get(transacao.categoriaId) || 'Sem Categoria';
            const nomeConta = mapContas.get(transacao.contaId) || 'Conta Deletada';

            return (
              <li key={transacao.id} className="transacao-item">
                
                <div className={`transacao-icon ${isReceita ? 'receita' : 'despesa'}`}>
                  {isReceita ? '↑' : '↓'}
                </div>

                <div className="transacao-detalhes">
                  <strong>{transacao.descricao}</strong>
                  <p>{nomeCategoria} | {nomeConta}</p>
                </div>

                <div className="transacao-info">
                  <div className={`transacao-valor ${isReceita ? 'receita' : 'despesa'}`}>
                    {isReceita ? '+' : '-'} R$ {Math.abs(transacao.valor).toFixed(2)}
                  </div>
                  <div className="transacao-data">
                    {formatarData(transacao.dataOperacao)}
                  </div>
                </div>

                <button
                  onClick={() => handleDeletar(transacao.id)}
                  className="btn-deletar-transacao"
                  title="Deletar transação"
                >
                  &times;
                </button>
              </li>
            );
          })
        ) : (
          <li className="empty-state" style={{ padding: '2rem' }}>
            Nenhuma transação encontrada.
          </li>
        )}
      </ul>

      {/* ... (Botão "Mostrar todas") ... */}
    </>
  );
}

export default TransacoesPage;