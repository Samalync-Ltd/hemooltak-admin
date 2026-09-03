import { mockData } from './data';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getCarriersAccountability = async () => {
  await delay();
  return [...mockData.carriersAccountability];
};

export const resetCarrierWarnings = async (carrierId) => {
  await delay();
  const carrier = mockData.carriersAccountability.find(c => c.carrierId === carrierId);
  if (!carrier) throw new Error('Carrier not found');
  carrier.warningCount = 0;
  return { ...carrier };
};

export const removeCarrierBlock = async (carrierId) => {
  await delay();
  const carrier = mockData.carriersAccountability.find(c => c.carrierId === carrierId);
  if (!carrier) throw new Error('Carrier not found');
  carrier.isBlocked = false;
  return { ...carrier };
};
