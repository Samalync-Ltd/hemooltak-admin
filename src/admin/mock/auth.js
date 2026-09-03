import { mockData } from './data';

// Simulate a brief network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const adminLogin = async (email, password) => {
  await delay();
  if (email === 'admin@hemooltak.com' && password === 'admin123') {
    const session = { id: 'ADM-1', name: 'Super Admin', email };
    mockData.adminSession = session;
    localStorage.setItem('adminSession', JSON.stringify(session));
    return session;
  }
  throw new Error('Invalid credentials');
};

export const adminLogout = async () => {
  await delay();
  mockData.adminSession = null;
  localStorage.removeItem('adminSession');
};

export const getAdminSession = () => {
  if (!mockData.adminSession) {
    const stored = localStorage.getItem('adminSession');
    if (stored) {
      mockData.adminSession = JSON.parse(stored);
    }
  }
  return mockData.adminSession;
};

// General Metrics for Overview
export const getDashboardMetrics = async () => {
  await delay();
  
  const totalShippers = mockData.accounts.filter(a => a.type === 'SHIPPER').length;
  const totalCarriers = mockData.accounts.filter(a => a.type === 'CARRIER').length;
  
  const pendingAccounts = mockData.accounts.filter(a => a.status === 'UNDER_REVIEW').length;
  
  const shipmentCounts = {
    AWAITING_OFFERS: 0,
    NEGOTIATING: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0
  };
  mockData.shipments.forEach(s => {
    if (shipmentCounts[s.status] !== undefined) {
      shipmentCounts[s.status]++;
    }
  });

  const totalCommission = mockData.commissionTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    users: { total: totalShippers + totalCarriers, shippers: totalShippers, carriers: totalCarriers },
    pendingAccounts,
    shipmentCounts,
    totalCommission
  };
};
