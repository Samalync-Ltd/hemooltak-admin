import { mockData } from './data';
import { TRIP_STAGE, SHIPMENT_STATUS } from './constants';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getActiveTrips = async () => {
  await delay();
  return [...mockData.trips];
};

export const administrativelyCancelTrip = async (tripId) => {
  await delay();
  const trip = mockData.trips.find(t => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  if (trip.stage !== TRIP_STAGE.LOADED && trip.stage !== TRIP_STAGE.IN_TRANSIT && trip.stage !== TRIP_STAGE.DELIVERED) {
    throw new Error('Administrative cancellation is ONLY allowed for trips that have passed the LOADED stage.');
  }

  // Find associated shipment
  const shipment = mockData.shipments.find(s => s.id === trip.shipmentId);
  if (shipment) {
    shipment.status = SHIPMENT_STATUS.CANCELLED;
  }

  // Process commission logic for cancellation (deduct fee, etc.)
  // In a real scenario, this would create negative commission TXs or apply penalties.
  // We'll simulate removing it from active trips (or changing state)
  trip.stage = 'ADMIN_CANCELLED';
  
  // Record penalty in carrier's outstanding debt (for example, flat 500 penalty)
  const carrierAccount = mockData.carriersAccountability.find(c => c.carrierId === trip.carrierId);
  if (carrierAccount) {
    carrierAccount.outstandingDebt += 500;
  }

  return { ...trip };
};
