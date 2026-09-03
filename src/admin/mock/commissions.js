import { mockData } from './data';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const getCommissionRate = async () => {
  await delay();
  return mockData.commissionRate;
};

export const updateCommissionRate = async (newRate) => {
  await delay();
  if (newRate < 0 || newRate > 100) throw new Error('Invalid rate');
  mockData.commissionRate = newRate;
  return newRate;
};

export const getCommissionTransactions = async () => {
  await delay();
  return [...mockData.commissionTransactions];
};
