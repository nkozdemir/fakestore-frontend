import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <h1 className="text-4xl font-semibold text-slate-900">FakeStore</h1>
      <p className="max-w-md text-center text-slate-600">
        Welcome to the FakeStore dashboard. Use the navigation to explore the app.
      </p>
      <Link
        to="/login"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
      >
        Sign in
      </Link>
    </section>
  )
}
