// src/pages/ContasPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import FormCriarConta from '../components/FormCriarConta';
import ModalEditarConta from '../components/ModalEditarConta'; // Importar o Modal
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

function ContasPage() {
  const { contas, loading, refreshContas } = useData();
  const { utilizador } = useAuth();
  
  // Estado para controlar qual conta estamos a editar (null = nenhuma)
  const [contaParaEditar, setContaParaEditar] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Tem a certeza? Isso pode apagar o histórico desta conta.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/contas/${id}`);
      alert("Conta excluída!");
      refreshContas();
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  if (loading) return <div>A carregar dados...</div>;

  // Pode remover o .filter se quiser ver todas, ou manter
  const listaContas = contas; 

  return (
    <div>
      <div className="page-header">
        <h2>Gestão de Contas</h2>
      </div>

      {/* Formulário de Criação (Fica sempre no topo) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <FormCriarConta 
          clienteId={utilizador.id} 
          onContaCriada={refreshContas} 
        />
      </div>

      <hr className="divider" />

      <h3>Minhas Contas ({listaContas.length})</h3>

      {/* GRID ORGANIZADO (Usa as classes do style.css) */}
      <ul className="contas-grid">
        {listaContas.length > 0 ? (
          listaContas.map(conta => (
            <li key={conta.id} className="conta-card">
              
              {/* Cabeçalho do Card: Nome e Tipo */}
              <div className="conta-card-header">
                <span className="conta-nome">{conta.nome}</span>
                <span className="conta-tipo">
                  {conta.tipo ? conta.tipo.replace('_', ' ') : 'Conta'}
                </span>
              </div>

              {/* Saldo com Cor */}
              <div 
                className="conta-saldo"
                style={{ color: conta.saldoAtual >= 0 ? '#2ecc71' : '#e74c3c' }}
              >
                R$ {conta.saldoAtual.toFixed(2)}
              </div>

              {/* Botões de Ação */}
              <div className="conta-actions">
                <button 
                  className="btn-editar"
                  onClick={() => setContaParaEditar(conta)}
                >
                  Editar
                </button>
                
                <button 
                  className="btn-excluir"
                  onClick={() => handleDelete(conta.id)}
                >
                  Excluir
                </button>
              </div>

            </li>
          ))
        ) : (
          <p>Nenhuma conta encontrada.</p>
        )}
      </ul>

      {/* MODAL DE EDIÇÃO (Só aparece se houver uma conta selecionada) */}
      {contaParaEditar && (
        <ModalEditarConta 
          conta={contaParaEditar}
          onClose={() => setContaParaEditar(null)}
          onSave={() => {
            refreshContas(); // Recarrega a lista
            // O modal fecha-se sozinho no componente, mas podemos garantir aqui
          }}
        />
      )}

    </div>
  );
}

export default ContasPage;