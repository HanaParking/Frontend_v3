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
  const getStatusColor = (occupied, capacity) => {
    if (!capacity) return "gray";
    const ratio = (occupied / capacity) * 100;
    if (ratio < 70) return "green";
    if (ratio < 30) return "yellow";
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

      const formatted = data.map((lot) => ({
        lotCode: lot.lot_code,
        lotName: lot.lot_name,
        statusCd: lot.status_cd,
        capacity: 0,
        occupied: 0
      }));

      setResponseData(formatted);
    } catch (error) {
      console.error("Error fetching parking lot data:", error);
    }
  };

  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource(
        "http://98.81.145.104:8000/api/v1/redis/detail/subscribe"
      );
  
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const positions = data.positions || [];
          const carExists = data.carExists || [];
  
          let capacity = 0;
          positions.forEach((row) => {
            capacity += row.filter((p) => p === 1).length;
          });
  
          let occupied = 0;
          positions.forEach((row, i) => {
            row.forEach((p, j) => {
              if (p === 1 && carExists[i] && carExists[i][j] === true) {
                occupied++;
              }// 주차 가능 구역이면서 주차가 되어있는 수
            });
          });
  
          // capacity, occupied만 업데이트
          setResponseData((prev) =>
            prev.map((lot, idx) =>
              idx === 0
                ? { ...lot, capacity, occupied }
                : lot
            )
          );
        } catch (err) {
          console.error("JSON 파싱 오류:", err);
        }
      };
  
      eventSource.onerror = () => {
        console.warn("⚠️ SSE 연결 오류. 3초 후 재연결 시도...");
        eventSource.close();
        setTimeout(connectSSE, 3000); // 자동 재연결
      };
  
      return eventSource;
    };
  
    const source = connectSSE();
    return () => source.close();
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
            const status = getStatusColor(lot.occupied, lot.capacity);
            return (
              <div
                className="status-card occupied"
                onClick={goToMap}
                key={lot.lotCode || index}
                style={{ cursor: "pointer" }}
              >
                <div className="status-left">
                  <div className={`status-dot ${status}`} />
                  <span>{lot.lotName}</span>
                </div>
                <div className={`status-right ${status}-text`}>
                  {lot.occupied} / {lot.capacity}
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