import { Link, useParams } from 'react-router-dom'

export default function PropertyDetail() {
  const { id } = useParams()

  return (
    <div className="page property-detail-page">
      <h1>Property Detail</h1>
      <p className="property-id">Property ID: {id}</p>
      <section className="property-content">
        <div className="block">Property Info</div>
        <div className="block">Photo Gallery</div>
        <div className="block">
          Availability Calendar — Check Dates
        </div>
        <div className="block">Reviews & Ratings — Leave Review</div>
      </section>
      <div className="cta">
        <Link to={`/booking/${id}`} className="button primary">Book Now</Link>
      </div>
      <p className="nav-hint">
        &quot;Book Now&quot; leads to <Link to={`/booking/${id}`}>Booking & Payment</Link>.
      </p>
    </div>
  )
}
