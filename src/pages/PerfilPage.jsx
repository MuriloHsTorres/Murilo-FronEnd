// src/pages/PerfilPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useData } from '../context/DataContext'; 
import axios from 'axios';
import GerenciadorCategorias from '../components/GerenciadorCategorias'; 

const API_BASE_URL = 'http://localhost:8080/api'; 

function PerfilPage() {
  const { utilizador, login, logout } = useAuth(); 
  
  // --- Estados do formulário ---
  const [nome, setNome] = useState(utilizador ? utilizador.nome : ''); 
  const [email, setEmail] = useState(utilizador ? utilizador.email : ''); 
  const [senhaAtual, setSenhaAtual] = useState(''); 
  const [novaSenha, setNovaSenha] = useState(''); 

  // --- Estados de exclusão ---
  const [deleteStep, setDeleteStep] = useState('idle'); 
  const [deletePassword, setDeletePassword] = useState(''); 

  const handleSubmit = async (event) => {
    event.preventDefault(); 

    if (!senhaAtual) {
      alert('Por favor, insira a sua senha atual para confirmar as alterações.');
      return;
    }
    
    // Payload
    const payload = {
      nome: nome,
      email: email,
      senhaAtual: senhaAtual
    };

    if (novaSenha && novaSenha.trim() !== '') {
        payload.novaSenha = novaSenha;
    }

    try {
      // --- CORREÇÃO AQUI ---
      // Removi o "/atualizar". Agora é PUT /api/clientes/{id}
      const response = await axios.put(
        `${API_BASE_URL}/clientes/${utilizador.id}`, 
        payload
      );
      
      alert('Perfil atualizado com sucesso!');
      
      // Atualiza o contexto global
      login(response.data); 

      setSenhaAtual('');
      setNovaSenha('');

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Erro desconhecido.';
      alert('Erro ao atualizar: ' + msg);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Por favor, digite sua senha para confirmar.');
      return;
    }

    try {
      // --- CORREÇÃO AQUI TAMBÉM ---
      // Removi o "/deletar". Agora é DELETE /api/clientes/{id}
      await axios.delete(`${API_BASE_URL}/clientes/${utilizador.id}`, {
        data: { senha: deletePassword } 
      });
      
      alert('Conta excluída com sucesso. Sentiremos sua falta!');
      logout(); 
      
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Erro ao excluir.';
      alert('Falha na exclusão: ' + msg);
    }
  };

  if (!utilizador) return <div>Carregando perfil...</div>;

  return (
    <>
      <div className="page-header">
        <h2>Gestão de Perfil</h2>
      </div>

      <div className="perfil-grid">
        
        {/* Card do Formulário */}
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
              <label>Senha Atual (Obrigatória):</label>
              <input
                type="password"
                className="form-control"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual..."
              />
            </div>
            
            <div className="form-group">
              <label>Nova Senha (Opcional):</label>
              <input
                type="password"
                className="form-control"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100">
              Salvar Alterações
            </button>
          </form>
        </div>

        {/* Card de Categorias */}
        <div className="card perfil-categorias-card">
          <h4>Gerenciador de Categorias</h4>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '1rem' }}>
            Adicione ou remova as categorias de transação.
          </p>
          <GerenciadorCategorias />
        </div>

        {/* Zona de Perigo */}
        <div className="perfil-danger-zone"  style={{ width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
          <div style={{width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            
            {deleteStep === 'idle' && (
              <button 
                onClick={() => setDeleteStep('confirm')}
                className="btn-sair"
                type="button"
                style={{ width: '90%',}}
              >
                Excluir Conta
              </button>
            )}

            {deleteStep === 'confirm' && (
              <div className="alert alert-danger" style={{ textAlign: 'center', fontSize: '17px'}}>
                <p><strong>Tem a certeza absoluta?</strong><br/>Isso apagará tudo permanentemente.</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button style={{width: '40%'}}
                     onClick={() => setDeleteStep('idle')} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button style={{height:'56px', width: '60%'}}
                    onClick={() => setDeleteStep('password')} className="btn btn-sair">
                        Sim, continuar
                    </button>
                </div>
              </div>
            )}

            {deleteStep === 'password' && (
              <div className="card p-3" style={{ border: '1px solid #dc3545', width: '100%' }}>
                <p className="text-danger">Digite sua senha para confirmar a exclusão:</p>
                <input
                    type="password"
                    className="form-control mb-2"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Sua senha"
                />
                <button onClick={handleDeleteAccount} className="btn btn-danger w-100 mb-2">
                    CONFIRMAR EXCLUSÃO
                </button>
                <button onClick={() => setDeleteStep('idle')} className="btn btn-secondary w-100">
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