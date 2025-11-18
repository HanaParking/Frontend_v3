import "../styles/ReportStyle.css";
import "../styles/HomeStyle.css";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";

function CommuteReportPage() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  // ⭐ 리포트 데이터 상태값
  const [summary, setSummary] = useState(null);
  const [hourlyDetail, setHourlyDetail] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ AI 리포트 요약 상태값
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const API_BASE = "http://98.81.145.104:8000/api/v1/report";

  // ⭐ 날짜 기본값 (어제)
  const getYesterday = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // ⭐ 점유율 formatting 함수
  const formatRate = (v) => {
    if (v === null || v === undefined || v === "") return "-";
    const num = Number(v);
    const rate = num <= 1 ? num * 100 : num;
    return rate.toFixed(2);
  };

  const [selectedDate, setSelectedDate] = useState(getYesterday());
  const [lotCode, setLotCode] = useState("A1");
  const [period, setPeriod] = useState("morning"); // 'morning' | 'evening'

  // ⭐ GPT 리포트 요약 호출 함수
  const fetchAiSummary = async (todayData, yesterdaySummary) => {
    try {
      setAiLoading(true);
      setAiError(null);

      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today: todayData,
          yesterday: yesterdaySummary,
        }),
      });

      if (!res.ok) {
        console.error("AI 분석 API 에러:", res.status);
        setAiError("AI 분석을 불러오지 못했습니다.");
        setAiSummary("");
        return;
      }

      const data = await res.json();
      setAiSummary(data.analysis ?? "");
    } catch (err) {
      console.error("AI 분석 호출 오류:", err);
      setAiError("AI 분석을 불러오는 중 오류가 발생했습니다.");
      setAiSummary("");
    } finally {
      setAiLoading(false);
    }
  };

  // ⭐ 리포트 데이터 조회 함수
  const fetchReportData = async () => {
    setLoading(true);
    setAiSummary("");
    setAiError(null);

    try {
      // 🔹 공통 쿼리스트링
      const query = new URLSearchParams({
        date: selectedDate,
        lot_code: lotCode,
        period: period,
      }).toString();

      // ✅ 요약 정보
      const summaryRes = await fetch(`${API_BASE}/summary?${query}`);
      // ✅ 상세 테이블 (시간대별 데이터)
      const detailRes = await fetch(`${API_BASE}/detail?${query}`);

      let summaryData = null;
      let normalized = [];

      // --- summary 처리 ---
      if (!summaryRes.ok) {
        console.error("summary API error:", summaryRes.status);
        setSummary(null);
      } else {
        const s = await summaryRes.json();
        summaryData = s;
        setSummary(s);
      }

      // --- detail 처리 ---
      if (!detailRes.ok) {
        console.error("detail API error:", detailRes.status);
        setHourlyDetail([]);
      } else {
        const detailData = await detailRes.json();

        // 백엔드 SQL에서:
        //  time_slot, occupied, capacity, occupancy_rate, congestion_level
        // 프론트에서 쓰기 편하게 한 번 normalize
        normalized = detailData.map((row) => ({
          time_label: row.time_label ?? row.time_slot,
          occupied: row.occupied,
          capacity: row.capacity,
          rate: row.rate ?? row.occupancy_rate,
          congestion: row.congestion ?? row.congestion_level,
        }));

        setHourlyDetail(normalized);
      }

      // ✅ 요약 & 상세 데이터가 있으면 → AI 분석 호출
      if (summaryData && normalized.length > 0) {
        fetchAiSummary(normalized, summaryData);
      }
    } catch (err) {
      console.error("리포트 조회 오류:", err);
      setSummary(null);
      setHourlyDetail([]);
    }

    setLoading(false);
  };

  // ⭐ 필터 변경 시마다 자동 재조회
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, lotCode, period]);

  return (
    <div className="home-container">
      {/* 헤더 */}
      <header className="home-header">
        <div className="header-left">
          <div className="header-icon" onClick={() => setShowMenu(!showMenu)}>
            ☰
          </div>

          {showMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate("/")}>
                메인페이지
              </div>
              <div className="dropdown-item" onClick={() => navigate("/report")}>
                출퇴근리포트
              </div>
            </div>
          )}
        </div>

        <h1 className="header-title">출퇴근 리포트</h1>
      </header>

      <div className="content-container">
        <h2 className="section-title">청라데이터센터</h2>
        <p className="section-subtext">출퇴근 혼잡 분석 리포트</p>

        {/* 필터 */}
        <section className="report-filters">
          <div className="filter-group">
            <label>날짜</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>주차장</label>
            <select
              value={lotCode}
              onChange={(e) => setLotCode(e.target.value)}
            >
              <option value="A1">옥외주차장</option>
              <option value="A2">옥외주차장2(농구장)</option>
              <option value="B1">지하주차장</option>
            </select>
          </div>

          <div className="filter-group">
            <label>구간</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="morning">출근 시간 (08:00 ~ 09:00)</option>
              <option value="evening">퇴근 시간 (17:00 ~ 19:00)</option>
            </select>
          </div>
        </section>

        {/* 로딩 표시 */}
        {loading && <p>데이터 불러오는 중...</p>}

        {/* 요약 카드 */}
        {!loading && summary && (
          <section className="report-summary">
            <div className="summary-card">
              <div className="summary-label">최대 점유율</div>
              <div className="summary-value">
                {formatRate(summary.max_rate)}%
              </div>
              <div className="summary-desc">
                {summary.max_time ?? summary.peak_time}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">평균 점유율</div>
              <div className="summary-value">
                {formatRate(summary.avg_rate)}%
              </div>
              <div className="summary-desc">선택 구간 기준</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">최소 남은 자리</div>
              <div className="summary-value">
                {summary.min_available ?? "-"}대
              </div>
              <div className="summary-desc">
                {summary.min_time ?? "시간 정보 없음"}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">가장 한가했던 날</div>
              <div className="summary-value">
                {summary.least_congested_day ?? "-"}
              </div>
              <div className="summary-desc">지난 7일(영업일) 기준</div>
            </div>
          </section>
        )}

{/* ⭐⭐ AI 리포트 요약 섹션 – 카드 스타일로 변경 */}
{!loading && summary && (
  <section className="report-ai-summary">
    <h2 className="section-title">AI 출퇴근 리포트 요약</h2>
    <p className="section-subtext">
      어제 패턴과 오늘 데이터를 기반으로 AI가 추천하는 주차 전략입니다.
    </p>

    <div className="report-summary ai-summary-wrapper">
      <div className="summary-card ai-summary-card">
        <div className="summary-label">AI 추천 오늘의 주차 전략</div>

        {aiLoading && (
          <div className="summary-desc">
            AI가 리포트를 분석 중입니다...
          </div>
        )}

        {aiError && (
          <div className="summary-desc" style={{ color: "red" }}>
            {aiError}
          </div>
        )}

        {!aiLoading && !aiError && aiSummary && (
          <div className="summary-desc ai-summary-text">
            {aiSummary.split("\n").map((line, idx) => (
              <p key={idx} style={{ margin: "6px 0" }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {!aiLoading && !aiError && !aiSummary && (
          <div className="summary-desc ai-summary-text" style={{ color: "#888" }}>
            아직 AI 리포트를 불러오지 못했습니다.
          </div>
        )}
      </div>
    </div>
  </section>
)}


        {/* 차트 섹션 */}
        <section className="report-chart-section">
          <h2 className="section-title">시간대별 점유율</h2>

          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={hourlyDetail}>
                <defs>
                  <linearGradient
                    id="colorRate"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 상세 테이블 */}
        {!loading && (
          <section className="report-table-section">
  <h2 className="section-title">상세 출퇴근 현황</h2>

  <div className="table-scroll-wrapper">
    <table className="report-table">
              <thead>
                <tr>
                  <th>시간대</th>
                  <th>점유 차량 수</th>
                  <th>전체 자리</th>
                  <th>점유율</th>
                  <th>혼잡도</th>
                </tr>
              </thead>
              <tbody>
                {hourlyDetail.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.time_label}</td>
                    <td>{row.occupied}</td>
                    <td>{row.capacity}</td>
                    <td>{row.rate}%</td>
                    <td>{row.congestion}</td>
                  </tr>
                ))}
                {hourlyDetail.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
             </table>
  </div>
</section>
        )}
      </div>

      <footer className="footer">
        <p>
          made by <strong>슬기로운 주차생활</strong>
        </p>
      </footer>
    </div>
  );
}

export default CommuteReportPage;
