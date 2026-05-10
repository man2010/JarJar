import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'JaarJaar',
  description: 'Histoires, confessions anonymes et parcours inspirants.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
