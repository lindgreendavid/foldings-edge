import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <span className="brand__mark" aria-hidden="true">
        ⌁
      </span>
      <p>404 · outside the dataset</p>
      <h1>This page is not part of the site.</h1>
      <Link className="button button--primary" href="/">
        Return to Foldings Edge
      </Link>
    </main>
  );
}
