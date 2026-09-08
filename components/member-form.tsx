import type { MemberInput } from '@/lib/domain';
import { categories } from '@/lib/domain';
const labels: Record<keyof MemberInput, string> = {
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  email: 'Email',
  membership_type: 'Membership type',
  team: 'Team',
  position: 'Position',
  aws_sbg_id: 'AWS SBG ID',
  date_issued: 'Date issued',
  valid_until: 'Valid until',
};
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
      {(Object.keys(labels) as (keyof MemberInput)[]).map((key) => (
        <label key={key} className="field">
          {labels[key]}
          {key === 'membership_type' ? (
            <select
              aria-label={labels[key]}
              value={value[key]}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]: event.target.value as MemberInput['membership_type'],
                })
              }
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          ) : (
            <input
              maxLength={240}
              type={
                key === 'email'
                  ? 'email'
                  : ['date_issued', 'valid_until'].includes(key)
                    ? 'date'
                    : 'text'
              }
              value={value[key]}
              onChange={(event) =>
                onChange({ ...value, [key]: event.target.value })
              }
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}
