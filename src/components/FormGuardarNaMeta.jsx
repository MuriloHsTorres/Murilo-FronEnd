import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/transferencias';

function FormGuardarNaMeta({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [valor, setValor] = useState('');
  // Define a primeira conta como padrão, se existir
  const [contaId, setContaId] = useState(contasCorrente[0]?.id || '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (contasCorrente.length === 0) {
      alert('Você precisa ter uma conta corrente para guardar dinheiro.');
      return;
    }

    const payload = {
      clienteId,
      contaOrigemId: contaId,
      metaDestinoId: meta.id,
      valor: parseFloat(valor)
    };

    try {
      await axios.post(`${API_URL}/guardar`, payload);
      alert('Valor guardado com sucesso!');
      onTransferenciaFeita();
    } catch (error) {
      console.error('Erro ao guardar valor:', error);
      alert('Erro ao guardar: ' + (error.response?.data || 'Verifique seu saldo.'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Valor a Guardar (R$)</label>
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
        <label>Tirar da Conta:</label>
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
      <button type="submit" className="btn btn-success w-100">
        Confirmar Depósito
      </button>
    </form>
  );
}
export default FormGuardarNaMeta;