import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute';
import { AdminLogin } from './pages/admin/auth/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApprovals } from './pages/admin/AdminApprovals';
import { AccountsList } from './pages/admin/accounts/AccountsList';
import { AccountDetails } from './pages/admin/accounts/AccountDetails';
import { ShipmentsList } from './pages/admin/shipments/ShipmentsList';
import { ShipmentDetails } from './pages/admin/shipments/ShipmentDetails';
import { ActiveTrips } from './pages/admin/trips/ActiveTrips';
import { CommissionsDashboard } from './pages/admin/commissions/CommissionsDashboard';
import { CarrierAccountability } from './pages/admin/carriers/CarrierAccountability';
import { TruckTypes } from './pages/admin/master-data/TruckTypes';
import { CargoTypes } from './pages/admin/master-data/CargoTypes';
import { GeneralNotifications } from './pages/admin/notifications/GeneralNotifications';
import { ContentManagement } from './pages/admin/content/ContentManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="accounts" element={<AccountsList />} />
            <Route path="accounts/:accountId" element={<AccountDetails />} />
            <Route path="shipments" element={<ShipmentsList />} />
            <Route path="shipments/:shipmentId" element={<ShipmentDetails />} />
            <Route path="trips" element={<ActiveTrips />} />
            <Route path="commissions" element={<CommissionsDashboard />} />
            <Route path="carriers/accountability" element={<CarrierAccountability />} />
            <Route path="master-data/truck-types" element={<TruckTypes />} />
            <Route path="master-data/cargo-types" element={<CargoTypes />} />
            <Route path="notifications" element={<GeneralNotifications />} />
            <Route path="content" element={<ContentManagement />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
