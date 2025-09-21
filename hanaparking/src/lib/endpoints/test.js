import axios from "axios";

const URL = "http://backend.hanaparkingcop.com/api/v1/diagnostics/redis";

export async function fetchDiagnosticsRedis() {
  const res = await axios.get(URL, { withCredentials: false });
  return res.data; // { ok, roundtrip: {...}, provider, notes }
}
