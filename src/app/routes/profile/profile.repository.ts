import prisma from '../../../prisma/prisma-client';

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    include: { followedBy: true },
  });
};

export const connectFollower = async (username: string, followerId: number) => {
  return prisma.user.update({
    where: { username },
    data: {
      followedBy: {
        connect: { id: followerId },
      },
    },
    include: { followedBy: true },
  });
};

export const disconnectFollower = async (username: string, followerId: number) => {
  return prisma.user.update({
    where: { username },
    data: {
      followedBy: {
        disconnect: { id: followerId },
      },
    },
    include: { followedBy: true },
  });
};
