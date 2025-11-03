import React, { useEffect, useState } from 'react';
import '../styles/ParkingMapStyle.css';

const ParkingMap = () => {
  const [positions, setPositions] = useState([]);
  const [carExists, setCarExists] = useState([]);

  // ✅ Redis Pub/Sub 기반 SSE 연결
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8000/api/v1/redis/detail/subscribe");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPositions(data.positions || []);
        setCarExists(data.carExists || []);
        console.log("🔄 데이터 업데이트됨:", data);
      } catch (err) {
        console.error("JSON 파싱 오류:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("⚠️ SSE 연결 오류, 재연결 시도 중...");
      eventSource.close();
      setTimeout(connect, 3000); // 3초 후 재연결
    };

    // cleanup
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="map-container">
      <header className="map-header">
        <h1 className="map-title">옥외주차장</h1>
      </header>

      <div className="content-container">
        <div className="content-company">하나금융TI</div>

        <div>
          {positions.map((row, xIndex) => (
            <div key={xIndex} style={{ display: 'flex', gap: '1px', marginBottom: '1px' }}>
              {row.map((cell, yIndex) => {
                const isParking = cell === 1;
                const hasCar = carExists[xIndex]?.[yIndex];

                return (
                  <div
                    key={yIndex}
                    style={{
                      width: '20px',
                      height: '30px',
                      backgroundColor: isParking
                        ? hasCar
                          ? '#E76071'
                          : '#F8BE80'
                        : '#FFF',
                      border: isParking ? '1px solid #F8BE80' : '1px solid transparent',
                      borderRadius: '4px',
                      boxShadow: isParking ? '2px 3px 6px rgba(0,0,0,0.1)' : '',
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