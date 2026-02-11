import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { queryClient } from './config/react-query';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsListPage from './pages/projects/ProjectsListPage';
import BoardPage from './pages/board/BoardPage';
import ReportsPage from './pages/reports/ReportsPage';
import ClientPortalPage from './pages/client/ClientPortalPage';
import TicketsListPage from './pages/tickets/TicketsListPage';
function App() {
  
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#052350',
              },
              success: {
                iconTheme: {
                  primary: '#0676CF',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EA1E28',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute >
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="client" element={<ClientPortalPage />} />
              <Route path="tickets" element={<TicketsListPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
