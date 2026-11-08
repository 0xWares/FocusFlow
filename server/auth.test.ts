import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSalt, hashPassword, verifyPassword } from './auth';

test('Password Hashing & Timing-Safe Verification', () => {
  const salt = generateSalt();
  assert.equal(typeof salt, 'string');
  assert.equal(salt.length, 32); // 16 bytes in hex = 32 chars

  const password = 'student_secure_pass_123';
  const hash = hashPassword(password, salt);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 128); // 64 bytes in hex = 128 chars

  // Correct password verification
  const isMatch = verifyPassword(password, salt, hash);
  assert.equal(isMatch, true, 'Correct password should verify true');

  // Wrong password verification
  const isWrong = verifyPassword('wrong_password', salt, hash);
  assert.equal(isWrong, false, 'Wrong password should verify false');

  // Different salt with same password yields different hash
  const salt2 = generateSalt();
  const hash2 = hashPassword(password, salt2);
  assert.notEqual(hash, hash2, 'Different salt must yield different hash');
});
