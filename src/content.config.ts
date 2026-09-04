import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// src/content/ の Markdown を読む。oldUrl は WordPress から移してきた記事だけが持ち、
// public/_redirects の 301 元と対応する。移行後に書く記事は持たない。

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    wpId: z.number().optional(),
    /** 旧 WordPress の permalink。public/_redirects の生成元と対応する。 */
    oldUrl: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    wpId: z.number().optional(),
    oldUrl: z.string().optional(),
  }),
});

export const collections = { posts, pages };
