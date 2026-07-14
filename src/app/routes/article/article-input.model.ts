export interface ArticleQueryInput {
  offset?: string | number;
  limit?: string | number;
  tag?: string;
  author?: string;
  favorited?: string;
}

export interface CreateArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}
