export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh w-full" style={{ backgroundColor: 'var(--bg-base)' }}>
      {children}
    </main>
  )
}
