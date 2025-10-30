import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashBoard from "./pages/DashBoard";
import FocusMode from "./pages/FocusMode";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BlockPage from "./pages/BlockPage";
import SettingsPage from "./pages/SettingsPage";
import InstructionsPage from "./pages/InstructionsPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/" element={<Home />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/blocked" element={<BlockPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<InstructionsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
