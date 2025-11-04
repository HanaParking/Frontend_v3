import "../styles/HomeStyle.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const goToMap = () => {
    navigate("/map");
  };

  const [responseData, setResponseData] = useState([]); // 배열

  // 각 주차장별 상태 조회
  const getStatusColor = (available, capacity) => {
    if (!capacity) return "gray";
    const ratio = (available / capacity) * 100;
    if (ratio >= 60) return "green";
    if (ratio >= 30) return "yellow";
    return "red";
  };

  // 주차장 목록조회
  useEffect(() => {
    getParkingLotsInfo();
  }, []);

  const getParkingLotsInfo = async () => {
    try {
      const response = await fetch(
        "http://98.81.145.104:8000/api/v1/lot"
      );
      const data = await response.json();

      // [{ lotCode, lotName, statusCd }, ...] 형태로 변환
      const formatted = data.map((lot) => ({
        lotCode: lot.lotCode,
        lotName: lot.lotName,
        statusCd: lot.statusCd,
        capacity: 0,
        available: 0,
      }));

      setResponseData(formatted);
    } catch (error) {
      console.error("Error fetching parking lot data:", error);
    }
  };

  // ✅ Redis Pub/Sub 기반 SSE 연결
  useEffect(() => {
    const eventSource = new EventSource(
      "http://98.81.145.104:8000/api/v1/redis/detail/subscribe"
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const positions = data.positions || [];
        const carExists = data.carExists || [];

        // 총 자리(capacity)
        let capacity = 0;
        positions.forEach((row) => {
          capacity += row.filter((p) => p === 1).length;
        });

        // 남은 자리(available)
        let available = 0;
        positions.forEach((row, i) => {
          row.forEach((p, j) => {
            if (p === 1 && carExists[i] && carExists[i][j] === false) {
              available++;
            }
          });
        });

        setResponseData((prev) => {
          if (prev.length === 0) return prev; //데이터 없을 경우
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            capacity,
            available,
          };
          return updated;
        });

        console.log("🔄 SSE 데이터 업데이트됨:", { capacity, available });
      } catch (err) {
        console.error("JSON 파싱 오류:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("⚠️ SSE 연결 오류, 재연결 시도 중...");
      eventSource.close();
      setTimeout(() => window.location.reload(), 3000);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="header-title">실시간 주차현황</h1>
      </header>

      <div className="content-container">
        <h2 className="section-title">청라데이터센터</h2>

        {responseData.length === 0 ? (
          <p>주차장 정보를 불러오는 중...</p>
        ) : (
          responseData.map((lot, index) => {
            const status = getStatusColor(lot.available, lot.capacity);
            return (
              <div
                className={`status-card ${status}`}
                onClick={goToMap}
                key={lot.lotCode || index}
                style={{ cursor: "pointer" }}
              >
                <div className="status-left">
                  <div className={`status-dot ${status}`} />
                  <span>{lot.lotName}</span>
                </div>
                <div className={`status-right ${status}-text`}>
                  {lot.available} / {lot.capacity}
                </div>
              </div>
            );
          })
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

export default Home;