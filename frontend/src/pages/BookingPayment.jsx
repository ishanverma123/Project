import { Link, useParams } from 'react-router-dom'

export default function BookingPayment() {
  const { id } = useParams()

  return (
    <div className="page booking-page">
      <h1>Booking & Payment</h1>
      <p className="booking-context">Booking for property ID: {id}</p>
      <section className="booking-flow">
        <div className="block">Booking Form</div>
        <div className="block">Price Summary</div>
        <div className="block">Payment Method</div>
        <button type="button" className="button primary">Confirm Booking</button>
      </section>
      <p className="nav-hint">
        After confirming, you&apos;ll see it in your <Link to="/dashboard">User Dashboard</Link>.
      </p>
    </div>
  )
}
