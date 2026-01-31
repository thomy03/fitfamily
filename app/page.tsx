import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md animate-slideUp">
        <div className="text-8xl mb-6">💪</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">FitFamily</h1>
        <p className="text-gray-500 mb-8">
          Remise en forme familiale.<br/>
          Suivi calories, sport et objectifs.
        </p>
        
        <div className="space-y-3">
          <Link href="/login" className="btn btn-primary w-full block text-center py-3">
            Se connecter
          </Link>
          <Link href="/register" className="btn btn-secondary w-full block text-center py-3">
            Créer un compte
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-1">📸</div>
            <p className="text-xs text-gray-500">Analyse repas IA</p>
          </div>
          <div>
            <div className="text-3xl mb-1">🏋️</div>
            <p className="text-xs text-gray-500">Exercices guidés</p>
          </div>
          <div>
            <div className="text-3xl mb-1">👨‍👩‍👧</div>
            <p className="text-xs text-gray-500">Défis famille</p>
          </div>
        </div>
      </div>
    </div>
  )
}
