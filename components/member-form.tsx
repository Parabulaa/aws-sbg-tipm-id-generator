import type { MemberInput } from '@/lib/domain';
import {
  campuses,
  categories,
  officerPositions,
  programs,
  teamForOfficerPosition,
  yearLevels,
  memberClassification,
} from '@/lib/domain';

const fields: { key: keyof MemberInput; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'tip_email', label: 'T.I.P. Email', type: 'email' },
  { key: 'student_id_number', label: 'Student ID Number' },
];

export function MemberForm({
  value,
  onChange,
  disabled = false,
}: {
  value: MemberInput;
  onChange: (value: MemberInput) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="field">
        Campus
        <select aria-label="Campus" value={value.campus} onChange={(event) => {
          const campus = event.target.value as MemberInput['campus'];
          onChange({ ...value, campus, membership_type: campus === 'Quezon City' ? 'Member' : value.membership_type, officer_position: campus === 'Quezon City' ? '' : value.officer_position, team: campus === 'Quezon City' ? '' : value.team });
        }}>{campuses.map((campus) => <option key={campus}>{campus}</option>)}</select>
      </label>
      {fields.map(({ key, label, type }) => (
        <label key={key} className="field">
          {label}
          <input
            maxLength={240}
            type={type ?? 'text'}
            value={value[key]}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
          />
        </label>
      ))}
      <label className="field">Department / Program<select aria-label="Department / Program" value={value.program} onChange={(event) => onChange({ ...value, program: event.target.value })}><option value="">Select a program</option>{programs.map((program) => <option key={program}>{program}</option>)}</select></label>
      <label className="field">Year Level<select aria-label="Year Level" value={value.year_level} onChange={(event) => onChange({ ...value, year_level: event.target.value })}><option value="">Select a year level</option>{yearLevels.map((year) => <option key={year}>{year}</option>)}</select></label>
      <label className="field">
        Membership Classification
        <select
          aria-label="Membership Type"
          value={value.membership_type}
          disabled={value.campus === 'Quezon City'}
          onChange={(event) => {
            const membership_type = event.target
              .value as MemberInput['membership_type'];
            onChange({
              ...value,
              membership_type,
              officer_position:
                membership_type === 'Officer' ? value.officer_position : '',
              team: membership_type === 'Officer' ? value.team : '',
            });
          }}
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category === 'Member' ? memberClassification({ campus: value.campus, membership_type: category }) : category}</option>
          ))}
        </select>
      </label>
      {value.membership_type === 'Officer' && (
        <>
          <label className="field">
            Officer Position
            <select
              aria-label="Officer Position"
              value={value.officer_position}
              onChange={(event) =>
                onChange({
                  ...value,
                  officer_position: event.target.value,
                  team: teamForOfficerPosition(event.target.value),
                })
              }
            >
              <option value="">Select a position</option>
              {officerPositions.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Team / Office
            <input maxLength={240} value={value.team} readOnly />
          </label>
        </>
      )}
    </fieldset>
  );
}
