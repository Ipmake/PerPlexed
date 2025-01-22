import React, { useEffect } from "react";
import AppBar from "./components/AppBar";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Browse from "./pages/Browse";
import { Box } from "@mui/material";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Search from "./pages/Search";
import Home from "./pages/Home";
import Library from "./pages/Library";
import BigReader from "./components/BigReader";
import { useWatchListCache } from "./states/WatchListCache";
import Startup, { useStartupState } from "./pages/Startup";
import PerPlexedSync from "./components/PerPlexedSync";
import WaitingRoom from "./pages/WaitingRoom";

function AppManager() {
  const { loading } = useStartupState();
  const [showApp, setShowApp] = React.useState(false);
  const [fadeOut, setFadeOut] = React.useState(false);

  useEffect(() => {
    if (loading) return;

    setFadeOut(true);
    setTimeout(() => setShowApp(true), 500);
  }, [loading]);

  if (!showApp) {
    return (
      <div style={{ opacity: fadeOut ? 0 : 1, transition: "opacity 0.5s" }}>
        <Startup />
      </div>
    );
  }

  return <App />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !localStorage.getItem("accessToken") &&
      !location.pathname.startsWith("/login")
    )
      navigate("/login");
  }, [location.pathname]);

  useEffect(() => {
    useWatchListCache.getState().loadWatchListCache();

    const interval = setInterval(() => {
      useWatchListCache.getState().loadWatchListCache();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <BigReader />
      <PerPlexedSync />
      <Routes>
        <Route path="*" element={<AppBar />} />
        <Route path="/watch/:itemID" element={<></>} />
        <Route path="/sync/waitingroom" element={<></>} />
      </Routes>
      <Box
        sx={{
          width: "100%",
          height: "auto",
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse/:libraryID" element={<Browse />} />
          <Route path="/watch/:itemID" element={<Watch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search/:query?" element={<Search />} />
          <Route path="/sync/waitingroom" element={<WaitingRoom />} />
          <Route
            path="/library/:libraryKey/dir/:dir/:subdir?"
            element={<Library />}
          />
        </Routes>
      </Box>
    </>
  );
}

export default AppManager;
