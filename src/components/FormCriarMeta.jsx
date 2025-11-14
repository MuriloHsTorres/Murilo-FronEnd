// src/components/FormCriarMeta.jsx

import React, { useState } from 'react';
import axios from 'axios';

// A URL MÁGICA: Voltamos para /metas, pois é lá que o seu backend cria tudo certo.
const API_URL = 'http://localhost:8080/api/metas'; 

function FormCriarMeta({ clienteId, onMetaCriada }) {
  const [nome, setNome] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [dataAlvo, setDataAlvo] = useState(''); // Este campo é obrigatório na rota /metas

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!clienteId) {
      alert("Erro: Cliente não identificado. Tente recarregar a página.");
      return;
    }

    // Payload baseado no SEU código antigo que funcionava
    const payload = {
      clienteId: clienteId,
      nome: nome,
      valorAlvo: parseFloat(valorAlvo),
      dataAlvo: dataAlvo // O backend precisa disto para calcular metas
    };

    console.log("Enviando para /api/metas:", payload);

    try {
      await axios.post(API_URL, payload);
      
      alert('Meta criada com sucesso!');
      
      // Atualiza a dashboard
      if (onMetaCriada) onMetaCriada();
      
      // Limpa os campos
      setNome('');
      setValorAlvo('');
      setDataAlvo('');
      
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      const msgErro = error.response?.data || error.message;
      alert('Erro ao criar meta: ' + msgErro);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3 mb-3">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 >Criar Nova Meta:</h3>
      </div>
      <br />
      
      {/* Campo Nome */}
      <div className="form-group mb-2">
        <label>Nome do Objetivo</label>
        <input
          type="text"
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: PlayStation 5"
          required
        />
      </div>
      
      {/* Campo Valor */}
      <div className="form-group mb-2">
        <label>Valor Alvo (R$)</label>
        <input
          type="number"
          step="0.01"
          className="form-control"
          value={valorAlvo}
          onChange={(e) => setValorAlvo(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      {/* Campo Data (Recuperado do código antigo) */}
      <div className="form-group mb-3">
        <label>Data Alvo</label>
        <input 
          type="date" 
          className="form-control"
          value={dataAlvo}
          onChange={(e) => setDataAlvo(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className={"btn-primary"}>
        Criar Meta
      </button>
      
      <br />
      <br />
      <hr />
      <br />
    </form>
  );
}

export default FormCriarMeta;