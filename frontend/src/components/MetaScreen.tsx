import {
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  getLibraryMeta,
  getLibraryMetaChildren,
  getSimilar,
  getTranscodeImageURL,
} from "../plex";
import { useQuery } from "react-query";
import {
  Add,
  CheckCircle,
  Close,
  PlayArrow,
  StarRate,
  VolumeOff,
  VolumeUp,
} from "@mui/icons-material";
import { durationToText } from "./MovieItemSlider";
import ReactPlayer from "react-player";
import { usePreviewPlayer } from "../states/PreviewPlayerState";
import MovieItem from "./MovieItem";

function MetaScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { MetaScreenPlayerMuted, setMetaScreenPlayerMuted } =
    usePreviewPlayer();

  const { data, status } = useQuery(
    ["meta", searchParams.get("mid")],
    async () => await getLibraryMeta(searchParams.get("mid") as string)
  );

  const similar = useQuery(
    ["similar", searchParams.get("mid")],
    async () => await getSimilar(searchParams.get("mid") as string)
  );

  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [episodes, setEpisodes] = useState<Plex.Metadata[] | null>();

  const [languages, setLanguages] = useState<string[] | null>(null);
  const [subTitles, setSubTitles] = useState<string[] | null>(null);

  const [previewVidURL, setPreviewVidURL] = useState<string | null>(null);
  const [previewVidPlaying, setPreviewVidPlaying] = useState<boolean>(false);

  useEffect(() => {
    setEpisodes(null);
    setSelectedSeason(0);
    setLanguages(null);
    setSubTitles(null);
    setPreviewVidURL(null);
    setPreviewVidPlaying(false);
  }, [data?.ratingKey]);

  useEffect(() => {
    if (!data) return;
    setSelectedSeason((data.OnDeck?.Metadata?.parentIndex ?? 1) - 1);

    if (
      !data?.Extras?.Metadata?.[0] ||
      !data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
    )
      return;

    setPreviewVidURL(
      `${localStorage.getItem("server")}${
        data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
      }&X-Plex-Token=${localStorage.getItem("accessToken")}`
    );

    const timeout = setTimeout(() => {
      setPreviewVidPlaying(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (languages || subTitles) return;
    if (!data) return;

    switch (data.type) {
      case "show":
        {
          if (!episodes) return;

          // get the first episode to get the languages and subtitles
          const firstEpisode = episodes[0];

          // you need to request the full metadata for the episode to get the media info
          getLibraryMeta(firstEpisode.ratingKey).then((res) => {
            if (!res.Media?.[0]?.Part?.[0]?.Stream) return;

            const uniqueLanguages = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 2
                ).map((stream) => stream.language ?? stream.displayTitle)
              )
            );
            const uniqueSubTitles = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 3
                ).map((stream) => stream.language)
              )
            );

            setLanguages(uniqueLanguages);
            setSubTitles(uniqueSubTitles);
          });
        }
        break;
      case "movie":
        {
          if (!data.Media?.[0]?.Part?.[0]?.Stream) return;

          const uniqueLanguages = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 2
              ).map((stream) => stream.language ?? stream.displayTitle)
            )
          );
          const uniqueSubTitles = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 3
              ).map((stream) => stream.language)
            )
          );

          setLanguages(uniqueLanguages);
          setSubTitles(uniqueSubTitles);
        }
        break;
    }
  }, [data?.ratingKey, episodes]);

  useEffect(() => {
    setEpisodes(null);
    if (
      data?.type === "show" &&
      data?.Children?.Metadata[selectedSeason]?.ratingKey
    ) {
      getLibraryMetaChildren(
        data?.Children?.Metadata[selectedSeason]?.ratingKey as string
      ).then((res) => {
        setEpisodes(res);
      });
    }
  }, [selectedSeason, data?.ratingKey]);

  if (!searchParams.has("mid")) return <></>;

  if (status === "loading")
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    );

  console.log(data);
  return (
    <Backdrop
      open={searchParams.has("mid")}
      sx={{
        overflowY: "scroll",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={() => {
        setSearchParams(new URLSearchParams());
      }}
    >
      <Box
        sx={{
          width: "120vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          backgroundColor: "#181818",
          mt: 4,
          pb: 4,

          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            aspectRatio: "16/9",
            backgroundImage: `url(${localStorage.getItem("server")}${
              data?.art
            }?X-Plex-Token=${localStorage.getItem("accessToken")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#000000AA",
            backgroundBlendMode: "darken",

            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "1%",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            position: "relative",
            zIndex: 0,
            userSelect: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              // make it take up the full width of the parent
              width: "100%",
              aspectRatio: "16/9",
              left: 0,
              top: 0,
              filter: "brightness(0.5)",
              opacity: previewVidPlaying ? 1 : 0,
              transition: "all 2s ease",
              backgroundColor: previewVidPlaying ? "#000000" : "transparent",
              pointerEvents: "none",

              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              overflow: "hidden",
            }}
          >
            <ReactPlayer
              url={previewVidURL ?? undefined}
              controls={false}
              width="100%"
              height="100%"
              autoplay={true}
              playing={previewVidPlaying}
              volume={MetaScreenPlayerMuted ? 0 : 0.5}
              muted={MetaScreenPlayerMuted}
              onEnded={() => {
                setPreviewVidPlaying(false);
              }}
              pip={false}
              config={{
                file: {
                  attributes: { disablePictureInPicture: true },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 2,
            }}
          >
            <IconButton
              sx={{
                backgroundColor: "#00000088",
              }}
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
            >
              <Close fontSize="medium" />
            </IconButton>

            <IconButton
              sx={{
                backgroundColor: "#00000088",
                opacity: previewVidURL ? 1 : 0,
                transition: "all 1s ease",
              }}
              onClick={() => {
                setMetaScreenPlayerMuted(!MetaScreenPlayerMuted);
              }}
            >
              {MetaScreenPlayerMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            mt: "-15vh",
            height: "30vh",
            width: "100%",
            background:
              "linear-gradient(180deg, #18181800, #181818FF, #181818FF)",
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0 3%",
            mt: "-55vh",
            gap: "3%",
            zIndex: 2,
          }}
        >
          <img
            src={`${getTranscodeImageURL(
              `${data?.thumb}?X-Plex-Token=${localStorage.getItem(
                "accessToken"
              )}`,
              600,
              900
            )}`}
            alt=""
            style={{
              width: "30%",
              aspectRatio: "2/3",
              boxShadow: "-10px 10px 01px 0px #000000FF",
              backgroundColor: "#00000088",
              objectFit: "cover",
              borderRadius: "10px",
            }}
          />

          <Box
            sx={{
              width: "70%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              height: "100%",
              marginLeft: "1%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                width: "100%",
                height: "65%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mb: 0,
                }}
              >
                <img
                  src="/plexIcon.png"
                  alt=""
                  height="40"
                  style={{
                    aspectRatio: 1,
                    borderRadius: 8,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "30px",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    textShadow: "3px 3px 1px #232529",
                    ml: 1,
                    color: "#e6a104",
                    textTransform: "uppercase",
                  }}
                >
                  {data?.type}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  mt: 0,
                }}
              >
                {data?.title}
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mt: -1,
                }}
              >
                {data?.type === "show" &&
                  data?.leafCount === data?.viewedLeafCount && (
                    <CheckCircle
                      sx={{
                        color: "#FFFFFF",
                        fontSize: "large",
                        mr: 1,
                      }}
                    />
                  )}
                {data?.type === "movie" && data?.viewCount && (
                  <CheckCircle
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "large",
                      mr: 1,
                    }}
                  />
                )}
                {data?.contentRating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: "#FFFFFF",
                      textShadow: "0px 0px 10px #000000",
                      border: "1px dotted #AAAAAA",
                      borderRadius: "5px",
                      px: 1,
                      py: -0.5,
                    }}
                  >
                    {data?.contentRating}
                  </Typography>
                )}
                {data?.year && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: "#FFFFFF",
                      ml: data?.contentRating ? 1 : 0,
                      textShadow: "0px 0px 10px #000000",
                    }}
                  >
                    {data?.year}
                  </Typography>
                )}
                {data?.rating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: "#FFFFFF",
                      textShadow: "0px 0px 10px #000000",
                      ml: 1,
                    }}
                  >
                    {data?.rating}
                  </Typography>
                )}
                {data?.duration &&
                  ["episode", "movie"].includes(data?.type) && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: "#FFFFFF",
                        textShadow: "0px 0px 10px #000000",
                        ml: 1,
                      }}
                    >
                      {durationToText(data?.duration)}
                    </Typography>
                  )}
                {data?.type === "show" &&
                  data?.leafCount &&
                  data?.childCount && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: "#FFFFFF",
                        textShadow: "0px 0px 10px #000000",
                        ml: 1,
                      }}
                    >
                      {data?.childCount > 1
                        ? `${data?.childCount} Seasons`
                        : `${data?.leafCount} Episode${
                            data?.leafCount > 1 ? "s" : ""
                          }`}
                    </Typography>
                  )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 2,
                  mt: 1,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#CCCCCC",
                    color: "#000000",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    "&:hover": {
                      backgroundColor: "primary.main",
                      gap: 1.5,
                    },
                    gap: 1,
                    transition: "all 0.2s ease-in-out",
                  }}
                  onClick={async () => {
                    if (data?.type === "movie")
                      navigate(`/watch/${data?.ratingKey}${data?.viewOffset ? `?t=${data?.viewOffset}` : ""}`);

                    if (data?.type === "show") {
                      if (data?.OnDeck && data?.OnDeck.Metadata) {
                        navigate(
                          `/watch/${data?.OnDeck.Metadata.ratingKey}${
                            data?.OnDeck.Metadata.viewOffset
                              ? `?t=${data?.OnDeck.Metadata.viewOffset}`
                              : ""
                          }`
                        );
                      } else {
                        const firstSeason = await getLibraryMetaChildren(
                          data?.Children?.Metadata[0]?.ratingKey as string
                        );

                        if (firstSeason)
                          navigate(`/watch/${firstSeason[0].ratingKey}`);
                      }
                    }
                  }}
                >
                  <PlayArrow fontSize="medium" /> Play{" "}
                  {data?.type === "show" &&
                    data?.OnDeck &&
                    data?.OnDeck.Metadata &&
                    `${
                      data?.Children?.size && data?.Children?.size > 1
                        ? `S${data?.OnDeck.Metadata.parentIndex}`
                        : ""
                    }E${data?.OnDeck.Metadata.index}`}
                </Button>
                <IconButton
                  sx={{
                    backgroundColor: "#202020",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "1px solid #FFFFFF",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                    cursor: "not-allowed",
                  }}
                  title="Not yet Implemented"
                >
                  <Add fontSize="medium" />
                </IconButton>
                <IconButton
                  sx={{
                    backgroundColor: "#202020",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "1px solid #FFFFFF",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                    cursor: "not-allowed",
                  }}
                  title="Not yet Implemented"
                >
                  <StarRate fontSize="medium" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  mt: 2,
                }}
              >
                <Typography>Genres: </Typography>
                {data?.Genre?.slice(0, 5).map((genre, index) => (
                  <Link
                    to={`/library/${data.librarySectionID}/dir/genre/${genre.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      }}
                    >
                      {genre.tag}
                      {index + 1 === data?.Genre?.slice(0, 5).length ? "" : ","}
                    </Typography>
                  </Link>
                ))}
              </Box>

              <Collapse in={Boolean(languages || subTitles)}>
                <Box>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                    }}
                  >
                    {languages && languages.length > 0 && (
                      <>
                        <Typography>Audio: </Typography>
                        {languages.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: "#FFFFFF",
                              fontWeight: "bold",
                            }}
                          >
                            {lang}
                            {index + 1 === languages.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                      whiteSpace: "wrap",
                      overflow: "hidden",
                    }}
                  >
                    {subTitles && subTitles.length > 0 && (
                      <>
                        <Typography>Subtitles: </Typography>
                        {subTitles.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: "#FFFFFF",
                              fontWeight: "bold",
                            }}
                          >
                            {lang}
                            {index + 1 === subTitles.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>
                </Box>
              </Collapse>

              <Typography
                sx={{
                  mt: 1.5,
                  fontSize: "1rem",
                  fontWeight: "normal",
                  // max 5 lines
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: "vertical",
                  maxInlineSize: "100%",
                }}
                title={data?.summary}
              >
                {data?.summary}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "100%",
            padding: "0 3%",
            gap: "3%",
            mt: "3vh",
          }}
        >
          <Box
            sx={{
              width: "30%",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 1,
              }}
            >
              Cast & Crew
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {data?.Role?.map((role) => (
                <Grid item xs={6}>
                  <Link
                    to={`/library/${data?.librarySectionID}/dir/actor/${role.id}`}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 1,

                        width: "100%",
                        height: "100%",

                        userSelect: "none",
                        cursor: "pointer",

                        "&:hover": {
                          transition: "all 0.2s ease-in-out",
                          transform: "scale(1.05)",
                        },
                        transition: "all 0.5s ease-in-out",
                      }}
                    >
                      <Avatar
                        src={role.thumb}
                        alt=""
                        sx={{
                          display: "flex",
                          width: "35%",
                          height: "auto",
                          aspectRatio: "1/1",

                          borderBottomRightRadius: "0%",
                          borderTopRightRadius: "0%",
                        }}
                      />

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "flex-start",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {role.tag}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: "normal",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {role.role}
                        </Typography>
                      </Box>
                    </Box>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            sx={{
              width: "70%",
              zIndex: 1,
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
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  mb: 1,
                }}
              >
                {data?.type === "movie" ? "Similar Movies" : "Episodes"}
              </Typography>

              {data?.type === "show" &&
                data?.Children &&
                data?.Children.size > 1 && (
                  <Select
                    sx={{
                      mb: 1,
                    }}
                    size="small"
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(e.target.value as number);
                    }}
                  >
                    {data?.type === "show" &&
                      data?.Children?.Metadata?.map((season, index) => (
                        <MenuItem value={index}>{season.title}</MenuItem>
                      ))}
                  </Select>
                )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {data?.type === "movie" && similar.status === "loading" && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mt: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {data?.type === "movie" && similar.status === "success" && (
              <Grid container spacing={2}>
                {similar.data?.slice(0, 10).map((movie) => (
                  <Grid item xs={6}>
                    <MovieItem item={movie} />
                  </Grid>
                ))}
              </Grid>
            )}

            {data?.type === "show" && !episodes && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mt: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {data?.type === "show" && episodes && (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  gap: 1,
                }}
              >
                {episodes?.map((episode) => (
                  <EpisodeItem
                    item={episode}
                    onClick={() => {
                      navigate(
                        `/watch/${episode.ratingKey}${
                          episode.viewOffset ? `?t=${episode.viewOffset} ` : ""
                        }`
                      );
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Backdrop>
  );
}

export default MetaScreen;

function EpisodeItem({
  item,
  onClick,
}: {
  item: Plex.Metadata;
  onClick?: (event: React.MouseEvent) => void;
}): JSX.Element {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 1,
        userSelect: "none",
        cursor: "pointer",

        // on hover get the 2nd child and then the 1st child of that
        "&:hover > :nth-child(2)": {
          "& > :nth-child(1)": {
            opacity: 1,
            transition: "all 0.2s ease-in",
          },
        },
      }}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      <Box
        sx={{
          width: "5%",
          display: "flex",
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
            textShadow: "0px 0px 10px #000000",
            textAlign: "center",
          }}
        >
          {item.index}
        </Typography>
      </Box>

      <Box
        sx={{
          width: "25%",
          borderRadius: "5px",
          aspectRatio: "16/9",
          backgroundImage: `url(${getTranscodeImageURL(
            `${item.thumb}?X-Plex-Token=${localStorage.getItem("accessToken")}`,
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
        <PlayArrow
          sx={{
            color: "#FFFFFF",
            fontSize: "400%",
            m: "auto",
            opacity: 0,
            backgroundColor: "#00000088",
            borderRadius: "50%",

            transition: "all 0.5s ease-out",
          }}
        />

        {(item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
          <LinearProgress
            value={
              item.viewOffset ? (item.viewOffset / item.duration) * 100 : 100
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
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#FFFFFF",
              textShadow: "0px 0px 10px #000000",
              // make it so the text doesnt resize the parent nor overflow max 3 rows
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              maxWidth: "80%",
            }}
          >
            {item.title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1,
            }}
          >
            {getMinutes(item.duration)} Min.
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: "medium",
            fontWeight: "light",
            color: "#FFFFFF",
            opacity: 0.7,
            textShadow: "0px 0px 10px #000000",
            mt: -0.5,
            // make it so the text doesnt resize the parent nor overflow max 3 rows
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
          title={item.summary}
        >
          {item.summary}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Calculates the number of minutes from a given duration in milliseconds.
 *
 * @param duration The duration in milliseconds.
 * @returns The number of minutes.
 */
function getMinutes(duration: number): number {
  return Math.floor(duration / 60000);
}
