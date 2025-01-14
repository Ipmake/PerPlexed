import { Theme } from "@emotion/react";
import {
  AppBar,
  Avatar,
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  Popper,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getAllLibraries, getSearch, getTranscodeImageURL } from "../plex";
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

  const [libraries, setLibraries] = useState<Plex.LibarySection[] | null>(null);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    getAllLibraries().then((res) => {
      setLibraries(res);
    });
  }, []);

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
        backdropFilter: scrollAtTop ? "blur(0px)" : "blur(10px)",
        boxShadow: scrollAtTop ? "none" : "0px 0px 10px 0px #000000AA",

        borderBottomLeftRadius: "10px",
        borderBottomRightRadius: "10px",
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
          {!libraries && <CircularProgress size="small" />}
          {libraries
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
        <SearchBar />

        <Avatar
          src={user?.thumb}
          variant="square"
          alt=""
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 45,
            height: 45,
            borderRadius: "10px",
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

function SearchBar() {
  const [searchAnchorEl, setSearchAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const searchOpen = Boolean(searchAnchorEl);
  const searchAnchorElRef = React.useRef<HTMLElement | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Plex.SearchResult[]>(
    []
  );
  const [searchLoading, setSearchLoading] = React.useState(false);

  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // listen to strg + f

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if(searchAnchorElRef.current) {
          searchAnchorElRef.current.blur();
          setSearchAnchorEl(null);
          return;
        }

        setSearchAnchorEl(document.getElementById("search-bar"));
        document.getElementById("search-bar")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    searchAnchorElRef.current = searchAnchorEl;
  }, [searchAnchorEl]);

  useEffect(() => {
    if (searchValue.length === 0) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    const delayDebounceFn = setTimeout(() => {
      getSearch(searchValue).then((res) => {
        if (!res) {
          setSearchLoading(false);
          return setSearchResults([]);
        }
        setSearchResults(
          res
            .filter(
              (item) =>
                (item.Metadata &&
                  ["movie", "show"].includes(item.Metadata.type)) ||
                item.Directory
            )
            .sort((a, b) => {
              // directories first
              if (a.Directory && !b.Directory) return -1;
              if (!a.Directory && b.Directory) return 1;
              return 0;
            })
            .slice(0, 8)
        );

        setSearchLoading(false);
      });
    }, 500); // Adjust the delay as needed

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  return (
    <>
      <Backdrop
        open={searchOpen}
        sx={{
          zIndex: 10000
        }}
        onClick={() => {
          setSearchAnchorEl(null);
        }}
      />
      <TextField
        id="search-bar"
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate(`/search/${encodeURIComponent(searchValue.trim())}`);

            searchAnchorEl?.blur();
            setSearchAnchorEl(null);
          }
        }}
        onChange={(e) => {
          setSearchValue(e.target.value);
          //navigate(`/search/${encodeURIComponent(e.target.value.trim())}`);
        }}
        onFocus={(e) => {
          setSearchAnchorEl(e.currentTarget);
        }}
        sx={{
          backgroundColor: "#121212AA",
          borderRadius: "7px",

          // round the corners of the input
          "& .MuiOutlinedInput-root": {
            borderRadius: "7px",
          },
          transition: "all 0.2s ease-in-out",
          zIndex: 11000,
        }}
        style={{
          ...(searchOpen
            ? { width: "20vw", zIndex: 10000 }
            : { width: "300px" }),
        }}
      />
      <Popper
        anchorEl={searchAnchorEl}
        open={searchOpen && searchValue.length > 0}
        placement="bottom-end"
        sx={{
          borderRadius: "7px",
          backgroundColor: "#121212AA",
          backdropFilter: "blur(10px)",
          transition: "width 0.2s ease-in-out",
          padding: "20px 10px",
          pt: "10px",

          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
        style={{
          ...(searchOpen
            ? { width: "20vw", zIndex: 11000 }
            : { width: "300px" }),
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {searchLoading && (
          <Box
            sx={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <CircularProgress />
          </Box>
        )}

        {!searchLoading && searchResults.length === 0 && (
          <Typography>No Results</Typography>
        )}

        {!searchLoading &&
          searchResults.length > 0 &&
          searchResults.map((item) => {
            if (item.Metadata) {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    width: "100%",
                    borderRadius: "5px",
                    bgcolor: "#202020",
                    padding: "7px 10px",

                    "&:hover": {
                      backgroundColor: "#303030",
                      transition: "all 0.2s ease-in-out",
                    },

                    transition: "all 0.4s ease-in-out",

                    userSelect: "none",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    searchAnchorEl?.blur();
                    setSearchAnchorEl(null);
                    if (item.Metadata?.ratingKey) {
                      setSearchParams({
                        mid: item.Metadata.ratingKey,
                      });
                    }
                  }}
                >
                  <img
                    src={`${getTranscodeImageURL(
                      `${
                        item.Metadata.thumb
                      }?X-Plex-Token=${localStorage.getItem("accessToken")}`,
                      100,
                      100
                    )}`}
                    alt=""
                    style={{
                      aspectRatio: 1,
                      objectFit: "cover",
                      borderRadius: "5px",
                      width: 50,
                      height: 50,
                    }}
                  />

                  <Box sx={{ ml: 2, display: "flex", flexDirection: "column" }}>
                    <Typography>{item.Metadata.title}</Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#777",
                      }}
                    >
                      {item.Metadata.librarySectionTitle}
                    </Typography>
                  </Box>
                </Box>
              );
            } else if (item.Directory) {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    width: "100%",
                    borderRadius: "5px",
                    bgcolor: "#202020",
                    padding: "7px 10px",

                    "&:hover": {
                      backgroundColor: "#303030",
                      transition: "all 0.2s ease-in-out",
                    },

                    transition: "all 0.4s ease-in-out",

                    userSelect: "none",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    console.log("test");
                    e.stopPropagation();
                    e.preventDefault();
                    navigate(`/library/${item.Directory?.librarySectionID}/dir/genre/${item.Directory?.id}`);
                    searchAnchorEl?.blur();
                    setSearchAnchorEl(null);
                  }}
                >
                  <Typography>
                    {item.Directory.librarySectionTitle} - {item.Directory.tag}
                  </Typography>
                </Box>
              );
            }
          })}
      </Popper>
    </>
  );
}

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
        fontFamily: '"Inter Variable", sans-serif',
      }}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
