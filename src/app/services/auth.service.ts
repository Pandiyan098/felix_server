import { getUserByEmail } from '../dao/auth.dao';

export const basicEmailLogin = async (email: string, password: string) => {
  const user = await getUserByEmail(email);

  if (user.password !== password) {
    throw new Error('Invalid email or password');
  }

  return {
    message: 'Login successful',
    user, // return full user row
  };
};
