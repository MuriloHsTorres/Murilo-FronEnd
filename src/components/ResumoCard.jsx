// src/components/ResumoCard.jsx

import React from 'react';

function ResumoCard({
  title,
  valor,
  color, // Cor do texto do valor (Ex: var(--receitas-color))
  backgroundColor, // Cor de fundo do card (Ex: var(--primary-color))
  isExpanded,
  onToggle,
  breakdownMap,
  breakdownKey
}) {

  // 1. Estilo para o CARD (o div principal)
  // Usa a prop 'backgroundColor' que recebemos
  const cardStyle = {
    backgroundColor: backgroundColor
  };

  // 2. Estilo para o VALOR (o <p>)
  // Usa a prop 'color' que já existia
  const valorStyle = {
    color: color
  };

  return (
    // 3. Aplicamos o estilo de fundo no div principal
    <div className="resumo-card" onClick={onToggle} style={cardStyle}>

      <h3>{title}</h3>

      {/* 4. Aplicamos o estilo de cor no <p> */}
      <p className="resumo-card-valor" style={valorStyle}>
        R$ {valor.toFixed(2)}
      </p>

      {/* O "Breakdown" que expande */}
      {isExpanded && (
        <div className="resumo-card-breakdown">
          <h4>Contas:</h4>

          {/* Converte o Map para um Array e renderiza */}
          {Array.from(breakdownMap.entries()).map(([contaNome, data]) => (
            <div className="breakdown-item" key={contaNome}>
              <span>{contaNome}:</span>
              <strong>R$ {data[breakdownKey].toFixed(2)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumoCard;