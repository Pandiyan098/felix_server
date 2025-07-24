import moment from 'moment-timezone';

/**
 * Convert timestamp to Indian Standard Time (IST)
 * Handles both UTC and local timestamps correctly
 * @param timestamp - timestamp string or Date object
 * @returns IST formatted timestamp
 */
export const convertToIST = (timestamp: string | Date): string => {
  // If the timestamp doesn't have timezone info, treat it as UTC
  if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
    // Parse as UTC and convert to IST
    return moment.utc(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  }
  // If it has timezone info, convert normally
  return moment(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Convert timestamp to IST with full date-time format
 * Handles both UTC and local timestamps correctly
 * @param timestamp - timestamp string or Date object
 * @returns IST formatted timestamp with timezone info
 */
export const convertToISTWithTimezone = (timestamp: string | Date): string => {
  // If the timestamp doesn't have timezone info, treat it as UTC
  if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
    // Parse as UTC and convert to IST
    return moment.utc(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss z');
  }
  // If it has timezone info, convert normally
  return moment(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss z');
};

/**
 * Get current time in IST
 * @returns Current IST timestamp
 */
export const getCurrentIST = (): string => {
  return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Convert UTC timestamp to IST ISO format
 * @param utcTimestamp - UTC timestamp string or Date object
 * @returns IST formatted timestamp in ISO format
 */
export const convertToISTISO = (utcTimestamp: string | Date): string => {
  return moment(utcTimestamp).tz('Asia/Kolkata').toISOString();
};

/**
 * Transform service objects to include IST timestamps
 * @param service - Service object with created_at field
 * @returns Service object with IST timestamp
 */
export const transformServiceWithIST = (service: any) => {
  return {
    ...service,
    created_at: service.created_at ? convertToIST(service.created_at) : null,
    created_at_ist: service.created_at ? convertToISTWithTimezone(service.created_at) : null,
    updated_at: service.updated_at ? convertToIST(service.updated_at) : null,
    updated_at_ist: service.updated_at ? convertToISTWithTimezone(service.updated_at) : null
  };
};

/**
 * Transform proposal objects to include IST timestamps
 * @param proposal - Proposal object with created_at field
 * @returns Proposal object with IST timestamp
 */
export const transformProposalWithIST = (proposal: any) => {
  return {
    ...proposal,
    created_at: proposal.created_at ? convertToIST(proposal.created_at) : null,
    created_at_ist: proposal.created_at ? convertToISTWithTimezone(proposal.created_at) : null,
    updated_at: proposal.updated_at ? convertToIST(proposal.updated_at) : null,
    updated_at_ist: proposal.updated_at ? convertToISTWithTimezone(proposal.updated_at) : null
  };
};
