import {
  ArrowBackIosNewRounded,
  PlayArrowRounded,
  SubscriptionsRounded,
} from "@mui/icons-material";
import {
  Box,
  ClickAwayListener,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { useState } from "react";
import { getLibraryDir, getTranscodeImageURL } from "../plex";
import { getMinutes } from "./MetaScreen";
import { useNavigate } from "react-router-dom";

function WatchShowChildView({ item }: { item: Plex.Metadata }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [seasons, setSeasons] = useState<Plex.Metadata[] | null>(null);
  const [episodes, setEpisodes] = useState<Plex.Metadata[] | null>(null);

  const [selectedSeason, setSelectedSeason] = useState(item.parentIndex ?? 1);

  const navigate = useNavigate();

  useEffect(() => {
    setSeasons(null);
    setEpisodes(null);

    (async () => {
      const getSeasons = new Promise<Plex.Metadata[]>((resolve) => {
        getLibraryDir(
          `/library/metadata/${item.grandparentRatingKey}/children`
        ).then((data) => {
          if (!data?.Metadata) return;
          resolve(data?.Metadata);
        });
      });

      const getEpisodes = new Promise<Plex.Metadata[]>((resolve) => {
        getLibraryDir(
          `/library/metadata/${item.grandparentRatingKey}/allLeaves`
        ).then((data) => {
          if (!data?.Metadata) return;
          resolve(data?.Metadata);
        });
      });

      const [seasons, episodes] = await Promise.all([getSeasons, getEpisodes]);

      setSeasons(seasons);
      setEpisodes(episodes);
      setSelectedSeason(item.parentIndex ?? 1);
    })();
  }, [item]);

  return (
    <>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="bottom"
        sx={{ zIndex: 10000 }}
        transition
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 10],
            },
          },
          {
            name: "preventOverflow",
            enabled: true,
            options: {
              altAxis: false,
              altBoundary: false,
              tether: false,
              rootBoundary: "viewport",
              padding: 20,
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              sx={{
                width: "auto",
                height: "auto",
                userSelect: "none",
              }}
            >
              <ClickAwayListener
                onClickAway={(e) => {
                  e.stopPropagation();
                  setAnchorEl(null);
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                    borderRadius: "5px",

                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: (seasons?.length ?? 1) > 1 ? "flex" : "none",
                      flexDirection: "column",
                      width: "12vw",
                      height: "40vh",
                      overflow: "auto",

                      maxHeight: "40vh",
                      overflowY: "auto",

                      backgroundColor: "#202020",
                    }}
                  >
                    <Box
                      sx={{
                        py: "7px",
                        px: "15px",
                        width: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "white",
                          fontSize: "1.5vh",
                          fontWeight: "bold",
                          width: "100%",

                          // clamp to one line
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.grandparentTitle}
                      </Typography>
                    </Box>

                    <Divider variant="middle" />

                    {seasons?.map((season) => (
                      <Box
                        key={season.ratingKey}
                        sx={{
                          cursor: "pointer",

                          width: "100%",
                          py: "7px",
                          px: "15px",
                          background: "#202020",

                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",

                          "&:hover": {
                            background: "#303030",

                            pr: "5px",
                          },

                          ...(selectedSeason === season.index && {
                            background: "#303030",

                            "& svg": {
                              opacity: 0,
                            },

                            "& p": {
                              fontWeight: "bold",
                            },
                          }),
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => setSelectedSeason(season.index ?? 1)}
                      >
                        <Typography
                          sx={{
                            color: "white",
                            fontSize: "1.3vh",
                          }}
                        >
                          {season.title}
                        </Typography>

                        <ArrowBackIosNewRounded
                          sx={{
                            color: "white",
                            fontSize: "1.3vh",
                            transform: "rotate(180deg)",
                            opacity: 1,

                            transition: "all 0.2s ease",
                          }}
                        />
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      width: "35vw",
                      height: "40vh",
                      maxHeight: "40vh",
                      overflowY: "auto",

                      py: "10px",
                      px: seasons?.length === 1 ? "10px" : "0px",
                    }}
                  >
                    {episodes
                      ?.filter(
                        (episode) => episode.parentIndex === selectedSeason
                      )
                      .map((episode) => (
                        <Box
                          key={episode.ratingKey}
                          sx={{
                            width: "100%",

                            display: "flex",
                            flexDirection: "row",
                            gap: "0px",

                            ...(episode.ratingKey !== item.ratingKey && {
                              cursor: "pointer",

                              "&:hover > :nth-child(2)": {
                                "& > :nth-child(1)": {
                                  opacity: 1,
                                  transition: "all 0.2s ease-in",
                                },
                              },
                            }),
                          }}
                          onClick={() => {
                            navigate(`/watch/${episode.ratingKey}`);
                            setAnchorEl(null);
                          }}
                        >
                          <Box
                            sx={{
                              width: "5%",
                              display: "none",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              alignSelf: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                                color: "#FFFFFF",
                                textAlign: "center",
                              }}
                            >
                              {episode.index}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              width: "30%",
                              borderRadius: "5px",
                              aspectRatio: "16/9",
                              backgroundImage: `url(${getTranscodeImageURL(
                                `${
                                  episode.thumb
                                }?X-Plex-Token=${localStorage.getItem(
                                  "accessToken"
                                )}`,
                                380,
                                214
                              )})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              backgroundBlendMode: "darken",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              clipPath: "inset(0px 0px -10px 0px)",
                              transition: "all 0.5s ease",

                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              justifyContent: "flex-start",

                              position: "relative",
                            }}
                          >
                            <PlayArrowRounded
                              sx={{
                                color: "#FFFFFF",
                                fontSize: "300%",
                                m: "auto",
                                opacity: 0,
                                backgroundColor: "#00000088",
                                borderRadius: "50%",

                                transition: "all 0.5s ease-out",
                              }}
                            />

                            {(episode.viewOffset ||
                              (episode.viewCount &&
                                episode.viewCount >= 1)) && (
                              <LinearProgress
                                value={
                                  episode.viewOffset
                                    ? (episode.viewOffset / episode.duration) *
                                      100
                                    : 100
                                }
                                variant="determinate"
                                sx={{
                                  width: "100%",
                                  height: "5%",
                                  backgroundColor: "#00000088",
                                  borderRadius: "5px",

                                  position: "absolute",
                                  bottom: 0,
                                }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              width: "70%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              justifyContent: "flex-start",
                              ml: 0.5,
                              px: "10px",
                            }}
                          >
                            <Box
                              sx={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  gap: 0.5,
                                  width: "85%",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "1.5vh",
                                  }}
                                >
                                  {episode.index}
                                </Typography>

                                {"  -  "}

                                <Typography
                                  sx={{
                                    fontSize: "1.5vh",
                                    fontWeight: "bold",
                                    color: "#FFFFFF",

                                    whiteSpace: "nowrap",
                                    maxWidth: "95%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {episode.title}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  fontSize: "1.3vh",
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  gap: 1,
                                }}
                              >
                                {getMinutes(episode.duration)} Min.
                              </Box>
                            </Box>

                            <Typography
                              sx={{
                                fontSize: "1.25vh",
                                fontWeight: "light",
                                color: "#FFFFFF",
                                opacity: 0.7,
                                // make it so the text doesnt resize the parent nor overflow max 3 rows
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                              }}
                              title={episode.summary}
                            >
                              {episode.summary}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
        <SubscriptionsRounded fontSize="large" />
      </IconButton>
    </>
  );
}

export default WatchShowChildView;
