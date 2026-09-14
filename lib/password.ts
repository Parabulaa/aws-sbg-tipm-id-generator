export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) return 'New password must be at least 8 characters.';
  if (password !== confirmation) return 'New password and confirmation do not match.';
  return '';
}
