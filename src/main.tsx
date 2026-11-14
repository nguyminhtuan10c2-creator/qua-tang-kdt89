import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));

function RootRouter() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
            Đang tải khu vực quản trị...
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(<RootRouter />);
