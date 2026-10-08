import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier


# Load dataset
df = pd.read_csv("data/donor_response_dataset.csv")

# Input features
X = df.drop(columns=["responded"])

# Target
y = df["responded"]


# Create Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    class_weight="balanced"
)


# Train model
model.fit(X, y)


# Save trained model
joblib.dump(
    model,
    "models/response_model.joblib"
)


print("===================================")
print("SmartBlood ML Model Trained!")
print("===================================")
print("Saved: models/response_model.joblib")