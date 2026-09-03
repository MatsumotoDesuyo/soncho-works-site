import rss from '@astrojs/rss';
import { site } from '../site.config';
import { getSortedPosts } from '../lib/posts';

// 旧 WordPress の /feed/ は public/_redirects でここへ 301 する。
export async function GET(context) {
  const posts = await getSortedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
    })),
    customData: `<language>ja</language>`,
  });
}
