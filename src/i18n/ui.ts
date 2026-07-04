// src/i18n/ui.ts
export type Locale = 'en' | 'zh';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.now': 'Now',
    'nav.about': 'About',
    'home.selectedWork': 'Selected work',
    'home.readBlog': 'Read the blog',
    'home.recentPosts': 'Recent posts',
    'home.featuredProjects': 'Selected projects',
    'projects.title': 'Projects',
    'projects.other': 'Other projects',
    'blog.title': 'Blog',
    'now.title': 'Now',
    'now.updated': 'Last updated',
    'about.title': 'About',
    'post.back': 'All posts',
    'notfound.message': 'Page not found',
  },
  zh: {
    'nav.home': '首页',
    'nav.projects': '项目',
    'nav.blog': '博客',
    'nav.now': '此刻',
    'nav.about': '关于',
    'home.selectedWork': '精选项目',
    'home.readBlog': '读博客',
    'home.recentPosts': '最近文章',
    'home.featuredProjects': '精选项目',
    'projects.title': '项目',
    'projects.other': '其他项目',
    'blog.title': '博客',
    'now.title': '此刻',
    'now.updated': '最后更新',
    'about.title': '关于',
    'post.back': '全部文章',
    'notfound.message': '页面不存在',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function t(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}

export function localePath(locale: Locale, path: string): string {
  return locale === 'en' ? path : `/zh${path === '/' ? '' : path}`;
}

export function altLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}
