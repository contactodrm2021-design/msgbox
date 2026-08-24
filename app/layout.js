import './globals.css';

export const metadata = {
  title: '留言箱',
  description: '匿名留言，自由表达',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
