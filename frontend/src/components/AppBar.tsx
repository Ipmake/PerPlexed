import { Theme } from "@emotion/react";
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAllLibraries } from "../plex";
import MetaScreen from "./MetaScreen";
import { useUserSessionStore } from "../states/UserSession";
import { Search } from "@mui/icons-material";

const BarSide: SxProps<Theme> = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
};

function Appbar() {
  const [scrollAtTop, setScrollAtTop] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useUserSessionStore();

  useEffect(() => {
    const onScroll = () => {
      setScrollAtTop(window.scrollY === 0);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const libraries = useQuery("libraries", getAllLibraries);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <AppBar
      sx={{
        position: "fixed",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: 6,
        py: 0,
        height: 64,
        transition: "all 0.2s ease-in-out",

        bgcolor: scrollAtTop ? "#00000000" : `#000000AA`,
        boxShadow: scrollAtTop ? "none" : "0px 0px 10px 0px #000000AA",
      }}
    >
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Typography
          sx={{
            width: "100%",
            textAlign: "center",
            fontWeight: 600,
            px: 2,
            fontSize: 18,
          }}
        >
          {user?.friendlyName ?? user?.username}
        </Typography>

        <Divider />

        <MenuItem
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("accAccessToken");
            window.location.reload();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
      <MetaScreen />
      <Box
        sx={{
          justifyContent: "flex-start",
          ...BarSide,
        }}
      >
        <img
          src="/plex.png"
          alt=""
          height="80"
          style={{
            aspectRatio: 1,
            objectFit: "contain",
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 4,
            ml: 6,
            height: "100%",
          }}
        >
          <HeadLink to="/" active={location.pathname === "/"}>
            Home
          </HeadLink>
          {libraries.isLoading && <CircularProgress size="small" />}
          {libraries.data
            ?.filter((e) => ["movie", "show"].includes(e.type))
            .map((library) => (
              <HeadLink
                key={library.key}
                to={`/browse/${library.key}`}
                active={location.pathname.includes(`/browse/${library.key}`)}
              >
                {library.title}
              </HeadLink>
            ))}
        </Box>
      </Box>

      <Box
        sx={{
          justifyContent: "flex-end",
          ...BarSide,
          gap: 2,
        }}
      >
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          placeholder="Search"
          variant="outlined"
          size="small"
          onChange={(e) =>
            navigate(`/search/${encodeURIComponent(e.target.value.trim())}`)
          }
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          }}
        />
        <Avatar
          src={user?.thumb}
          variant="square"
          alt=""
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 45,
            height: 45,
            borderRadius: 2,
            cursor: "pointer",

            "&:hover": {
              boxShadow: (theme) =>
                `0px 0px 20px 0px ${theme.palette.primary.main}`,
            },
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>
    </AppBar>
  );
}

export default Appbar;

function HeadLink({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active?: boolean;
}): JSX.Element {
  return (
    <Link
      className={`head-link${active ? " head-link-active" : ""}`}
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
      }}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
