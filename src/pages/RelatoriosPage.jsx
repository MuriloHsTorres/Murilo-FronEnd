// src/pages/RelatoriosPage.jsx (CORRIGIDO)

import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';

// Imports
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

// Registar
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CORES_GRAFICO = [
  '#005840', '#5dd62c', '#df0139', '#ffc107', '#0dcaf0',
  '#8B0000', '#006400', '#00008B', '#FF9F40', '#E7E9ED'
];

function RelatoriosPage() {
  const { contas, transacoes, loading } = useData();

  // --- Estados e Refs ---
  const [contaId, setContaId] = useState('todas');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const barChartRef = useRef(null);
  const doughnutDespesasRef = useRef(null);
  const doughnutReceitasRef = useRef(null);

  // --- useMemo (com "Guarda" de loading) ---
  const dadosRelatorio = useMemo(() => {
    if (loading || !contas || !transacoes) {
        return { transacoesFiltradas: [], dataBarras: { labels: [], datasets: [] }, dataPizzaDespesas: { labels: [], datasets: [] }, dataPizzaReceitas: { labels: [], datasets: [] }, saldoInicial: 0, totalReceitas: 0, totalDespesas: 0, saldoFinal: 0, contasFiltradas: [] };
    }

    const dataInicioObj = parseISO(dataInicio + 'T00:00:00');
    const dataFimObj = parseISO(dataFim + 'T23:59:59');
    const contasFiltradas = contas.filter(c => 
      c.tipo === 'CONTA_CORRENTE' && (contaId === 'todas' || c.id === contaId)
    );

    const idsContasFiltradas = contasFiltradas.map(c => c.id);
    let saldoInicial = 0;
    contasFiltradas.forEach(c => saldoInicial += c.saldoAbertura);
    transacoes
      .filter(t => 
        idsContasFiltradas.includes(t.contaId) && 
        parseISO(t.dataOperacao) < dataInicioObj
      )
      .forEach(t => saldoInicial += t.valor);
    const transacoesFiltradas = transacoes
      .filter(t => 
        idsContasFiltradas.includes(t.contaId) &&
        parseISO(t.dataOperacao) >= dataInicioObj &&
        parseISO(t.dataOperacao) <= dataFimObj
      )
      .sort((a, b) => parseISO(a.dataOperacao) - parseISO(b.dataOperacao));
    let totalReceitas = 0;
    let totalDespesas = 0;
    let saldoCorrente = saldoInicial;
    const despesasPorCategoria = {};
    const receitasPorCategoria = {};
    transacoesFiltradas.forEach(t => {
      saldoCorrente += t.valor;
      if (t.nomeCategoria !== 'Transferências') {
        if (t.valor > 0) {
          totalReceitas += t.valor;
          receitasPorCategoria[t.nomeCategoria] = (receitasPorCategoria[t.nomeCategoria] || 0) + t.valor;
        } else {
          totalDespesas += t.valor;
          despesasPorCategoria[t.nomeCategoria] = (despesasPorCategoria[t.nomeCategoria] || 0) + Math.abs(t.valor);
        }
      }
    });
    const saldoFinal = saldoCorrente;
    const dataBarras = {
      labels: ['Resumo do Período'],
      datasets: [
        { label: 'Total Receitas', data: [totalReceitas], backgroundColor: '#198754' },
        { label: 'Total Despesas', data: [Math.abs(totalDespesas)], backgroundColor: '#dc3545' },
      ],
    };
    const dataPizzaDespesas = {
      labels: Object.keys(despesasPorCategoria),
      datasets: [{ data: Object.values(despesasPorCategoria), backgroundColor: CORES_GRAFICO }]
    };
    const dataPizzaReceitas = {
      labels: Object.keys(receitasPorCategoria),
      datasets: [{ data: Object.values(receitasPorCategoria), backgroundColor: CORES_GRAFICO }]
    };
    return {
      transacoesFiltradas, saldoInicial, totalReceitas, totalDespesas, saldoFinal,
      dataBarras, dataPizzaDespesas, dataPizzaReceitas, contasFiltradas
    };

  }, [contas, transacoes, contaId, dataInicio, dataFim, loading]);


  // --- handleGerarRelatorio (com "Guarda" de refs) ---
  const handleGerarRelatorio = () => {

    if (!barChartRef.current || !doughnutDespesasRef.current || !doughnutReceitasRef.current) {
      alert("Erro: Os gráficos ainda não estão prontos. Tente novamente em um segundo.");
      return;
    }

    if (loading || !dadosRelatorio.contasFiltradas) {
         alert("Erro: Os dados ainda estão a ser carregados. Tente novamente.");
         return;
    }

    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const margin = 40;
      let yPos = margin;
      const {
        transacoesFiltradas, saldoInicial, totalReceitas,
        totalDespesas, saldoFinal
      } = dadosRelatorio;

      // ... (resto da lógica do PDF) ...
      doc.setFontSize(18);
      doc.text('Relatório Financeiro - Expresso Finance', margin, yPos);
      yPos += 30;
      const contaSelecionada = contas.find(c => c.id === contaId);
      const nomeConta = contaId === 'todas' ? 'Todas as Contas' : (contaSelecionada ? contaSelecionada.nome : 'Conta Desconhecida');
      doc.setFontSize(11);
      doc.text(`Conta: ${nomeConta}`, margin, yPos);
      yPos += 15;
      doc.text(`Período: ${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`, margin, yPos);
      yPos += 30;
      doc.autoTable({
        startY: yPos,
        head: [['Saldo Inicial', 'Total Receitas', 'Total Despesas', 'Saldo Final']],
        body: [[
          `R$ ${saldoInicial.toFixed(2)}`,
          `R$ ${totalReceitas.toFixed(2)}`,
          `R$ ${Math.abs(totalDespesas).toFixed(2)}`,
          `R$ ${saldoFinal.toFixed(2)}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [0, 88, 64] }
      });
      yPos = doc.lastAutoTable.finalY + 30;
      doc.setFontSize(14);
      doc.text('Gráficos do Período', margin, yPos);
      yPos += 20;
      const barChartImg = barChartRef.current.toBase64Image('image/png', 1.0);
      const doughDespesasImg = doughnutDespesasRef.current.toBase64Image('image/png', 1.0);
      const doughReceitasImg = doughnutReceitasRef.current.toBase64Image('image/png', 1.0);
      doc.addImage(barChartImg, 'PNG', margin, yPos, 515, 200);
      yPos += 220;
      doc.text('Despesas por Categoria', margin, yPos);
      doc.addImage(doughDespesasImg, 'PNG', margin, yPos + 10, 250, 200);
      doc.text('Receitas por Categoria', margin + 265, yPos);
      doc.addImage(doughReceitasImg, 'PNG', margin + 265, yPos + 10, 250, 200);
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Histórico de Transações', margin, margin);
      yPos = margin + 30;
      const tableData = transacoesFiltradas.map(t => [
        format(parseISO(t.dataOperacao), 'dd/MM/yy HH:mm'),
        t.nomeConta,
        t.nomeCategoria,
        t.descricao || '-',
        t.valor > 0 ? `R$ ${t.valor.toFixed(2)}` : '',
        t.valor < 0 ? `R$ ${t.valor.toFixed(2)}` : ''
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Data', 'Conta', 'Categoria', 'Descrição', 'Receita', 'Despesa']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 88, 64] }
      });
      doc.save(`Relatorio_Financeiro_${nomeConta}_${dataInicio}_a_${dataFim}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o relatório em PDF.");
    }
  };

  if (loading) return <div>A carregar dados...</div>;

  // --- O JSX (HTML) DA PÁGINA ---
  return (
    <div>
      <h2>Gerador de Relatórios</h2>
      <p>Selecione os filtros para gerar o seu extrato financeiro em PDF. Os gráficos abaixo são uma prévia do que será incluído.</p>

      <form onSubmit={(e) => { e.preventDefault(); handleGerarRelatorio(); }}>
        <div>
          <label>Conta:</label>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} required>
            <option value="todas">Todas as Contas Corrente</option>
            {contas && contas.filter(c => c.tipo === 'CONTA_CORRENTE').map(conta => (
              <option key={conta.id} value={conta.id}>
                {conta.nome} (Saldo: {conta.saldoAtual.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>Data de Início:</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
          </div>
          <div style={{ flex: 1 }}>
            <label>Data de Fim:</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
          </div>
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '12px' }}>
          Gerar Relatório em PDF
        </button>
      </form>

      <hr />

      <h3>Prévia do Relatório</h3>
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        <h4>Receitas vs. Despesas</h4>
        <Bar ref={barChartRef} data={dadosRelatorio.dataBarras} />
      </div>
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '900px', margin: 'auto' }}>
        <div style={{ width: '45%' }}>
          <h4>Despesas por Categoria</h4>
          <Doughnut ref={doughnutDespesasRef} data={dadosRelatorio.dataPizzaDespesas} />
        </div>
        <div style={{ width: '45%' }}>
          <h4>Receitas por Categoria</h4>
          <Doughnut ref={doughnutReceitasRef} data={dadosRelatorio.dataPizzaReceitas} />
        </div>
      </div>
    </div>
  );
}

export default RelatoriosPage;