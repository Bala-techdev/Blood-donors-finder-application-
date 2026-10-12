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
        main._model = StubModel()
        main._model_version = "test-model"
        for key in main._monitoring:
            main._monitoring[key] = 0

    def tearDown(self):
        main._model = None

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

    def test_missing_model_returns_service_unavailable(self):
        main._model = None
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(main, "MODEL_PATH", Path(directory) / "missing.joblib"):
                with self.assertRaises(main.HTTPException) as error:
                    main.predict(main.DonorPrediction(**VALID_INPUT))
        self.assertEqual(error.exception.status_code, 503)

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


if __name__ == "__main__":
    unittest.main()
