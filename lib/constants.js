// ID Document Types
export const ID_TYPES = {
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  NATIONAL_ID: 'national_id',
  RESIDENCE_PERMIT: 'residence_permit',
};

export const ID_TYPE_LABELS = {
  [ID_TYPES.PASSPORT]: 'Passport',
  [ID_TYPES.DRIVING_LICENSE]: 'Driving License',
  [ID_TYPES.NATIONAL_ID]: 'National ID Card',
  [ID_TYPES.RESIDENCE_PERMIT]: 'Residence Permit',
};

// Address Proof Types
export const ADDRESS_PROOF_TYPES = {
  UTILITY_BILL: 'utility_bill',
  BANK_STATEMENT: 'bank_statement',
  RENTAL_AGREEMENT: 'rental_agreement',
  GOVERNMENT_LETTER: 'government_letter',
};

export const ADDRESS_PROOF_TYPE_LABELS = {
  [ADDRESS_PROOF_TYPES.UTILITY_BILL]: 'Utility Bill',
  [ADDRESS_PROOF_TYPES.BANK_STATEMENT]: 'Bank Statement',
  [ADDRESS_PROOF_TYPES.RENTAL_AGREEMENT]: 'Rental Agreement',
  [ADDRESS_PROOF_TYPES.GOVERNMENT_LETTER]: 'Government Letter',
};

// Submission Status
export const SUBMISSION_STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
