import prisma from '../../../prisma/prisma-client';

export const findTagsByAuthorVisibility = async (userId?: number) => {
  const orQueries: object[] = [{ demo: true }];

  if (userId) {
    orQueries.push({ id: { equals: userId } });
  }

  return prisma.tag.findMany({
    where: {
      articles: {
        some: {
          author: {
            OR: orQueries,
          },
        },
      },
    },
    select: {
      name: true,
    },
    orderBy: {
      articles: {
        _count: 'desc',
      },
    },
    take: 10,
  });
};
