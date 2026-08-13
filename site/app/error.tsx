"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Foldings Edge render failure", error);
  }, [error]);

  return (
    <main className="status-page">
      <span className="brand__mark" aria-hidden="true">
        ⌁
      </span>
      <p>Structure not resolved</p>
      <h1>This page could not be rendered.</h1>
      <p>No data was sent anywhere. Try again or return to the site.</p>
      <div className="hero__actions">
        <button className="button button--primary" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button--ghost" href="/">
          Return to Foldings Edge
        </Link>
      </div>
    </main>
  );
}
