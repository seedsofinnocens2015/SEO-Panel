"use client";

import { FormEvent, useMemo, useState } from "react";

type SeoPayload = {
  pageUrl: string;
  title: string;
  description: string;
  keywords: string;
  robots: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schema: string;
  googleVerification: string;
  gaCode: string;
  fbPixel: string;
};

const PAGE_OPTIONS = [
  { label: "Home", value: "/" },
  { label: "IVF Treatment", value: "/ivf-treatment" },
  { label: "Contact Us", value: "/contact-us" },
];

const INITIAL_FORM: SeoPayload = {
  pageUrl: "",
  title: "",
  description: "",
  keywords: "",
  robots: "index,follow",
  canonical: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  schema: "{}",
  googleVerification: "",
  gaCode: "",
  fbPixel: "",
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

async function saveSeo(payload: Omit<SeoPayload, "schema"> & { schema: unknown }) {
  const endpoint = `${API_BASE_URL}/api/seo`;

  const putResponse = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (putResponse.ok) return putResponse;
  if (![404, 405].includes(putResponse.status)) return putResponse;

  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: keyof SeoPayload;
  value: string;
  onChange: (name: keyof SeoPayload, value: string) => void;
  placeholder?: string;
  type?: "text" | "url";
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

export default function Home() {
  const [form, setForm] = useState<SeoPayload>(INITIAL_FORM);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isBusy = useMemo(() => isFetching || isSaving, [isFetching, isSaving]);

  const setField = (name: keyof SeoPayload, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = async (selectedPage: string) => {
    setField("pageUrl", selectedPage);
    setError("");
    setSuccess("");

    if (!selectedPage) {
      setForm(INITIAL_FORM);
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/seo?pageUrl=${encodeURIComponent(selectedPage)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load SEO (${response.status})`);
      }

      const payload = await response.json();
      const data = payload?.data || {};

      setForm({
        pageUrl: data.pageUrl || selectedPage,
        title: data.title || "",
        description: data.description || "",
        keywords: data.keywords || "",
        robots: data.robots || "index,follow",
        canonical: data.canonical || "",
        ogTitle: data.ogTitle || "",
        ogDescription: data.ogDescription || "",
        ogImage: data.ogImage || "",
        schema: JSON.stringify(data.schema ?? {}, null, 2),
        googleVerification: data.googleVerification || "",
        gaCode: data.gaCode || "",
        fbPixel: data.fbPixel || "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch SEO data";
      setError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.pageUrl) {
      setError("Please select a page first.");
      return;
    }

    let parsedSchema: unknown = {};
    try {
      parsedSchema = form.schema ? JSON.parse(form.schema) : {};
    } catch {
      setError("Schema must be valid JSON.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveSeo({
        ...form,
        schema: parsedSchema,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Failed to save SEO data");
      }

      setSuccess("SEO data saved successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save SEO data";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <main className="mx-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Page SEO Management</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Select Page</span>
            <select
              value={form.pageUrl}
              onChange={(e) => void handlePageChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={isBusy}
            >
              <option value="">Choose a page</option>
              {PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <InputField
            label="Page URL"
            name="pageUrl"
            value={form.pageUrl}
            onChange={setField}
            placeholder="/ivf-treatment"
          />
          <InputField label="Title" name="title" value={form.title} onChange={setField} />
          <InputField
            label="Description"
            name="description"
            value={form.description}
            onChange={setField}
          />
          <InputField
            label="Keywords"
            name="keywords"
            value={form.keywords}
            onChange={setField}
          />
          <InputField label="Robots" name="robots" value={form.robots} onChange={setField} />
          <InputField
            label="Canonical"
            name="canonical"
            value={form.canonical}
            onChange={setField}
            type="url"
          />
          <InputField label="OG Title" name="ogTitle" value={form.ogTitle} onChange={setField} />
          <InputField
            label="OG Description"
            name="ogDescription"
            value={form.ogDescription}
            onChange={setField}
          />
          <InputField
            label="OG Image"
            name="ogImage"
            value={form.ogImage}
            onChange={setField}
            type="url"
          />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Schema (JSON)</span>
            <textarea
              value={form.schema}
              onChange={(e) => setField("schema", e.target.value)}
              rows={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <InputField
            label="Google Verification"
            name="googleVerification"
            value={form.googleVerification}
            onChange={setField}
          />
          <InputField label="GA Code" name="gaCode" value={form.gaCode} onChange={setField} />
          <InputField
            label="FB Pixel"
            name="fbPixel"
            value={form.fbPixel}
            onChange={setField}
          />

          {isFetching && (
            <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Loading SEO data...
            </p>
          )}
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save SEO"}
          </button>
        </form>
      </main>
    </div>
  );
}
