import { mockData } from './data';
import { ACCOUNT_STATUS } from './constants';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getAccounts = async () => {
  await delay();
  return [...mockData.accounts];
};

export const getAccountById = async (id) => {
  await delay();
  const acc = mockData.accounts.find(a => a.id === id);
  if (!acc) throw new Error('Account not found');
  return { ...acc };
};

export const updateDocumentStatus = async (accountId, documentId, newStatus) => {
  await delay();
  const acc = mockData.accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');
  
  const doc = acc.documents.find(d => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  doc.status = newStatus;
  return { ...doc };
};

export const updateAccountStatus = async (accountId, newStatus) => {
  await delay();
  const acc = mockData.accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  acc.status = newStatus;
  return { ...acc };
};
