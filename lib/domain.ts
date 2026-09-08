export const categories = ['Member', 'Officer', 'Associate'] as const;
export type Category = (typeof categories)[number];
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
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  membership_type: Category;
  team: string;
  position: string;
  aws_sbg_id: string;
  date_issued: string;
  valid_until: string;
}
export interface MemberRecord extends MemberInput {
  id: string;
  photo_url: string | null;
  photo_crop_data: Crop;
  color_override: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
  revision: number;
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
}
export interface Activity {
  id: string;
  member_id: string;
  message: string;
  created_at: string;
}
export const blankMember: MemberInput = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  membership_type: 'Member',
  team: '',
  position: '',
  aws_sbg_id: '',
  date_issued: '',
  valid_until: '',
};
export const defaultCrop: Crop = { x: 0.5, y: 0.5, zoom: 1 };
export function displayName(member: MemberInput) {
  const middle = member.middle_name.trim();
  return [
    member.first_name.trim(),
    middle ? `${Array.from(middle)[0].toUpperCase()}.` : '',
    member.last_name.trim(),
  ]
    .filter(Boolean)
    .join(' ');
}
export function normalizeMember(raw: Record<string, unknown>): MemberInput {
  const member = { ...blankMember };
  for (const key of Object.keys(blankMember) as (keyof MemberInput)[]) {
    Object.assign(member, {
      [key]: typeof raw[key] === 'string' ? raw[key].trim() : '',
    });
  }
  member.email = member.email.toLowerCase();
  member.aws_sbg_id = member.aws_sbg_id.toUpperCase();
  member.membership_type = (categories.find(
    (value) =>
      value.toLowerCase() === String(raw.membership_type).trim().toLowerCase(),
  ) ?? String(raw.membership_type)) as Category;
  return member;
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateMember(member: MemberInput) {
  const errors: string[] = [];
  for (const key of [
    'first_name',
    'last_name',
    'email',
    'aws_sbg_id',
    'date_issued',
    'valid_until',
  ] as const) {
    if (!member[key]) errors.push(`${key} is required`);
  }
  for (const key of Object.keys(blankMember) as (keyof MemberInput)[]) {
    const value = member[key];
    if (value.length > 240)
      errors.push(`${key} must be 240 characters or fewer`);
    if (
      typeof value === 'string' &&
      Array.from(value).some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      )
    )
      errors.push(`${key} contains invalid characters`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))
    errors.push('Invalid email');
  if (!/^[A-Z0-9][A-Z0-9._-]{2,79}$/.test(member.aws_sbg_id))
    errors.push(
      'Invalid AWS SBG ID (3–80 letters, numbers, dots, underscores or hyphens)',
    );
  if (!categories.includes(member.membership_type))
    errors.push('Invalid membership type');
  if (member.membership_type === 'Officer' && !member.team)
    errors.push('Officer team is required');
  if (member.membership_type === 'Officer' && !member.position)
    errors.push('Officer position is required');
  if (!validDate(member.date_issued))
    errors.push('Invalid date_issued (use YYYY-MM-DD)');
  if (!validDate(member.valid_until))
    errors.push('Invalid valid_until (use YYYY-MM-DD)');
  if (
    validDate(member.date_issued) &&
    validDate(member.valid_until) &&
    member.valid_until <= member.date_issued
  )
    errors.push('Validity must end after the issue date');
  return [...new Set(errors)];
}
export function reviewStatus(
  member: MemberInput,
  photo: string | null,
): MemberStatus {
  if (validateMember(member).length) return 'Needs Attention';
  return photo ? 'Draft' : 'Needs Photo';
}
export function safeFilename(member: MemberInput) {
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
