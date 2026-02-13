import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:8000";

export let options = {
  stages: [
    { duration: "1m", target: 50 }, // ramp up to 50 users
    { duration: "3m", target: 50 }, // hold at 50
    { duration: "1m", target: 100 }, // ramp to 100 users
    { duration: "3m", target: 100 }, // hold at 100
    { duration: "1m", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // loosen for test
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Test GET /databases
  let res = http.get("http://localhost:8000/api/databases");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test health endpoint
  res = http.get("http://localhost:8000/");
  check(res, {
    "health check OK": (r) => r.status === 200,
  });

  sleep(1);
}
