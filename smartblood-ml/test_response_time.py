import unittest

import main


class ResponseTimeReadinessTests(unittest.TestCase):
    def test_response_time_estimate_is_not_claimed_without_historical_data(self):
        result = main.response_time_status()

        self.assertEqual(result["status"], "DATA_INSUFFICIENT")
        self.assertFalse(result["estimate_available"])
        self.assertIn("recommendedAt", result["definition"])
        self.assertIn("respondedAt", result["definition"])
        self.assertIn(
            "Nonresponding donors cannot be treated as zero-minute responses.",
            result["reason"],
        )

    def test_response_time_is_distinguished_from_travel_and_fulfillment(self):
        result = main.response_time_status()

        self.assertIn("donor travel time", result["not_a_measure_of"])
        self.assertIn("time until blood reaches a patient", result["not_a_measure_of"])


if __name__ == "__main__":
    unittest.main()
