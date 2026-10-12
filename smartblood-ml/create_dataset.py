import os
import numpy as np
import pandas as pd

np.random.seed(42)

ROWS = 2000

data = []

for _ in range(ROWS):

    blood_compatible = np.random.choice([0, 1], p=[0.25, 0.75])

    distance_km = round(
        np.random.exponential(scale=8),
        2
    )
    distance_km = min(distance_km, 50)

    available = np.random.choice([0, 1], p=[0.15, 0.85])

    eligible = np.random.choice([0, 1], p=[0.10, 0.90])

    verified = np.random.choice([0, 1], p=[0.20, 0.80])

    total_donations = np.random.poisson(5)
    total_donations = min(total_donations, 30)

    previous_recommendations = np.random.poisson(4)
    previous_recommendations = min(previous_recommendations, 30)

    previous_acceptances = min(
        previous_recommendations,
        np.random.binomial(
            previous_recommendations,
            0.65
        )
    )

    remaining = (
        previous_recommendations
        - previous_acceptances
    )

    previous_declines = np.random.binomial(
        remaining,
        0.65
    )

    if previous_recommendations > 0:
        response_rate = (
            previous_acceptances + previous_declines
        ) / previous_recommendations
    else:
        response_rate = 0.0

    if previous_acceptances + previous_declines > 0:
        acceptance_rate = (
            previous_acceptances
            / (previous_acceptances + previous_declines)
        )
    else:
        acceptance_rate = 0.0

    urgency_score = round(
        np.random.uniform(0, 100),
        2
    )

    # --------------------------------------------------
    # Generate response probability
    # --------------------------------------------------

    score = (
        1.5 * blood_compatible
        + 1.2 * available
        + 1.0 * eligible
        + 0.8 * verified
        + 0.5 * acceptance_rate
        + 0.3 * response_rate
        + 0.15 * urgency_score
        + 0.04 * total_donations
        - 0.06 * distance_km
    )

    # Convert score to probability
    probability = 1 / (1 + np.exp(-(
        score - 2.5
    )))

    responded = np.random.binomial(
        1,
        probability
    )

    data.append({
        "blood_compatible": blood_compatible,
        "distance_km": distance_km,
        "available": available,
        "eligible": eligible,
        "verified": verified,
        "total_donations": total_donations,
        "previous_recommendations": previous_recommendations,
        "previous_acceptances": previous_acceptances,
        "previous_declines": previous_declines,
        "response_rate": round(response_rate, 4),
        "acceptance_rate": round(acceptance_rate, 4),
        "urgency_score": urgency_score,
        "responded": responded
    })


df = pd.DataFrame(data)

os.makedirs("data", exist_ok=True)

output_file = "data/donor_response_dataset.csv"

df.to_csv(
    output_file,
    index=False
)

print("======================================")
print("SmartBlood Training Dataset Created")
print("======================================")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print(f"Saved: {output_file}")
print()
print(df.head())
print()
print("Response distribution:")
print(df["responded"].value_counts())
