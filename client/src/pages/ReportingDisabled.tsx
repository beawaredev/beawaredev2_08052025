import React from "react";

export default function ReportingDisabled() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold">Reporting is currently unavailable</h1>
      <p className="mt-3 text-slate-600">
        You can still use BeAware to check numbers and links, and follow the
        security checklist.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <a
          className="px-4 py-2 rounded-md bg-indigo-600 text-white"
          href="/scam-lookup"
        >
          Scam Lookup
        </a>
        <a
          className="px-4 py-2 rounded-md border"
          href="/secure-your-digital-presence"
        >
          Security Checklist
        </a>
      </div>
    </div>
  );
}
