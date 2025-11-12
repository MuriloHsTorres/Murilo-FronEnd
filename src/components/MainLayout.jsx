// src/components/MainLayout.jsx (CORRIGIDO)

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CardsResumoContainer from './CardsResumoContainer';
// 1. IMPORTAR O CSS MODULE (Agora ele existe!)
import styles from './MainLayout.module.css';

function MainLayout() {
  const { utilizador, logout } = useAuth();

  // 2. DEFINIR A FUNÇÃO (Corrigindo o erro 'getNavLinkClass is not defined')
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
  };

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>

        <div className={styles.logoArea}>
          <NavLink to="/" className={styles.logoLink}>
            Expresso Finance
          </NavLink>
        </div>

        {/* A navegação correta */}
        <nav className={styles.navArea}>
          <ul className={styles.navTabs}>
            <li>
              <NavLink to="/" end className={getNavLinkClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/contas" className={getNavLinkClass}>
                Minhas Contas
              </NavLink>
            </li>
            <li>
              <NavLink to="/transacoes" className={getNavLinkClass}>
                Transações
              </NavLink>
            </li>
            <li>
              <NavLink to="/metas" className={getNavLinkClass}>
                Metas
              </NavLink>
            </li>
            <li>
              <NavLink to="/transferencias" className={getNavLinkClass}>
                Transferências
              </NavLink>
            </li>
            <li>
              <NavLink to="/perfil" className={getNavLinkClass}>
                Perfil
              </NavLink>
            </li>
            <li>
              <NavLink to="/relatorios" className={getNavLinkClass}>
                Relatórios
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* O rodapé da sidebar */}
        <div className={styles.userArea}>
          <span>Olá, {utilizador.nome}!</span>
          <button onClick={logout} className="btnSair" style={{ width: '100%' }}>
            Sair
          </button>
        </div>
      </aside>

      {/* O conteúdo principal */}
      <main className={styles.mainContent}>
        <CardsResumoContainer />
        <hr />
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;