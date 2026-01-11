// This root layout is required by Next.js but won't be rendered
// because the middleware redirects all requests to /[locale]
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
