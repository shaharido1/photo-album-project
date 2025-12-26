import { describe, it, expect } from '@jest/globals';
import {
  UserSchema,
  firestoreUserToApi,
  parseUser,
  safeParseUser,
} from '../user.js';

describe('UserSchema', () => {
  const validUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
  };

  it('should validate correct user', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should allow null photoURL', () => {
    const result = UserSchema.safeParse({ ...validUser, photoURL: null });
    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('firestoreUserToApi', () => {
  it('should transform Firestore user to API user', () => {
    const firestoreUser = {
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
      createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
      updatedAt: { toDate: () => new Date(), toMillis: () => Date.now() },
    };

    const result = firestoreUserToApi(firestoreUser, 'user-123');

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('test@example.com');
  });
});

describe('parseUser', () => {
  it('should parse valid user', () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };
    const result = parseUser(user);
    expect(result).toEqual(user);
  });

  it('should throw for invalid user', () => {
    expect(() => parseUser({ id: '' })).toThrow();
  });
});

describe('safeParseUser', () => {
  it('should return success for valid user', () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };
    const result = safeParseUser(user);
    expect(result.success).toBe(true);
  });
});
