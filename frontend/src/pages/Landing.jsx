import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero page">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Urban Rides Reimagined</p>
          <h1>Smart Carpool for safer, cleaner & better-priced city trips.</h1>
          <p className="landing-subtitle">
            Compare smart fare suggestions, book reliable rides, and negotiate transparently in one polished platform.
          </p>
          <div className="landing-hero-actions">
            <Link to="/signup" className="landing-btn landing-btn-primary">Get Started</Link>
            <Link to="/signin" className="landing-btn landing-btn-secondary">Sign In</Link>
          </div>
          <div className="landing-trust-strip">
            <span>Live fare intelligence</span>
            <span>Verified profiles</span>
            <span>Transparent booking flow</span>
          </div>
        </div>
        <div className="landing-hero-visual" aria-hidden>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb orb-three" />
          <div className="visual-card visual-card-main">
            <p>Delhi to Noida</p>
            <strong>$13.40 / seat</strong>
            <span>Suggested fare is 8% lower</span>
          </div>
          <div className="visual-card visual-card-mini">2 seats left</div>
        </div>
      </section>

      <section className="landing-metrics page">
        <article>
          <h3>50K+</h3>
          <p>Trips coordinated</p>
        </article>
        <article>
          <h3>4.8/5</h3>
          <p>User trust rating</p>
        </article>
        <article>
          <h3>22%</h3>
          <p>Average fare savings</p>
        </article>
      </section>

      <section className="landing-features page">
        <article className="feature-card">
          <h4>Smart fare suggestions</h4>
          <p>Compare listed vs platform-recommended fare before you book.</p>
        </article>
        <article className="feature-card">
          <h4>Negotiation timeline</h4>
          <p>Bid, counter, and confirm with full booking status visibility.</p>
        </article>
        <article className="feature-card">
          <h4>Designed for real commutes</h4>
          <p>Fast route filters, clean ride cards, and details in one modal flow.</p>
        </article>
      </section>
    </div>
  )
}