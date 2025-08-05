import React, { useRef, useState } from 'react';
import '../styles/ParkingMapStyle.css';

const ParkingMap = () => {

  const Positions = [[1,1,1,1,1,1,1,1,1,1,0,1],[1,1,1,1,1,1,1,1,1,1,0,0]];
  const CarExists = [[true,false,false,false,false,false,false,true,false,false,false,false]
                    ,[true,true,false,false,false,false,false,true,false,false,false,true]];

  // const mapRef = useRef(null);
  // const [isDragging, setIsDragging] = useState(false);
  // const [origin, setOrigin] = useState({ x: 0, y: 0 });
  // const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // const onMouseDown = (e) => {
  //   setIsDragging(true);
  //   setOrigin({ x: e.clientX, y: e.clientY });
  // };

  // const onMouseMove = (e) => {
  //   if (!isDragging) return;

  //   const dx = e.clientX - origin.x;
  //   const dy = e.clientY - origin.y;

  //   setOrigin({ x: e.clientX, y: e.clientY });
  //   setTranslate(prev => ({
  //     x: prev.x + dx,
  //     y: prev.y + dy,
  //   }));
  // };

  // const onMouseUp = () => {
  //   setIsDragging(false);
  // };

  return (
    <div className="map-container">
      <header className="map-header">
        {/* <div className="menu-icon">☰</div> */}
        <h1 className="map-title">옥외주차장</h1>
      </header>

      <div className="content-container">
        <div className="content-company">하나금융TI</div>

        <div>
          {Positions.map((x, xIndex) => 
            <div key={xIndex} style={{display: 'flex', gap: '1px', marginBottom: '1px'}}>
              {x.map((cell, yIndex) => {
                const isParking = cell === 1;
                const hasCar = CarExists[xIndex][yIndex];

                return (
                  <div
                    key={yIndex}
                    style={{
                      width: '20px',
                      height: '30px',
                      backgroundColor: isParking ? hasCar ? '#E76071' : '#F8BE80' : '#FFF',
                      border: isParking ? '1px solid #F8BE80' : '',
                      borderRadius: '4px',
                      boxShadow: isParking ? '2px 3px 6px rgba(0,0,0,0.1)' : ''
                    }}
                  />
                )
              }
              )}
            </div>
          )}
        </div>
{/*
        <div
              className="map-container"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
        >
          <div
              className="map-content"
              ref={mapRef}
             style={{transform: `translate(${translate.x}px, ${translate.y}px)`,}}
          >
          <img src="../src/images/map_empty_space.png" alt="Parking Map" />
         
          </div>
        </div>
*/}
      </div>
    </div>
  );
};

export default ParkingMap;