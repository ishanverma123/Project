import { Link } from 'react-router-dom'

export default function SignInSignUp() {
  return (
    <div className="page auth-page">
      <h1>Sign In / Sign Up</h1>
      <section className="auth-actions">
        <button type="button">Sign In</button>
        <button type="button">Sign Up</button>
      </section>
      <section className="auth-roles">
        <p>Choose your role:</p>
        <div className="role-options">
          <span title="Tenant">Tenant</span>
          <span title="Landlord">Landlord</span>
        </div>
      </section>
      <p className="nav-hint">
        After signing in, you&apos;ll go to <Link to="/">Home / Property Listings</Link>.
      </p>
    </div>
  )
}
