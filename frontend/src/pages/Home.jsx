import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page home-page">
      <h1>Home / Property Listings</h1>
      <section className="listings-toolbar">
        <div className="search-filters">Search & Filters</div>
        <div className="sort-options">Sort Options</div>
      </section>
      <section className="property-cards">
        <div className="property-card placeholder">
          <p>Property Card</p>
          <div className="card-actions">
            <button type="button">View Details</button>
            <button type="button" aria-label="Add to favorites">♥ Favorites</button>
          </div>
        </div>
        <div className="property-card placeholder">
          <p>Property Card</p>
          <div className="card-actions">
            <Link to="/property/1">View Details</Link>
            <button type="button" aria-label="Add to favorites">♥ Favorites</button>
          </div>
        </div>
      </section>
      <p className="nav-hint">
        Use &quot;View Details&quot; to go to <Link to="/property/1">Property Detail Page</Link>.
      </p>
    </div>
  )
}
