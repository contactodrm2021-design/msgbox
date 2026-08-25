import './globals.css';
import RegisterSW from './RegisterSW';

export const metadata = {
  title: '留言箱 💌 · 匿名留言自由表达',
  description: '一个可以匿名留下心事的角落。自由表达，无人知晓你是谁。',
  applicationName: '留言箱',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💌</text></svg>',
  },
  openGraph: {
    title: '留言箱 💌 · 匿名留言自由表达',
    description: '一个可以匿名留下心事的角落。自由表达，无人知晓你是谁。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '留言箱',
  },
  twitter: {
    card: 'summary',
    title: '留言箱 💌',
    description: '匿名留言，自由表达',
  },
};

export const viewport = {
  themeColor: '#050510',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=ZCOOL+KuaiLe&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
