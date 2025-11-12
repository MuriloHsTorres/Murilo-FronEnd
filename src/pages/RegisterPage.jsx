// src/pages/RegisterPage.jsx

import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Importar o Link

const API_URL = "http://localhost:8080/api/clientes";

function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // Adicionei a confirmação de senha, como na imagem
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validação simples
    if (senha !== confirmaSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      const response = await axios.post(API_URL + "/cadastro", {
        nome: nome,
        email: email,
        senha: senha,
      });
      alert(
        "Registo bem-sucedido! Pode fazer login agora, " + response.data.nome
      );
      // TODO: Redirecionar para o Login
    } catch (error) {
      alert("Erro no registo: " + error.response.data);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-header-bar"></div> {/* A barra verde */}
      <div className="auth-container">
        <div className="auth-card-register">
          {" "}
          {/* O card branco centralizado */}
          <div className="titulo">
            <h2>Bem Vindo!</h2>
            <p>Faça seu Cadastro</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome de Usuário:</label>
              <input
                type="text"
                className="form-control" /* Classe do seu style.css */
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Insira seu nome de usuário..."
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                className="form-control" /* Classe do seu style.css */
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insira seu email..."
                required
              />
            </div>
            <div className="form-group">
              <label>Senha:</label>
              <input
                type="password"
                className="form-control" /* Classe do seu style.css */
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Insira sua senha..."
                required
              />
            </div>
            <div className="form-group">
              <label>Confirme sua senha:</label>
              <input
                type="password"
                className="form-control" /* Classe do seu style.css */
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="Insira sua senha..."
                required
              />
            </div>
            <div className="button-confirm">
              <button type="submit" className="btn btn-primary w-100">
                Criar
              </button>
            </div>
            
          </form>
          <div className="text-center mt-3">
            Já possui conta? <Link to="/LoginPage">Entre aqui</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
