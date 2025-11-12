import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/transferencias';

function FormSacarDaMeta({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [valor, setValor] = useState('');
  const [contaId, setContaId] = useState(contasCorrente[0]?.id || '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (contasCorrente.length === 0) {
      alert('Você precisa ter uma conta corrente para sacar o dinheiro.');
      return;
    }

    const payload = {
      clienteId,
      metaOrigemId: meta.id,
      contaDestinoId: contaId,
      valor: parseFloat(valor)
    };

    try {
      await axios.post(`${API_URL}/sacar`, payload);
      alert('Valor sacado com sucesso!');
      onTransferenciaFeita();
    } catch (error) {
      console.error('Erro ao sacar valor:', error);
      alert('Erro ao sacar: ' + (error.response?.data || 'Verifique o valor na meta.'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Valor a Sacar (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="form-control"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="50.00"
          required
        />
      </div>
      <div className="form-group">
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
                {conta.nome} (Saldo: R$ {conta.saldoAtual.toFixed(2)})
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