export type MembershipType = 'member' | 'officer' | 'associate';
export type IdStatus = 'generated' | 'pending' | 'expired';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  membershipType: MembershipType;
  photo: string;
  issuedAt: string;
  validUntil: string;
  idStatus: IdStatus;
}
