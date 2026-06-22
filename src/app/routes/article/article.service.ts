import slugify from 'slugify';
import HttpException from '../../models/http-exception.model';
import profileMapper from '../profile/profile.utils';
import articleMapper from './article.mapper';
import { Tag } from '../tag/tag.model';
import { ArticleQueryInput, CreateArticleInput, UpdateArticleInput } from './article-input.model';
import * as articleRepository from './article.repository';


export const getArticles = async (query: ArticleQueryInput, userId?: number) => {
  const articlesCount = await articleRepository.countArticles(query, userId);
  const articles = await articleRepository.findArticles(query, userId);

  return {
    articles: articles.map((article) => articleMapper(article, userId)),
    articlesCount,
  };
};

export const getFeed = async (offset: number, limit: number, userId: number) => {
  const articlesCount = await articleRepository.countFeedArticles(userId);
  const articles = await articleRepository.findFeedArticles(offset, limit, userId);

  return {
    articles: articles.map((article) => articleMapper(article, userId)),
    articlesCount,
  };
};

export const createArticle = async (article: CreateArticleInput, userId: number) => {
  const { title, description, body, tagList } = article;
  const tags = Array.isArray(tagList) ? tagList : [];

  if (!title) {
    throw new HttpException(422, { errors: { title: ["can't be blank"] } });
  }

  if (!description) {
    throw new HttpException(422, { errors: { description: ["can't be blank"] } });
  }

  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const slug = `${slugify(title)}-${userId}`;

  const existingTitle = await articleRepository.findArticleSlugOnly(slug);

  if (existingTitle) {
    throw new HttpException(422, { errors: { title: ['must be unique'] } });
  }

  const { authorId, id: articleId, ...createdArticle } = await articleRepository.createArticle(
    { title, description, body, slug, tagList: tags },
    userId,
  );

  return articleMapper(createdArticle, userId);
};

export const getArticle = async (slug: string, userId?: number) => {
  const article = await articleRepository.findArticleBySlug(slug);

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  return articleMapper(article, userId);
};

export const updateArticle = async (
  article: UpdateArticleInput,
  slug: string,
  userId: number,
) => {
  let newSlug: string | undefined;

  const existingArticle = await articleRepository.findArticleAuthor(slug);

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== userId) {
    throw new HttpException(403, {
      message: 'You are not authorized to update this article',
    });
  }

  if (article.title) {
    newSlug = `${slugify(article.title)}-${userId}`;

    if (newSlug !== slug) {
      const existingTitle = await articleRepository.findArticleAuthor(newSlug);

      if (existingTitle) {
        throw new HttpException(422, { errors: { title: ['must be unique'] } });
      }
    }
  }

  const tagList =
    Array.isArray(article.tagList) && article.tagList.length
      ? article.tagList
      : [];

  await articleRepository.disconnectArticleTags(slug);

  const updatedArticle = await articleRepository.updateArticle(slug, {
    title: article.title,
    body: article.body,
    description: article.description,
    slug: newSlug,
    tagList,
  });

  return articleMapper(updatedArticle, userId);
};

export const deleteArticle = async (slug: string, userId: number) => {
  const existingArticle = await articleRepository.findArticleAuthor(slug);

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== userId) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this article',
    });
  }

  await articleRepository.deleteArticle(slug);
};

export const getCommentsByArticle = async (slug: string, userId?: number) => {
  const result = await articleRepository.findArticleWithComments(slug, userId);

  return result?.comments.map((comment) => ({
    ...comment,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === userId),
    },
  }));
};

export const addComment = async (body: string, slug: string, userId: number) => {
  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const article = await articleRepository.findArticleIdBySlug(slug);

  const comment = await articleRepository.createComment(body, article?.id as number, userId);

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === userId),
    },
  };
};

export const deleteComment = async (commentId: number, userId: number) => {
  const comment = await articleRepository.findCommentWithAuthor(commentId, userId);

  if (!comment) {
    throw new HttpException(404, {});
  }

  if (comment.author.id !== userId) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this comment',
    });
  }

  await articleRepository.deleteComment(commentId);
};

export const favoriteArticle = async (slug: string, userId: number) => {
  const { _count, ...article } = await articleRepository.favoriteArticle(slug, userId);

  return {
    ...article,
    author: profileMapper(article.author, userId),
    tagList: article.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === userId),
    favoritesCount: _count?.favoritedBy,
    bookmarked: article.bookmarkedBy?.some((bookmarked: any) => bookmarked.id === userId) ?? false,
  };
};

export const unfavoriteArticle = async (slug: string, userId: number) => {
  const { _count, ...article } = await articleRepository.unfavoriteArticle(slug, userId);

  return {
    ...article,
    author: profileMapper(article.author, userId),
    tagList: article.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === userId),
    favoritesCount: _count?.favoritedBy,
    bookmarked: article.bookmarkedBy?.some((bookmarked: any) => bookmarked.id === userId) ?? false,
  };
};

export const bookmarkArticle = async (slug: string, userId: number) => {
  const article = await articleRepository.bookmarkArticle(slug, userId);
  return articleMapper(article, userId);
};

export const unbookmarkArticle = async (slug: string, userId: number) => {
  const article = await articleRepository.unbookmarkArticle(slug, userId);
  return articleMapper(article, userId);
};
