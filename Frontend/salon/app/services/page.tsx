"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, Service, useSession } from "../lib/api";

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const { token, user } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Service[]>("/services/").then(setServices).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const created = await api<Service>("/services/", { method: "POST", body: JSON.stringify({ ...values, price: Number(values.price), duration_minutes: Number(values.duration_minutes), is_available: true }) }, token);
      setServices((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name)));
      setFormOpen(false); setNotice("Service added successfully.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add service."); }
    finally { setSaving(false); }
  }

  return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark">S</span> Serein <em>studio</em></Link><div className="nav-actions"><Link className="text-button" href="/appointments">Appointments</Link>{user?.is_staff && <Link className="text-button" href="/admin">Studio portal</Link>}{user ? <span className="welcome">Hi, {user.first_name}</span> : <Link className="outline-button" href="/">Sign in</Link>}</div></nav>
    <section className="section shell page-intro"><p className="eyebrow">The menu</p><div className="page-title-row"><h1>Our services</h1>{user?.is_staff && <button className="primary-button" onClick={() => setFormOpen(true)}>Add service <span>+</span></button>}</div><p className="hero-text">Thoughtful cuts, color, and care, shaped around the person in the chair.</p></section>
    {notice && <div className="notice shell">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="section shell">{loading ? <div className="loading">Loading our services...</div> : error && !services.length ? <div className="error-state">{error}</div> : <div className="service-grid">{services.map((service, index) => <article className="service-card" key={service.id}><span className="service-number">{String(index + 1).padStart(2, "0")}</span><h2>{service.name}</h2><p>{service.description || "A considered service, tailored to you."}</p><div className="service-meta"><span>{service.duration_minutes} min</span><strong>${Number(service.price).toFixed(0)}</strong></div><Link className="book-link" href={`/appointments?service=${service.id}`}>Book this service <span>↗</span></Link></article>)}</div>}</section>
    {formOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}><form className="modal" onSubmit={createService}><button type="button" className="close-button" onClick={() => setFormOpen(false)}>×</button><p className="eyebrow">Studio admin</p><h2>Add a service</h2><Field label="Service name" name="name" required maxLength={150} /><label className="field"><span>Description</span><textarea name="description" rows={3} /></label><div className="two-fields"><Field label="Price" name="price" type="number" min="0" step="0.01" required /><Field label="Duration (minutes)" name="duration_minutes" type="number" min="1" required /></div>{error && <p className="form-error">{error}</p>}<button className="primary-button full" disabled={saving}>{saving ? "Adding..." : "Add service"}</button></form></div>}
  </main>;
}
