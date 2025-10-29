import { Navbar1 } from "@/components/ui/navbar-1"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar1 />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Startalytica Demo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This is a demo page showcasing the responsive navigation bar. 
            Try resizing your browser window to see the mobile menu in action.
          </p>
        </div>
      </main>
    </div>
  )
}
