import { mockData } from './data';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Truck Types
export const getTruckTypes = async () => {
  await delay();
  return [...mockData.truckTypes];
};

export const createTruckType = async (name) => {
  await delay();
  const newType = { id: `TT-${Date.now()}`, name };
  mockData.truckTypes.push(newType);
  return newType;
};

export const updateTruckType = async (id, name) => {
  await delay();
  const type = mockData.truckTypes.find(t => t.id === id);
  if (!type) throw new Error('Not found');
  type.name = name;
  return type;
};

export const deleteTruckType = async (id) => {
  await delay();
  mockData.truckTypes = mockData.truckTypes.filter(t => t.id !== id);
};

// Cargo Types
export const getCargoTypes = async () => {
  await delay();
  return [...mockData.cargoTypes];
};

export const createCargoType = async (name, category) => {
  await delay();
  const newType = { id: `CT-${Date.now()}`, name, category };
  mockData.cargoTypes.push(newType);
  return newType;
};

export const updateCargoType = async (id, name, category) => {
  await delay();
  const type = mockData.cargoTypes.find(t => t.id === id);
  if (!type) throw new Error('Not found');
  type.name = name;
  type.category = category;
  return type;
};

export const deleteCargoType = async (id) => {
  await delay();
  mockData.cargoTypes = mockData.cargoTypes.filter(t => t.id !== id);
};
