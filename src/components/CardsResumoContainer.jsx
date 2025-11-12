// src/components/CardsResumoContainer.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ResumoCard from './ResumoCard'; // O card que acabámos de criar

function CardsResumoContainer() {
  // 1. Pega os dados globais
  const { contas, transacoes, loading } = useData();

  // 2. Estado para controlar qual card está expandido
  // (null, 'saldo', 'receitas', 'despesas')
  const [expandedCard, setExpandedCard] = useState(null);

  // 3. A GRANDE LÓGICA DE CÁLCULO
  // 'useMemo' garante que só recalculamos isto se as contas ou transações mudarem
  const data = useMemo(() => {
    const map = new Map();
    let totalSaldo = 0;
    let totalReceitas = 0;
    let totalDespesas = 0;

    // A. "Semear" o Map com as contas e o saldo total
    // (O backend só nos manda as CONTA_CORRENTE aqui)
    for (const conta of contas) {
      map.set(conta.id, {
        nome: conta.nome,
        saldo: conta.saldoAtual,
        receitas: 0,
        despesas: 0
      });
      totalSaldo += conta.saldoAtual;
    }

    // B. Processar as transações
    for (const t of transacoes) {
      // Verifica se a transação pertence a uma CONTA_CORRENTE
      if (map.has(t.contaId)) {

        // REGRA: Só contamos como "Receita" ou "Despesa"
        // se NÃO for uma "Transferência" (pois é dinheiro interno)
        if (t.nomeCategoria !== "Transferências") {
          const contaData = map.get(t.contaId);

          if (t.valor > 0) {
            contaData.receitas += t.valor;
            totalReceitas += t.valor;
          } else {
            contaData.despesas += t.valor;
            totalDespesas += t.valor;
          }
        }
      }
    }

    return { breakdownMap: map, totalSaldo, totalReceitas, totalDespesas };

  }, [contas, transacoes]); // Dependências

  if (loading) return <div>A carregar resumos...</div>;

  // Função para alternar qual card está expandido
  const toggleCard = (card) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  // 4. Renderizar os 3 Cards
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', margin: '10px 0' }}>

      <ResumoCard 
        title="Saldo Total"
        valor={data.totalSaldo}
        backgroundColor="#000000" // Azul
        isExpanded={expandedCard === 'saldo'}
        onToggle={() => toggleCard('saldo')}
        breakdownMap={data.breakdownMap}
        breakdownKey="saldo" 
      />

      <ResumoCard 
        title="Total Receitas"
        valor={data.totalReceitas}
        backgroundColor="#56D53D" // Verde (o que você pediu)
        isExpanded={expandedCard === 'receitas'}
        onToggle={() => toggleCard('receitas')}
        breakdownMap={data.breakdownMap}
        breakdownKey="receitas"
      />

      <ResumoCard 
        title="Total Despesas"
        valor={data.totalDespesas}
        backgroundColor="#DF223E" // Vermelho (o que você pediu)
        isExpanded={expandedCard === 'despesas'}
        onToggle={() => toggleCard('despesas')}
        breakdownMap={data.breakdownMap}
        breakdownKey="despesas"
      />

    </div>
  );
}

export default CardsResumoContainer;