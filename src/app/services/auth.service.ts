import { getUserByEmail } from '../dao/auth.dao';

export const basicEmailLogin = async (email: string) => {
  const user = await getUserByEmail(email);

  return {
    message: 'Profile fetched successfully',
    user, 
  };
};
