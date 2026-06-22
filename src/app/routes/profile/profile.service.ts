import HttpException from '../../models/http-exception.model';
import profileMapper from './profile.utils';
import { connectFollower, disconnectFollower, findUserByUsername } from './profile.repository';

export const getProfile = async (username: string, userId?: number) => {
  const profile = await findUserByUsername(username);

  if (!profile) {
    throw new HttpException(404, {});
  }

  return profileMapper(profile, userId);
};

export const followUser = async (username: string, userId: number) => {
  const existing = await findUserByUsername(username);

  if (!existing) {
    throw new HttpException(404, {});
  }

  const profile = await connectFollower(username, userId);
  return profileMapper(profile, userId);
};

export const unfollowUser = async (username: string, userId: number) => {
  const existing = await findUserByUsername(username);

  if (!existing) {
    throw new HttpException(404, {});
  }

  const profile = await disconnectFollower(username, userId);
  return profileMapper(profile, userId);
};
