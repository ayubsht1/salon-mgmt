"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "./lib/api";

type Service = { id: number; name: string; description: string; price: string; duration_minutes: number };
type Appointment = { id: number; customer: number | null; service_name: string; appointment_datetime: string; status_display: string };
type User = { id: number; first_name: string; last_name: string; email: string; is_staff?: boolean };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || "Something went wrong. Please try again.");
  return data;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const session = useSession();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [localToken, setLocalToken] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const user = signedOut ? null : localUser || session.user;
  const token = signedOut ? "" : localToken || session.token;
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceBusy, setServiceBusy] = useState(false);

  useEffect(() => {
    api<Service[]>("/services/").then(setServices).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (token) api<Appointment[]>("/appointments/", {}, token).then((items) => setAppointments(user?.is_staff ? items : items.filter((item) => item.customer === user?.id))).catch(() => setAppointments([]));
  }, [token, user?.id, user?.is_staff]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (authMode === "register") {
        await api("/register/", { method: "POST", body: JSON.stringify(values) });
        setMessage("Account created. Sign in to continue."); setAuthMode("login");
      } else {
        const result = await api<{ data: { access: string; user: User } }>("/login/", { method: "POST", body: JSON.stringify(values) });
        setLocalToken(result.data.access); setLocalUser(result.data.user); setSignedOut(false); localStorage.setItem("salon_access", result.data.access); localStorage.setItem("salon_user", JSON.stringify(result.data.user)); setAuthOpen(false);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); }
    finally { setAuthBusy(false); }
  }

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedService || !user || !token) return;
    setBookingBusy(true); setMessage("");
    const appointment_datetime = new FormData(event.currentTarget).get("appointment_datetime");
    try {
      await api("/appointments/", { method: "POST", body: JSON.stringify({ service: selectedService.id, appointment_datetime, customer_name: `${user.first_name} ${user.last_name}`, customer_email: user.email }) }, token);
      setMessage("Your appointment request is in. We will confirm it shortly."); setSelectedService(null);
      const items = await api<Appointment[]>("/appointments/", {}, token);
      setAppointments(user.is_staff ? items : items.filter((item) => item.customer === user.id));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to book appointment."); }
    finally { setBookingBusy(false); }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setServiceBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const service = await api<Service>("/services/", { method: "POST", body: JSON.stringify({ ...values, price: Number(values.price), duration_minutes: Number(values.duration_minutes), is_available: true }) }, token);
      setServices((current) => [...current, service].sort((left, right) => left.name.localeCompare(right.name)));
      setServiceOpen(false); setMessage("Service added successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add service."); }
    finally { setServiceBusy(false); }
  }

  function logout() { localStorage.removeItem("salon_access"); localStorage.removeItem("salon_user"); setLocalToken(""); setLocalUser(null); setSignedOut(true); setAppointments([]); }

  return <main>
    <nav className="nav shell"><a className="brand" href="#top"><span className="brand-mark">S</span> Serein <em>studio</em></a><div className="nav-actions"><a className="text-button" href="/services">Services</a><a className="text-button" href="/appointments">Appointments</a>{user ? <><span className="welcome">Hi, {user.first_name}</span><button className="text-button" onClick={logout}>Sign out</button></> : <button className="outline-button" onClick={() => setAuthOpen(true)}>Sign in</button>}</div></nav>
    <section className="hero shell" id="top"><div className="hero-copy"><p className="eyebrow">A quieter kind of beauty</p><h1>Time set aside<br /><i>for you.</i></h1><p className="hero-text">Thoughtful cuts, color, and care in a calm little studio made for feeling like yourself.</p><a className="primary-button" href="#services">Explore services <span>↓</span></a></div><div className="hero-art"><div className="sun-shape" /><div className="hero-card"><span>Open today</span><strong>09:00 — 19:00</strong><small>Tuesday to Saturday</small></div></div></section>
    {message && <div className="notice shell">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
    <section className="section shell" id="services"><div className="section-heading"><div><p className="eyebrow">The menu</p><h2>Choose your ritual</h2></div><p>Every appointment begins with a conversation and ends with you feeling a little more at home in your skin.</p></div>{loading ? <div className="loading">Loading our services...</div> : services.length ? <div className="service-grid">{services.map((service, index) => <article className="service-card" key={service.id}><span className="service-number">0{index + 1}</span><h3>{service.name}</h3><p>{service.description || "A considered service, tailored to you."}</p><div className="service-meta"><span>{service.duration_minutes} min</span><strong>${Number(service.price).toFixed(0)}</strong></div><button className="book-link" onClick={() => user ? setSelectedService(service) : setAuthOpen(true)}>Book this service <span>↗</span></button></article>)}</div> : <div className="empty">No services are available right now.</div>}</section>
    {user && <section className="appointments shell"><div className="section-heading"><div><p className="eyebrow">Your visits</p><h2>Appointments</h2></div></div>{appointments.length ? <div className="appointment-list">{appointments.map((appointment) => <div className="appointment-row" key={appointment.id}><div><strong>{appointment.service_name}</strong><span>{new Date(appointment.appointment_datetime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div><b>{appointment.status_display}</b></div>)}</div> : <p className="muted">Your upcoming visits will appear here.</p>}</section>}
    <footer className="footer shell"><span className="brand">Serein <em>studio</em></span><span>Beauty, at your own pace.</span><span>© 2026</span></footer>
    {selectedService && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedService(null)}><form className="modal" onSubmit={bookAppointment}><button type="button" className="close-button" onClick={() => setSelectedService(null)}>×</button><p className="eyebrow">Reserve your time</p><h2>{selectedService.name}</h2><p className="muted">{selectedService.duration_minutes} minutes · ${Number(selectedService.price).toFixed(0)}</p><label className="field"><span>Date and time</span><input type="datetime-local" name="appointment_datetime" required min={new Date().toISOString().slice(0, 16)} /></label><button className="primary-button full" disabled={bookingBusy}>{bookingBusy ? "Requesting..." : "Request appointment"}</button></form></div>}
    {serviceOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setServiceOpen(false)}><form className="modal" onSubmit={createService}><button type="button" className="close-button" onClick={() => setServiceOpen(false)}>×</button><p className="eyebrow">Studio admin</p><h2>Add a service</h2><Field label="Service name" name="name" required maxLength={150} /><label className="field"><span>Description</span><textarea name="description" rows={3} /></label><div className="two-fields"><Field label="Price" name="price" type="number" min="0" step="0.01" required /><Field label="Duration (minutes)" name="duration_minutes" type="number" min="1" required /></div><button className="primary-button full" disabled={serviceBusy}>{serviceBusy ? "Adding..." : "Add service"}</button></form></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}><form className="modal" onSubmit={handleAuth}><button type="button" className="close-button" onClick={() => setAuthOpen(false)}>×</button><p className="eyebrow">Welcome to Serein</p><h2>{authMode === "login" ? "Good to see you" : "Make a little room"}</h2>{authMode === "register" && <div className="two-fields"><Field label="First name" name="first_name" required /><Field label="Last name" name="last_name" required /></div>}<Field label="Email" name="email" type="email" required />{authMode === "register" && <><Field label="Username" name="username" required /><Field label="Phone" name="phone" type="tel" required pattern="\+?[0-9]{7,15}" /></>}<Field label="Password" name="password" type="password" minLength={6} required /><button className="primary-button full" disabled={authBusy}>{authBusy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button><button type="button" className="switch-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setMessage(""); }}>{authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></form></div>}
  </main>;
}
