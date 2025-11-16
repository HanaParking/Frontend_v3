import React, { useEffect, useState } from 'react';
import '../styles/ParkingMapStyle.css';

const ParkingMap = () => {
  const [positions, setPositions] = useState([]);
  const [carExists, setCarExists] = useState([]);

  useEffect(() => {
    let eventSource = null;

    // 1️⃣ 최초 1번: 현재 주차장 상태를 백엔드에서 조회
    const fetchInitialData = async () => {
      try {
        const res = await fetch(
          'http://127.0.0.1:8000/api/v1/lot/recent?lot_code=A1'
          //'http://127.0.0.1:8000/api/v1/lot/recent?lot_code=A1'
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

    // 2️⃣ 이후: Redis Pub/Sub 기반 SSE 연결
    const connectSSE = () => {
      // 백엔드 SSE URL (지금 쓰는 주소 그대로 사용)
      eventSource = new EventSource(
        'http://98.81.145.104:8000/api/v1/redis/detail/subscribe'
        //'http://127.0.0.1:8000/api/v1/redis/detail/subscribe'
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
        // 필요한 경우 직접 재연결 로직 추가 가능
        // eventSource.close();
        // setTimeout(connectSSE, 3000);
      };
    };

    // 3️⃣ 실행 순서: 초기 데이터 → SSE 연결
    (async () => {
      await fetchInitialData(); // 한 번 현재 DB/Redis 상태로 그림
      connectSSE();             // 이후부터는 Pub/Sub(SSE)로만 갱신
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

  return (
  <div className="map-container">
    <header className="map-header">
      <h1 className="map-title">옥외주차장</h1>
    </header>

    <div className="content-container">
      <div className="content-company">하나금융TI</div>

      <div>
        {positions.map((row, xIndex) => (
          <div
            key={xIndex}
            style={{ display: 'flex', gap: '1px', marginBottom: '1px'}}
          >
            {row.map((cell, yIndex) => {
              const isParking = cell === 1;
              const hasCar = carExists[xIndex]?.[yIndex];

              return (
                <div
                  key={yIndex}
                  style={{
                    // ✅ 한 줄 전체를 totalCols 개로 딱 나눠 사용
                    flex: `0 0 ${100 / totalCols}%`,
                    // width: `${100 / totalCols}%`,  // 위 flex 한 줄로 대체 가능
                    aspectRatio: '2 / 2.5', // width:height = 2:3 (예전 20x30 비율)
                    boxSizing: 'border-box',

                    backgroundColor: isParking
                      ? hasCar
                        ? '#E76071' // 차 있음
                        : '#F8BE80' // 빈자리
                      : '#FFF',     // 주차 구역 아님
                    border: isParking
                      ? '1px solid #F8BE80'
                      : '1px solid transparent',
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
    </div>
  </div>
);

};

export default ParkingMap;
