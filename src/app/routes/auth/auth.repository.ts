import prisma from '../../../prisma/prisma-client';
import { RegisterInput } from './register-input.model';
import { UpdateUserInput } from './update-user-input.model';

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
};

export const findUserByEmailWithCredentials = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      bio: true,
      image: true,
    },
  });
};

export const findUserById = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });
};

export const createUser = async (input: Omit<RegisterInput, 'password'> & { password: string }) => {
  const { email, username, password, image, bio, demo } = input;

  return prisma.user.create({
    data: {
      username,
      email,
      password,
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
      ...(demo ? { demo } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });
};

export const updateUser = async (id: number, data: UpdateUserInput & { password?: string }) => {
  const { email, username, password, image, bio } = data;

  return prisma.user.update({
    where: { id },
    data: {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });
};
