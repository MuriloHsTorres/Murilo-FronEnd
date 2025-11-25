// src/components/ResumoCard.jsx

import React from 'react';

function ResumoCard({
  title,
  valor,
  color,           // Cor do texto do valor
  backgroundColor, // Cor de fundo do card
  isExpanded,
  onToggle,
  breakdownMap,
  breakdownKey
}) {

  const cardStyle = {
    backgroundColor: backgroundColor,
    cursor: 'pointer', // Adicionado para indicar que é clicável
    transition: 'all 0.3s ease'
  };

  const valorStyle = {
    color: color || '#fff' // Se não vier cor, usa branco por defeito
  };

  return (
    <div className="resumo-card" onClick={onToggle} style={cardStyle}>

      <h3>{title}</h3>

      <p className="resumo-card-valor" style={valorStyle}>
        R$ {valor ? valor.toFixed(2) : '0.00'}
      </p>

      {isExpanded && (
        <div className="resumo-card-breakdown">
          {/* CORREÇÃO AQUI: */}
          {/* O map devolve [chave, valor]. A chave é o ID, o valor é o objeto com dados */}
          {Array.from(breakdownMap.entries()).map(([id, data]) => (
            <div className="breakdown-item" key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              
              {/* Aqui usamos data.nome em vez da chave id */}
              <span>{data.nome}:</span>
              
              <strong>R$ {data[breakdownKey].toFixed(2)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumoCard;