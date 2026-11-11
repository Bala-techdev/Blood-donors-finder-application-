import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np

import main


class StubModel:
    def predict_proba(self, features):
        self.features = features
        return np.array([[0.25, 0.75]])


VALID_INPUT = {
    "blood_compatible": 1,
    "distance_km": 4.2,
    "available": 1,
    "eligible": 1,
    "verified": 0,
    "total_donations": 2,
    "previous_recommendations": 3,
    "previous_acceptances": 2,
    "previous_declines": 1,
    "response_rate": 1.0,
    "acceptance_rate": 0.667,
    "urgency_score": 75.0,
}


class PredictionApiTests(unittest.TestCase):
    def setUp(self):
        main._response_model = StubModel()
        main._response_model_version = "test-model"
        for key in main._monitoring:
            main._monitoring[key] = 0

    def tearDown(self):
        main._response_model = None

    def test_valid_prediction_returns_versioned_status(self):
        result = main.predict(main.DonorPrediction(**VALID_INPUT))
        self.assertEqual(result["response_probability"], 0.75)
        self.assertEqual(result["model_version"], "test-model")
        self.assertEqual(result["prediction_status"], "MODEL_PREDICTED")

    def test_invalid_input_is_rejected(self):
        with self.assertRaises(ValueError):
            main.DonorPrediction(**{**VALID_INPUT, "distance_km": -1})

    def test_missing_feature_is_rejected(self):
        incomplete = dict(VALID_INPUT)
        del incomplete["acceptance_rate"]
        with self.assertRaises(ValueError):
            main.DonorPrediction(**incomplete)

    def test_missing_model_returns_rule_based_fallback(self):
        """When the model file is missing, /predict returns a rule-based
        fallback instead of raising a 503 error."""
        main._response_model = None
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(main, "RESPONSE_MODEL_PATH",
                              Path(directory) / "missing.joblib"):
                result = main.predict(main.DonorPrediction(**VALID_INPUT))
        self.assertEqual(result["prediction_status"], "RULE_BASED_FALLBACK")
        self.assertIn("response_probability", result)
        self.assertGreater(result["response_probability"], 0)
        self.assertLessEqual(result["response_probability"], 1.0)

    def test_monitoring_reports_live_counts_without_live_accuracy(self):
        main.predict(main.DonorPrediction(**VALID_INPUT))
        with patch.object(main, "MONITORING_TOKEN", "test-token"):
            result = main.monitoring("test-token")
        self.assertEqual(result["prediction_requests"], 1)
        self.assertEqual(result["successful_predictions"], 1)
        self.assertIsNone(result["evaluation_metrics"])
        self.assertIn("ground-truth", result["evaluation_notice"])

    def test_monitoring_requires_authorization(self):
        with self.assertRaises(main.HTTPException) as error:
            main.monitoring(None)
        self.assertEqual(error.exception.status_code, 401)


class ReliabilityApiTests(unittest.TestCase):
    def test_new_donor_returns_neutral_score(self):
        result = main.predict_reliability(main.ReliabilityRequest(
            donor_id=1,
            total_recommendations=0,
        ))
        self.assertEqual(result["reliability_level"], "NEW")
        self.assertEqual(result["reliability_score"], 50.0)
        self.assertEqual(result["prediction_status"], "RULE_BASED_FALLBACK")

    def test_experienced_donor_returns_high_score(self):
        result = main.predict_reliability(main.ReliabilityRequest(
            donor_id=2,
            total_recommendations=10,
            responded_count=9,
            accepted_count=8,
            declined_count=1,
            total_donations=5,
            verified=1,
            response_rate=90.0,
            acceptance_rate=88.9,
        ))
        self.assertEqual(result["reliability_level"], "HIGH")
        self.assertGreaterEqual(result["reliability_score"], 80.0)


class ShortageApiTests(unittest.TestCase):
    def test_high_risk_when_no_donors(self):
        result = main.predict_shortage(main.ShortageRequest(
            blood_group="O-",
            unresolved_requests=3,
            available_donors=0,
        ))
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertEqual(result["prediction_status"], "RULE_BASED_FALLBACK")

    def test_low_risk_when_ample_donors(self):
        result = main.predict_shortage(main.ShortageRequest(
            blood_group="A+",
            unresolved_requests=1,
            available_donors=10,
            recent_requests=1,
        ))
        self.assertEqual(result["risk_level"], "LOW")


class ResponseTimeApiTests(unittest.TestCase):
    def test_returns_reasonable_estimate(self):
        result = main.predict_response_time(main.ResponseTimeRequest(
            donor_id=1,
            distance_km=5.0,
            urgency_score=80.0,
            total_donations=3,
            response_rate=0.8,
            verified=1,
        ))
        self.assertIn("estimated_response_minutes", result)
        self.assertGreater(result["estimated_response_minutes"], 0)
        self.assertLess(result["estimated_response_minutes"], 480)
        self.assertEqual(result["prediction_status"], "RULE_BASED_FALLBACK")


class OutreachApiTests(unittest.TestCase):
    def test_urgent_request_gets_expanded_strategy(self):
        result = main.optimize_outreach(main.OutreachRequest(
            request_id=1,
            blood_group="O+",
            urgency="URGENT",
            remaining_units=2,
            candidate_count=1,
            avg_response_probability=60.0,
        ))
        self.assertEqual(result["strategy"], "EXPANDED")
        self.assertEqual(result["prediction_status"], "RULE_BASED_FALLBACK")
        self.assertGreater(result["additional_donors_recommended"], 0)

    def test_normal_request_gets_standard_strategy(self):
        result = main.optimize_outreach(main.OutreachRequest(
            request_id=2,
            blood_group="A+",
            urgency="NORMAL",
            remaining_units=1,
            candidate_count=3,
            avg_response_probability=70.0,
        ))
        self.assertEqual(result["strategy"], "STANDARD")


if __name__ == "__main__":
    unittest.main()
