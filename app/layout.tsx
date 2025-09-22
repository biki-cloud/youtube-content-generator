import "./globals.css";

export const metadata = {
  title: "YouTube Content Generator",
  description: "Next.js migration scaffold",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
