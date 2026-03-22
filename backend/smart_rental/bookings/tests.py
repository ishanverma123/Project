from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property
from rental_core_engine.pricing_engine import PricingEngine


User = get_user_model()


class PricingEngineTests(APITestCase):
	def test_suggest_price_returns_breakdown(self):
		engine = PricingEngine()
		suggestion = engine.suggest_price_per_seat(
			listed_price_per_seat=120,
			departure_time=timezone.now(),
			seats_left=1,
			max_passengers=4,
			distance_km=15,
			duration_min=30,
		)

		self.assertIn('suggested_price_per_seat', suggestion)
		self.assertIn('breakdown', suggestion)
		self.assertGreater(suggestion['suggested_price_per_seat'], 0)
		self.assertIn('total', suggestion['breakdown'])


class BookingNegotiationFlowTests(APITestCase):
	def setUp(self):
		self.driver = User.objects.create_user(
			username='driver1',
			password='DriverPass123!',
			role='driver',
			email='driver1@example.com',
		)
		self.traveller = User.objects.create_user(
			username='traveller1',
			password='TravellerPass123!',
			role='traveller',
			email='traveller1@example.com',
		)
		self.ride = Property.objects.create(
			driver=self.driver,
			title='Morning commute',
			description='Daily office route',
			from_city='City A',
			to_city='City B',
			departure_time=timezone.now() + timedelta(days=1),
			price_per_seat='120.00',
			max_passengers=3,
		)

	def test_negotiation_counter_and_accept_flow(self):
		self.client.force_authenticate(self.traveller)
		create_resp = self.client.post(
			'/api/bookings/',
			{
				'property': self.ride.id,
				'passenger_count': 1,
				'requested_bid_per_seat': '100.00',
			},
			format='json',
		)
		self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
		booking_id = create_resp.data['id']

		self.client.force_authenticate(self.driver)
		counter_resp = self.client.patch(
			f'/api/bookings/{booking_id}/',
			{
				'status': 'countered',
				'driver_counter_offer_per_seat': '110.00',
			},
			format='json',
		)
		self.assertEqual(counter_resp.status_code, status.HTTP_200_OK)
		self.assertEqual(counter_resp.data['status'], 'countered')

		self.client.force_authenticate(self.traveller)
		accept_resp = self.client.patch(
			f'/api/bookings/{booking_id}/',
			{'status': 'approved'},
			format='json',
		)
		self.assertEqual(accept_resp.status_code, status.HTTP_200_OK)
		self.assertEqual(accept_resp.data['status'], 'approved')
		self.assertEqual(str(accept_resp.data['requested_bid_per_seat']), '110.00')

		list_resp = self.client.get('/api/bookings/')
		self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
		self.assertTrue(len(list_resp.data) > 0)
		events = list_resp.data[0]['negotiation_events']
		self.assertGreaterEqual(len(events), 3)
		event_types = [event['event_type'] for event in events]
		self.assertIn('booking_requested', event_types)
		self.assertIn('driver_countered', event_types)
		self.assertIn('traveller_accepted_counter', event_types)
