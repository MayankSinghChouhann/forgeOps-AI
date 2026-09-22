# k6 production-readiness test

The test creates 500 concurrent virtual users: 450 exercise the cached dashboard
endpoint and 50 exercise shell safety analysis. Its thresholds enforce p95 below
2 seconds for non-AI traffic and below 8 seconds for AI-backed traffic.

Run only against an environment you own and have sized for the test. AI requests
can incur provider cost and quota consumption.

```bash
BASE_URL=https://staging.example.com \
TEST_EMAIL=loadtest@example.com \
TEST_PASSWORD='<secret>' \
k6 run tests/load/forgeops.js
```

Use `DURATION=30s` for a short smoke run. A passing result is environment-specific
evidence; committing this script does not claim that production has already met
the thresholds.
