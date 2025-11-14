// src/components/ModalEditarConta.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

function ModalEditarConta({ conta, onClose, onSave }) {
  const [nome, setNome] = useState(conta.nome);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Enviamos APENAS o nome. O saldo não é enviado.
      // O backend deve ser capaz de ignorar campos nulos ou você pode enviar o objeto completo sem alterar o saldo.
      // Aqui, assumimos que o PUT aceita atualizar apenas o nome.
      const payload = {
        nome: nome,
        clienteId: conta.clienteId, 
        // Mantemos o saldo original no payload APENAS se o backend exigir o objeto completo,
        // mas o utilizador não o alterou.
        saldoAtual: conta.saldoAtual, 
        tipo: conta.tipo
      };

      await axios.put(`${API_BASE_URL}/contas/${conta.id}`, payload);
      
      onSave(); // Atualiza a lista na página pai
      onClose(); // Fecha o modal
    } catch (error) {
      alert('Erro ao atualizar conta: ' + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3
        style={{ 
                margin: '0 0 5px 0'
              }}
        >Editar Conta</h3>
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '1rem' }}>
            <label
            style={{ 
                margin: '5px 0 0 0'
              }}
            >Nome da Conta</label>
            <input 
              type="text" 
              className="form-control"
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required
              style={{ 
                margin: '5px 0 0 0'
              }}
            />
          </div>

          {/* 2. Campo de Saldo BLOQUEADO (Apenas leitura) */}
          <div style={{ marginBottom: '1rem' }}>
            <label>Saldo Atual (Bloqueado)</label>
            <br />
            <input 
              type="text" 
              className="form-control"
              value={`R$ ${conta.saldoAtual.toFixed(2)}`} // Mostra formatado
              disabled // Impede edição
              style={{ 
                margin: '5px',
                backgroundColor: '#dededeff', // Fundo mais escuro para indicar bloqueio
                color: '#383838ff', 
                cursor: 'not-allowed',
                border: '1px solid #444'
              }} 
            />
            <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>
              Para alterar o saldo, adicione uma Receita ou Despesa.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'A Salvar...' : 'Guardar Alterações'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ModalEditarConta;