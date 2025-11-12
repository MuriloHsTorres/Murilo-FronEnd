// src/pages/LoginPage.jsx

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Importar o Link

const API_URL = 'http://localhost:8080/api/clientes';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login } = useAuth(); 

  const handleSubmit = async (event) => {
    event.preventDefault(); 
    try {
      const response = await axios.post(API_URL + '/login', {
        email: email,
        senha: senha
      });
      login(response.data); 
    } catch (error) {
      console.error('Erro no login:', error.response.data);
      alert('Erro no login: ' + error.response.data); 
    }
  };


  // O HTML (JSX) agora com classes CSS
  return (
    <div className="auth-layout">
      <div className="auth-header-bar"></div> {/* A barra verde */}

      <div className="auth-container">
        <div className="auth-card"> {/* O card branco centralizado */}
          
          <div className="titulo">
            <h2>Bem Vindo De Volta!</h2>
            <p>Faça seu Login</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group"> {/* Grupo para espaçamento */}
              <label>Email:</label>
              <input 
                type="email" 
                className="form-control" /* Classe do seu style.css */
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insira seu Email..."
                required 
              />
            </div>
            
            <div className="form-group"> {/* Grupo para espaçamento */}
              <label>Senha:</label>
              <input 
                type="password"
                className="form-control" /* Classe do seu style.css */
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua Senha..."
                required
              />
            </div>
          <div className="button-confirm">
            <button type="submit" className="btn btn-primary w-100">
              Entrar
            </button>
          </div>

          </form>
          
          <div className="text-center mt-3">
            Não possui conta ainda? <Link to="/RegisterPage">Faça seu Cadastro</Link>
          </div>
        </div>
      </div>
    </div>  
  );
}

export default LoginPage;