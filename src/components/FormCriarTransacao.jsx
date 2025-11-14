import React, { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:8080/api';

function FormCriarTransacao({ onTransacaoCriada }) {
  
  // --- PEGAR DADOS GLOBAIS ---
  // Buscamos as contas e categorias direto da "memória" do App (Contexto)
  const { contas, categorias, clienteId, refreshCategorias } = useData();

  // --- Estados do Formulário ---
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('DESPESA');
  const [dataOperacao, setDataOperacao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  
  // 1. O estado começa VAZIO ('') para forçar o utilizador a escolher
  const [contaId, setContaId] = useState(''); 
  
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

  // --- ENVIO DO FORMULÁRIO ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!clienteId) {
      alert("Erro: Cliente não identificado. Tente recarregar a página.");
      return;
    }
    
    // 2. Validação reforçada: Se não escolheu conta, bloqueia
    if (!contaId) {
      alert('Por favor, selecione uma CONTA antes de salvar.');
      return;
    }
    if (!valor || !dataOperacao) {
      alert('Por favor, preencha o Valor e a Data.');
      return;
    }

    let categoriaIdFinal = categoriaId;
    
    // Lógica para criar categoria nova na hora
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

    // Converter valor para negativo se for Despesa
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
      
      if (onTransacaoCriada) {
        onTransacaoCriada();
      }
      
      // Limpar formulário
      setDescricao('');
      setValor('');
      setDataOperacao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      
      // 3. Reseta para vazio para mostrar "Selecione..." novamente
      setContaId(''); 
      
      setCategoriaId('');
      setTipo('DESPESA');
      setIsCreatingCategoria(false);
      setNovaCategoriaNome('');

    } catch (error) {
      console.error("Erro:", error);
      alert('Erro ao criar transação: ' + (error.response?.data?.message || "Erro desconhecido"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 mb-3 border rounded bg-light">

      <h4>Adicionar Receita ou Despesa</h4>

      <div className="form-group mb-3">
        <label className="form-label">Tipo:</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="form-control" required>
          <option value="DESPESA">Despesa</option>
          <option value="RECEITA">Receita</option>
        </select>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Valor (R$): </label>
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

      <div className="form-group mb-3">
        <label className="form-label">Conta: </label>
        
        {/* 4. O Dropdown começa na opção disabled "Selecione..." */}
        <select 
            value={contaId} 
            onChange={(e) => setContaId(e.target.value)} 
            className="form-control" 
            required
        >
          <option value="" disabled>Selecione uma conta...</option>
          
          {contas && contas.length > 0 ? (
            contas.map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} (Saldo: {conta.saldoAtual ? conta.saldoAtual.toFixed(2) : '0.00'})
              </option>
            ))
          ) : (
             // Caso a internet esteja lenta ou não haja contas
             <option value="" disabled>Carregando contas...</option>
          )}
        </select>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Categoria: </label>
        {isCreatingCategoria ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Nome da nova categoria..."
              value={novaCategoriaNome}
              onChange={(e) => setNovaCategoriaNome(e.target.value)}
              className="form-control"
            />
            <button 
              type="button" 
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
            <option value="___NOVA___" style={{ fontWeight: 'bold', color: 'green' }}>
              + Nova Categoria...
            </option>
          </select>
        )}
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Descrição: </label>
        <input 
          type="text" 
          value={descricao} 
          onChange={(e) => setDescricao(e.target.value)} 
          className="form-control"
          placeholder="Ex: Almoço, Salário..."
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Data e Hora: </label>
        <input 
          type="datetime-local" 
          value={dataOperacao} 
          onChange={(e) => setDataOperacao(e.target.value)} 
          className="form-control"
          required 
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Adicionar Transação
      </button>
    </form>
  );
}

export default FormCriarTransacao;