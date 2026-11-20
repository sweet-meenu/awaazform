import type { MetadataRoute } from 'next';

// Generated once at build time (the site is a static export).
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AwaazForm',
    short_name: 'AwaazForm',
    description: 'Your voice. Your form. Your access. Fill forms and documents with Bolu.',
    lang: 'en-IN',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#624de3',
    categories: ['productivity', 'utilities'],
    prefer_related_applications: false,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Fill an online form', short_name: 'Online form', url: '/form?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Fill a PDF or Word document', short_name: 'Documents', url: '/documents?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Saved profiles', short_name: 'Profiles', url: '/profiles?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
    share_target: {
      action: '/share-target', method: 'POST', enctype: 'multipart/form-data',
      params: {
        title: 'title', text: 'text', url: 'url',
        files: [{ name: 'files', accept: ['application/pdf', '.pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'] }],
      },
    },
  };
}
