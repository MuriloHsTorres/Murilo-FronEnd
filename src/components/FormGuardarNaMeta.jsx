// src/components/FormGuardarNaMeta.jsx (Corrigido)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 1. A URL CORRETA (do seu código antigo)
const API_URL = 'http://localhost:8080/api/transferencias'; 

function FormGuardarNaMeta({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [valor, setValor] = useState('');
  const [contaId, setContaId] = useState('');

  // Auto-seleciona a primeira conta da lista
  useEffect(() => {
    if (contasCorrente && contasCorrente.length > 0 && !contaId) {
      setContaId(contasCorrente[0].id);
    }
  }, [contasCorrente, contaId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!contaId) {
        alert('Erro: Nenhuma conta de origem selecionada.');
        return;
    }
    // Verifica se o ID da conta-cofrinho existe
    if (!meta.contaAssociadaId) {
        alert('Erro: Esta meta não tem uma conta associada. (contaAssociadaId está nulo)');
        return;
    }

    // 2. O PAYLOAD CORRETO (baseado no seu código antigo)
    const payload = {
      clienteId: clienteId,
      contaOrigemId: contaId,       
      
      // 3. A MUDANÇA CRÍTICA: Usamos o ID da conta associada
      contaDestinoId: meta.contaAssociadaId, 
      
      valor: parseFloat(valor),
      
      // 4. A DATA (formato ISO/LocalDateTime que o Java aceita)
      dataOperacao: new Date().toISOString().slice(0, 19)
      
      // Não precisamos de 'tipo' ou 'categoriaId' nesta rota
    };

    console.log("📤 Payload (Final) Enviado para /api/transferencias:", payload);

    try {
      await axios.post(API_URL, payload);
      alert(`Sucesso! Guardou R$ ${valor} na meta.`);
      setValor('');
      if (onTransferenciaFeita) onTransferenciaFeita();

    } catch (error) {
      console.error('❌ Erro:', error);
      let msg = "Erro desconhecido";
      if (error.response) {
          console.log("Dados do erro:", error.response.data);
          // O erro agora deve ser "Saldo insuficiente" se for o caso
          msg = error.response.data.message || error.response.data;
      } else {
          msg = "Servidor não respondeu.";
      }
      alert(`Erro ao guardar: ${msg}`);
    }
  };

  if (!contasCorrente || contasCorrente.length === 0) {
      return (
          <div className="alert alert-warning p-2 text-center">
              <small>Nenhuma conta corrente encontrada para transferir.</small>
          </div>
      );
  }

  return (
    
    <form onSubmit={handleSubmit} className="p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
      
      <div className="form-group mb-3">
        <label style={{fontWeight: 'bold', color: '#2ecc71', fontSize: '0.9em'}}>Quanto quer guardar?</label>
        <div className="input-group">
            <span className="input-group-text" style={{backgroundColor: '#e8f5e9', color: '#2ecc71', fontWeight: 'bold'}}>R$</span>
            <input
            type="number"
            step="0.01"
            min="0.01"
            className="form-control"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0.00"
            required
            autoFocus
            />
        </div>
      </div>
      <div className="form-group mb-3">
        <label style={{fontSize: '0.9em'}}>Tirar de qual conta?</label>
        <select
          className="form-control"
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
          required
        >
          <option value="" disabled={!!contaId}>Selecione a conta...</option>
          {contasCorrente.map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} (Saldo: R$ {conta.saldoAtual?.toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn w-100" style={{ backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold', border: 'none' }}>
        Confirmar Depósito
      </button>
    </form>
  );
}

export default FormGuardarNaMeta;