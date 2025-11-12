// src/pages/TransferenciasPage.jsx (CORRIGIDO)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext'; // 1. IMPORTAR useData
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:8080/api';

function TransferenciasPage() {
  const { utilizador } = useAuth();

  // 2. A CORREÇÃO (PUXAR AS FUNÇÕES CORRETAS)
  const { 
    contas, 
    loading, 
    refreshContas,         // <-- A função de atualizar Contas
    refreshDadosTransacao  // <-- A função de atualizar Transações
  } = useData();

  // --- Estados (sem mudança) ---
  const [contaOrigemId, setContaOrigemId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataOperacao, setDataOperacao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  // --- handleSubmit (COM A CORREÇÃO) ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (contaOrigemId === contaDestinoId) {
        alert('A conta de origem e destino não podem ser a mesma.');
        return;
    }

    const payload = {
      clienteId: utilizador.id,
      contaOrigemId: contaOrigemId,
      contaDestinoId: contaDestinoId,
      valor: parseFloat(valor),
      descricao: descricao,
      dataOperacao: dataOperacao
    };

    try {
      await axios.post(`${API_BASE_URL}/transferencias`, payload);
      alert('Transferência realizada com sucesso!');

      // 3. A CORREÇÃO (Chamar as duas funções)
      refreshContas();         // Atualiza os saldos das contas
      refreshDadosTransacao(); // Atualiza a lista de transações

      // Limpa o formulário
      setContaOrigemId('');
      setContaDestinoId('');
      setValor('');
      setDescricao('');

    } catch (error) {
      // Agora este 'catch' só será executado se a *transferência* falhar
      const msg = error.response?.data?.message || error.response?.data || "Erro desconhecido";
      alert('Erro ao realizar transferência: ' + msg);
    }
  };

  if (loading) return <p>A carregar contas...</p>;

  // --- JSX (sem mudança, usa as classes globais) ---
  return (
    <div>
      <h2>Transferência entre Contas</h2>

      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Conta de Origem:</label>
          <select 
            value={contaOrigemId} 
            onChange={(e) => setContaOrigemId(e.target.value)} 
            className="form-control" 
            required
          >
            <option value="" disabled>Selecione a conta de origem...</option>
            {/* (A correção do Passo 155, de remover o filtro, continua aqui) */}
            {contas && contas.length > 0 ? (
              contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} (Saldo: R$ {conta.saldoAtual.toFixed(2)})
                </option>
              ))
            ) : (
               <option value="" disabled>Nenhuma conta encontrada</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Conta de Destino:</label>
          <select 
            value={contaDestinoId} 
            onChange={(e) => setContaDestinoId(e.target.value)} 
            className="form-control" 
            required
          >
            <option value="" disabled>Selecione a conta de destino...</option>
            {contas && contas.length > 0 ? (
              contas.map(conta => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} (Saldo: R$ {conta.saldoAtual.toFixed(2)})
                </option>
              ))
            ) : (
               <option value="" disabled>Nenhuma conta encontrada</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Valor (R$):</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="form-control"
            placeholder="100.00"
            required
          />
        </div>
        <div className="form-group">
          <label>Descrição (Opcional):</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="form-control"
            placeholder="Ex: Transferência para poupança"
          />
        </div>
        <div className="form-group">
          <label>Data e Hora:</label>
          <input
            type="datetime-local"
            value={dataOperacao}
            onChange={(e) => setDataOperacao(e.target.value)}
            className="form-control"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Realizar Transferência
        </button>

      </form>
    </div>
  );
}

export default TransferenciasPage;