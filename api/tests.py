from django.test import TestCase

class BasicTestCase(TestCase):
	def test_basic(self):
		"""Basic test to ensure test runner works."""
		self.assertEqual(1 + 1, 2)
