# Load Testing

This project uses `k6` for backend load testing.

Run against an already-started API:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/load/run-load-test.ps1 -BaseUrl http://localhost:3001
```

Run and let the script build/start `dist/main`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/load/run-load-test.ps1 -StartServer
```

The load profile ramps from 0 to 100 virtual users over 30 seconds, holds 100 users for 2 minutes, then ramps down to 0 over 15 seconds. The runner writes k6 latency/throughput/error summaries plus sampled Node CPU and memory metrics into this directory.

By default the load test focuses on read-heavy and non-destructive operations. Set `-IncludeWrites` only for disposable environments because it creates test projects and roles.
