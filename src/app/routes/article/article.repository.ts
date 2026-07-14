import prisma from '../../../prisma/prisma-client';
import { ArticleQueryInput, CreateArticleInput, UpdateArticleInput } from './article-input.model';

// Shared Prisma include shape for article responses
const articleInclude = {
  tagList: {
    select: { name: true },
  },
  author: {
    select: {
      username: true,
      bio: true,
      image: true,
      followedBy: true,
    },
  },
  favoritedBy: true,
  bookmarkedBy: true,
  _count: {
    select: { favoritedBy: true },
  },
} as const;

const buildAuthorVisibilityFilter = (userId: number | undefined) => {
  const orAuthorQuery: object[] = [{ demo: { equals: true } }];

  if (userId) {
    orAuthorQuery.push({ id: { equals: userId } });
  }

  return orAuthorQuery;
};

const buildArticleWhereFilters = (query: ArticleQueryInput, userId: number | undefined) => {
  const filters: object[] = [];

  filters.push({
    author: {
      OR: buildAuthorVisibilityFilter(userId),
      AND: 'author' in query ? [{ username: { equals: query.author } }] : [],
    },
  });

  if ('tag' in query) {
    filters.push({
      tagList: {
        some: { name: query.tag },
      },
    });
  }

  if ('favorited' in query) {
    filters.push({
      favoritedBy: {
        some: { username: { equals: query.favorited } },
      },
    });
  }

  return filters;
};

export const countArticles = async (query: ArticleQueryInput, userId?: number) => {
  return prisma.article.count({
    where: { AND: buildArticleWhereFilters(query, userId) },
  });
};

export const findArticles = async (query: ArticleQueryInput, userId?: number) => {
  return prisma.article.findMany({
    where: { AND: buildArticleWhereFilters(query, userId) },
    orderBy: { createdAt: 'desc' },
    skip: Number(query.offset) || 0,
    take: Number(query.limit) || 10,
    include: articleInclude,
  });
};

export const countFeedArticles = async (userId: number) => {
  return prisma.article.count({
    where: {
      author: { followedBy: { some: { id: userId } } },
    },
  });
};

export const findFeedArticles = async (offset: number, limit: number, userId: number) => {
  return prisma.article.findMany({
    where: {
      author: { followedBy: { some: { id: userId } } },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset || 0,
    take: limit || 10,
    include: articleInclude,
  });
};

export const findArticleBySlug = async (slug: string) => {
  return prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
};

export const findArticleSlugOnly = async (slug: string) => {
  return prisma.article.findUnique({
    where: { slug },
    select: { slug: true },
  });
};

export const findArticleAuthor = async (slug: string) => {
  return prisma.article.findFirst({
    where: { slug },
    select: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
};

export const createArticle = async (
  input: CreateArticleInput & { slug: string },
  authorId: number,
) => {
  const { title, description, body, slug, tagList = [] } = input;

  return prisma.article.create({
    data: {
      title,
      description,
      body,
      slug,
      tagList: {
        connectOrCreate: tagList.map((tag) => ({
          create: { name: tag },
          where: { name: tag },
        })),
      },
      author: { connect: { id: authorId } },
    },
    include: articleInclude,
  });
};

export const updateArticle = async (slug: string, data: UpdateArticleInput & { slug?: string }) => {
  const { title, body, description, slug: newSlug, tagList = [] } = data;

  return prisma.article.update({
    where: { slug },
    data: {
      ...(title ? { title } : {}),
      ...(body ? { body } : {}),
      ...(description ? { description } : {}),
      ...(newSlug ? { slug: newSlug } : {}),
      updatedAt: new Date(),
      tagList: {
        connectOrCreate: tagList.map((tag) => ({
          create: { name: tag },
          where: { name: tag },
        })),
      },
    },
    include: articleInclude,
  });
};

export const disconnectArticleTags = async (slug: string) => {
  return prisma.article.update({
    where: { slug },
    data: { tagList: { set: [] } },
  });
};

export const deleteArticle = async (slug: string) => {
  return prisma.article.delete({ where: { slug } });
};

export const findArticleWithComments = async (slug: string, userId?: number) => {
  const orCommentAuthorQueries: object[] = [{ author: { demo: true } }];

  if (userId) {
    orCommentAuthorQueries.push({ author: { id: userId } });
  }

  return prisma.article.findUnique({
    where: { slug },
    include: {
      comments: {
        where: { OR: orCommentAuthorQueries },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          body: true,
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: true,
            },
          },
        },
      },
    },
  });
};

export const findArticleIdBySlug = async (slug: string) => {
  return prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });
};

export const createComment = async (body: string, articleId: number, authorId: number) => {
  return prisma.comment.create({
    data: {
      body,
      article: { connect: { id: articleId } },
      author: { connect: { id: authorId } },
    },
    include: {
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
    },
  });
};

export const findCommentWithAuthor = async (commentId: number, userId: number) => {
  return prisma.comment.findFirst({
    where: {
      id: commentId,
      author: { id: userId },
    },
    select: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
};

export const deleteComment = async (commentId: number) => {
  return prisma.comment.delete({ where: { id: commentId } });
};

export const favoriteArticle = async (slug: string, userId: number) => {
  return prisma.article.update({
    where: { slug },
    data: {
      favoritedBy: { connect: { id: userId } },
    },
    include: articleInclude,
  });
};

export const unfavoriteArticle = async (slug: string, userId: number) => {
  return prisma.article.update({
    where: { slug },
    data: {
      favoritedBy: { disconnect: { id: userId } },
    },
    include: articleInclude,
  });
};

export const bookmarkArticle = async (slug: string, userId: number) => {
  return prisma.article.update({
    where: { slug },
    data: {
      bookmarkedBy: { connect: { id: userId } },
    },
    include: articleInclude,
  });
};

export const unbookmarkArticle = async (slug: string, userId: number) => {
  return prisma.article.update({
    where: { slug },
    data: {
      bookmarkedBy: { disconnect: { id: userId } },
    },
    include: articleInclude,
  });
};
