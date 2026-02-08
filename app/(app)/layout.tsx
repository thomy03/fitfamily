import Link from "next/link"
import { NotificationPrompt } from "@/components/NotificationPrompt"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Content */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-1">
          <NavItem href="/dashboard" icon="🏠" label="Home" />
          <NavItem href="/meals" icon="🍽️" label="Repas" />
          <NavItem href="/supplements" icon="💊" label="Compléments" />
          <NavItem href="/chat" icon="🤖" label="Chat" />
          <NavItem href="/profile" icon="👤" label="Profil" />
        </div>
      </nav>

      {/* Notification Prompt */}
      <NotificationPrompt />
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center py-2 px-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30 transition-all">
      <span className="text-lg mb-0.5">{icon}</span>
      <span className="text-[9px] font-medium">{label}</span>
    </Link>
  )
}
