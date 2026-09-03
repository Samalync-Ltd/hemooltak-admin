import {
  ACCOUNT_STATUS,
  DOCUMENT_STATUS,
  SHIPMENT_STATUS,
  TRIP_STAGE,
  WITHDRAWAL_STATUS,
  CARGO_CATEGORY
} from './constants';

export const mockData = {
  adminSession: null, // Stores { id, name, email } when logged in

  commissionRate: 10, // 10% platform commission

  accounts: [
    {
      id: 'ACC-001',
      type: 'SHIPPER',
      status: ACCOUNT_STATUS.UNDER_REVIEW,
      fullName: 'Ahmed Ali',
      phone: '+966 50 123 4567',
      email: 'ahmed@example.com',
      companyName: 'Ali Trading Co.',
      address: 'Riyadh, KSA',
      submissionDate: '2026-09-01T10:00:00Z',
      documents: [
        { id: 'DOC-101', name: 'Commercial Registration', status: DOCUMENT_STATUS.UNDER_REVIEW, uploadedAt: '2026-09-01T10:05:00Z' },
        { id: 'DOC-102', name: 'Owner ID', status: DOCUMENT_STATUS.VERIFIED, uploadedAt: '2026-09-01T10:06:00Z' }
      ]
    },
    {
      id: 'ACC-002',
      type: 'CARRIER',
      status: ACCOUNT_STATUS.UNDER_REVIEW,
      fullName: 'Fahad Transport',
      phone: '+966 55 987 6543',
      email: 'fahad@transport.com',
      companyName: 'Fahad Logistics',
      address: 'Jeddah, KSA',
      submissionDate: '2026-09-02T14:30:00Z',
      documents: [
        { id: 'DOC-201', name: 'Transport License', status: DOCUMENT_STATUS.UNDER_REVIEW, uploadedAt: '2026-09-02T14:31:00Z' },
        { id: 'DOC-202', name: 'Vehicle Registration', status: DOCUMENT_STATUS.UNDER_REVIEW, uploadedAt: '2026-09-02T14:32:00Z' }
      ]
    },
    {
      id: 'ACC-003',
      type: 'SHIPPER',
      status: ACCOUNT_STATUS.VERIFIED,
      fullName: 'Khalid Abdullah',
      phone: '+966 53 444 5555',
      email: 'khalid@example.com',
      companyName: 'Khalid Importers',
      address: 'Dammam, KSA',
      submissionDate: '2026-08-15T09:00:00Z',
      documents: []
    },
    {
      id: 'ACC-004',
      type: 'CARRIER',
      status: ACCOUNT_STATUS.REJECTED,
      fullName: 'Saad Trucks',
      phone: '+966 59 111 2222',
      email: 'saad@trucks.com',
      companyName: 'Saad & Sons',
      address: 'Riyadh, KSA',
      submissionDate: '2026-08-20T11:00:00Z',
      documents: [
        { id: 'DOC-401', name: 'Transport License', status: DOCUMENT_STATUS.REJECTED, uploadedAt: '2026-08-20T11:05:00Z' }
      ]
    }
  ],

  shipments: [
    {
      id: 'SHP-1001',
      shipperId: 'ACC-003',
      shipperName: 'Khalid Abdullah',
      cargoType: 'Electronics',
      cargoCategory: CARGO_CATEGORY.NORMAL,
      origin: 'Riyadh',
      destination: 'Jeddah',
      weight: '5000 kg',
      requiredTruckType: 'Dyna',
      status: SHIPMENT_STATUS.AWAITING_OFFERS,
      createdAt: '2026-09-03T08:00:00Z',
      assignedCarrierId: null,
      assignedCarrierName: null,
      agreedPrice: null,
      offers: [
        { id: 'OFF-1', carrierId: 'ACC-002', carrierName: 'Fahad Transport', price: 1500, date: '2026-09-03T09:00:00Z', status: 'PENDING' }
      ],
      negotiations: []
    },
    {
      id: 'SHP-1002',
      shipperId: 'ACC-001',
      shipperName: 'Ahmed Ali',
      cargoType: 'Frozen Meat',
      cargoCategory: CARGO_CATEGORY.SPECIAL_CONDITIONS,
      origin: 'Jeddah',
      destination: 'Dammam',
      weight: '12000 kg',
      requiredTruckType: 'Refrigerated',
      status: SHIPMENT_STATUS.NEGOTIATING,
      createdAt: '2026-09-02T10:00:00Z',
      assignedCarrierId: null,
      assignedCarrierName: null,
      agreedPrice: null,
      offers: [
        { id: 'OFF-2', carrierId: 'ACC-005', carrierName: 'Cold Chain KSA', price: 3000, date: '2026-09-02T11:00:00Z', status: 'NEGOTIATING' }
      ],
      negotiations: [
        { id: 'NEG-1', sender: 'SHIPPER', message: 'Can you do 2800?', date: '2026-09-02T11:30:00Z' },
        { id: 'NEG-2', sender: 'CARRIER', message: 'Lowest is 2900.', date: '2026-09-02T12:00:00Z' }
      ]
    },
    {
      id: 'SHP-1003',
      shipperId: 'ACC-003',
      shipperName: 'Khalid Abdullah',
      cargoType: 'Construction Materials',
      cargoCategory: CARGO_CATEGORY.NORMAL,
      origin: 'Dammam',
      destination: 'Riyadh',
      weight: '25000 kg',
      requiredTruckType: 'Flatbed',
      status: SHIPMENT_STATUS.ACTIVE,
      createdAt: '2026-09-01T08:00:00Z',
      assignedCarrierId: 'ACC-006',
      assignedCarrierName: 'Heavy Haulage',
      agreedPrice: 1800,
      offers: [],
      negotiations: []
    },
    {
      id: 'SHP-1004',
      shipperId: 'ACC-001',
      shipperName: 'Ahmed Ali',
      cargoType: 'Medical Supplies',
      cargoCategory: CARGO_CATEGORY.HIGH_RISK,
      origin: 'Riyadh',
      destination: 'Makkah',
      weight: '2000 kg',
      requiredTruckType: 'Closed Box',
      status: SHIPMENT_STATUS.COMPLETED,
      createdAt: '2026-08-25T08:00:00Z',
      assignedCarrierId: 'ACC-007',
      assignedCarrierName: 'Safe Transit',
      agreedPrice: 1200,
      offers: [],
      negotiations: []
    }
  ],

  trips: [
    {
      id: 'TRP-1003',
      shipmentId: 'SHP-1003',
      carrierId: 'ACC-006',
      carrierName: 'Heavy Haulage',
      stage: TRIP_STAGE.EN_ROUTE_TO_LOADING,
      updatedAt: '2026-09-03T10:00:00Z'
    },
    {
      id: 'TRP-1005',
      shipmentId: 'SHP-1005',
      carrierId: 'ACC-008',
      carrierName: 'Quick Delivery',
      stage: TRIP_STAGE.LOADED, // Eligible for admin cancellation
      updatedAt: '2026-09-03T14:00:00Z'
    },
    {
      id: 'TRP-1006',
      shipmentId: 'SHP-1006',
      carrierId: 'ACC-009',
      carrierName: 'Star Logistics',
      stage: TRIP_STAGE.ARRIVED,
      updatedAt: '2026-09-03T15:30:00Z'
    }
  ],

  commissionTransactions: [
    {
      id: 'CTX-001',
      shipmentId: 'SHP-1004',
      amount: 120, // 10% of 1200
      rateUsed: 10,
      date: '2026-08-28T14:00:00Z',
      type: 'COMPLETION'
    },
    {
      id: 'CTX-002',
      shipmentId: 'SHP-0999',
      amount: 150,
      rateUsed: 10,
      date: '2026-09-03T11:00:00Z', // Today
      type: 'COMPLETION'
    }
  ],

  withdrawals: [
    {
      id: 'WD-001',
      carrierId: 'ACC-007',
      carrierName: 'Safe Transit',
      amount: 1080,
      status: WITHDRAWAL_STATUS.PENDING,
      requestDate: '2026-09-01T09:00:00Z'
    },
    {
      id: 'WD-002',
      carrierId: 'ACC-006',
      carrierName: 'Heavy Haulage',
      amount: 5000,
      status: WITHDRAWAL_STATUS.PAID,
      requestDate: '2026-08-15T09:00:00Z'
    }
  ],

  carriersAccountability: [
    {
      carrierId: 'ACC-002',
      carrierName: 'Fahad Transport',
      warningCount: 0,
      isBlocked: false,
      outstandingDebt: 0
    },
    {
      carrierId: 'ACC-006',
      carrierName: 'Heavy Haulage',
      warningCount: 2,
      isBlocked: false,
      outstandingDebt: 0
    },
    {
      carrierId: 'ACC-007',
      carrierName: 'Safe Transit',
      warningCount: 0,
      isBlocked: false,
      outstandingDebt: 150 // Read only debt from previous cancellation
    },
    {
      carrierId: 'ACC-008',
      carrierName: 'Quick Delivery',
      warningCount: 3,
      isBlocked: true,
      outstandingDebt: 0
    }
  ],

  truckTypes: [
    { id: 'TT-001', name: 'Dyna' },
    { id: 'TT-002', name: 'Flatbed' },
    { id: 'TT-003', name: 'Refrigerated' },
    { id: 'TT-004', name: 'Closed Box' }
  ],

  cargoTypes: [
    { id: 'CT-001', name: 'Electronics', category: CARGO_CATEGORY.NORMAL },
    { id: 'CT-002', name: 'Frozen Meat', category: CARGO_CATEGORY.SPECIAL_CONDITIONS },
    { id: 'CT-003', name: 'Medical Supplies', category: CARGO_CATEGORY.HIGH_RISK },
    { id: 'CT-004', name: 'Construction Materials', category: CARGO_CATEGORY.NORMAL }
  ],

  content: {
    aboutUs: 'Hemooltak is the leading digital freight network in Saudi Arabia...',
    terms: '1. Introduction\nThese terms govern the use of the platform...'
  }
};
