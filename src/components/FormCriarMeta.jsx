import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/metas';

function FormCriarMeta({ clienteId, onMetaCriada }) {
  const [nome, setNome] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      clienteId,
      nome,
      valorAlvo: parseFloat(valorAlvo),
      valorAtual: 0, // Meta começa com 0
      tipoMeta: 'ECONOMIA' // Tipo padrão
    };
    try {
      await axios.post(API_URL, payload);
      alert('Meta criada com sucesso!');
      onMetaCriada();
      setNome('');
      setValorAlvo('');
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      alert('Erro ao criar meta.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Criar Nova Meta (Cofrinho)</h4>
      <div className="form-group">
        <label>Nome da Meta (ex: Viagem, Carro Novo)</label>
        <input
          type="text"
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Minha viagem para a praia..."
          required
        />
      </div>
      <div className="form-group">
        <label>Valor Alvo (R$)</label>
        <input
          type="number"
          step="0.01"
          min="1"
          className="form-control"
          value={valorAlvo}
          onChange={(e) => setValorAlvo(e.target.value)}
          placeholder="Insira um valor aqui..."
          required
        />
      </div>
      <button type="submit" className="btn btn-primary w-100">
        Salvar Meta
      </button>
    </form>
  );
}
export default FormCriarMeta;