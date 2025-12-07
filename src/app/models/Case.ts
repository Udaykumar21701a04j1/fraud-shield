export interface Case {
  id?: string;
  caseID: number;
  claimID: string;
  investigatorID: number | null;
  status: string;
  resolutionNotes: string;
  isFraud: boolean;
}