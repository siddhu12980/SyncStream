import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "../components/Home/Home";
import Dashboard from "../pages/Dashboard/Dashboard";
import { useRecoilValue } from 'recoil';
import { userState } from '../store/userStore';
import { Navigate } from 'react-router-dom';
import RoomPage from "../components/Room/RoomPage"

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useRecoilValue(userState);
  return auth.isAuthenticated ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/rooms" element={<Dashboard />} />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/room/:id" element={<RoomPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;

