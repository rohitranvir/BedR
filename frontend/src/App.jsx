import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastContext';
import { DataProvider } from './components/DataContext';
import NotFound from './pages/NotFound';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Flats = React.lazy(() => import('./pages/Flats'));
const Rooms = React.lazy(() => import('./pages/Rooms'));
const Beds = React.lazy(() => import('./pages/Beds'));
const Tenants = React.lazy(() => import('./pages/Tenants'));

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="flats" element={<Flats />} />
              <Route path="flats/:id" element={<Rooms />} />
              <Route path="rooms/:id" element={<Beds />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
