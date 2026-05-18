import './globals.css';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Assiduity',
  description: `Suivi des formations et émargements — ${process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Australe Formation'}`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
