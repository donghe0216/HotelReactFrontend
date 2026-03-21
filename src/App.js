import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/home" element={<div>Home</div>} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
