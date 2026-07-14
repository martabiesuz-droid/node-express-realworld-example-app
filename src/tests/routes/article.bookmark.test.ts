import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import * as articleService from '../../app/routes/article/article.service';

jest.mock('../../app/routes/article/article.service');

const TEST_USER_ID = 42;
const TEST_SLUG = 'how-to-train-your-dragon';

const buildMockedArticle = (bookmarked: boolean) => ({
  slug: TEST_SLUG,
  title: 'How to train your dragon',
  description: 'Ever wonder how?',
  body: 'You have to believe.',
  tagList: ['dragons', 'training'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  favorited: false,
  favoritesCount: 0,
  bookmarked,
  author: {
    username: 'testuser',
    bio: null,
    image: null,
    following: false,
  },
});

const stubAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).auth = { user: { id: TEST_USER_ID } };
  next();
};

const buildTestApp = () => {
  const app = express();
  app.use(express.json());

  app.post(
    '/api/articles/:slug/bookmark',
    stubAuthMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.bookmarkArticle(
          req.params.slug,
          (req as any).auth.user.id,
        );
        res.json({ article });
      } catch (error) {
        next(error);
      }
    },
  );

  app.delete(
    '/api/articles/:slug/bookmark',
    stubAuthMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.unbookmarkArticle(
          req.params.slug,
          (req as any).auth.user.id,
        );
        res.json({ article });
      } catch (error) {
        next(error);
      }
    },
  );

  return app;
};

describe('Bookmark routes', () => {
  const mockBookmarkArticle = articleService.bookmarkArticle as jest.MockedFunction<
    typeof articleService.bookmarkArticle
  >;
  const mockUnbookmarkArticle = articleService.unbookmarkArticle as jest.MockedFunction<
    typeof articleService.unbookmarkArticle
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/articles/:slug/bookmark', () => {
    test('should return 200 with bookmarked: true when bookmark is added', async () => {
      // Given
      const bookedArticle = buildMockedArticle(true);
      mockBookmarkArticle.mockResolvedValue(bookedArticle);

      // When
      const response = await request(buildTestApp())
        .post(`/api/articles/${TEST_SLUG}/bookmark`)
        .expect(200);

      // Then
      expect(response.body.article).toBeDefined();
      expect(response.body.article.bookmarked).toBe(true);
      expect(mockBookmarkArticle).toHaveBeenCalledWith(TEST_SLUG, TEST_USER_ID);
    });

    test('response article payload contains the bookmarked field', async () => {
      // Given
      const bookedArticle = buildMockedArticle(true);
      mockBookmarkArticle.mockResolvedValue(bookedArticle);

      // When
      const response = await request(buildTestApp())
        .post(`/api/articles/${TEST_SLUG}/bookmark`)
        .expect(200);

      // Then
      expect(response.body.article).toHaveProperty('bookmarked');
      expect(response.body.article).toHaveProperty('slug', TEST_SLUG);
      expect(response.body.article).toHaveProperty('favoritesCount');
    });
  });

  describe('DELETE /api/articles/:slug/bookmark', () => {
    test('should return 200 with bookmarked: false when bookmark is removed', async () => {
      // Given
      const unbookedArticle = buildMockedArticle(false);
      mockUnbookmarkArticle.mockResolvedValue(unbookedArticle);

      // When
      const response = await request(buildTestApp())
        .delete(`/api/articles/${TEST_SLUG}/bookmark`)
        .expect(200);

      // Then
      expect(response.body.article).toBeDefined();
      expect(response.body.article.bookmarked).toBe(false);
      expect(mockUnbookmarkArticle).toHaveBeenCalledWith(TEST_SLUG, TEST_USER_ID);
    });
  });
});
