// サイト全体の設定。組織が発行した ID (AdSense・Google タグ) とプライバシーポリシーの
// URL はここに集約する。正本は組織の ORGANIZATION.md 側にあり、ここはその参照である。

export const site = {
  title: 'そんちょーのブログ',
  description: 'そんちょーが村長を目指す',
  url: 'https://soncho-works.com',
  author: 'そんちょー',
  lang: 'ja',

  /** プライバシーポリシーは組織が soncho-works.com/privacy/ で配信する。サイト内に自前で持たない。 */
  privacyUrl: 'https://soncho-works.com/privacy/',

  /** 組織の AdSense (pub-9666515152781934)。CMP と同意メッセージは組織のアカウント設定で出る。 */
  adsense: {
    enabled: true,
    client: 'ca-pub-9666515152781934',
  },

  /** 組織の Google タグ。旧サイトから継続。 */
  googleTag: {
    enabled: true,
    id: 'GT-M6XHF7Q',
  },

  /**
   * Amazon アソシエイト。トラッキング ID は組織が発行した 1 個だけを使う。
   * 本文の Markdown には ID を書かない。リンクへの付与は rehype-amazon-links が行う。
   */
  amazon: {
    tag: 'soncho00-22',
    /** 運営規約が表示を求める開示。Amazon 指定の文面をそのまま使う。 */
    disclosure: 'Amazonのアソシエイトとして、そんちょーは適格販売により収入を得ています。',
  },

  /** 記事一覧の 1 ページあたりの件数。 */
  postsPerPage: 20,
} as const;
