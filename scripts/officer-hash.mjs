import { pbkdf2Sync, randomBytes } from 'node:crypto';
const email = process.argv[2]?.trim().toLowerCase();
const password = process.env.OFFICER_PASSWORD;
if (
  !email ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  !password ||
  password.length < 12
) {
  console.error(
    'Provide an officer email argument and OFFICER_PASSWORD environment value (at least 12 characters).',
  );
  process.exit(1);
}
const salt = randomBytes(24).toString('hex');
const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
process.stdout.write(JSON.stringify({ [email]: { salt, hash } }) + '\n');
