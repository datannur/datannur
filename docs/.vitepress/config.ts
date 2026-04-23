import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'datannur app docs',
  description: 'Portable client-side data catalog',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  // Deployed under https://docs.datannur.com/app/
  base: '/app/',

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/app/favicon-32.png',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Website', link: 'https://datannur.com' },
      { text: 'Demo', link: 'https://dev.datannur.com/' },
      { text: 'Builder docs', link: 'https://docs.datannur.com/builder/' },
    ],

    sidebar: [
      { text: 'Getting Started', link: '/' },
      { text: 'Installing on Your Computer', link: '/install' },
      { text: 'Managing the App', link: '/app' },
      { text: 'Managing Your Data', link: '/data' },
      { text: 'Publishing Online', link: '/deployment' },
      { text: 'APIs & Interoperability', link: '/integrations' },
      { text: 'Advanced Configuration', link: '/configuration' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/datannur/datannur' },
    ],

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/datannur/datannur/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
