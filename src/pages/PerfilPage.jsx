// src/pages/PerfilPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; //
import axios from 'axios';
import GerenciadorCategorias from '../components/GerenciadorCategorias'; //

const API_BASE_URL = 'http://localhost:8080/api'; //

function PerfilPage() {
  const { utilizador, login, logout } = useAuth(); //
  
  // --- Estados do formulário de perfil ---
  const [nome, setNome] = useState(utilizador.nome); //
  const [email, setEmail] = useState(utilizador.email); //
  const [senhaAtual, setSenhaAtual] = useState(''); //
  const [novaSenha, setNovaSenha] = useState(''); //

  // --- Estados do fluxo de exclusão ---
  const [deleteStep, setDeleteStep] = useState('idle'); //
  const [deletePassword, setDeletePassword] = useState(''); //

  // --- Função de Atualizar Perfil ---
  const handleSubmit = async (event) => {
    event.preventDefault(); //

    if (!senhaAtual) {
      alert('Por favor, insira a sua senha atual para confirmar as alterações.');
      return;
    }
    
    const payload = {
      nome: nome,
      email: email,
      senhaAtual: senhaAtual,
      novaSenha: novaSenha.length > 0 ? novaSenha : null 
    };

    try {
      const response = await axios.put( //
        `${API_BASE_URL}/clientes/atualizar/${utilizador.id}`, 
        payload
      );
      
      alert('Perfil atualizado com sucesso!');
      
      // *** IMPORTANTE ***
      // Atualiza o 'utilizador' no AuthContext com os novos dados
      login(response.data); //

      // Limpa os campos de senha
      setSenhaAtual('');
      setNovaSenha('');

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar: ' + (error.response?.data || 'Erro desconhecido.'));
    }
  };

  // --- Função de Excluir Conta ---
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Por favor, digite sua senha para confirmar.');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/clientes/deletar/${utilizador.id}`, {
        data: { senha: deletePassword } // Envia a senha no corpo da requisição DELETE
      });
      
      alert('Conta excluída com sucesso. Estamos a sentir a sua falta!');
      logout(); // Faz o logout do utilizador
      
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      alert('Erro ao excluir conta: ' + (error.response?.data || 'Senha incorreta.'));
    }
  };

  // --- O NOVO JSX ESTILIZADO ---
  return (
    <>
      {/* 1. Cabeçalho da Página */}
      <div className="page-header">
        <h2>Gestão de Perfil</h2>
      </div>

      {/* 2. Grid de Conteúdo */}
      <div className="perfil-grid">
        
        {/* 3. Card do Formulário de Perfil */}
        <div className="card perfil-form-card">
          <form onSubmit={handleSubmit}>
            <h4>Atualizar Meus Dados</h4>
            
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <hr />
            
            <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              Para salvar, confirme com sua senha atual. Para mudar a senha, preencha os dois campos.
            </p>

            <div className="form-group">
              <label>Senha Atual (Obrigatória para salvar):</label>
              <input
                type="password"
                className="form-control"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual..."
              />
            </div>
            
            <div className="form-group">
              <label>Nova Senha (Deixe em branco para não alterar):</label>
              <input
                type="password"
                className="form-control"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha..."
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100">
              Salvar Alterações
            </button>
          </form>
        </div>

        {/* 4. Card do Gerenciador de Categorias */}
        <div className="card perfil-categorias-card">
          <h4>Gerenciador de Categorias</h4>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '1rem' }}>
            Adicione ou remova as categorias de transação.
          </p>
          {/* O componente é renderizado aqui dentro */}
          <GerenciadorCategorias />
        </div>

        {/* 5. Zona de Perigo (Ocupa as 2 colunas) */}
        <div className="perfil-danger-zone">
          <div className="card-danger-outline">
            <h4>Zona de Perigo</h4>
            
            {/* Passo 1: Botão inicial */}
            {deleteStep === 'idle' && (
              <button
                onClick={() => setDeleteStep('confirm')}
                className="btn btn-danger"
                type="button"
              >
                Excluir Minha Conta
              </button>
            )}

            {/* Passo 2: Confirmação */}
            {deleteStep === 'confirm' && (
              <div>
                <p><strong>Tem a certeza absoluta?</strong> Esta ação é irreversível e todos os seus dados (contas, transações, metas) serão perdidos.</p>
                <button
                  onClick={() => setDeleteStep('password')}
                  className="btn btn-danger"
                  type="button"
                  style={{ marginRight: '10px' }}
                >
                  Sim, tenho certeza e quero excluir
                </button>
                <button 
                  onClick={() => setDeleteStep('idle')} 
                  className="btn btn-secondary" 
                  type="button"
                >
                  Não, cancelar
                </button>
              </div>
            )}

            {/* Passo 3: Digitar a senha */}
            {deleteStep === 'password' && (
              <div>
                <p>Para confirmar esta ação, digite sua senha atual:</p>
                <div className="form-group">
                  <label>Senha Atual:</label>
                  <input
                    type="password"
                    className="form-control"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Sua senha atual"
                  />
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger w-100"
                  type="button"
                >
                  CONFIRMAR EXCLUSÃO PERMANENTE
                </button>
                <button 
                  onClick={() => setDeleteStep('idle')} 
                  className="btn btn-secondary w-100" 
                  type="button"
                  style={{ marginTop: '10px' }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </>
  );
}

export default PerfilPage;