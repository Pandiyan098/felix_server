export interface ServiceProposal {
  id: string; // UUID
  request_id: string | null;
  provider_key: string;
  proposal_text: string | null;
  bid_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'paid' | null;
  created_at: string | null; // ISO timestamp (could also be `Date`)
}
