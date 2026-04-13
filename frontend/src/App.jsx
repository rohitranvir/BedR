import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastContext';
import Dashboard from './pages/Dashboard';
import Flats from './pages/Flats';
import Rooms from './pages/Rooms';
import Beds from './pages/Beds';
import Tenants from './pages/Tenants';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
