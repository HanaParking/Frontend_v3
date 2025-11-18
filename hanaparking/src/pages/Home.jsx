import "../styles/HomeStyle.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const goToMap = () => {
    navigate("/map");
  };

  const [responseData, setResponseData] = useState([]);
  const [createdAt, setCreatedAt] = useState("");
  const [showMenu, setShowMenu] = useState(false);


const getStatusColor = (occupied, capacity) => {
  if (!capacity) return "gray"; // capacity 0일 때
  
  const ratio = (occupied / capacity) * 100;

  if (ratio < 30) return "green";      // 여유 많음
  if (ratio < 70) return "yellow";     // 여유 부족
  return "red";                        // 혼잡
};



  // ISO → yyyy/MM/dd HH:MM:SS
const formatDateTime = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const HH = String(date.getHours()).padStart(2, "0");
  const MI = String(date.getMinutes()).padStart(2, "0");
  const SS = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${HH}:${MI}:${SS}`;
};

  useEffect(() => {
    getParkingLotsInfo();
  }, []);

  const getParkingLotsInfo = async () => {
    try {
      const response = await fetch("http://98.81.145.104:8000/api/v1/lot/lots");
      const data = await response.json();

      // 🔵 A1의 created_at 찾아서 저장
    const lotA1 = data.find(lot => lot.lot_code === "A1");
    if (lotA1) {
      setCreatedAt(lotA1.created_at);
    }

      const formatted = data.map((lot) => ({
        lotCode: lot.lot_code,
        lotName: lot.lot_name,
        statusCd: lot.status_cd,
        capacity: lot.capacity ?? 0,
        occupied: lot.occupied ?? 0,
      }));

      setResponseData(formatted);
    } catch (error) {
      console.error("Error fetching parking lot data:", error);
    }
  };

  return (
    <div className="home-container">
<header className="home-header">
  <div className="header-left">
    <div className="header-icon" onClick={() => setShowMenu(!showMenu)}>☰</div>

    {showMenu && (
      <div className="dropdown-menu">
        <div className="dropdown-item" onClick={() => navigate("/")}>메인페이지</div>
        <div className="dropdown-item" onClick={() => navigate("/report")}>출퇴근리포트</div>
      </div>
    )}
  </div>

  <h1 className="header-title">실시간 주차현황</h1>
</header>

      <div className="content-container">
        <h2 className="section-title">청라데이터센터</h2>
        <p className="section-subtext">
          기준 시각: {createdAt ? formatDateTime(createdAt) : "로딩 중..."}
          </p>

        {responseData.length === 0 ? (
          <p>주차장 정보를 불러오는 중...</p>
        ) : (
          responseData.map((lot, index) => {
            const status = getStatusColor(lot.occupied, lot.capacity);
            const isDisabled = lot.statusCd === "0"; // 준비중 여부

            return (
              <div
                className={`status-card occupied ${
                  isDisabled ? "disabled-card" : ""
                }`}
                key={lot.lotCode || index}
                style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                onClick={() => {
                  if (!isDisabled) goToMap();
                }}
              >
                <div className="status-left">
                  <div className={`status-dot ${status}`} />
                  <span>{lot.lotName}</span>
                </div>

                <div className={`status-right ${status}-text`}>
                  {isDisabled
                    ? "준비중"
                    : `${lot.occupied} / ${lot.capacity}`}
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
