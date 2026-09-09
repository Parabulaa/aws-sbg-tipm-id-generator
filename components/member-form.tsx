import type { MemberInput } from '@/lib/domain';
import { categories } from '@/lib/domain';

const fields: { key: keyof MemberInput; label: string; type?: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'tip_email', label: 'T.I.P. Email', type: 'email' },
  { key: 'student_id_number', label: 'Student ID Number' },
  { key: 'program', label: 'Department / Program' },
  { key: 'year_level', label: 'Year Level' },
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
      {fields.map(({ key, label, type }) => (
        <label key={key} className="field">
          {label}
          <input
            maxLength={240}
            type={type ?? 'text'}
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
          />
        </label>
      ))}
      <label className="field">
        Membership Type
        <select
          aria-label="Membership Type"
          value={value.membership_type}
          onChange={(event) => {
            const membership_type = event.target.value as MemberInput['membership_type'];
            onChange({
              ...value,
              membership_type,
              officer_position: membership_type === 'Officer' ? value.officer_position : '',
              team: membership_type === 'Officer' ? value.team : '',
            });
          }}
        >
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      {value.membership_type === 'Officer' && (
        <>
          <label className="field">
            Officer Position
            <input
              maxLength={240}
              value={value.officer_position}
              onChange={(event) => onChange({ ...value, officer_position: event.target.value })}
            />
          </label>
          <label className="field">
            Team / Office
            <input
              maxLength={240}
              value={value.team}
              onChange={(event) => onChange({ ...value, team: event.target.value })}
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
