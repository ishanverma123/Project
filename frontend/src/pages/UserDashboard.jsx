import { Link } from 'react-router-dom'

export default function UserDashboard() {
  return (
    <div className="dashboard-shell">
      <div className="page dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="muted">Quick access to your bookings, favorites, and account settings.</p>
          </div>
          <Link className="button primary" to="/home">
            Browse properties
          </Link>
        </header>

        <section className="dashboard-sections">
          <article className="panel dashboard-card">
            <h2>My Bookings</h2>
            <p className="muted">Upcoming and past stays</p>
            <div className="dashboard-card-actions">
              <button type="button" className="button secondary">View bookings</button>
            </div>
          </article>

          <article className="panel dashboard-card">
            <h2>Favorites</h2>
            <p className="muted">Saved properties</p>
            <div className="dashboard-card-actions">
              <button type="button" className="button secondary">View favorites</button>
            </div>
          </article>

          <article className="panel dashboard-card">
            <h2>Account</h2>
            <p className="muted">Profile and preferences</p>
            <div className="dashboard-card-actions">
              <button type="button" className="button secondary">Manage account</button>
            </div>
          </article>

          <article className="panel dashboard-card">
            <h2>Notifications</h2>
            <p className="muted">Alerts and updates</p>
            <div className="dashboard-card-actions">
              <button type="button" className="button secondary">View notifications</button>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
