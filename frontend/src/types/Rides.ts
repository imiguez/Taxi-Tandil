export interface RideInterface {
  id: string;
  created_at: string;
  updated_at: string;
  originShortAddress: string;
  originLongAddress: string;
  destinationShortAddress: string;
  destinationLongAddress: string;
  acceptedTimestamp: string;
  arrivedTimestamp: string | null;
  finishedTimestamp: string | null;
  wasCancelled: boolean;
  cancellationReason: string| null;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}