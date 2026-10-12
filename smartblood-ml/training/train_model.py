import pandas as pd
import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from pathlib import Path


# Load dataset
DATA_PATH = Path("data/donor_response_dataset.csv")
MODEL_PATH = Path("models/response_model.joblib")
MODEL_VERSION = "response-rf-calibrated-v1"

df = pd.read_csv(DATA_PATH)
required_columns = {
    "blood_compatible", "distance_km", "available", "eligible", "verified",
    "total_donations", "previous_recommendations", "previous_acceptances",
    "previous_declines", "response_rate", "acceptance_rate", "urgency_score",
    "responded",
}
missing = required_columns.difference(df.columns)
if missing:
    raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")

# Input features
X = df.drop(columns=["responded"])

# Target
y = df["responded"]

if y.nunique() < 2 or y.value_counts().min() < 3:
    raise ValueError("At least three examples of each response outcome are required.")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)


# Create Random Forest model
base_model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced_subsample",
    min_samples_leaf=5,
)

model = CalibratedClassifierCV(base_model, method="sigmoid", cv=3)
model.fit(X_train, y_train)

probabilities = model.predict_proba(X_test)[:, 1]
predictions = (probabilities >= 0.5).astype(int)
metrics = {
    "precision": precision_score(y_test, predictions, zero_division=0),
    "recall": recall_score(y_test, predictions, zero_division=0),
    "f1": f1_score(y_test, predictions, zero_division=0),
    "roc_auc": roc_auc_score(y_test, probabilities),
    "brier_score": brier_score_loss(y_test, probabilities),
}

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(
    {
        "model": model,
        "model_version": MODEL_VERSION,
        "feature_names": list(X.columns),
        "training_data": str(DATA_PATH),
        "evaluation": metrics,
    },
    MODEL_PATH,
)


print("===================================")
print("SmartBlood ML Model Trained!")
print("===================================")
print(f"Saved: {MODEL_PATH}")
print(f"Model version: {MODEL_VERSION}")
print("Evaluation (stratified 80/20 holdout):")
for name, value in metrics.items():
    print(f"{name}: {value:.4f}")
print("NOTE: the bundled dataset is synthetic demonstration data, not production evidence.")