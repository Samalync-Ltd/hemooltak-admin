import { mockData } from './data';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getShipments = async () => {
  await delay();
  return [...mockData.shipments];
};

export const getShipmentById = async (id) => {
  await delay();
  const shp = mockData.shipments.find(s => s.id === id);
  if (!shp) throw new Error('Shipment not found');
  return { ...shp };
};
