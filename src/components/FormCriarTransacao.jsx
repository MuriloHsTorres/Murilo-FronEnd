// src/components/FormCriarTransacao.jsx (COM AS CLASSES GLOBAIS CORRETAS)

import React, { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
// 1. REMOVER o import do .module.css

const API_BASE_URL = 'http://localhost:8080/api';

function FormCriarTransacao({ clienteId, contas, categorias, onTransacaoCriada }) {
  const { refreshCategorias } = useData();

  // --- Estados do Formulário (Sua Lógica do Passo 151) ---
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('DESPESA');
  const [dataOperacao, setDataOperacao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [contaId, setContaId] = useState(contas && contas.length > 0 ? contas[0].id : '');
  const [categoriaId, setCategoriaId] = useState('');
  const categoriasVisiveis = categorias ? categorias.filter(c => c.nome !== 'Transferências') : [];
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [isCreatingCategoria, setIsCreatingCategoria] = useState(false);

  const handleCategoriaChange = (e) => {
    const valorSelecionado = e.target.value;
    if (valorSelecionado === '___NOVA___') {
      setIsCreatingCategoria(true);
      setCategoriaId('');
    } else {
      setIsCreatingCategoria(false);
      setCategoriaId(valorSelecionado);
    }
  };

  // --- handleSubmit (Sua Lógica do Passo 151) ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!valor || !contaId || !dataOperacao) {
      alert('Por favor, preencha Valor, Conta e Data.');
      return;
    }
    let categoriaIdFinal = categoriaId;
    if (isCreatingCategoria) {
      if (!novaCategoriaNome) {
        alert('Por favor, preencha o nome da nova categoria.');
        return;
      }
      try {
        const payloadCategoria = {
          nome: novaCategoriaNome,
          clienteId: clienteId,
          tipo: tipo 
        };
        const response = await axios.post(`${API_BASE_URL}/categorias`, payloadCategoria);
        categoriaIdFinal = response.data.id;
        refreshCategorias();
      } catch (error) {
        alert('Erro ao criar categoria: ' + (error.response?.data?.message || error.response?.data));
        return;
      }
    } else {
      if (!categoriaIdFinal) {
        alert('Por favor, selecione uma categoria.');
        return;
      }
    }
    let valorFinal = Math.abs(parseFloat(valor));
    if (tipo === 'DESPESA') {
      valorFinal = valorFinal * -1;
    }
    const payloadTransacao = {
      clienteId: clienteId,
      contaId: contaId,
      categoriaId: categoriaIdFinal,
      descricao: descricao,
      valor: valorFinal,
      dataOperacao: dataOperacao
    };
    try {
      await axios.post(`${API_BASE_URL}/transacoes`, payloadTransacao);
      alert('Transação criada com sucesso!');
      onTransacaoCriada();
      // Limpar formulário
      setDescricao('');
      setValor('');
      setDataOperacao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setContaId(contas && contas.length > 0 ? contas[0].id : '');
      setCategoriaId('');
      setTipo('DESPESA');
      setIsCreatingCategoria(false);
      setNovaCategoriaNome('');
    } catch (error) {
      alert('Erro ao criar transação: ' + (error.response?.data?.message || error.response?.data));
    }
  };

  // --- O JSX (HTML) com as classes do FormCriarMeta ---
  return (
    // 2. A tag <form> não tem classe (igual ao FormCriarMeta)
    <form onSubmit={handleSubmit}>

      <h4>Adicionar Receita ou Despesa</h4>

      {/* 3. Aplicar "form-group" aos <div> e "form-control" aos <select> e <input> */}
      <div className="form-group">
        <label>Tipo:</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="form-control" required>
          <option value="DESPESA">Despesa</option>
          <option value="RECEITA">Receita</option>
        </select>
      </div>

      <div className="form-group">
        <label>Valor (R$): </label>
        <input 
          type="number" 
          step="0.01" 
          value={valor} 
          onChange={(e) => setValor(e.target.value)} 
          placeholder="Ex: 50.00"
          className="form-control"
          required 
        />
      </div>

      <div className="form-group">
        <label>Conta: </label>
        <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="form-control" required>
          <option value="" disabled>Selecione uma conta...</option>
          {contas && contas.length > 0 ? (
            contas.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} (Saldo: {conta.saldoAtual.toFixed(2)})
              </option>
            ))
          ) : (
            <option value="" disabled>Nenhuma conta encontrada</option>
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Categoria: </label>
        {isCreatingCategoria ? (
          // (O FormCriarMeta não tem este HTML, mas vamos estilizá-lo de forma parecida)
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Nome da nova categoria..."
              value={novaCategoriaNome}
              onChange={(e) => setNovaCategoriaNome(e.target.value)}
              className="form-control" // Usa a mesma classe
            />
            <button 
              type="button" 
              // Usa as classes de botão (assumindo que 'btn' e 'btn-secondary' existem)
              className="btn btn-secondary" 
              onClick={() => setIsCreatingCategoria(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <select value={categoriaId} onChange={handleCategoriaChange} className="form-control" required>
            <option value="" disabled>Selecione uma categoria...</option>
            {categoriasVisiveis && categoriasVisiveis.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
            <option value="___NOVA___">+ Nova Categoria...</option>
          </select>
        )}
      </div>

      <div className="form-group">
        <label>Descrição: </label>
        <input 
          type="text" 
          value={descricao} 
          onChange={(e) => setDescricao(e.target.value)} 
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Data e Hora: </label>
        <input 
          type="datetime-local" 
          value={dataOperacao} 
          onChange={(e) => setDataOperacao(e.target.value)} 
          className="form-control"
          required 
        />
      </div>

      {/* 4. Aplicar as classes de botão "btn btn-primary w-100" */}
      <button type="submit" className="btn btn-primary w-100">
        Adicionar Transação
      </button>
    </form>
  );
}

export default FormCriarTransacao;