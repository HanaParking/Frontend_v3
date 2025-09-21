import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // ← 여기!
  withCredentials: false, // 쿠키 인증 쓰면 true
});
