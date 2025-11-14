import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import ProgressBar from '../components/ProgressBar';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from 'date-fns';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CORES_GRAFICO = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#E7E9ED', '#8B0000', '#006400', '#00008B'
];

function HomePage() {
  // --- 1. A PRIMEIRA CORREÇÃO (Pedir a lista de 'metas') ---
  const { transacoes, categorias, contas, metas, loading } = useData();

  const [tipoGrafico, setTipoGrafico] = useState('linha');
  const [dateRange, setDateRange] = useState('mesAtual');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [tipoFiltro, setTipoFiltro] = useState('DESPESA'); 
  const [categoriaId, setCategoriaId] = useState('todas');
  
  const [contasSelecionadas, setContasSelecionadas] = useState([]);

  // --- LÓGICA DE SELEÇÃO PADRÃO ("TODAS") ---
  const contasValidas = useMemo(() => {
    if (!contas) return [];
    return contas.filter(c => {
       const tipo = c.tipo || c.tipoConta || ''; 
       return tipo !== 'META' && tipo !== 'CONTA_META'; 
    });
  }, [contas]);

  useEffect(() => {
    if (!loading && contasValidas.length > 0 && contasSelecionadas.length === 0) {
      const ids = contasValidas.map(c => c.id);
      setContasSelecionadas(ids);
    }
  }, [loading, contasValidas]);

  const handleCheckboxChange = (id) => {
    setContasSelecionadas(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setContasSelecionadas(contasValidas.map(c => c.id));
    } else {
      setContasSelecionadas([]);
    }
  };

  const isAllSelected = contasValidas.length > 0 && contasSelecionadas.length === contasValidas.length;

  // --- LÓGICA DOS GRÁFICOS ---
  const dadosGrafico = useMemo(() => {
    // ... (toda a lógica dos gráficos permanece igual) ...
    if (loading || !transacoes || !categorias || !contas) {
      return { dataPizza: {}, dataBarras: {}, dataLinha: {} };
    }

    let startDate, endDate;
    const hoje = new Date();
    if (dateRange === 'mesAtual') {
      startDate = startOfMonth(hoje);
      endDate = endOfMonth(hoje);
    } else if (dateRange === '7dias') {
      startDate = subDays(hoje, 6);
      endDate = hoje;
    } else { 
      startDate = parseISO(dataInicio);
      endDate = parseISO(dataFim);
    }
    endDate.setHours(23, 59, 59, 999); 

    const transacoesFiltradasGeral = transacoes.filter(t => {
      if (!t.dataOperacao) return false;
      const dataTransacao = parseISO(t.dataOperacao);
      
      const inDate = dataTransacao >= startDate && dataTransacao <= endDate;
      const inCategoria = categoriaId === 'todas' || t.categoriaId === categoriaId;
      const inConta = contasSelecionadas.includes(t.contaId);
      
      return inDate && inCategoria && inConta && t.nomeCategoria !== 'Transferências';
    });

    const transacoesFiltradasPizza = transacoesFiltradasGeral.filter(t => {
        return tipoFiltro === 'todos' ||
               (tipoFiltro === 'RECEITA' && t.valor > 0) ||
               (tipoFiltro === 'DESPESA' && t.valor < 0);
    });

    // 1. PIZZA
    const pizzaMap = new Map();
    transacoesFiltradasPizza.forEach(t => {
      const nomeCat = t.nomeCategoria || 'Sem Categoria';
      pizzaMap.set(nomeCat, (pizzaMap.get(nomeCat) || 0) + Math.abs(t.valor));
    });
    const dataPizza = {
      labels: Array.from(pizzaMap.keys()),
      datasets: [{ 
        data: Array.from(pizzaMap.values()), 
        backgroundColor: CORES_GRAFICO 
      }]
    };

    // 2. BARRA
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

    // 3. LINHA
    let saldoInicialLinha = 0;
    const contasNoFiltro = contas.filter(c => contasSelecionadas.includes(c.id)); 
    
    contasNoFiltro.forEach(c => saldoInicialLinha += c.saldoAbertura);

    transacoes.filter(t => {
        if (!t.dataOperacao) return false;
        const inConta = contasSelecionadas.includes(t.contaId);
        const isBefore = parseISO(t.dataOperacao) < startDate;
        return inConta && isBefore;
    }).forEach(t => saldoInicialLinha += t.valor);

    const diasIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    const labelsLinha = diasIntervalo.map(dia => format(dia, 'dd/MM'));
    const dadosSaldoLinha = [];
    let saldoAcumulado = saldoInicialLinha;

    diasIntervalo.forEach(dia => {
        let netDiario = 0;
        transacoesFiltradasGeral.forEach(t => { 
            if (!t.dataOperacao) return;
            if (format(parseISO(t.dataOperacao), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd')) {
                netDiario += t.valor;
            }
        });
        saldoAcumulado += netDiario;
        dadosSaldoLinha.push(saldoAcumulado.toFixed(2));
    });

    const dataLinha = {
      labels: labelsLinha,
      datasets: [{
        label: 'Evolução do Saldo (Selecionadas)', 
        data: dadosSaldoLinha, 
        borderColor: 'var(--primary-color)',
        backgroundColor: 'rgba(0, 88, 64, 0.1)',
        fill: true,
        tension: 0.1 
      }]
    };

    return { dataPizza, dataBarras, dataLinha };

  }, [
    transacoes, categorias, contas, loading, 
    dateRange, dataInicio, dataFim, tipoFiltro, categoriaId, 
    contasSelecionadas
  ]);

  // --- 2. A SEGUNDA CORREÇÃO (Remover este bloco) ---
  /* const metas = useMemo(() => {
     if (loading || !contas) return [];
     return contas.filter(c => c.tipo === 'META' || c.tipoConta === 'META' || c.tipo === 'CONTA_META');
   }, [contas, loading]);
  */
  // (A variável 'metas' agora vem diretamente do useData())

  const calcularProgressoMeta = (meta) => {
    if (meta.valorAlvo <= 0) return 0;
    const percentual = (meta.valorAtual / meta.valorAlvo) * 100;
    return Math.min(Math.max(percentual, 0), 100);
  };

  if (loading) {
    return <div>A carregar dashboard...</div>;
  }

  // --- ESTILOS CUSTOMIZADOS ---
  const themeColor = '#2ecc71'; 
  const inputBorderColor = '#ced4da'; 

  return (
    <div>
      <h2>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Coluna 1 */}
        <div>
          {/* --- FILTROS --- */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)', marginBottom: '20px' }}>
            {/* ... (toda a lógica de filtros continua igual) ... */}
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
                <label>Tipo (p/ Pizza)</label>
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

              {/* CAMPO DE CONTAS */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}> 
                <label>Contas</label>
                <div style={{ 
                    border: `1px solid ${inputBorderColor}`, 
                    borderRadius: '0.375rem', 
                    padding: '10px', 
                    height: 'auto',
                    maxHeight: '150px',
                    overflowY: 'auto', 
                    backgroundColor: '#fff',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)'
                }}>
                  
                  <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px', 
                      paddingBottom: '8px', 
                      borderBottom: '1px solid #eee'
                  }}>
                    <input 
                      type="checkbox" 
                      id="select-all"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      style={{ 
                          marginRight: '10px', 
                          width: '16px', 
                          height: '16px', 
                          accentColor: themeColor,
                          cursor: 'pointer'
                      }}
                    />
                    <label htmlFor="select-all" style={{ margin: 0, fontWeight: '600', cursor: 'pointer', color: '#495057', fontSize: '0.95em' }}>
                      Selecionar Todas
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '5px' }}>
                    {contasValidas.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
                        <input 
                            type="checkbox" 
                            id={`conta-${c.id}`}
                            checked={contasSelecionadas.includes(c.id)}
                            onChange={() => handleCheckboxChange(c.id)}
                            style={{ 
                                marginRight: '8px', 
                                width: '15px', 
                                height: '15px', 
                                accentColor: themeColor,
                                cursor: 'pointer'
                            }}
                        />
                        <label htmlFor={`conta-${c.id}`} style={{ margin: 0, fontSize: '0.9em', cursor: 'pointer', color: '#495057' }}>
                            {c.nome}
                        </label>
                        </div>
                    ))}
                  </div>
                  
                  {contasValidas.length === 0 && (
                     <div style={{color: '#dc3545', fontSize: '0.8em', marginTop: '5px'}}>
                        Nenhuma conta encontrada.
                     </div>
                  )}
                </div>
                <small className="text-muted" style={{fontSize: '0.75em', marginLeft: '2px', marginTop: '4px', display: 'block'}}>
                    {contasSelecionadas.length} de {contasValidas.length} contas visíveis
                </small>
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

          {/* --- GRÁFICOS --- */}
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)' }}>
            {/* ... (toda a lógica de gráficos continua igual) ... */}
            <h4>Balanço (com filtros)</h4>

            <div className="btn-group" role="group">
              <button type="button" className={`btn ${tipoGrafico === 'linha' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('linha')}>
                Evolução (Linha)
              </button>
              <button type="button" className={`btn ${tipoGrafico === 'barra' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('barra')}>
                Receita vs Despesa 
              </button>
              <button type="button" className={`btn ${tipoGrafico === 'pizza' ? 'btn-home' : 'btn-home'}`} onClick={() => setTipoGrafico('pizza')}>
                Categorias (Pizza)
              </button>
            </div>
            <br />
            <hr />

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

        {/* Coluna 2: Metas */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--cor-branco)' }}>
          <h4>Minhas Metas:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {/* A variável 'metas' agora é a correta, vinda do context */}
            {metas && metas.length > 0 ? ( 
              metas.slice(0, 3).map(meta => {
                const progresso = calcularProgressoMeta(meta);
                return (
                  <li key={meta.id} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>{meta.nome}</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{progresso.toFixed(0)}%</span>
                    </div>
                    <ProgressBar percentual={progresso} />
                    <small>R$ {meta.valorAtual.toFixed(2)} / R$ {meta.valorAlvo.toFixed(2)}</small>
                    <br />
                    <br />
                    <hr />
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