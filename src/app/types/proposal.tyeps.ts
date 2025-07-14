export interface Proposal {
  id: string;                     // UUID of the proposal
  request_id: string;             // Foreign key to the service request
  provider_key: string;           // Stellar public key of the service provider
  proposal_text: string;          // Description or details of the offer
  bid_amount: number;             // Offered bid amount (in BD)
  status: 'pending' | 'accepted' | 'rejected' | 'paid'; // Status of the proposal
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}