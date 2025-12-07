// shared constants used by services
export const CLAIM_STATUS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
  FRAUD_DETECTED: 'Fraud Detected',
} as const;

export const CASE_STATUS = {
  OPEN: 'Open',
  PENDING: 'Pending',  
  COMPLETED: 'Completed'
} as const;

