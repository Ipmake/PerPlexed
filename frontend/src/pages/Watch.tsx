import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getLibraryMeta,
  getPlayQueue,
  getServerPreferences,
  getTimelineUpdate,
  getTranscodeImageURL,
  getUniversalDecision,
  putAudioStream,
  putSubtitleStream,
} from "../plex";
import CenteredSpinner from "../components/CenteredSpinner";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  Popover,
  Slider,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";
import ReactPlayer from "react-player";
import { getXPlexProps, queryBuilder } from "../plex/QuickFunctions";
import {
  ArrowBackIos,
  ArrowBackIosNew,
  Check,
  Fullscreen,
  Pause,
  PlayArrow,
  SkipNext,
  Tune,
  VolumeUp,
} from "@mui/icons-material";
import { VideoSeekSlider } from "react-video-seek-slider";
import "react-video-seek-slider/styles.css";
import { useSessionStore } from "../states/SessionState";

let SessionID = "";
export { SessionID };

function Watch() {
  const { itemID } = useParams<{ itemID: string }>();
  const [params] = useSearchParams();
  const theme = useTheme();
  const navigate = useNavigate();

  const { sessionID } = useSessionStore();

  const [metadata, setMetadata] = useState<Plex.Metadata | null>(null);
  const [showmetadata, setShowMetadata] = useState<Plex.Metadata | null>(null);
  const [playQueue, setPlayQueue] = useState<Plex.Metadata[] | null>(null); // [current, ...next]
  const player = useRef<ReactPlayer | null>(null);
  const [quality, setQuality] = useState<{
    bitrate?: number;
    auto?: boolean;
  }>({
    ...(localStorage.getItem("quality") && {
      bitrate: parseInt(localStorage.getItem("quality") ?? "10000"),
    }),
  });

  const [volume, setVolume] = useState<number>(
    parseInt(localStorage.getItem("volume") ?? "100")
  );

  const lastAppliedTime = useRef<number>(0);

  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(playing);
  const [ready, setReady] = useState(false);
  const seekToAfterLoad = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const [volumePopoverAnchor, setVolumePopoverAnchor] =
    useState<HTMLButtonElement | null>(null);
  const volumePopoverOpen = Boolean(volumePopoverAnchor);

  const [showTune, setShowTune] = useState(false);
  const [tunePage, setTunePage] = useState<number>(0); // 0: menu, 1: video, 2: audio, 3: subtitles
  const tuneButtonRef = useRef<HTMLButtonElement | null>(null);

  const playbackBarRef = useRef<HTMLDivElement | null>(null);

  const [buffering, setBuffering] = useState(false);
  const [showError, setShowError] = useState<string | false>(false);

  const loadMetadata = async (itemID: string) => {
    await getUniversalDecision(itemID, {
      maxVideoBitrate: quality.bitrate,
      autoAdjustQuality: quality.auto,
    });

    let Metadata: Plex.Metadata | null = null;
    await getLibraryMeta(itemID).then((metadata) => {
      Metadata = metadata;
      if (["movie", "episode"].includes(metadata.type)) {
        setMetadata(metadata);
        if (metadata.type === "episode") {
          getLibraryMeta(metadata.grandparentRatingKey as string).then(
            (show) => {
              setShowMetadata(show);
            }
          );
        }
      } else {
        console.error("Invalid metadata type");
      }
    });

    if (!Metadata) return;
    const serverPreferences = await getServerPreferences();

    getPlayQueue(
      `server://${
        serverPreferences.machineIdentifier
      }/com.plexapp.plugins.library/library/metadata/${
        (Metadata as Plex.Metadata).ratingKey
      }`
    ).then((queue) => {
      setPlayQueue(queue);
    });
  };

  const [url, setURL] = useState<string>("");
  const getUrl = `${localStorage.getItem(
    "server"
  )}/video/:/transcode/universal/start.mpd?${queryBuilder({
    hasMDE: 1,
    path: `/library/metadata/${itemID}`,
    mediaIndex: 0,
    partIndex: 0,
    protocol: "dash",
    fastSeek: 1,
    directPlay: 0,
    directStream: 1,
    subtitleSize: 100,
    audioBoost: 100,
    location: "lan",
    autoAdjustQuality: 0,
    directStreamAudio: 12835,
    mediaBufferSize: 102400,
    subtitles: "burn",
    "Accept-Language": "en",
    ...getXPlexProps(),
  })}`;

  const [showControls, setShowControls] = useState(true);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let whenMouseMoves = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    document.addEventListener("mousemove", whenMouseMoves);
    return () => {
      document.removeEventListener("mousemove", whenMouseMoves);
    };
  }, [playing]);

  const [showInfo, setShowInfo] = useState(false);
  useEffect(() => {
    playingRef.current = playing;

    if (!playingRef.current) {
      setTimeout(() => {
        if (!playingRef.current) setShowInfo(true);
      }, 5000);
    } else {
      setShowInfo(false);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) return;

    if (showControls) document.body.style.cursor = "default";
    else document.body.style.cursor = "none";

    return () => {
      document.body.style.cursor = "default";
    };
  }, [playing, showControls]);

  useEffect(() => {
    if (!itemID) return;
    // timeline report update cycle
    const updateInterval = setInterval(async () => {
      if (!itemID || !player.current) return;
      getTimelineUpdate(
        parseInt(itemID),
        Math.floor(player.current?.getDuration()) * 1000,
        buffering ? "buffering" : playing ? "playing" : "paused",
        Math.floor(player.current?.getCurrentTime()) * 1000
      );
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [buffering, itemID, playing]);

  useEffect(() => {
    // set css style for .ui-video-seek-slider .track .main .connect
    const style = document.createElement("style");
    style.innerHTML = `
      .ui-video-seek-slider .track .main .connect {
        background-color: ${theme.palette.primary.main};
      }
      .ui-video-seek-slider .thumb .handler {
        background-color: ${theme.palette.primary.main};
      }
    `;
    document.head.appendChild(style);

    setReady(false);

    if (!itemID) return;

    loadMetadata(itemID);
    setURL(getUrl);
    setShowError(false);
  }, [itemID, theme.palette.primary.main]);

  useEffect(() => {
    SessionID = sessionID;
  }, [sessionID]);

  useEffect(() => {
    if (!player.current) return;

    if (ready && !playing) setPlaying(true);
  }, [ready]);


  // playback controll buttons 
  // SPACE: play/pause
  // LEFT: seek back 10 seconds
  // RIGHT: seek forward 10 seconds
  // UP: increase volume
  // DOWN: decrease volume
  // , (comma): Back 1 frame
  // . (period): Forward 1 frame
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && player.current) {
        setPlaying(!playing);
      }
      if (e.key === "ArrowLeft" && player.current) {
        player.current.seekTo(player.current.getCurrentTime() - 10);
      }
      if (e.key === "ArrowRight" && player.current) {
        player.current.seekTo(player.current.getCurrentTime() + 10);
      }
      if (e.key === "ArrowUp" && player.current) {
        setVolume(Math.min(volume + 5, 100));
      }
      if (e.key === "ArrowDown" && player.current) {
        setVolume(Math.max(volume - 5, 0));
      }
      if (e.key === "," && player.current) {
        player.current.seekTo(player.current.getCurrentTime() - 0.04);
      }
      if (e.key === "." && player.current) {
        player.current.seekTo(player.current.getCurrentTime() + 0.04);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [playing, volume]);

  return (
    <>
      <Backdrop
        open={showError !== false}
        sx={{
          zIndex: 5000,
        }}
      >
        <Box
          sx={{
            p: 2,
            background: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography>{showError}</Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={() => {
                setShowError(false);
                window.location.reload();
              }}
            >
              Reload
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setShowError(false);
                if (!metadata) return navigate("/");

                if (metadata.type === "movie")
                  navigate(
                    `/browse/${metadata.librarySectionID}?${queryBuilder({
                      mid: metadata.ratingKey,
                    })}`
                  );

                if (metadata.type === "episode")
                  navigate(
                    `/browse/${metadata.librarySectionID}?${queryBuilder({
                      mid: metadata.grandparentRatingKey,
                    })}`
                  );
              }}
            >
              Home
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setShowError(false);
              }}
            >
              Ignore
            </Button>
          </Box>
        </Box>
      </Backdrop>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: buffering ? "flex" : "none",
            zIndex: 2,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <CenteredSpinner />
        </Box>
        <Box
          sx={{
            background: "#000000BB",
            width: "100vw",
            height: "100vh",
            position: "absolute",
            padding: "10px",
            left: "0",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            px: "5vw",
            gap: "5vw",

            opacity: showInfo ? 1 : 0,
            transition: "all 0.5s ease-in-out",
          }}
        >
          <img
            src={`${getTranscodeImageURL(
              `${metadata?.thumb}?X-Plex-Token=${localStorage.getItem(
                "accessToken"
              )}`,
              1500,
              1500
            )}`}
            alt=""
            style={{
              height: "25vw",
              width: "auto",
              borderRadius: "0px",
              boxShadow: "0px 0px 10px 0px #000000AA",
              transform: `translateX(${
                showInfo ? 0 : -40
              }vw) perspective(1000px) rotateY(${showInfo ? 0 : -30}deg)`,
              transition: "transform 0.5s ease-in-out",
              transitionDelay: "0.2s",
            }}
          />
          <Box
            sx={{
              width: "40vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              textAlign: "left",
              transform: `translateX(${showInfo ? 0 : -80}vw)`,
              transition: "transform 0.5s ease-in-out",
              transitionDelay: "0s",
            }}
          >
            {metadata && metadata?.type === "episode" && (
              <>
                <Typography
                  sx={{
                    fontSize: "2vw",
                    fontWeight: "bold",
                    color: "#FFF",
                  }}
                >
                  {metadata?.grandparentTitle}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1vw",
                    color: "#FFF",
                    mt: "-0.75vw",
                  }}
                >
                  {showmetadata?.childCount &&
                    showmetadata?.childCount > 1 &&
                    `Season ${metadata.parentIndex}`}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1vw",
                    fontWeight: "bold",
                    color: "#FFF",
                    mt: "10px",
                  }}
                >
                  {metadata?.title}: EP. {metadata?.index}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75vw",
                    color: "#FFF",
                  }}
                >
                  {metadata?.summary}
                </Typography>
              </>
            )}
            {metadata && metadata?.type === "movie" && (
              <>
                <Typography
                  sx={{
                    fontSize: "2vw",
                    fontWeight: "bold",
                    color: "#FFF",
                  }}
                >
                  {metadata?.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1vw",
                    color: "#FFF",
                    mt: "-0.75vw",
                  }}
                >
                  {metadata?.year}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1vw",
                    fontWeight: "bold",
                    color: "#FFF",
                    mt: "10px",
                  }}
                >
                  {metadata?.tagline}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75vw",
                    color: "#FFF",
                  }}
                >
                  {metadata?.summary}
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Popover
          open={showTune}
          anchorEl={tuneButtonRef.current}
          onClose={() => {
            setShowTune(false);
            setTunePage(0);
          }}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
        >
          <Box
            sx={{
              width: 350,
              height: "auto",
            }}
          >
            {tunePage === 0 && (
              <>
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 1,
                  text: "Video",
                })}
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 2,
                  text: "Audio",
                })}
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 3,
                  text: "Subtitles",
                })}
              </>
            )}

            {tunePage === 1 && metadata?.Media && (
              <>
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 0,
                  text: "Back",
                })}

                {getCurrentVideoLevels(
                  metadata.Media[0].videoResolution,
                  `${Math.floor(metadata.Media[0].bitrate / 1000)}Mbps`
                ).map((qualityOption) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      width: "100%",
                      height: "50px",
                      px: 2,

                      userSelect: "none",
                      cursor: "pointer",

                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                        transition: "background-color 0.2s",
                      },
                      transition: "background-color 0.5s",
                    }}
                    onClick={async () => {
                      if (!metadata.Media || !itemID) return;
                      setTunePage(0);
                      await loadMetadata(itemID);
                      await getUniversalDecision(
                        itemID,
                        qualityOption.original
                          ? {}
                          : {
                              maxVideoBitrate: qualityOption.bitrate,
                            }
                      );
                      setQuality({
                        bitrate: qualityOption.original
                          ? undefined
                          : qualityOption.bitrate,
                        auto: undefined,
                      });

                      if (qualityOption.original)
                        localStorage.removeItem("quality");
                      else if (qualityOption.bitrate)
                        localStorage.setItem(
                          "quality",
                          qualityOption.bitrate.toString()
                        );

                      const progress = player.current?.getCurrentTime() ?? 0;

                      if (!seekToAfterLoad.current)
                        seekToAfterLoad.current = progress;
                      setURL("");
                      setURL(getUrl);
                    }}
                  >
                    {qualityOption.bitrate === quality.bitrate && (
                      <Check
                        sx={{
                          mr: "auto",
                        }}
                        fontSize="medium"
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      <strong
                        style={{
                          fontWeight: "normal",
                          opacity: 0.5,
                          marginRight: "4px",
                        }}
                      >
                        {qualityOption.extra}
                      </strong>
                      {qualityOption.title}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            {tunePage === 2 && metadata?.Media && (
              <>
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 0,
                  text: "Back",
                })}

                {metadata?.Media[0].Part[0].Stream.filter(
                  (stream) => stream.streamType === 2
                ).map((stream) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      width: "100%",
                      height: "50px",
                      px: 2,

                      userSelect: "none",
                      cursor: "pointer",

                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                        transition: "background-color 0.2s",
                      },
                      transition: "background-color 0.5s",
                    }}
                    onClick={async () => {
                      if (!metadata.Media || !itemID) return;
                      await putAudioStream(
                        metadata.Media[0].Part[0].id,
                        stream.id
                      );
                      setTunePage(0);
                      await loadMetadata(itemID);
                      await getUniversalDecision(itemID, {
                        maxVideoBitrate: quality.bitrate,
                        autoAdjustQuality: quality.auto,
                      });

                      const progress = player.current?.getCurrentTime() ?? 0;

                      if (!seekToAfterLoad.current)
                        seekToAfterLoad.current = progress;
                      setURL("");
                      setURL(getUrl);
                    }}
                  >
                    {stream.selected && (
                      <Check
                        sx={{
                          mr: "auto",
                        }}
                        fontSize="medium"
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {stream.displayTitle}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            {tunePage === 3 && metadata?.Media && (
              <>
                {TuneSettingTab(theme, setTunePage, {
                  pageNum: 0,
                  text: "Back",
                })}

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    width: "100%",
                    height: "50px",
                    px: 2,

                    userSelect: "none",
                    cursor: "pointer",

                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                      transition: "background-color 0.2s",
                    },
                    transition: "background-color 0.5s",
                  }}
                  onClick={async () => {
                    if (!metadata.Media || !itemID) return;
                    await putSubtitleStream(metadata.Media[0].Part[0].id, 0);
                    setTunePage(0);
                    await loadMetadata(itemID);
                    await getUniversalDecision(itemID, {
                      maxVideoBitrate: quality.bitrate,
                      autoAdjustQuality: quality.auto,
                    });

                    const progress = player.current?.getCurrentTime() ?? 0;

                    if (!seekToAfterLoad.current)
                      seekToAfterLoad.current = progress;
                    setURL("");
                    setURL(getUrl);
                  }}
                >
                  {metadata?.Media[0].Part[0].Stream.filter(
                    (stream) => stream.selected && stream.streamType === 3
                  ).length === 0 && (
                    <Check
                      sx={{
                        mr: "auto",
                      }}
                      fontSize="medium"
                    />
                  )}
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    None
                  </Typography>
                </Box>

                {metadata?.Media[0].Part[0].Stream.filter(
                  (stream) => stream.streamType === 3
                ).map((stream) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      width: "100%",
                      height: "50px",
                      px: 2,

                      userSelect: "none",
                      cursor: "pointer",

                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                        transition: "background-color 0.2s",
                      },
                      transition: "background-color 0.5s",
                    }}
                    onClick={async () => {
                      if (!metadata.Media || !itemID) return;
                      await putSubtitleStream(
                        metadata.Media[0].Part[0].id,
                        stream.id
                      );
                      setTunePage(0);
                      await loadMetadata(itemID);
                      console.log(
                        await getUniversalDecision(itemID, {
                          maxVideoBitrate: quality.bitrate,
                          autoAdjustQuality: quality.auto,
                        })
                      );

                      const progress = player.current?.getCurrentTime() ?? 0;

                      if (!seekToAfterLoad.current)
                        seekToAfterLoad.current = progress;
                      setURL("");
                      setURL(getUrl);
                    }}
                  >
                    {stream.selected && (
                      <Check
                        sx={{
                          mr: "auto",
                        }}
                        fontSize="medium"
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {stream.extendedDisplayTitle}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Popover>
        {(() => {
          if (!metadata) return <CenteredSpinner />;

          return (
            <>
              <Fade
                mountOnEnter
                unmountOnExit
                in={
                  metadata.Marker &&
                  metadata.Marker.filter(
                    (marker) =>
                      marker.startTimeOffset / 1000 <= progress &&
                      marker.endTimeOffset / 1000 >= progress &&
                      marker.type === "intro"
                  ).length > 0
                }
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: `${
                      (playbackBarRef.current?.clientHeight ?? 0) + 40
                    }px`,
                    right: "40px",
                    zIndex: 2,
                  }}
                >
                  <Button
                    sx={{
                      width: "auto",
                      px: 3,
                      py: 1,

                      background: theme.palette.text.primary,
                      color: theme.palette.background.paper,
                      transition: "all 0.25s",

                      "&:hover": {
                        background: theme.palette.text.primary,
                        color: theme.palette.background.paper,

                        boxShadow: "0px 0px 10px 0px #000000AA",
                        px: 4,
                      },
                    }}
                    variant="contained"
                    onClick={() => {
                      if (!player.current || !metadata?.Marker) return;
                      const time =
                        metadata.Marker?.filter(
                          (marker) =>
                            marker.startTimeOffset / 1000 <= progress &&
                            marker.endTimeOffset / 1000 >= progress &&
                            marker.type === "intro"
                        )[0].endTimeOffset / 1000;
                      player.current.seekTo(time + 1);
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s",
                        gap: 1,
                      }}
                    >
                      <SkipNext />{" "}
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Skip Intro
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              </Fade>

              <Fade
                mountOnEnter
                unmountOnExit
                in={
                  metadata.Marker &&
                  metadata.Marker.filter(
                    (marker) =>
                      marker.startTimeOffset / 1000 <= progress &&
                      marker.endTimeOffset / 1000 >= progress &&
                      marker.type === "credits" &&
                      !marker.final
                  ).length > 0
                }
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: `${
                      (playbackBarRef.current?.clientHeight ?? 0) + 40
                    }px`,
                    right: "40px",
                    zIndex: 2,
                  }}
                >
                  <Button
                    sx={{
                      width: "auto",
                      px: 3,
                      py: 1,

                      background: theme.palette.text.primary,
                      color: theme.palette.background.paper,
                      transition: "all 0.25s",

                      "&:hover": {
                        background: theme.palette.text.primary,
                        color: theme.palette.background.paper,

                        boxShadow: "0px 0px 10px 0px #000000AA",
                        px: 4,
                      },
                    }}
                    variant="contained"
                    onClick={() => {
                      if (!player.current || !metadata?.Marker) return;
                      const time =
                        metadata.Marker?.filter(
                          (marker) =>
                            marker.startTimeOffset / 1000 <= progress &&
                            marker.endTimeOffset / 1000 >= progress &&
                            marker.type === "credits" &&
                            !marker.final
                        )[0].endTimeOffset / 1000;
                      player.current.seekTo(time + 1);
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s",
                        gap: 1,
                      }}
                    >
                      <SkipNext />{" "}
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Skip Credits
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              </Fade>

              <Fade
                mountOnEnter
                unmountOnExit
                in={
                  metadata.Marker &&
                  metadata.Marker.filter(
                    (marker) =>
                      marker.startTimeOffset / 1000 <= progress &&
                      marker.endTimeOffset / 1000 >= progress &&
                      marker.type === "credits" &&
                      marker.final
                  ).length > 0
                }
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: `${
                      (playbackBarRef.current?.clientHeight ?? 0) + 40
                    }px`,
                    right: "40px",
                    zIndex: 2,
                  }}
                >
                  <Button
                    sx={{
                      width: "auto",
                      px: 3,
                      py: 1,

                      background: theme.palette.text.primary,
                      color: theme.palette.background.paper,
                      transition: "all 0.25s",

                      "&:hover": {
                        background: theme.palette.text.primary,
                        color: theme.palette.background.paper,

                        boxShadow: "0px 0px 10px 0px #000000AA",
                        px: 4,
                      },
                    }}
                    variant="contained"
                    onClick={async () => {
                      if (!player.current || !metadata?.Marker) return;

                      if (metadata.type === "movie")
                        return navigate(
                          `/browse/${metadata.librarySectionID}?${queryBuilder({
                            mid: metadata.ratingKey,
                          })}`
                        );

                      console.log(playQueue);

                      if (!playQueue) return;
                      const next = playQueue[1];
                      if (!next)
                        return navigate(
                          `/browse/${metadata.librarySectionID}?${queryBuilder({
                            mid: metadata.grandparentRatingKey,
                            pid: metadata.parentRatingKey,
                            iid: metadata.ratingKey,
                          })}`
                        );

                      navigate(`/watch/${next.ratingKey}`);
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s",
                        gap: 1,
                      }}
                    >
                      <SkipNext />{" "}
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        {metadata.type === "movie"
                          ? "Skip Credits"
                          : playQueue && playQueue[1]
                          ? "Next Episode"
                          : "Return to Show"}
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              </Fade>

              <Fade
                in={showControls || !playing}
                style={{
                  transitionDuration: "1s",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    width: "100vw",
                    height: "100vh",

                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      mt: 2,
                      mx: 2,

                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        if (itemID && player.current)
                          getTimelineUpdate(
                            parseInt(itemID),
                            Math.floor(player.current?.getDuration() * 1000),
                            "stopped",
                            Math.floor(player.current?.getCurrentTime() * 1000)
                          );
                        if (metadata.type === "movie")
                          navigate(
                            `/browse/${
                              metadata.librarySectionID
                            }?${queryBuilder({
                              mid: metadata.ratingKey,
                            })}`
                          );

                        if (metadata.type === "episode")
                          navigate(
                            `/browse/${
                              metadata.librarySectionID
                            }?${queryBuilder({
                              mid: metadata.grandparentRatingKey,
                            })}`
                          );
                      }}
                    >
                      <ArrowBackIosNew fontSize="large" />
                    </IconButton>
                  </Box>

                  <Box
                    ref={playbackBarRef}
                    sx={{
                      mt: "auto",
                      mb: 2,
                      mx: 2,

                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          px: 2,
                          height: "18px",
                        }}
                      >
                        <VideoSeekSlider
                        
                          max={(player.current?.getDuration() ?? 0) * 1000}
                          currentTime={progress * 1000}
                          bufferTime={buffered * 1000}
                          onChange={(value) => {
                            player.current?.seekTo(value / 1000);
                          }}
                          getPreviewScreenUrl={(value) => {
                            if (!metadata.Media) return "";
                            return `${localStorage.getItem(
                              "server"
                            )}/photo/:/transcode?${queryBuilder({
                              width: "240",
                              height: "135",
                              minSize: "1",
                              upscale: "1",
                              url: `/library/parts/${
                                metadata.Media[0].Part[0].id
                              }/indexes/sd/${value}?X-Plex-Token=${
                                localStorage.getItem("accessToken") as string
                              }`,
                              "X-Plex-Token": localStorage.getItem(
                                "accessToken"
                              ) as string,
                            })}`;
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography textAlign="right" sx={{
                          mb: "-1px",
                        }}>
                          {getFormatedTime(
                            (player.current?.getDuration() ?? 0) - progress
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          mr: "auto",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          onClick={() => {
                            setPlaying(!playing);
                          }}
                        >
                          {playing ? (
                            <Pause fontSize="large" />
                          ) : (
                            <PlayArrow fontSize="large" />
                          )}
                        </IconButton>

                        {playQueue && playQueue[1] && (
                          <IconButton
                            onClick={() => {
                              navigate(`/watch/${playQueue[1].ratingKey}`);
                            }}
                          >
                            <SkipNext fontSize="large" />
                          </IconButton>
                        )}
                      </Box>

                      {metadata.type === "movie" && (
                        <Box
                          sx={{
                            mr: "auto",
                            fontSize: 18,
                            fontWeight: "bold",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {metadata.title}
                        </Box>
                      )}

                      {metadata.type === "episode" && (
                        <Box
                          sx={{
                            mr: "auto",
                            fontSize: 18,
                            fontWeight: "bold",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {metadata.grandparentTitle} - S{metadata.parentIndex}E
                          {metadata.index} - {metadata.title}
                        </Box>
                      )}

                      <Popover
                        open={volumePopoverOpen}
                        anchorEl={volumePopoverAnchor}
                        onClose={() => {
                          setVolumePopoverAnchor(null);
                        }}
                        anchorOrigin={{
                          vertical: "top",
                          horizontal: "center",
                        }}
                        transformOrigin={{
                          vertical: "bottom",
                          horizontal: "center",
                        }}
                        sx={{
                          "& .MuiPaper-root": {
                            py: 2,
                          },
                        }}
                      >
                        <Slider
                          sx={{
                            height: "100px",
                          }}
                          value={volume}
                          onChange={(event, value) => {
                            setVolume(value as number);
                            localStorage.setItem("volume", value.toString());
                          }}
                          aria-labelledby="continuous-slider"
                          min={0}
                          max={100}
                          step={1}
                          orientation="vertical"
                        />
                      </Popover>

                      <IconButton
                        onClick={(event) => {
                          setVolumePopoverAnchor(event.currentTarget);
                        }}
                      >
                        <VolumeUp fontSize="large" />
                      </IconButton>

                      <IconButton
                        onClick={(event) => {
                          setShowTune(!showTune);
                          setTunePage(0);
                          tuneButtonRef.current = event.currentTarget;
                        }}
                      >
                        <Tune fontSize="large" />
                      </IconButton>

                      <IconButton
                        onClick={() => {
                          if (!document.fullscreenElement)
                            document.documentElement.requestFullscreen();
                          else document.exitFullscreen();
                        }}
                      >
                        <Fullscreen fontSize="large" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Fade>

              <ReactPlayer
                ref={player}
                playing={playing}
                volume={volume / 100}
                onReady={() => {
                  if (!player.current) return;
                  setReady(true);

                  if (seekToAfterLoad.current !== null) {
                    player.current.seekTo(seekToAfterLoad.current);
                    seekToAfterLoad.current = null;
                  }

                  if (!params.has("t")) return;
                  if (
                    lastAppliedTime.current === parseInt(params.get("t") ?? "0")
                  )
                    return;
                  player.current.seekTo(
                    parseInt(params.get("t") ?? "0") / 1000
                  );
                  lastAppliedTime.current = parseInt(params.get("t") ?? "0");
                }}
                onProgress={(progress) => {
                  setProgress(progress.playedSeconds);
                  setBuffered(progress.loadedSeconds);
                }}
                onPause={() => {
                  setPlaying(false);
                }}
                onPlay={() => {
                  setPlaying(true);
                }}
                onBuffer={() => {
                  setBuffering(true);
                }}
                onBufferEnd={() => {
                  setBuffering(false);
                }}
                onError={(error) => {
                  console.log("Player error:");
                  console.error(error);
                  // window.location.reload();

                  // filter out links from the error message
                  const message = error.error.message.replace(
                    /https?:\/\/[^\s]+/g,
                    "Media"
                  );

                  setShowError(message);
                }}
                config={{
                  file: {
                    forceDASH: true,
                    forceDisableHls: true,
                    attributes: {
                      controlsList: "nodownload",
                      disablePictureInPicture: true,
                      disableRemotePlayback: true,
                      autoplay: true,
                    },
                  },
                }}
                onEnded={() => {
                  if (!playQueue) return;

                  if (metadata.type !== "episode")
                    return navigate(
                      `/browse/${metadata.librarySectionID}?${queryBuilder({
                        mid: metadata.ratingKey,
                      })}`
                    );

                  const next = playQueue[1];
                  if (!next)
                    return navigate(
                      `/browse/${metadata.librarySectionID}?${queryBuilder({
                        mid: metadata.grandparentRatingKey,
                        pid: metadata.parentRatingKey,
                        iid: metadata.ratingKey,
                      })}`
                    );

                  navigate(`/watch/${next.ratingKey}`);
                }}
                url={url}
                width="100%"
                height="100%"
              />
            </>
          );
        })()}
      </Box>
    </>
  );
}

export default Watch;
function TuneSettingTab(
  theme: Theme,
  setTunePage: React.Dispatch<React.SetStateAction<number>>,
  props: {
    pageNum: number;
    text: string;
  }
) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "50px",
        px: 2,

        userSelect: "none",
        cursor: "pointer",

        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          transition: "background-color 0.2s",
        },
        transition: "background-color 0.5s",
      }}
      onClick={() => {
        setTunePage(props.pageNum);
      }}
    >
      <ArrowBackIos
        sx={{
          mr: "auto",
        }}
        fontSize="medium"
      />
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        {props.text}
      </Typography>
    </Box>
  );
}

export function getFormatedTime(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  // only show hours if there are any
  if (hours > 0)
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function getCurrentVideoLevels(
  resolution: string,
  extraForOriginal = "Auto"
) {
  const levels: {
    title: string;
    bitrate?: number;
    extra: string;
    original?: boolean;
  }[] = [
    {
      title: "Original",
      bitrate: 0,
      extra: extraForOriginal,
      original: true,
    },
  ];

  switch (resolution) {
    case "720":
      levels.push(
        ...[
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ]
      );
      break;
    case "4k":
      levels.push(
        ...[
          {
            title: "Convert to 4K",
            bitrate: 40000,
            extra: "(High) 40Mbps",
          },
          {
            title: "Convert to 4K",
            bitrate: 30000,
            extra: "(Medium) 30Mbps",
          },
          {
            title: "Convert to 4K",
            bitrate: 20000,
            extra: "20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 20000,
            extra: "(High) 20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 12000,
            extra: "(Medium) 12Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 10000,
            extra: "10Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ]
      );
      break;

    case "1080":
    default:
      levels.push(
        ...[
          {
            title: "Convert to 1080p",
            bitrate: 20000,
            extra: "(High) 20Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 12000,
            extra: "(Medium) 12Mbps",
          },
          {
            title: "Convert to 1080p",
            bitrate: 10000,
            extra: "10Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 4000,
            extra: "(High) 4Mbps",
          },
          {
            title: "Convert to 720p",
            bitrate: 3000,
            extra: "(Medium) 3Mbps",
          },
          { title: "Convert to 720p", bitrate: 2000, extra: "2Mbps" },
          { title: "Convert to 480p", bitrate: 1500, extra: "1.5Mbps" },
          { title: "Convert to 360p", bitrate: 750, extra: "0.7Mbps" },
          { title: "Convert to 240p", bitrate: 300, extra: "0.3Mbps" },
        ]
      );
      break;
  }

  return levels;
}
