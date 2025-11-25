// src/components/FormSacarDaMeta.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Usamos a mesma rota que funcionou no "Guardar"
const API_URL = 'http://localhost:8080/api/transferencias'; 

function FormSacarDaMeta({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [valor, setValor] = useState('');
  const [contaId, setContaId] = useState(''); // ID da conta de DESTINO (Sua conta corrente)

  // Auto-seleciona a primeira conta da lista (Melhoria de usabilidade)
  useEffect(() => {
    if (contasCorrente && contasCorrente.length > 0 && !contaId) {
      setContaId(contasCorrente[0].id);
    }
  }, [contasCorrente, contaId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (contasCorrente.length === 0) {
      alert('Você precisa ter uma conta corrente para receber o saque.');
      return;
    }

    if (!contaId) {
        alert('Selecione para qual conta o dinheiro deve ir.');
        return;
    }

    // Validação de saldo
    if (parseFloat(valor) > meta.valorAtual) {
        alert('Erro: Saldo insuficiente na meta para este saque.');
        return;
    }

    // --- PAYLOAD CORRIGIDO ---
    // Invertemos a lógica do "Guardar":
    // Origem = Meta (contaAssociadaId)
    // Destino = Sua Conta (contaId)
    const payload = {
      clienteId,
      contaOrigemId: meta.contaAssociadaId, 
      contaDestinoId: contaId,
      valor: parseFloat(valor),
      dataOperacao: new Date().toISOString().slice(0, 19)
    };

    console.log("📤 Payload de Saque:", payload);

    try {
      await axios.post(API_URL, payload);
      alert('Valor sacado com sucesso!');
      
      setValor(''); // Limpa o campo
      if (onTransferenciaFeita) onTransferenciaFeita(); // Atualiza a tela

    } catch (error) {
      console.error('Erro ao sacar valor:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Erro desconhecido.';
      alert('Erro ao sacar: ' + msg);
    }
  };

  // --- VISUAL ORIGINAL (Limpo) ---
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-2">
        <label>Valor a Sacar (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={meta.valorAtual} // Impede digitar mais do que tem
          className="form-control"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0.00"
          required
        />
        <small className="text-muted" style={{fontSize: '0.8em'}}>
            Disponível: R$ {meta.valorAtual.toFixed(2)}
        </small>
      </div>

      <div className="form-group mb-3">
        <label>Enviar para a Conta:</label>
        <select
          className="form-control"
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
          required
        >
          {contasCorrente.length > 0 ? (
            contasCorrente.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} (Saldo: R$ {conta.saldoAtual?.toFixed(2)})
              </option>
            ))
          ) : (
            <option disabled>Nenhuma conta corrente encontrada</option>
          )}
        </select>
      </div>

      <button type="submit" className="btn btn-danger w-100">
        Confirmar Saque
      </button>
    </form>
  );
}
export default FormSacarDaMeta;