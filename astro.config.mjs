// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aizyeee.github.io',
  integrations: [sitemap()],
  // 悬停即预取全部站内链接（默认 hover 策略），点击时接近秒开
  prefetch: { prefetchAll: true },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
