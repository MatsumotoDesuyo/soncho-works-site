import { getCollection, type CollectionEntry } from 'astro:content';
import categories from '../data/categories.json';

export type Post = CollectionEntry<'posts'>;

/** 新しい順の全記事。 */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** カテゴリーの slug から日本語の表示名を引く。 */
const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));

export const categoryName = (slug: string): string => nameBySlug.get(slug) ?? slug;

export const allCategories = categories;

export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeZone: 'Asia/Tokyo' }).format(date);
