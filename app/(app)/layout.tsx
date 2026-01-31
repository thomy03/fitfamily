import Link from "next/link"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-1">
          <NavItem href="/dashboard" icon="🏠" label="Accueil" />
          <NavItem href="/meals" icon="🍽️" label="Repas" />
          <NavItem href="/workout" icon="💪" label="Sport" />
          <NavItem href="/profile" icon="👤" label="Profil" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center py-2 px-4 rounded-2xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all">
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
