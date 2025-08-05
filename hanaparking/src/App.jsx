import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Map from './pages/ParkingMap'
import Header from './components/Header'

function App() {
  return (
    <div className="min-h-screen">
      <Header/>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
