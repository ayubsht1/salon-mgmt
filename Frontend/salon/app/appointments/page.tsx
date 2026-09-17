"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, Appointment, Service, useSession } from "../lib/api";

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const { token, user } = useSession();
  const [serviceId, setServiceId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [loaded, setLoaded] = useState(false);
  const loading = Boolean(token) && !loaded;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api<Service[]>("/services/")
      .then((items) => {
        setServices(items);
        if (items[0]) setServiceId(String(items[0].id));
      })
      .catch((reason) => setError(reason.message));
    if (!token) return;
    api<Appointment[]>("/appointments/", {}, token)
      .then((items) => {
        setAppointments(
          user?.is_staff
            ? items
            : items.filter((item) => item.customer === user?.id),
        );
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoaded(true));
  }, [token, user?.id, user?.is_staff]);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const localAppointment = new Date(dateTime);
      if (
        Number.isNaN(localAppointment.getTime()) ||
        localAppointment <= new Date()
      ) {
        throw new Error("Please choose a future date and time.");
      }
      await api(
        "/appointments/",
        {
          method: "POST",
          body: JSON.stringify({
            service: Number(serviceId),
            appointment_datetime: localAppointment.toISOString(),
            customer_name: `${user.first_name} ${user.last_name}`,
            customer_email: user.email,
          }),
        },
        token,
      );
      const items = await api<Appointment[]>("/appointments/", {}, token);
      setAppointments(
        user.is_staff
          ? items
          : items.filter((item) => item.customer === user.id),
      );
      setDateTime("");
      setNotice("Your appointment request is in. We will confirm it shortly.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to book appointment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <nav className="nav shell">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span> Serein <em>studio</em>
        </Link>
        <div className="nav-actions">
          <Link className="text-button" href="/services">
            Services
          </Link>
          {user?.is_staff && (
            <Link className="text-button" href="/admin">
              Studio portal
            </Link>
          )}
          {user ? (
            <span className="welcome">Hi, {user.first_name}</span>
          ) : (
            <Link className="outline-button" href="/">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <section className="section shell page-intro">
        <p className="eyebrow">Your visits</p>
        <h1>Appointments</h1>
        <p className="hero-text">
          Choose a time that feels good. Your request will be confirmed by the
          studio.
        </p>
      </section>
      {notice && (
        <div className="notice shell">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {!user ? (
        <section className="section shell">
          <div className="empty">
            <h2>Sign in to manage appointments</h2>
            <p>You need an account before you can book or view visits.</p>
            <Link className="primary-button" href="/">
              Go to sign in <span>→</span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="appointments-layout shell">
          <form className="booking-panel" onSubmit={bookAppointment}>
            <p className="eyebrow">New booking</p>
            <h2>Reserve your time</h2>
            <label className="field">
              <span>Service</span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                required
              >
                <option value="">Choose a service</option>
                {services.map((service) => (
                  <option value={service.id} key={service.id}>
                    {service.name} - ${Number(service.price).toFixed(0)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>
                Date and time{" "}
                <small className="field-hint">your local time</small>
              </span>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(event) => setDateTime(event.target.value)}
                required
                min={localDateTimeValue()}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button
              className="primary-button full"
              disabled={saving || loading}
            >
              {saving ? "Requesting..." : "Request appointment"}
            </button>
          </form>
          <div className="visit-history">
            <p className="eyebrow">History</p>
            <h2>Your visits</h2>
            {loading ? (
              <p className="muted">Loading appointments...</p>
            ) : appointments.length ? (
              <div className="appointment-list">
                {appointments.map((appointment) => (
                  <div className="appointment-row" key={appointment.id}>
                    <div>
                      <strong>{appointment.service_name}</strong>
                      <span>
                        {new Date(
                          appointment.appointment_datetime,
                        ).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <b>{appointment.status_display}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                No appointments yet. Your bookings will appear here.
              </p>
            )}
          </div>
        </section>
      )}
      <footer className="footer shell">
        <span className="brand">
          Serein <em>studio</em>
        </span>
        <span>Beauty, at your own pace.</span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
