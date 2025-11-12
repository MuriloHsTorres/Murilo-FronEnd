// src/pages/ContasPage.jsx (ATUALIZADO)

import React from 'react'; // O 'useState' não é mais necessário
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import FormCriarConta from '../components/FormCriarConta';
import styles from './ContasPage.module.css'; // 1. IMPORTAR O CSS MODULE

function ContasPage() {
  const { contas, loading, refreshContas } = useData();
  const { utilizador } = useAuth();

  if (loading) {
    return <div>A carregar dados...</div>;
  }

  // Filtra apenas as contas corrente
  const contasCorrente = contas.filter(c => c.tipo === 'CONTA_CORRENTE');

  return (
    <div>
      <h2>Gestão de Contas</h2>

      {/* O formulário agora fica sempre visível
           e já está estilizado pelo index.css (Passo 137) */}
      <FormCriarConta 
        clienteId={utilizador.id} 
        onContaCriada={refreshContas} 
      />

      <hr />

      <h3>Minhas Contas</h3>

      {/* 2. Lista de Contas (Grid de Cards) */}
      <ul className={styles.grid}>
        {contasCorrente.length > 0 ? (
          contasCorrente.map(conta => (

            // 3. Aplicar o estilo do card
            <li key={conta.id} className={styles.contaCard}>

              {/* 4. A CORREÇÃO (garantir que é conta.nome) */}
              <div className={styles.cardNome}>
                {conta.nome} {/* <-- Esta é a correção do bug */}
              </div>

              <div className={styles.cardTipo}>
                {/* Limpa o texto 'CONTA_CORRENTE' para 'conta corrente' */}
                {conta.tipo.replace('_', ' ').toLowerCase()}
              </div>

              <div className={styles.cardSaldo}>
                R$ {conta.saldoAtual.toFixed(2)}
              </div>

            </li>
          ))
        ) : (
          <p>Nenhuma conta corrente encontrada.</p>
        )}
      </ul>
    </div>
  );
}

export default ContasPage;