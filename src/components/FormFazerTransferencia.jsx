// src/components/FormFazerTransferencia.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/transferencias';

function FormFazerTransferencia({ onTransferenciaFeita }) {
  const { utilizador } = useAuth();
  const { contas } = useData();

  // Estados do formulário
  const [contaOrigemId, setContaOrigemId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Filtra contas (só pode transferir de/para CONTA_CORRENTE)
  const contasCorrente = contas.filter(
    c => c.tipoConta === 'CONTA_CORRENTE'
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (contaOrigemId === contaDestinoId) {
      alert('A conta de origem e destino não podem ser as mesmas.');
      return;
    }

    const payload = {
      clienteId: utilizador.id,
      contaOrigemId: parseInt(contaOrigemId),
      contaDestinoId: parseInt(contaDestinoId),
      valor: parseFloat(valor),
      dataTransferencia: new Date(data + 'T12:00:00').toISOString()
    };

    try {
      // Este endpoint é um palpite (pode ser /transferir)
      await axios.post(`${API_URL}/conta-para-conta`, payload);
      alert('Transferência realizada com sucesso!');
      onTransferenciaFeita(); // Chama a função de "refresh"
      
      // Limpa o formulário
      setContaOrigemId('');
      setContaDestinoId('');
      setValor('');

    } catch (error) {
      console.error('Erro ao fazer transferência:', error.response?.data);
      alert('Erro ao transferir: ' + (error.response?.data || 'Verifique os saldos.'));
    }
  };

  return (
    // O formulário em grid
    <form onSubmit={handleSubmit} className="form-fazer-transferencia">
      
      <div className="form-group">
        <label>De (Conta Origem)</label>
        <select
          className="form-control"
          value={contaOrigemId}
          onChange={(e) => setContaOrigemId(e.target.value)}
          required
        >
          <option value="">Selecione a conta de origem</option>
          {contasCorrente.map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome} (Saldo: R$ {conta.saldoAtual.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Para (Conta Destino)</label>
        <select
          className="form-control"
          value={contaDestinoId}
          onChange={(e) => setContaDestinoId(e.target.value)}
          required
        >
          <option value="">Selecione a conta de destino</option>
          {contasCorrente.map(conta => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="form-control"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="form-group">
        <label>Data</label>
        <input
          type="date"
          className="form-control"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </div>

      {/* Ocupa as duas colunas */}
      <div className="form-group form-group-full form-group-submit">
        <button type="submit" className="btn btn-primary w-100">
          Confirmar Transferência
        </button>
      </div>
    </form>
  );
}
export default FormFazerTransferencia;