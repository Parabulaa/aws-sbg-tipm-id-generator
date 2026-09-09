export const categories = ['Member', 'Officer', 'Associate'] as const;
export type Category = (typeof categories)[number];
export const officerPositions = [
  'LORSO REPRESENTATIVE',
  'CHIEF EXECUTIVE OFFICER/LEAD',
  'EXECUTIVE SECRETARY',
  'ASSOCIATE SECRETARY',
  'BUILDHERS+ AMBASSADOR',
  'CHIEF FINANCIAL OFFICER',
  'VICE-CHIEF FINANCIAL OFFICER',
  'CHIEF OPERATIONS OFFICER',
  'VICE-CHIEF OPERATIONS OFFICER',
  'CHIEF MARKETING OFFICER',
  'VICE-CHIEF MARKETING OFFICER',
  'CHIEF RELATIONS OFFICER',
  'VICE-CHIEF RELATIONS OFFICER',
  'CHIEF CREATIVES OFFICER',
  'VICE-CHIEF CREATIVES OFFICER',
  'CHIEF TECHNOLOGY OFFICER',
  'VICE-CHIEF TECHNOLOGY OFFICER',
  'AI/ML LEAD',
  'SOFTWARE ENGINEERING LEAD',
] as const;
export type OfficerPosition = (typeof officerPositions)[number];
export const officerPositionTeams: Record<OfficerPosition, string> = {
  'LORSO REPRESENTATIVE': 'LORSO',
  'CHIEF EXECUTIVE OFFICER/LEAD': 'Executive',
  'EXECUTIVE SECRETARY': 'Executive',
  'ASSOCIATE SECRETARY': 'Executive',
  'BUILDHERS+ AMBASSADOR': 'BuildHers+',
  'CHIEF FINANCIAL OFFICER': 'Finance',
  'VICE-CHIEF FINANCIAL OFFICER': 'Finance',
  'CHIEF OPERATIONS OFFICER': 'Operations',
  'VICE-CHIEF OPERATIONS OFFICER': 'Operations',
  'CHIEF MARKETING OFFICER': 'Marketing',
  'VICE-CHIEF MARKETING OFFICER': 'Marketing',
  'CHIEF RELATIONS OFFICER': 'Relations',
  'VICE-CHIEF RELATIONS OFFICER': 'Relations',
  'CHIEF CREATIVES OFFICER': 'Creatives',
  'VICE-CHIEF CREATIVES OFFICER': 'Creatives',
  'CHIEF TECHNOLOGY OFFICER': 'Technology / CTO Office',
  'VICE-CHIEF TECHNOLOGY OFFICER': 'Technology / CTO Office',
  'AI/ML LEAD': 'Technology / CTO Office',
  'SOFTWARE ENGINEERING LEAD': 'Technology / CTO Office',
};

export function teamForOfficerPosition(position: string) {
  return officerPositionTeams[position as OfficerPosition] ?? '';
}
export const statuses = [
  'Draft',
  'Needs Photo',
  'Needs Attention',
  'Ready',
  'Generated',
] as const;
export type MemberStatus = (typeof statuses)[number];

export interface Crop {
  x: number;
  y: number;
  zoom: number;
}

export interface MemberInput {
  full_name: string;
  tip_email: string;
  student_id_number: string;
  program: string;
  year_level: string;
  membership_type: Category;
  officer_position: string;
  team: string;
}

export interface MemberRecord extends MemberInput {
  id: string;
  aws_sbg_id: string;
  photo_path: string | null;
  photo_crop_data: Crop;
  color_override: string | null;
  date_issued: string | null;
  valid_until: string | null;
  status: MemberStatus;
  revision: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface TeamColor {
  name: string;
  color: string;
  enabled: boolean;
}

export interface ColorSettings {
  mode: 'default' | 'team';
  teams: TeamColor[];
  revision: number;
}

export interface Generation {
  id: string;
  member_id: string;
  member: MemberRecord;
  generated_at: string;
  generated_by: string;
  accent: string;
  template_version: string;
  status: 'Generated';
  front_path?: string;
  back_path?: string;
  pdf_path?: string;
}

export interface Activity {
  id: string;
  member_id: string | null;
  message: string;
  created_at: string;
}

export const blankMember: MemberInput = {
  full_name: '',
  tip_email: '',
  student_id_number: '',
  program: '',
  year_level: '',
  membership_type: 'Member',
  officer_position: '',
  team: '',
};

export const defaultCrop: Crop = { x: 0.5, y: 0.5, zoom: 1 };

export function isArchived(member: Pick<MemberRecord, 'archived_at'>) {
  return member.archived_at !== null;
}

export function formatAwsSbgId(prefix: string, year: number, value: number) {
  if (
    !Number.isInteger(year) ||
    year < 0 ||
    year > 9999 ||
    !Number.isSafeInteger(value) ||
    value < 1
  )
    throw new Error('Invalid AWS SBG ID sequence value.');
  // AWSCC-TIPM-24000: two-digit school-year term followed immediately by a
  // three-digit sequence (Captain = 001, next officer = 002, etc.). Values
  // above 999 are kept intact rather than truncated.
  const term = String(year).padStart(4, '0').slice(-2);
  return `${prefix.trim()}-${term}${String(value).padStart(3, '0')}`;
}

export function displayName(member: Pick<MemberInput, 'full_name'>) {
  return member.full_name.trim();
}

export function normalizeYearLevel(value: string) {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(\d+)(?:st|nd|rd|th)?(?:\s*year)?$/i);
  if (!match) return cleaned;
  const number = Number(match[1]);
  const suffix =
    number % 100 >= 11 && number % 100 <= 13
      ? 'th'
      : number % 10 === 1
        ? 'st'
        : number % 10 === 2
          ? 'nd'
          : number % 10 === 3
            ? 'rd'
            : 'th';
  return `${number}${suffix} Year`;
}

export function normalizeMember(raw: Record<string, unknown>): MemberInput {
  const text = (key: keyof MemberInput) =>
    typeof raw[key] === 'string' ? raw[key].trim() : '';
  const membership = text('membership_type');
  const rawPosition = text('officer_position');
  const position =
    officerPositions.find(
      (value) => value.toLowerCase() === rawPosition.toLowerCase(),
    ) ?? rawPosition;
  return {
    full_name: text('full_name'),
    tip_email: text('tip_email').toLowerCase(),
    student_id_number: text('student_id_number'),
    program: text('program'),
    year_level: normalizeYearLevel(text('year_level')),
    membership_type: (categories.find(
      (value) => value.toLowerCase() === membership.toLowerCase(),
    ) ?? membership) as Category,
    officer_position: position,
    team:
      membership.toLowerCase() === 'officer'
        ? teamForOfficerPosition(position)
        : '',
  };
}

export function validDate(value: string | null) {
  return (
    value === null ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value)
  );
}

export function validateMember(member: MemberInput) {
  const errors: string[] = [];
  for (const key of [
    'full_name',
    'tip_email',
    'student_id_number',
    'program',
    'year_level',
  ] as const) {
    if (!member[key]) errors.push(`${key} is required`);
  }
  for (const key of Object.keys(blankMember) as (keyof MemberInput)[]) {
    const value = member[key];
    if (value.length > 240)
      errors.push(`${key} must be 240 characters or fewer`);
    if (
      Array.from(value).some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      )
    )
      errors.push(`${key} contains invalid characters`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.tip_email))
    errors.push('Invalid T.I.P. email');
  if (!categories.includes(member.membership_type))
    errors.push('Invalid membership type');
  if (member.membership_type === 'Officer' && !member.officer_position)
    errors.push('Officer position is required');
  if (
    member.membership_type === 'Officer' &&
    !officerPositions.includes(member.officer_position as OfficerPosition)
  )
    errors.push('Select a valid officer position');
  if (member.membership_type === 'Officer' && !member.team)
    errors.push('Officer team is required');
  if (
    member.membership_type !== 'Officer' &&
    (member.officer_position || member.team)
  )
    errors.push('Officer position and team only apply to Officers');
  return [...new Set(errors)];
}

export function reviewStatus(
  member: MemberInput,
  photo: string | null,
): MemberStatus {
  if (validateMember(member).length) return 'Needs Attention';
  return photo ? 'Draft' : 'Needs Photo';
}

export function safeFilename(
  member: Pick<MemberRecord, 'aws_sbg_id' | 'full_name'>,
) {
  const clean = (text: string) =>
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);
  return `${clean(member.aws_sbg_id)}_${clean(displayName(member)) || 'ID'}`;
}

export function accentColor(member: MemberRecord, settings: ColorSettings) {
  if (member.membership_type === 'Member') return '#f59e0b';
  if (member.membership_type === 'Associate') return '#8b5cf6';
  return (
    member.color_override ||
    (settings.mode === 'team'
      ? settings.teams.find(
          (team) =>
            team.enabled &&
            team.name.toLowerCase() === member.team.toLowerCase(),
        )?.color
      : null) ||
    '#10b981'
  );
}

export function contrastText(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? '#000000'
    : '#ffffff';
}
