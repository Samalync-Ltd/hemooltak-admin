import { mockData } from './data';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getWithdrawalRequests = async () => {
  await delay();
  return [...mockData.withdrawals];
};

export const updateWithdrawalStatus = async (id, newStatus) => {
  await delay();
  const req = mockData.withdrawals.find(w => w.id === id);
  if (!req) throw new Error('Withdrawal request not found');
  req.status = newStatus;
  return { ...req };
};
