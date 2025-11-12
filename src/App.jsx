// src/App.jsx
// 1. Imports do React Router
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// --- Layout ---
import MainLayout from "./components/MainLayout"; // A "casca" da app logada

// --- Páginas Logadas (as 6 "abas") ---
import HomePage from "./pages/HomePage";
import ContasPage from "./pages/ContasPage";
import TransacoesPage from "./pages/TransacoesPage";
import MetasPage from "./pages/MetasPage";
import TransferenciasPage from "./pages/TransferenciasPage";
import PerfilPage from "./pages/PerfilPage";
import RelatoriosPage from "./pages/RelatoriosPage";
// --- Páginas Deslogadas ---
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// --- Componente da Área de Autenticação (Login/Cadastro) ---
// (O que tínhamos antes, mas agora mais simples)
// --- Componente de "Rota Privada" ---
// Isto protege as nossas páginas. Se o utilizador não estiver logado,
// ele é "redirecionado" (Navigate) para a página de login.
function PrivateRoute({ children }) {
  const { utilizador } = useAuth(); // Lê o estado de login

  // Se houver utilizador, mostre o "filho" (no caso, o <MainLayout>)
  // Se não, redirecione para "/login"
  return utilizador ? children : <Navigate to="/login" />;
}

// --- O NOVO App.jsx ---
// Agora ele é apenas o "mapa" (Router) do site
// src/App.jsx

// ... (mantenha todos os seus imports)
// ... (mantenha o componente PrivateRoute)

// --- O NOVO App.jsx ---
// Agora ele é apenas o "mapa" (Router) do site
function App() {
  const { utilizador } = useAuth(); // Usado para a rota de login

  // (Não precisamos mais do AuthArea ou do useState(mostrarLogin) aqui)

  return (
    // O <Routes> é o "cérebro" do Router
    <Routes>
      {/* --- ROTAS PRIVADAS (Área Logada) --- */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Estas rotas são "filhas" do MainLayout
          Elas serão renderizadas dentro do <Outlet />
        */}
        <Route index element={<HomePage />} /> {/* URL: / */}
        <Route path="contas" element={<ContasPage />} /> {/* URL: /contas */}
        <Route path="transacoes" element={<TransacoesPage />} />{" "}
        {/* URL: /transacoes */}
        <Route path="metas" element={<MetasPage />} /> {/* URL: /metas */}
        <Route path="transferencias" element={<TransferenciasPage />} />{" "}
        {/* URL: /transferencias */}
        <Route path="perfil" element={<PerfilPage />} /> {/* URL: /perfil */}
        <Route path="relatorios" element={<RelatoriosPage />} />{" "}
        {/* URL: /relatorios */}
      </Route>
      

      {/* --- ROTAS PÚBLICAS (Área Deslogada) --- */}

      {/* MUDANÇA 1: A rota /login agora renderiza SÓ o LoginPage */}
      <Route
        path="/login"
        element={
          // Se o utilizador já está logado, redireciona para a Home ("/")
          // Se não, mostra a página de Login
          utilizador ? <Navigate to="/" /> : <LoginPage />
        }
      />

      {/* MUDANÇA 2: ADICIONAMOS A ROTA PARA /RegisterPage */}
      <Route
        path="/RegisterPage"
        element={
          // Se o utilizador já está logado, redireciona para a Home ("/")
          // Se não, mostra a página de Registro
          utilizador ? <Navigate to="/" /> : <RegisterPage />
        }
      />

      {/* Rota "Pega-Tudo" (404 Not Found) */}
      <Route path="*" element={<Navigate to="/" />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {" "}
        {/* Rotas "filhas" do MainLayout */}{" "}
        <Route index element={<HomePage />} />{" "}
        <Route path="contas" element={<ContasPage />} />{" "}
        <Route path="transacoes" element={<TransacoesPage />} />{" "}
        <Route path="metas" element={<MetasPage />} />{" "}
        <Route path="transferencias" element={<TransferenciasPage />} />{" "}
        <Route path="perfil" element={<PerfilPage />} />{" "}
        <Route path="relatorios" element={<RelatoriosPage />} />{" "}
        {/* <-- 2. ADICIONE ESTA LINHA */}{" "}
      </Route>
    </Routes>
  );
}

export default App;
