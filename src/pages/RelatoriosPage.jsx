// src/pages/RelatoriosPage.jsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext'; 

// Imports Gráficos
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Imports PDF e Datas
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { format, parseISO, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function RelatoriosPage() {
  const { transacoes, contas, metas, loading } = useData();
  const { utilizador } = useAuth(); 

  const [dateRange, setDateRange] = useState('mesAtual');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [contasSelecionadas, setContasSelecionadas] = useState([]);

  const lineChartRef = useRef(null);

  // --- LÓGICA DE SELEÇÃO ---
  const contasValidas = useMemo(() => {
    if (!contas) return [];
    return contas.filter(c => {
       const tipo = c.tipo || c.tipoConta || ''; 
       return tipo !== 'META' && tipo !== 'CONTA_META'; 
    });
  }, [contas]);

  useEffect(() => {
    if (!loading && contasValidas.length > 0 && contasSelecionadas.length === 0) {
      setContasSelecionadas(contasValidas.map(c => c.id));
    }
  }, [loading, contasValidas]);

  const handleCheckboxChange = (id) => {
    setContasSelecionadas(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
    setContasSelecionadas(e.target.checked ? contasValidas.map(c => c.id) : []);
  };

  const isAllSelected = contasValidas.length > 0 && contasSelecionadas.length === contasValidas.length;

  // --- LÓGICA DE DADOS ---
  const dadosRelatorio = useMemo(() => {
    if (loading || !transacoes || !contas) return null;

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
    const startIso = new Date(startDate); startIso.setHours(0,0,0,0);
    const endIso = new Date(endDate); endIso.setHours(23,59,59,999);

    let saldoInicial = 0;
    const contasNoFiltro = contas.filter(c => contasSelecionadas.includes(c.id));
    contasNoFiltro.forEach(c => saldoInicial += c.saldoAbertura);

    transacoes
      .filter(t => contasSelecionadas.includes(t.contaId) && parseISO(t.dataOperacao) < startIso)
      .forEach(t => saldoInicial += t.valor);

    const transacoesPeriodo = transacoes
        .filter(t => {
            if (!t.dataOperacao) return false;
            const dt = parseISO(t.dataOperacao);
            const inDate = dt >= startIso && dt <= endIso;
            const inConta = contasSelecionadas.includes(t.contaId);
            return inDate && inConta && t.nomeCategoria !== 'Transferências'; 
        })
        .sort((a, b) => parseISO(a.dataOperacao) - parseISO(b.dataOperacao));

    let totalReceitas = 0;
    let totalDespesas = 0;
    
    transacoesPeriodo.forEach(t => {
        if (t.valor > 0) totalReceitas += t.valor;
        else totalDespesas += Math.abs(t.valor);
    });

    const saldoFinal = saldoInicial + totalReceitas - totalDespesas;

    const diasIntervalo = eachDayOfInterval({ start: startIso, end: endIso });
    const labelsLinha = diasIntervalo.map(dia => format(dia, 'dd/MM'));
    const dadosSaldoLinha = [];
    let saldoCorrente = saldoInicial;

    diasIntervalo.forEach(dia => {
        let netDiario = 0;
        transacoesPeriodo.forEach(t => {
            if (format(parseISO(t.dataOperacao), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd')) {
                netDiario += t.valor;
            }
        });
        saldoCorrente += netDiario;
        dadosSaldoLinha.push(saldoCorrente.toFixed(2));
    });

    const dataLinha = {
        labels: labelsLinha,
        datasets: [{
            label: 'Evolução do Saldo',
            data: dadosSaldoLinha,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            fill: true,
            tension: 0.3
        }]
    };

    return { startDate: startIso, endDate: endIso, saldoInicial, saldoFinal, totalReceitas, totalDespesas, transacoesPeriodo, dataLinha };
  }, [transacoes, contas, dateRange, dataInicio, dataFim, contasSelecionadas, loading]);


  // --- FUNÇÃO GERAR PDF ---
  const handleGerarPDF = () => {
    if (!dadosRelatorio) return alert("Sem dados.");
    if (!lineChartRef.current) return alert("Aguarde o gráfico carregar.");

    try {
        const doc = new jsPDF();
        const margin = 15;
        let y = 20;

        // --- CONTEÚDO DO PDF (Corpo) ---

        // Cabeçalho da Primeira Página
        doc.setFontSize(22);
        doc.setTextColor(46, 204, 113);
        doc.text("Relatório Financeiro Detalhado", margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        const nomeUsuario = utilizador ? utilizador.nome : "Utilizador";
        const dataGeracao = format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Gerado por: ${nomeUsuario} | Em: ${dataGeracao}`, margin, y);
        y += 8;

        doc.setFontSize(12);
        doc.setTextColor(0);
        const inicioStr = format(dadosRelatorio.startDate, 'dd/MM/yyyy');
        const fimStr = format(dadosRelatorio.endDate, 'dd/MM/yyyy');
        doc.text(`Período de Análise: ${inicioStr} até ${fimStr}`, margin, y);
        y += 12;

        doc.setFontSize(10);
        doc.setTextColor(80);
        const paragrafo = "Este documento apresenta o histórico completo das movimentações financeiras, a evolução do saldo acumulado e a situação atual das metas do utilizador. Os dados abaixo refletem apenas as contas selecionadas no momento da geração deste relatório.";
        const linhasParagrafo = doc.splitTextToSize(paragrafo, 180);
        doc.text(linhasParagrafo, margin, y);
        y += (linhasParagrafo.length * 5) + 10; 

        // Tabela Resumo
        autoTable(doc, {
            startY: y,
            head: [['Saldo Inicial', 'Total Entradas', 'Total Saídas', 'Saldo Final']],
            body: [[
                `R$ ${dadosRelatorio.saldoInicial.toFixed(2)}`,
                `R$ ${dadosRelatorio.totalReceitas.toFixed(2)}`,
                `R$ ${dadosRelatorio.totalDespesas.toFixed(2)}`,
                `R$ ${dadosRelatorio.saldoFinal.toFixed(2)}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [46, 204, 113], halign: 'center' },
            bodyStyles: { halign: 'center' },
            styles: { fontSize: 11 }
        });
        y = doc.lastAutoTable.finalY + 20;

        // Gráfico
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Evolução do Saldo", margin, y);
        y += 10;
        const imgLine = lineChartRef.current.toBase64Image();
        if (imgLine) doc.addImage(imgLine, 'PNG', margin, y, 180, 60);
        y += 70;

        // Metas
        if (y > 230) { doc.addPage(); y = 20; }
        doc.text("Progresso das Metas", margin, y);
        y += 10;

        const metasTableData = metas.map(m => {
            const progresso = m.valorAlvo > 0 ? (m.valorAtual / m.valorAlvo) * 100 : 0;
            return [
                m.nome,
                `R$ ${m.valorAtual.toFixed(2)}`,
                `R$ ${m.valorAlvo.toFixed(2)}`,
                `${progresso.toFixed(0)}%`
            ];
        });

        if (metasTableData.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Nome da Meta', 'Guardado', 'Objetivo', 'Concluído']],
                body: metasTableData,
                theme: 'striped',
                headStyles: { fillColor: [39, 174, 96] },
                columnStyles: { 3: { fontStyle: 'bold', textColor: [39, 174, 96] } }
            });
            y = doc.lastAutoTable.finalY + 20;
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Nenhuma meta cadastrada no sistema.", margin, y);
            y += 20;
        }

        // Extrato
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.setTextColor(46, 204, 113);
        doc.text("Extrato Detalhado de Transações", margin, y);
        y += 10;

        const transacoesTableData = dadosRelatorio.transacoesPeriodo.map(t => [
            format(parseISO(t.dataOperacao), 'dd/MM/yy'),
            t.descricao,
            t.nomeCategoria,
            t.valor >= 0 ? `R$ ${t.valor.toFixed(2)}` : '',
            t.valor < 0 ? `R$ ${Math.abs(t.valor).toFixed(2)}` : ''
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Data', 'Descrição', 'Categoria', 'Entrada', 'Saída']],
            body: transacoesTableData,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50] },
            columnStyles: { 3: { textColor: [0, 150, 0] }, 4: { textColor: [200, 0, 0] } }
        });

        // --- 2. RODAPÉ GLOBAL EM TODAS AS PÁGINAS (Expresso + Numeração) ---
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Lado Esquerdo: "Expresso" (Marca)
            doc.setFontSize(12);
            doc.setTextColor(46, 204, 113); // Verde da marca
            doc.setFont("helvetica", "bold"); // Negrito para destacar
            doc.text("Expresso", margin, pageHeight - 10);

            // Lado Direito: Numeração
            doc.setFontSize(8);
            doc.setTextColor(150); // Cinza
            doc.setFont("helvetica", "normal");
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        doc.save(`Relatorio_${inicioStr}_${fimStr}.pdf`);

    } catch (error) {
        console.error("ERRO:", error);
        alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const calcularProgressoMeta = (meta) => {
    if (meta.valorAlvo <= 0) return 0;
    return Math.min(Math.max((meta.valorAtual / meta.valorAlvo) * 100, 0), 100);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Gerador de Relatórios</h2>
        <button className="btn btn-primary" onClick={handleGerarPDF} disabled={!dadosRelatorio}>
            📄 Baixar PDF Completo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* COLUNA 1: FILTROS */}
        <div className="card" style={{ padding: '20px' }}>
            <h4>Filtros</h4>
            
            <div className="form-group mb-3">
                <label>Período</label>
                <select className="form-control" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="mesAtual">Mês Atual</option>
                    <option value="7dias">Últimos 7 Dias</option>
                    <option value="personalizado">Personalizado</option>
                </select>
            </div>

            {dateRange === 'personalizado' && (
                <div className="row mb-3">
                    <div className="col-6"><label>Início</label><input type="date" className="form-control" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
                    <div className="col-6"><label>Fim</label><input type="date" className="form-control" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                </div>
            )}

            <div className="form-group">
                <label>Contas</label>
                <div style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} style={{ marginRight: '10px' }} />
                        <label style={{ margin: 0, fontWeight: 'bold' }}>Todas</label>
                    </div>
                    {contasValidas.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <input type="checkbox" checked={contasSelecionadas.includes(c.id)} onChange={() => handleCheckboxChange(c.id)} style={{ marginRight: '10px' }} />
                            <label style={{ margin: 0, fontSize: '0.9em' }}>{c.nome}</label>
                        </div>
                    ))}
                </div>
                <small className="text-muted">{contasSelecionadas.length} selecionadas</small>
            </div>
        </div>

        {/* COLUNA 2: PRÉVIA */}
        <div className="card" style={{ padding: '20px' }}>
            <h4>Prévia do Relatório</h4>
            {dadosRelatorio ? (
                <>
                    <div className="row mb-4">
                        <div className="col-4 text-center border-end"><small>Saldo Inicial</small><h5 className="text-secondary">R$ {dadosRelatorio.saldoInicial.toFixed(2)}</h5></div>
                        <div className="col-4 text-center border-end"><small>Resultado</small><h5 style={{color: (dadosRelatorio.totalReceitas - dadosRelatorio.totalDespesas) >= 0 ? 'green' : 'red'}}>R$ {(dadosRelatorio.totalReceitas - dadosRelatorio.totalDespesas).toFixed(2)}</h5></div>
                        <div className="col-4 text-center"><small>Saldo Final</small><h5 className="text-primary">R$ {dadosRelatorio.saldoFinal.toFixed(2)}</h5></div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h6>Evolução do Saldo</h6>
                        <div style={{ height: '200px' }}>
                            <Line ref={lineChartRef} data={dadosRelatorio.dataLinha} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>

                    <hr />

                    <div style={{ marginTop: '20px' }}>
                        <h6>Situação das Metas</h6>
                        {metas && metas.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {metas.map(meta => {
                                    const progresso = calcularProgressoMeta(meta);
                                    return (
                                        <div key={meta.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', fontWeight: 'bold', marginBottom: '5px' }}>
                                                <span>{meta.nome}</span>
                                                <span style={{ color: '#2ecc71' }}>{progresso.toFixed(0)}%</span>
                                            </div>
                                            <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${progresso}%`, height: '100%', backgroundColor: '#2ecc71' }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                                                Guardado: <strong>R$ {meta.valorAtual.toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted">Nenhuma meta cadastrada.</p>
                        )}
                    </div>
                </>
            ) : <p>Selecione os filtros.</p>}
        </div>
      </div>
    </div>
  );
}

export default RelatoriosPage;