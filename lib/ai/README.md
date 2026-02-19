# AI Hooks Roadmap

## Planned interfaces
- `GET analytics/features?range=30d` -> normalized vector payload for scoring models.
- `POST ai/discipline-forecast` -> projected discipline score trajectory.
- `POST ai/relapse-risk` -> risk classification + intervention suggestions.

## TODO markers
- `lib/engines/analyticsEngine.ts`: add prediction feature vector export.
- `lib/engines/relapseEngine.ts`: expose model-friendly feature map.
- Add signed request policy once external model endpoints are introduced.
