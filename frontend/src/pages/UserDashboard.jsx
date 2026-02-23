import { Link } from 'react-router-dom'

export default function UserDashboard() {
  return (
    <div className="page dashboard-page">
      <h1>User Dashboard</h1>
      <section className="dashboard-sections">
        <div className="dashboard-block">
          <h2>My Bookings</h2>
          <p>Upcoming & Past</p>
        </div>
        <div className="dashboard-block">
          <h2>Favorites</h2>
          <p>Saved Properties</p>
        </div>
        <div className="dashboard-block">
          <h2>Account Settings</h2>
          <p>Profile & Info</p>
        </div>
        <div className="dashboard-block">
          <h2>Notifications</h2>
          <p>Alerts & Updates</p>
        </div>
      </section>
      <p className="nav-hint">
        <Link to="/home">Back to Home</Link>
      </p>
    </div>
  )
}
