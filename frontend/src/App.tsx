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
      <Routes>
        <Route path="*" element={<AppBar />} />
        <Route path="/watch/:itemID" element={<></>} />
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
          <Route
            path="/library/:libraryKey/dir/:dir/:subdir?"
            element={<Library />}
          />
        </Routes>
      </Box>
    </>
  );
}

export default App;
