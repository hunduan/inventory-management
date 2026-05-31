import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/auth';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import ProductsPage from './pages/products';
import ProductFormPage from './pages/products/form';
import CategoriesPage from './pages/categories';
import SuppliersPage from './pages/suppliers';
import CustomersPage from './pages/customers';
import WarehousesPage from './pages/warehouses';
import PurchasesList from './pages/purchases';
import PurchasesNew from './pages/purchases/new';
import PurchasesDetail from './pages/purchases/detail';
import SalesList from './pages/sales';
import SalesNew from './pages/sales/new';
import SalesDetail from './pages/sales/detail';
import InventoryPage from './pages/inventory';
import StocktakeList from './pages/stocktake';
import StocktakeNew from './pages/stocktake/new';
import StocktakeDetail from './pages/stocktake/detail';
import TransfersList from './pages/transfers';
import TransfersNew from './pages/transfers/new';
import TransfersDetail from './pages/transfers/detail';
import ReportsPage from './pages/reports';
import UsersPage from './pages/users';
import RolesPage from './pages/roles';
import TenantsPage from './pages/tenants';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <AuthInit>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/purchases" element={<PurchasesList />} />
              <Route path="/purchases/new" element={<PurchasesNew />} />
              <Route path="/purchases/:id/edit" element={<PurchasesNew />} />
              <Route path="/purchases/:id" element={<PurchasesDetail />} />
              <Route path="/sales" element={<SalesList />} />
              <Route path="/sales/new" element={<SalesNew />} />
              <Route path="/sales/:id/edit" element={<SalesNew />} />
              <Route path="/sales/:id" element={<SalesDetail />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/stocktakes" element={<StocktakeList />} />
              <Route path="/stocktakes/new" element={<StocktakeNew />} />
              <Route path="/stocktakes/:id" element={<StocktakeDetail />} />
              <Route path="/transfers" element={<TransfersList />} />
              <Route path="/transfers/new" element={<TransfersNew />} />
              <Route path="/transfers/:id" element={<TransfersDetail />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInit>
      </BrowserRouter>
    </ConfigProvider>
  );
}
