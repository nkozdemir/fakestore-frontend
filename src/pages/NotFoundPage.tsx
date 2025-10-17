import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white p-6 text-center">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="text-base text-slate-600">The page you are looking for could not be found.</p>
      <Link
        to="/"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
      >
        Go home
      </Link>
    </section>
  )
}
