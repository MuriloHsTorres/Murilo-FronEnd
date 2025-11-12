// src/pages/HomePage.jsx (COM NOVOS GRÁFICOS E FILTROS)

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ProgressBar from '../components/ProgressBar';

// Imports do Chart.js (completos)
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler // Adiciona Filler para preenchimento
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
// Imports do Date-fns (completos)
import { format, parseISO, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from 'date-fns';

// Registar o Chart.js (adiciona Filler)
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

// 1. CORREÇÃO (Pizza): Usando as cores multi-coloridas do seu código antigo
const CORES_GRAFICO = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#E7E9ED', '#8B0000', '#006400', '#00008B'
];

function HomePage() {
  // Puxar TODOS os dados e o 'loading'
  const { transacoes, categorias, contas, loading } = useData();

  // --- Estados de Filtro (sem mudança) ---
  const [tipoGrafico, setTipoGrafico] = useState('linha'); // Padrão agora é Linha
  const [dateRange, setDateRange] = useState('mesAtual');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [tipoFiltro, setTipoFiltro] = useState('DESPESA'); 
  const [categoriaId, setCategoriaId] = useState('todas');
  const [contaId, setContaId] = useState('todas');


  // --- LÓGICA DE CÁLCULO (useMemo) ATUALIZADA ---
  const dadosGrafico = useMemo(() => {

    // Guarda de Segurança (previne a tela branca)
    if (loading || !transacoes || !categorias || !contas) {
      return { dataPizza: {}, dataBarras: {}, dataLinha: {} };
    }

    // --- A. Determinar o intervalo de datas ---
    let startDate, endDate;
    const hoje = new Date();
    if (dateRange === 'mesAtual') {
      startDate = startOfMonth(hoje);
      endDate = endOfMonth(hoje);
    } else if (dateRange === '7dias') {
      startDate = subDays(hoje, 6);
      endDate = hoje;
    } else { // 'personalizado'
      startDate = parseISO(dataInicio);
      endDate = parseISO(dataFim);
    }
    endDate.setHours(23, 59, 59, 999); // Garante que o dia final é incluído

    // --- B. Filtrar transações (baseado nos filtros) ---

    // Filtro Geral (para Gráficos de Barra e Linha)
    const transacoesFiltradasGeral = transacoes.filter(t => {
      if (!t.dataOperacao) return false;
      const dataTransacao = parseISO(t.dataOperacao);
      const inDate = dataTransacao >= startDate && dataTransacao <= endDate;
      const inCategoria = categoriaId === 'todas' || t.categoriaId === categoriaId;
      const inConta = contaId === 'todas' || t.contaId === contaId;
      return inDate && inCategoria && inConta && t.nomeCategoria !== 'Transferências';
    });

    // Filtro Específico (para Gráfico de Pizza)
    const transacoesFiltradasPizza = transacoesFiltradasGeral.filter(t => {
        return tipoFiltro === 'todos' ||
               (tipoFiltro === 'RECEITA' && t.valor > 0) ||
               (tipoFiltro === 'DESPESA' && t.valor < 0);
    });

    // --- C. Calcular os dados para os gráficos ---

    // 1. DADOS PIZZA (Req. 1: Cores diferentes por categoria)
    const pizzaMap = new Map();
    transacoesFiltradasPizza.forEach(t => {
      const nomeCat = t.nomeCategoria || 'Sem Categoria';
      pizzaMap.set(nomeCat, (pizzaMap.get(nomeCat) || 0) + Math.abs(t.valor));
    });
    const dataPizza = {
      labels: Array.from(pizzaMap.keys()),
      datasets: [{ 
        data: Array.from(pizzaMap.values()), 
        backgroundColor: CORES_GRAFICO // Usa o array de cores multi-coloridas
      }]
    };

    // 2. DADOS BARRA (Req. 2: Verde/Vermelho)
    let totalReceitasFiltro = 0;
    let totalDespesasFiltro = 0;
    transacoesFiltradasGeral.forEach(t => {
        if (t.valor > 0) totalReceitasFiltro += t.valor;
        else totalDespesasFiltro += Math.abs(t.valor);
    });
    const dataBarras = {
      labels: ['Período Selecionado'],
      datasets: [
        { label: 'Receitas', data: [totalReceitasFiltro], backgroundColor: '#2f7812ff' },
        { label: 'Despesas', data: [totalDespesasFiltro], backgroundColor: '#6e0e0eff' },
      ],
    };

    // 3. DADOS LINHA (Req. 3: Gráfico Único de Saldo Cumulativo)

    // 3a. Calcular o Saldo Inicial (no dia anterior ao 'startDate')
    let saldoInicialLinha = 0;
    const contasFiltradas = contas.filter(c => (contaId === 'todas' || c.id === contaId) && c.tipo === 'CONTA_CORRENTE');
    contasFiltradas.forEach(c => saldoInicialLinha += c.saldoAbertura);

    transacoes.filter(t => {
        if (!t.dataOperacao) return false;
        const inConta = contaId === 'todas' || t.contaId === contaId;
        const isBefore = parseISO(t.dataOperacao) < startDate;
        // (Para o saldo, não filtramos por categoria, apenas por conta)
        return inConta && isBefore;
    }).forEach(t => saldoInicialLinha += t.valor);

    // 3b. Calcular o fluxo diário e o saldo cumulativo
    const diasIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    const labelsLinha = diasIntervalo.map(dia => format(dia, 'dd/MM'));
    const dadosSaldoLinha = [];
    let saldoAcumulado = saldoInicialLinha;

    diasIntervalo.forEach(dia => {
        let netDiario = 0;
        transacoesFiltradasGeral.forEach(t => { // Usa as transações já filtradas
            if (!t.dataOperacao) return;
            if (format(parseISO(t.dataOperacao), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd')) {
                netDiario += t.valor;
            }
        });
        saldoAcumulado += netDiario;
        dadosSaldoLinha.push(saldoAcumulado.toFixed(2)); // Guarda o saldo do dia
    });

    const dataLinha = {
      labels: labelsLinha,
      datasets: [{
        label: 'Evolução do Saldo', 
        data: dadosSaldoLinha, 
        borderColor: 'var(--primary-color)', // Linha verde escura
        backgroundColor: 'rgba(0, 88, 64, 0.1)', // Preenchimento verde transparente
        fill: true, // Preenche a área abaixo da linha
        tension: 0.1 
      }]
    };

    return { dataPizza, dataBarras, dataLinha };

  }, [
    transacoes, categorias, contas, loading, // Dados
    dateRange, dataInicio, dataFim, tipoFiltro, categoriaId, contaId // Filtros
  ]);

  // --- Lógica das Metas (sem mudança) ---
  const metas = useMemo(() => {
      if (loading || !contas) return [];
      return contas.filter(c => c.tipo === 'META');
  }, [contas, loading]);

  const calcularProgressoMeta = (meta) => {
    if (meta.valorAlvo <= 0) return 0;
    const percentual = (meta.valorAtual / meta.valorAlvo) * 100;
    return Math.min(Math.max(percentual, 0), 100);
  };

  // --- "Guarda" de Renderização ---
  if (loading) {
    return <div>A carregar dashboard...</div>;
  }

  // --- O JSX (Layout + Filtros + Gráficos + Metas) ---
  return (
    <div>
      <h2>Dashboard</h2>

      {/* Wrapper para Grid (Gráficos à esquerda, Metas à direita) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Coluna 1: Filtros e Gráficos */}
        <div>
          {/* --- 1. OS FILTROS --- */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)', marginBottom: '20px' }}>
            <h4>Filtros do Dashboard</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

              <div className="form-group">
                <label>Período</label>
                <select className="form-control" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                  <option value="mesAtual">Mês Atual</option>
                  <option value="7dias">Últimos 7 Dias</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tipo (p/ Gráfico Pizza)</label>
                <select className="form-control" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                  <option value="DESPESA">Despesas</option>
                  <option value="RECEITA">Receitas</option>
                  <option value="todos">Todas</option>
                </select>
              </div>

              {dateRange === 'personalizado' && (
                <>
                  <div className="form-group">
                    <label>Data Início</label>
                    <input type="date" className="form-control" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Data Fim</label>
                    <input type="date" className="form-control" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Conta</label>
                <select className="form-control" value={contaId} onChange={(e) => setContaId(e.target.value)}>
                  <option value="todas">Todas as Contas</option>
                  {contas && contas.filter(c => c.tipo === 'CONTA_CORRENTE').map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select className="form-control" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="todas">Todas as Categorias</option>
                  {categorias && categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* --- 2. O CARD DE GRÁFICOS --- */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)' }}>
            <h4>Balanço (com filtros)</h4>

            {/* Botões de seleção do gráfico */}
            <div className="btn-group" role="group">
              <button type="button" className={`btn ${tipoGrafico === 'linha' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('linha')}>
                Evolução (Linha)
              </button>
              <button type="button" className={`btn ${tipoGrafico === 'barra' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('barra')}>
                Receita vs Despesa (Barra)
              </button>
              <button type="button" className={`btn ${tipoGrafico === 'pizza' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('pizza')}>
                Categorias (Pizza)
              </button>
            </div>
            <hr />

            {/* Renderização dos Gráficos */}
            {tipoGrafico === 'barra' && (
              <div style={{ maxWidth: '800px', margin: 'auto' }}>
                <Bar data={dadosGrafico.dataBarras} />
              </div>
            )}
            {tipoGrafico === 'linha' && (
              <div style={{ maxWidth: '800px', margin: 'auto' }}>
                <Line data={dadosGrafico.dataLinha} />
              </div>
            )}
            {tipoGrafico === 'pizza' && (
              <div style={{ maxWidth: '450px', margin: 'auto' }}>
                <h5>{tipoFiltro === 'RECEITA' ? 'Receitas' : (tipoFiltro === 'DESPESA' ? 'Despesas' : 'Geral')} por Categoria</h5>
                {dadosGrafico.dataPizza.labels && dadosGrafico.dataPizza.labels.length > 0 ? (
                  <Doughnut data={dadosGrafico.dataPizza} />
                ) : (
                  <p>Nenhum dado encontrado para os filtros selecionados.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Card de Metas (sem mudança) */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)' }}>
          <h4>Minhas Metas</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {metas.length > 0 ? (
              metas.slice(0, 3).map(meta => {
                const progresso = calcularProgressoMeta(meta);
                return (
                  <li key={meta.id} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>{meta.nome}</span>
                      <span style={{ color: 'var(--info-color)', fontWeight: 'bold' }}>{progresso.toFixed(0)}%</span>
                    </div>
                    <ProgressBar percentual={progresso} />
                    <small>R$ {meta.valorAtual.toFixed(2)} / R$ {meta.valorAlvo.toFixed(2)}</small>
                  </li>
                );
              })
            ) : (
              <p>Nenhuma meta cadastrada.</p>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default HomePage;