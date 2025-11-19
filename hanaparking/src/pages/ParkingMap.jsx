import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/ParkingMapStyle.css';

const ParkingMap = () => {
  const [positions, setPositions] = useState([]);
  const [carExists, setCarExists] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  // ⭐ A1 주차장 요약 정보 상태
  const [lotSummary, setLotSummary] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let eventSource = null;

    // 1️⃣ 최초 1번: 현재 주차장 상태를 백엔드에서 조회
    const fetchInitialData = async () => {
      try {
        const res = await fetch(
          //'http://98.81.145.104:8000/api/v1/lot/recent?lot_code=A1'
          'http://127.0.0.1:8000/api/v1/lot/recent?lot_code=A1'
        );

        if (!res.ok) {
          console.error('초기 데이터 조회 실패:', res.status, res.statusText);
          return;
        }

        const data = await res.json();
        setPositions(data.positions || []);
        setCarExists(data.carExists || []);
        console.log('🔰 초기 데이터 로딩 완료:', data);
      } catch (err) {
        console.error('초기 데이터 조회 중 오류:', err);
      }
    };

    // 1-2️⃣ A1 주차장 요약 정보 조회 (occupied / capacity / created_at)
    const fetchLotSummary = async () => {
      try {
        const res = await fetch(
          //'http://127.0.0.1:8000/api/v1/lot/lots'
          'http://98.81.145.104:8000/api/v1/lot/lots'
        );

        if (!res.ok) {
          console.error('lot 요약 조회 실패:', res.status, res.statusText);
          return;
        }

        const lots = await res.json();
        const a1 = lots.find((lot) => lot.lot_code === 'A1');
        if (a1) {
          setLotSummary(a1);
          console.log('📊 A1 요약 데이터:', a1);
        }
      } catch (err) {
        console.error('lot 요약 조회 중 오류:', err);
      }
    };

    // 2️⃣ 이후: Redis Pub/Sub 기반 SSE 연결
    const connectSSE = () => {
      eventSource = new EventSource(
        'http://98.81.145.104:8000/api/v1/redis/detail/subscribe'
        // 'http://127.0.0.1:8000/api/v1/redis/detail/subscribe'
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setPositions(data.positions || []);
          setCarExists(data.carExists || []);
          console.log('🔄 SSE 데이터 업데이트됨:', data);
        } catch (err) {
          console.error('SSE JSON 파싱 오류:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('⚠️ SSE 연결 오류:', err);
      };
    };

    // 3️⃣ 실행 순서: 초기 데이터 → 요약 조회 → SSE 연결
    (async () => {
      await fetchInitialData();  // 한 번 현재 상태 그림
      await fetchLotSummary();   // 헤더 아래 요약 텍스트용
      connectSSE();              // 이후부터는 실시간 갱신
    })();

    // 4️⃣ 컴포넌트 언마운트 시 SSE 정리
    return () => {
      if (eventSource) {
        console.log('🧹 SSE 연결 종료');
        eventSource.close();
      }
    };
  }, []);

  const totalCols = positions[0]?.length || 1;

  // ⭐ created_at 포맷팅 도우미
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcRate = (occ, cap) => {
    if (!cap || cap === 0) return '-';
    return ((occ / cap) * 100).toFixed(1);
  };

  return (
    <div className="map-container">
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
        <h1 className="header-title">옥외주차장</h1>
      </header>

      <div className="content-container">

        <div className="content-company">
          하나금융TI
          {/* 요약 텍스트는 필요 시 다시 활성화 */}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          {/* ✅ 왼쪽: 주차장 그리드 */}
          <div style={{ flex: '1 1 auto' }}>
            {positions.map((row, xIndex) => (
              <div
                key={xIndex}
                style={{ display: 'flex', gap: '1px', marginBottom: '1px' }}
              >
                {row.map((cell, yIndex) => {
                  const isParking = cell === 1;
                  const status = carExists[xIndex]?.[yIndex]; // 0/1/2 또는 undefined

                  // 🔥 상태별 색상 지정
                  let bgColor = '#FFF';
                  let borderColor = 'transparent';

                  if (isParking) {
                    borderColor = '#F8BE80';

                    if (status === 1) {
                      // 차 있음
                      bgColor = '#E76071';
                    } else if (status === 0) {
                      // 빈자리
                      bgColor = '#F8BE80';
                    } else if (status === 2) {
                      // ROI 없음 / 비활성 구역
                      bgColor = '#D3D3D3'; // 회색
                      borderColor = '#B0B0B0';
                    } else {
                      // 혹시 모를 undefined 등
                      bgColor = '#FFFFFF';
                      borderColor = '#EEE';
                    }
                  }

                  return (
                    <div
                      key={yIndex}
                      style={{
                        flex: `0 0 ${100 / totalCols}%`,
                        aspectRatio: '2 / 2.5',
                        boxSizing: 'border-box',
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        boxShadow: isParking
                          ? '2px 3px 6px rgba(0,0,0,0.1)'
                          : '',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* ✅ 오른쪽: 도로 표시 */}
          <div className="road-column">
            <div className="road-center-line" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingMap;
