// src/components/FormCriarConta.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Recebe o clienteId e a função de refresh
function FormCriarConta({ clienteId, onContaCriada }) {
  const [nome, setNome] = useState('');
  const [saldoAbertura, setSaldoAbertura] = useState('');
  // Adicionamos tipo de conta para o formulário
  const [tipoConta, setTipoConta] = useState('CONTA_CORRENTE'); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const payload = {
      clienteId: clienteId,
      nome: nome,
      saldoAbertura: parseFloat(saldoAbertura),
      tipoConta: tipoConta 
    };

    try {
      await axios.post(`${API_BASE_URL}/contas`, payload);
      alert('Conta criada com sucesso!');
      onContaCriada(); // Chama a função de "refresh"
      
      // Limpa o formulário
      setNome('');
      setSaldoAbertura('');
      setTipoConta('CONTA_CORRENTE');

    } catch (error) {
      console.error('Erro ao criar conta:', error.response.data);
      alert('Erro ao criar conta: ' + error.response.data);
    }
  };

  return (
    // Aplicamos as classes de formulário (form-group, form-control, btn)
    <form onSubmit={handleSubmit}>
      <h4>Adicionar Nova Conta</h4>

      <div className="form-group">
        <label>Nome da Conta (ex: Nubank, Bradesco)</label>
        <input
          type="text"
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Inter"
          required
        />
      </div>

      <div className="form-group">
        <label>Saldo de Abertura (R$)</label>
        <input
          type="number"
          step="0.01"
          className="form-control"
          value={saldoAbertura}
          onChange={(e) => setSaldoAbertura(e.target.value)}
          placeholder="Ex: 0.00"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Salvar Conta
      </button>
    </form>
  );
}

export default FormCriarConta;