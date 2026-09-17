"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, Appointment, Service, useSession } from "../lib/api";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

export default function AdminPage() {
  const { token, user } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!token || !user?.is_staff) return;
    Promise.all([api<Service[]>("/services/", {}, token), api<Appointment[]>("/appointments/", {}, token)])
      .then(([serviceItems, appointmentItems]) => { setServices(serviceItems); setAppointments(appointmentItems); })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [token, user]);

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

  async function updateStatus(id: number, status: string) {
    setError("");
    try {
      const updated = await api<Appointment>(`/appointments/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      setAppointments((current) => current.map((appointment) => appointment.id === id ? updated : appointment));
      setNotice("Appointment status updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update appointment."); }
  }

  async function toggleService(service: Service) {
    setError("");
    try {
      const updated = await api<Service>(`/services/${service.id}/`, { method: "PATCH", body: JSON.stringify({ is_available: !service.is_available }) }, token);
      setServices((current) => current.map((item) => item.id === service.id ? updated : item));
      setNotice(updated.is_available ? "Service is now available." : "Service hidden from customers.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update service."); }
  }

  if (!user || !token) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark">S</span> Serein <em>studio</em></Link></nav><section className="section shell"><div className="empty"><h2>Staff sign-in required</h2><p>Sign in with your staff account to access the salon portal.</p><Link className="primary-button" href="/">Go to sign in <span>→</span></Link></div></section></main>;
  if (!user.is_staff) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark">S</span> Serein <em>studio</em></Link></nav><section className="section shell"><div className="empty"><h2>This area is for staff</h2><p>Your customer account does not have permission to manage the salon.</p><Link className="primary-button" href="/appointments">View appointments <span>→</span></Link></div></section></main>;

  return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark">S</span> Serein <em>studio</em></Link><div className="nav-actions"><Link className="text-button" href="/services">Services</Link><Link className="text-button" href="/appointments">Customer view</Link></div></nav>
    <section className="section shell page-intro"><p className="eyebrow">Studio portal</p><div className="page-title-row"><h1>Good morning, {user.first_name}</h1><button className="primary-button" onClick={() => setFormOpen(true)}>Add service <span>+</span></button></div><p className="hero-text">Manage today&apos;s appointments and keep your service menu current.</p></section>
    {notice && <div className="notice shell">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}{error && <div className="notice shell admin-error">{error}<button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-grid shell"><div className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Schedule</p><h2>Appointments</h2></div><span>{appointments.length} total</span></div>{loading ? <p className="muted">Loading appointments...</p> : appointments.length ? <div className="admin-list">{appointments.map((appointment) => <div className="admin-row" key={appointment.id}><div className="admin-row-main"><strong>{appointment.service_name}</strong><span>{appointment.customer_name} · {appointment.customer_email || "No email"}</span><small>{new Date(appointment.appointment_datetime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></div><select value={appointment.status} onChange={(event) => updateStatus(appointment.id, event.target.value)} aria-label={`Status for appointment ${appointment.id}`}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></div>)}</div> : <p className="muted">No appointments have been booked yet.</p>}</div><div className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Menu</p><h2>Services</h2></div><span>{services.length} total</span></div><div className="admin-list">{services.map((service) => <div className="admin-row" key={service.id}><div className="admin-row-main"><strong>{service.name}</strong><span>{service.duration_minutes} min · ${Number(service.price).toFixed(0)}</span></div><button className="toggle-button" onClick={() => toggleService(service)}>{service.is_available ? "Available" : "Hidden"}</button></div>)}</div></div></section>
    {formOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}><form className="modal" onSubmit={createService}><button type="button" className="close-button" onClick={() => setFormOpen(false)}>×</button><p className="eyebrow">Studio admin</p><h2>Add a service</h2><Field label="Service name" name="name" required maxLength={150} /><label className="field"><span>Description</span><textarea name="description" rows={3} /></label><div className="two-fields"><Field label="Price" name="price" type="number" min="0" step="0.01" required /><Field label="Duration (minutes)" name="duration_minutes" type="number" min="1" required /></div><button className="primary-button full" disabled={saving}>{saving ? "Adding..." : "Add service"}</button></form></div>}
  </main>;
}
