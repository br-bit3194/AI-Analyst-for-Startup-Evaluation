import Navbar1 from "@/components/ui/navbar-1";
import { Hero } from "@/components/ui/helix-hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar1 />
      <main className="flex-1">
        <Hero
          title="AI-Powered Startup Evaluation"
          description="Leverage cutting-edge AI to analyze and evaluate startup potential with precision. Our platform provides deep insights, risk assessment, and investment recommendations to help you make data-driven decisions."
        />
      </main>
    </div>
  );
}
