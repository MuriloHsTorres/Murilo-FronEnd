// src/pages/MetasPage.jsx

import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import FormCriarMeta from "../components/FormCriarMeta";
import FormGuardarNaMeta from "../components/FormGuardarNaMeta";
import FormSacarDaMeta from "../components/FormSacarDaMeta";
import ProgressBar from "../components/ProgressBar";

// --- COMPONENTE INTERNO: O CARD DA META ---
function MetaItem({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [formAberto, setFormAberto] = useState("nenhum"); // 'nenhum', 'guardar', 'sacar'
  const percentual = (meta.valorAtual / meta.valorAlvo) * 100;

  // Funções para alternar os formulários
  const toggleGuardar = () => {
    setFormAberto(formAberto === "guardar" ? "nenhum" : "guardar");
  };
  const toggleSacar = () => {
    setFormAberto(formAberto === "sacar" ? "nenhum" : "sacar");
  };

  // Função para fechar o formulário após a ação
  const handleTransferencia = () => {
    onTransferenciaFeita(); // Atualiza os dados (via DataContext)
    setFormAberto("nenhum"); // Fecha o formulário
  };

  return (
    // 1. O card da meta
    <li className="meta-item-card">
      {/* 2. Cabeçalho do card */}
      <div className="meta-item-header">
        <h3>{meta.nome}</h3>
        {/* Aqui poderiam ir botões de editar/excluir */}
      </div>

      {/* 3. Progresso */}
      <div>
        <ProgressBar percentual={percentual} />
        <div className="meta-item-progress-text">
          <span>
            Guardado: <strong>R$ {meta.valorAtual.toFixed(2)}</strong>
          </span>
          <span>Objetivo: R$ {meta.valorAlvo.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. Botões de Ação */}
      <div className="meta-item-buttons">
        <button
          onClick={toggleGuardar}
          // Muda o estilo do botão se o form estiver aberto
          className={`btn ${
            formAberto === "guardar" ? "btn-secondary" : "btn-success"
          } w-100`}
        >
          {formAberto === "guardar" ? "Fechar" : "Guardar"}
        </button>
        <button
          onClick={toggleSacar}
          className={`btn ${
            formAberto === "sacar" ? "btn-secondary" : "btn-danger"
          } w-100`}
        >
          {formAberto === "sacar" ? "Fechar" : "Sacar"}
        </button>
      </div>

      {/* 5. Formulários Internos (Guardar) */}
      {formAberto === "guardar" && (
        <div className="meta-item-form">
          <h4>Guardar na Meta</h4>
          <FormGuardarNaMeta
            meta={meta}
            contasCorrente={contasCorrente}
            clienteId={clienteId}
            onTransferenciaFeita={handleTransferencia}
          />
        </div>
      )}

      {/* 5. Formulários Internos (Sacar) */}
      {formAberto === "sacar" && (
        <div className="meta-item-form">
          <h4>Sacar da Meta</h4>
          <FormSacarDaMeta
            meta={meta}
            contasCorrente={contasCorrente}
            clienteId={clienteId}
            onTransferenciaFeita={handleTransferencia}
          />
        </div>
      )}
    </li>
  );
}

// --- COMPONENTE PRINCIPAL: A PÁGINA ---
function MetasPage() {
  const { utilizador } = useAuth();
  const { contas, metas, loading, refreshMetas, refreshContas } = useData();
  const [mostrarFormCriar, setMostrarFormCriar] = useState(false);

  // Ordena as metas (sem mudança na lógica)
  const metasOrdenadas = useMemo(() => {
    return [...metas].sort((a, b) => {
      const percentualA = (a.valorAtual / a.valorAlvo) * 100;
      const percentualB = (b.valorAtual / b.valorAlvo) * 100;
      return percentualB - percentualA;
    });
  }, [metas]);

  if (loading) {
    return <div>A carregar dados...</div>;
  }

  return (
    <>
      {/* 1. Cabeçalho da Página */}
      <div className="page-header">
        <h2>Gestão de Metas</h2>
        <button
          onClick={() => setMostrarFormCriar(!mostrarFormCriar)}
          className={`btn ${
            mostrarFormCriar ? "btn-secondary" : "btn-secondary"
          }`}
        >
          {mostrarFormCriar ? "Fechar Formulário" : "Nova Meta"}
        </button>
      </div>

      {/* 2. Formulário de "Criar Meta" (que abre e fecha) */}
      {mostrarFormCriar && (
        <div className="card form-criar-meta">
          {" "}
          {/* Aplicamos a classe .card */}
          <FormCriarMeta
            clienteId={utilizador.id}
            onMetaCriada={() => {
              refreshMetas();
              setMostrarFormCriar(false);
            }}
          />
        </div>
      )}

      {/* 3. Lista de Metas */}
      <ul className="metas-list">
        {metasOrdenadas.length > 0 ? (
          metasOrdenadas.map((meta) => (
            <MetaItem
              key={meta.id}
              meta={meta}
              contasCorrente={contas.filter(
                (c) => c.tipoConta === "CONTA_CORRENTE"
              )}
              clienteId={utilizador.id}
              onTransferenciaFeita={() => {
                refreshMetas();
                refreshContas(); // Atualiza contas e metas após transferência
              }}
            />
          ))
        ) : (
          <p>Nenhuma meta encontrada. Crie sua primeira meta!</p>
        )}
      </ul>
    </>
  );
}

export default MetasPage;
