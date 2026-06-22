import * as bcrypt from 'bcryptjs';
import { RegisterInput } from './register-input.model';
import { LoginInput } from './login-input.model';
import { UpdateUserInput } from './update-user-input.model';
import HttpException from '../../models/http-exception.model';
import { RegisteredUser } from './registered-user.model';
import generateToken from './token.utils';
import * as authRepository from './auth.repository';

const checkUserUniqueness = async (email: string, username: string) => {
  const existingByEmail = await authRepository.findUserByEmail(email);
  const existingByUsername = await authRepository.findUserByUsername(username);

  if (existingByEmail || existingByUsername) {
    throw new HttpException(422, {
      errors: {
        ...(existingByEmail ? { email: ['has already been taken'] } : {}),
        ...(existingByUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

export const createUser = async (input: RegisterInput): Promise<RegisteredUser> => {
  const email = input.email?.trim();
  const username = input.username?.trim();
  const password = input.password?.trim();
  const { image, bio, demo } = input;

  if (!email) {
    throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  }

  if (!username) {
    throw new HttpException(422, { errors: { username: ["can't be blank"] } });
  }

  if (!password) {
    throw new HttpException(422, { errors: { password: ["can't be blank"] } });
  }

  await checkUserUniqueness(email, username);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await authRepository.createUser({
    email,
    username,
    password: hashedPassword,
    image,
    bio,
    demo,
  });

  return {
    ...user,
    token: generateToken(user.id),
  };
};

export const login = async (userPayload: LoginInput) => {
  const email = userPayload.email?.trim();
  const password = userPayload.password?.trim();

  if (!email) {
    throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  }

  if (!password) {
    throw new HttpException(422, { errors: { password: ["can't be blank"] } });
  }

  const user = await authRepository.findUserByEmailWithCredentials(email);

  if (user) {
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      return {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: generateToken(user.id),
      };
    }
  }

  throw new HttpException(403, {
    errors: {
      'email or password': ['is invalid'],
    },
  });
};

export const getCurrentUser = async (id: number) => {
  const user = await authRepository.findUserById(id);

  if (!user) {
    throw new HttpException(404, { errors: { user: ['not found'] } });
  }

  return {
    ...user,
    token: generateToken(user.id),
  };
};

export const updateUser = async (userPayload: UpdateUserInput, id: number) => {
  const { password } = userPayload;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  const user = await authRepository.updateUser(id, {
    ...userPayload,
    ...(hashedPassword ? { password: hashedPassword } : {}),
  });

  return {
    ...user,
    token: generateToken(user.id),
  };
};
