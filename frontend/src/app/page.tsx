import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wine-900/50 to-wine-950" />

        <div className="relative z-10 max-w-4xl">
          <h1 className="mb-6 font-serif text-5xl font-bold text-gold-300 md:text-7xl">
            Aionysus
          </h1>
          <p className="mb-4 text-xl text-wine-200 md:text-2xl">
            Your AI Wine Sommelier
          </p>
          <p className="mb-8 text-lg text-wine-300">
            Discover fine wines with AI-powered investment dashboards,
            drinking windows, and expert recommendations.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/wines"
              className="rounded-lg bg-gold-500 px-8 py-3 font-semibold text-wine-950 transition hover:bg-gold-400"
            >
              Browse Wines
            </Link>
            <button
              className="rounded-lg border border-gold-500 px-8 py-3 font-semibold text-gold-400 transition hover:bg-gold-500/10"
              onClick={() => {
                // Open CopilotKit sidebar
                const sidebar = document.querySelector('[data-copilotkit-sidebar-toggle]');
                if (sidebar) (sidebar as HTMLButtonElement).click();
              }}
            >
              Ask the Sommelier
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gold-300">
            Why Aionysus?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              title="Investment Dashboards"
              description="See AI-generated investment scores, drinking windows, and price trends for every wine."
              icon="chart"
            />
            <FeatureCard
              title="AI Sommelier"
              description="Ask natural language questions and get expert recommendations powered by AI."
              icon="chat"
            />
            <FeatureCard
              title="Food Pairings"
              description="Find the perfect wine for any meal with intelligent pairing suggestions."
              icon="food"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-wine-800/50 p-8 text-center backdrop-blur">
          <h2 className="mb-4 font-serif text-2xl font-bold text-gold-300">
            Ready to explore?
          </h2>
          <p className="mb-6 text-wine-200">
            Browse our curated collection of fine wines with detailed investment analysis.
          </p>
          <Link
            href="/wines"
            className="inline-block rounded-lg bg-gold-500 px-8 py-3 font-semibold text-wine-950 transition hover:bg-gold-400"
          >
            View All Wines
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  const icons: Record<string, string> = {
    chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    chat: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
    food: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12',
  };

  return (
    <div className="rounded-xl bg-wine-800/30 p-6 backdrop-blur">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/20">
        <svg className="h-6 w-6 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
        </svg>
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-gold-300">{title}</h3>
      <p className="text-wine-200">{description}</p>
    </div>
  );
}
