import { supabase } from '../../config/supabase';
import { ServiceProposal } from '../models/proposal.models';

export const createRequest = async (clientKey: string, description: string, budget: number, title: string, requirements: string) => {
  console.log('Creating service request with data:', { clientKey, description, budget, title, requirements });
  
  const { data, error } = await supabase
    .from('service_requests')
    .insert([{ client_key: clientKey, description, budget, title, requirements }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createProposal = async (
  requestId: string,
  providerKey: string,
  proposalText: string,
  bidAmount: number
) => {
  const { data, error } = await supabase
    .from('service_proposals')
    .insert([{ request_id: requestId, provider_key: providerKey, proposal_text: proposalText, bid_amount: bidAmount }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProposalStatus = async (proposalId: string, status: string) => {
  const { error } = await supabase
    .from('service_proposals')
    .update({ status })
    .eq('id', proposalId);
  if (error) throw error;
};

export const updateRequestStatus = async (requestId: string, status: string) => {
  const { error } = await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw error;
};

export const getProposalById = async (proposalId: string) => {
  const { data, error } = await supabase
    .from('service_proposals')
    .select('*')
    .eq('id', proposalId)
    .single();
  if (error) throw error;
  return data;
};

export const getRequestById = async (requestId: string) => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (error) throw error;
  return data;
};

  
export const getServicesDao = async () => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*');
  if (error) throw error;
  return data;
}

export const getAllProposalsByRequestId = async (requestId: string): Promise<ServiceProposal[]> => {
  console.log('Fetching proposals for requestId:', requestId);
  const { data, error } = await supabase
    .from('service_proposals')
    .select('*')
    .eq('request_id', requestId);

  if (error) {
    console.error('Error fetching proposals:', error);
    throw new Error(`Failed to fetch proposals: ${error.message}`);
  }

  return data as ServiceProposal[];
};