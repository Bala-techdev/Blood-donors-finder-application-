# Response-time estimation readiness

## Current decision

SmartBlood does not currently produce a response-time estimate. The available
training dataset contains donor/request features and the final `responded`
label, but no timestamps. It has no `recommended_at`, `responded_at`,
`response_status`, or `observation_end_at` fields.

The database entity does contain `recommendedAt` and `respondedAt`. However,
those fields are not present in the exported training data, and a missing
`respondedAt` means that a response was not observed, not that the response
took zero minutes.

The ML service therefore exposes `GET /response-time/status`, which returns
`DATA_INSUFFICIENT` instead of an estimate.

## Target definition

If implemented in the future, response time should mean:

> Elapsed minutes from the invitation's persisted `recommendedAt` timestamp
> until the donor records an `ACCEPTED` or `DECLINED` response at
> `respondedAt`.

This is not donor travel time, time until blood reaches a patient, time to
fulfillment, or medical clearance.

## Suitable future approach

The application should first export one row per invitation containing:

- `recommended_at`
- `responded_at`, nullable
- `response_status`
- `observation_end_at` (for example, request closure or a fixed follow-up
  horizon)
- prediction-time features only, such as availability, distance, urgency, and
  historical response summaries calculated before `recommended_at`

For observed responses, a regression model could be evaluated with a
chronological holdout and MAE/median absolute error. Because pending and
nonresponding invitations are right-censored, a survival or time-to-event
model is preferable when enough real observations exist. Evaluation must
separate earlier invitations from later invitations and must never use
`responded_at` or derived response duration as an input feature.

No response-time accuracy or production readiness is claimed from the current
synthetic response-classification dataset.
