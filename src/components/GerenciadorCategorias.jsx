// src/components/GerenciadorCategorias.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// --- Sub-componente para CADA item da lista (Refatorado) ---
function CategoriaItem({ categoria }) {
  const { utilizador } = useAuth();
  const { refreshCategorias } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(categoria.nome);

  // Função para SALVAR (PUT) - Lógica não muda
  const handleEdit = async () => {
    try {
      await axios.put(`${API_BASE_URL}/categorias/${categoria.id}`, {
        nome: nomeEditado,
        clienteId: utilizador.id
      });
      alert('Categoria atualizada!');
      setIsEditing(false);
      refreshCategorias();
    } catch (error) {
      alert('Erro ao atualizar: ' + error.response.data);
    }
  };

  // Função para DELETAR (DELETE) - Lógica não muda
  const handleDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja deletar a categoria "${categoria.nome}"?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/categorias/${categoria.id}`, {
        headers: { 'Content-Type': 'application/json' },
        data: { clienteId: utilizador.id } // Backend espera o ID no corpo
      });
      alert('Categoria deletada!');
      refreshCategorias();
    } catch (error) {
      alert('Erro ao deletar: ' + error.response.data);
    }
  };

  // --- JSX do Item ---
  return (
    <li className="categoria-item">
      {!isEditing ? (
        <>
          {/* 1. Nome da Categoria (Modo de Leitura) */}
          <span className="categoria-item-nome">{categoria.nome}</span>
          
          {/* 2. Botões de Ação (Modo de Leitura) */}
          <div className="categoria-item-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-warning btn-sm"
              type="button"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              type="button"
            >
              Deletar
            </button>
          </div>
        </>
      ) : (
        <>
          {/* 3. Formulário de Edição (Modo de Edição) */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleEdit(); }} 
            className="categoria-item-edit-form"
          >
            <input
              type="text"
              className="form-control" // Aplicamos a classe
              value={nomeEditado}
              onChange={(e) => setNomeEditado(e.target.value)}
            />
            <div className="categoria-item-actions">
              <button
                type="submit"
                className="btn btn-success btn-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary btn-sm"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </>
      )}
    </li>
  );
}


// --- Componente Principal (Refatorado) ---
function GerenciadorCategorias() {
  const { utilizador } = useAuth(); //
  const { categorias, loading, refreshCategorias } = useData(); //
  const [novoNome, setNovoNome] = useState(''); //

  // Função para ADICIONAR (POST) - Lógica não muda
  const handleAdd = async (e) => {
    e.preventDefault(); //
    if (!novoNome) return;
    try {
      await axios.post(`${API_BASE_URL}/categorias`, { //
        nome: novoNome,
        clienteId: utilizador.id
      });
      alert('Nova categoria adicionada!');
      setNovoNome('');
      refreshCategorias();
    } catch (error) {
      alert('Erro ao adicionar: ' + error.response.data);
    }
  };

  if (loading) return <p>A carregar categorias...</p>;

  // --- JSX do Gerenciador ---
  return (
    // Div principal (sem o 'style' de borda, pois já está num card)
    <div> 
      
      {/* 1. Formulário de Adicionar (POST) */}
      <form onSubmit={handleAdd} className="form-add-categoria">
        <input
          type="text"
          className="form-control" // Aplicamos a classe
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nome da nova categoria"
        />
        <button type="submit" className="btn btn-primary"> {/* Aplicamos a classe */}
          Adicionar
        </button>
      </form>

      {/* 2. Lista de Categorias (com Edit/Delete) */}
      <ul className="categorias-list">
        {categorias.length > 0 ? (
          categorias.map(cat => (
            <CategoriaItem key={cat.id} categoria={cat} />
          ))
        ) : (
          <p>Nenhuma categoria personalizada encontrada.</p>
        )}
      </ul>
    </div>
  );
}

export default GerenciadorCategorias;