// src/pages/MetasPage.jsx (Corrigido)

import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import FormCriarMeta from "../components/FormCriarMeta";
import FormGuardarNaMeta from "../components/FormGuardarNaMeta";
import FormSacarDaMeta from "../components/FormSacarDaMeta";
import ProgressBar from "../components/ProgressBar";

// --- CARD DA META (Não precisa mais da categoria) ---
function MetaItem({ meta, contasCorrente, clienteId, onTransferenciaFeita }) {
  const [formAberto, setFormAberto] = useState("nenhum");
  
  const percentual = meta.valorAlvo > 0 
    ? (meta.valorAtual / meta.valorAlvo) * 100 
    : 0;

  const toggleGuardar = () => setFormAberto(formAberto === "guardar" ? "nenhum" : "guardar");
  const toggleSacar = () => setFormAberto(formAberto === "sacar" ? "nenhum" : "sacar");

  const handleTransferencia = () => {
    onTransferenciaFeita();
    setFormAberto("nenhum");
  };

  return (
    <li className="meta-wide-card">
      <div className="meta-wide-header">
        <h3 className="meta-title">{meta.nome}</h3>
        <div className="meta-values">
          <span className="valor-atual">R$ {meta.valorAtual.toFixed(2)}</span>
          <span className="valor-alvo"> / R$ {meta.valorAlvo.toFixed(2)}</span>
        </div>
      </div>
      <div className="meta-progress-wrapper">
        <ProgressBar percentual={percentual} />
      </div>
      <div className="meta-actions">
        <button 
          onClick={toggleGuardar} 
          className={`btn-action ${formAberto === "guardar" ? "btn-cancel" : "btn-deposit"}`}
        >
          {formAberto === "guardar" ? "Cancelar" : "Guardar Dinheiro"}
        </button>
        <button 
          onClick={toggleSacar} 
          className={`btn-action ${formAberto === "sacar" ? "btn-cancel" : "btn-withdraw"}`}
        >
          {formAberto === "sacar" ? "Cancelar" : "Resgatar"}
        </button>
      </div>

      {/* Formulário de GUARDAR (sem a prop 'transferenciaCategoriaId') */}
      {formAberto === "guardar" && (
        <div className="meta-form-container">
          <FormGuardarNaMeta
            meta={meta}
            contasCorrente={contasCorrente}
            clienteId={clienteId}
            onTransferenciaFeita={handleTransferencia}
          />
        </div>
      )}

      {/* Formulário de SACAR (vamos assumir que também não precisa) */}
      {formAberto === "sacar" && (
        <div className="meta-form-container">
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

// --- PÁGINA PRINCIPAL ---
function MetasPage() {
  const { utilizador } = useAuth();
  // Não precisamos mais de 'categorias' aqui
  const { contas, metas, loading, refreshMetas, refreshContas } = useData();
  const [mostrarFormCriar, setMostrarFormCriar] = useState(false);

  // Lógica de encontrar 'transferenciaCategoriaId' foi REMOVIDA
  
  const metasOrdenadas = useMemo(() => {
    if (!metas) return [];
    // Ordena as metas
    return [...metas].sort((a, b) => {
      const pA = a.valorAlvo > 0 ? (a.valorAtual / a.valorAlvo) : 0;
      const pB = b.valorAlvo > 0 ? (b.valorAtual / b.valorAlvo) : 0;
      return pB - pA;
    });
  }, [metas]);

  if (loading) return <div>A carregar dados...</div>;

  // Bloco de "Erro Crítico" foi REMOVIDO

  return (
    <div className="metas-page-container">
      <div className="page-header"> 
        <h2>Minhas Metas</h2>
        <button
          onClick={() => setMostrarFormCriar(!mostrarFormCriar)}
          className="btn btn-secondary"
        >
          {mostrarFormCriar ? "Fechar" : "+ Nova Meta"}
        </button>
      </div>
      
      <hr />
      <br />
      {mostrarFormCriar && (
        <div className="form-criar-meta-wrapper">
          <FormCriarMeta
            clienteId={utilizador.id}
            onMetaCriada={() => {
              refreshMetas();
              setMostrarFormCriar(false);
            }}
          />
        </div>
      )}

      <ul className="metas-list-wide">
        {metasOrdenadas.length > 0 ? (
          metasOrdenadas.map((meta) => (
            <MetaItem
              key={meta.id}
              meta={meta}
              // Filtro de contas (Tudo que não é META)
              contasCorrente={contas.filter(c => {
                  const tipo = c.tipo || c.tipoConta || '';
                  return tipo !== 'META' && tipo !== 'CONTA_META';
              })}
              clienteId={utilizador.id}
              // Não passamos mais o 'transferenciaCategoriaId'
              onTransferenciaFeita={() => {
                refreshMetas();
                refreshContas(); // Atualiza contas (saldo) e metas
              }}
            />
          ))
        ) : (
          <p className="text-muted">Você ainda não tem metas.</p>
        )}
      </ul>
    </div>
  );
}

export default MetasPage;