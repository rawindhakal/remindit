import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <span className="text-xl font-bold text-blue-600">RenewIt</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span>🇳🇵</span> Made for Nepal
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Never miss a renewal
          <br />
          <span className="text-blue-600">deadline again</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Track your driving license, vehicle insurance, passport, subscriptions, and more. Get
          automatic email reminders before anything expires.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            Add my first reminder →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-lg"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Everything you need to stay ahead
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Add in seconds",
                desc: "Category → Name → Expiry Date → Save. Everything else is optional.",
              },
              {
                icon: "📧",
                title: "Automatic reminders",
                desc: "Get email alerts 90, 60, 30, 15, 7, 3, and 1 day before expiry.",
              },
              {
                icon: "🔄",
                title: "Track renewals",
                desc: "Mark as renewed, set a new date, and the cycle starts again automatically.",
              },
              {
                icon: "📊",
                title: "Clear dashboard",
                desc: "See Active, Due Soon, Expiring Today, and Expired at a glance.",
              },
              {
                icon: "🗂️",
                title: "All categories",
                desc: "Driving License, Vehicle Tax, Insurance, Passport, Subscriptions, Warranties, and more.",
              },
              {
                icon: "🔒",
                title: "Private & secure",
                desc: "Your data is private by default. No public sharing of personal documents.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can track */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">What can you track?</h2>
        <p className="text-center text-gray-500 mb-12">
          Everything with an expiry date. For individuals and businesses in Nepal.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🪪", name: "Driving License" },
            { icon: "📘", name: "Passport" },
            { icon: "🚗", name: "Vehicle Tax" },
            { icon: "🛡️", name: "Vehicle Insurance" },
            { icon: "🏥", name: "Health Insurance" },
            { icon: "🌐", name: "Domain" },
            { icon: "💻", name: "Software License" },
            { icon: "📺", name: "OTT Subscription" },
            { icon: "📱", name: "Mobile Plan" },
            { icon: "🏢", name: "Company Registration" },
            { icon: "📄", name: "Business License" },
            { icon: "⭐", name: "Custom Reminder" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Start tracking for free</h2>
        <p className="text-blue-100 mb-8 text-lg">
          Add an expiry date once. We'll remind you before it expires. Always.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-lg"
        >
          Get started — it's free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🔔</span>
          <span className="font-semibold text-gray-600">RenewIt</span>
        </div>
        <p>Never miss a renewal deadline · Made with ❤️ for Nepal</p>
      </footer>
    </div>
  );
}
