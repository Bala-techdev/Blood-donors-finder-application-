"""Reproducible evaluation report for the current SmartBlood ML artifacts.

This evaluates only the response classifier. Response-time and demand
forecasting are deliberately reported as unsupported when their required
historical fields are absent.
"""

from pathlib import Path

import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split


DATA_PATH = Path("data/donor_response_dataset.csv")
RANDOM_STATE = 42
TEST_SIZE = 0.2
TARGET = "responded"
FEATURES = [
    "blood_compatible",
    "distance_km",
    "available",
    "eligible",
    "verified",
    "total_donations",
    "previous_recommendations",
    "previous_acceptances",
    "previous_declines",
    "response_rate",
    "acceptance_rate",
    "urgency_score",
]


def evaluate_response_classifier():
    data = pd.read_csv(DATA_PATH)
    missing = set(FEATURES + [TARGET]).difference(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if data[FEATURES].isnull().any().any():
        raise ValueError("Prediction features contain missing values.")

    leakage_columns = {
        column for column in data.columns
        if column in {"responded", "responded_at", "response_time_minutes"}
    } - {TARGET}
    if leakage_columns:
        raise ValueError(f"Target leakage columns present: {sorted(leakage_columns)}")

    X = data[FEATURES]
    y = data[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    model = CalibratedClassifierCV(
        RandomForestClassifier(
            n_estimators=100,
            random_state=RANDOM_STATE,
            class_weight="balanced_subsample",
            min_samples_leaf=5,
        ),
        method="sigmoid",
        cv=3,
    )
    model.fit(X_train, y_train)
    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    majority = y_train.mode().iloc[0]
    baseline_predictions = [majority] * len(y_test)

    return {
        "rows": len(data),
        "training_rows": len(X_train),
        "evaluation_rows": len(X_test),
        "positive_rows": int(y.sum()),
        "negative_rows": int((y == 0).sum()),
        "features": FEATURES,
        "baseline": {
            "type": "majority class",
            "accuracy": accuracy_score(y_test, baseline_predictions),
            "f1": f1_score(y_test, baseline_predictions, zero_division=0),
        },
        "model": {
            "version": "response-rf-calibrated-v1",
            "precision": precision_score(y_test, predictions, zero_division=0),
            "recall": recall_score(y_test, predictions, zero_division=0),
            "f1": f1_score(y_test, predictions, zero_division=0),
            "roc_auc": roc_auc_score(y_test, probabilities),
            "brier_score": brier_score_loss(y_test, probabilities),
        },
    }


def main():
    report = evaluate_response_classifier()
    print("SmartBlood ML evaluation")
    print("========================")
    print(f"Dataset rows: {report['rows']}")
    print(f"Training rows: {report['training_rows']}")
    print(f"Evaluation rows: {report['evaluation_rows']}")
    print(f"Positive labels: {report['positive_rows']}")
    print(f"Negative labels: {report['negative_rows']}")
    print("Split: stratified 80/20 holdout, random_state=42")
    print(f"Features: {', '.join(report['features'])}")
    print("Baseline (majority class):")
    for name, value in report["baseline"].items():
        if name != "type":
            print(f"  {name}: {value:.4f}")
    print("Calibrated Random Forest:")
    for name, value in report["model"].items():
        if name != "version":
            print(f"  {name}: {value:.4f}")
    print("NOTE: all response results are synthetic-data demonstration results.")
    print("Response-time model: NOT EVALUABLE; timestamp/censoring fields are absent.")
    print("Demand forecast model: NOT EVALUABLE from ML data; no request history export is bundled.")


if __name__ == "__main__":
    main()
