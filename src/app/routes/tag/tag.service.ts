import { Tag } from './tag.model';
import { findTagsByAuthorVisibility } from './tag.repository';

const getTags = async (userId?: number): Promise<string[]> => {
  const tags = await findTagsByAuthorVisibility(userId);
  return tags.map((tag: Tag) => tag.name);
};

export default getTags;
