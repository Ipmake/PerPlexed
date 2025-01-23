import {
  CheckCircle,
  PlayArrow,
  InfoOutlined,
  BookmarkBorder,
  CheckCircleOutline,
  Bookmark,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Tooltip,
  Button,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getTranscodeImageURL,
  getLibraryMeta,
  getLibraryMetaChildren,
  getItemByGUID,
} from "../plex";
import { durationToText } from "./MovieItemSlider";
import { useWatchListCache } from "../states/WatchListCache";
import { useBigReader } from "./BigReader";

function MovieItem({
  item,
  itemsPerPage,
  index,
  PlexTvSource,
}: {
  item: Plex.Metadata;
  itemsPerPage?: number;
  index?: number;
  PlexTvSource?: boolean;
}): JSX.Element {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [playButtonLoading, setPlayButtonLoading] = React.useState(false);

  // 300 x 170
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        width: itemsPerPage
          ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
          : "100%",
        minWidth: itemsPerPage
          ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
          : "100%",
        backgroundColor: "#1C1C1C",

        borderRadius: "7px",
        overflow: "hidden",
        mb: "0px",

        "&:hover": {
          // backgroundColor: "#000000AA",
          // backgroundBlendMode: "darken",
          // backgroundSize: "cover",
          // backgroundPosition: "center",

          transform: "scale(1.15)",
          transition: "all 0.2s ease, transform 0.5s ease",
          zIndex: 1000,
          boxShadow: "0px 0px 20px #000000",
          position: "relative",

          pb: "10px",

          mb: "-42px",
        },

        [`&:hover > :nth-child(${
          item.type === "episode" || (item.type === "movie" && item.viewOffset)
            ? 4
            : 3
        })`]: {
          height: "32px",
        },

        // "&:hover > :nth-child(3)": {
        //   opacity: 1,
        //   transition: "all 0.25s ease-in",
        // },

        transition: "all 0.2s ease, transform 0.5s ease",
        cursor: "pointer",
      }}
      onClick={async () => {
        if (PlexTvSource) {
          const data = await getItemByGUID(item.guid);
          if (!data) {
            useBigReader
              .getState()
              .setBigReader(
                `"${item.title}" is not available on this Plex Server`
              );
            return;
          }

          setSearchParams({ mid: data.ratingKey.toString() });
        } else {
          if (
            item.grandparentRatingKey &&
            ["episode"].includes(item.type)
          )
            return setSearchParams({ mid: item.grandparentRatingKey });

          setSearchParams({ mid: item.ratingKey.toString() });
        }
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16/9",

          backgroundImage: ["episode"].includes(item.type)
            ? `url(${getTranscodeImageURL(
                `${item.thumb}?X-Plex-Token=${localStorage.getItem(
                  "accessToken"
                )}`,
                1200,
                680
              )})`
            : `url(${getTranscodeImageURL(
                `${item.art}?X-Plex-Token=${localStorage.getItem(
                  "accessToken"
                )}`,
                1200,
                680
              )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",

          position: "relative",
        }}
      >
        {((item.type === "show" && item.leafCount === item.viewedLeafCount) ||
          (item.type === "movie" && item?.viewCount && item.viewCount > 0)) && (
          <Box
            sx={{
              width: "80px",
              height: "40px",
              position: "absolute",
              top: "-6px",
              right: "-26px",
              transform: "rotate(45deg)",

              backgroundColor: "#000000AA",

              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "4px",
            }}
          >
            <Tooltip title="Watched" arrow placement="top">
              <CheckCircleOutline
                fontSize="medium"
                sx={{
                  transform: "rotate(-45deg)",
                }}
              />
            </Tooltip>
          </Box>
        )}
      </Box>
      {(item.type === "episode" ||
        (item.type === "movie" && item.viewOffset)) && (
        <LinearProgress
          variant="determinate"
          value={((item?.viewOffset ?? 0) / item.duration) * 100}
          sx={{
            width: "100%",
          }}
        />
      )}
      <Box
        sx={{
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "10px",
          userSelect: "none",
          transition: "all 0.5s ease",
          transform: "translateX(0%)",
          transformStyle: "preserve-3d",
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "0.15em",
            color: "#e6a104",
            textTransform: "uppercase",
            mt: "2px",
          }}
        >
          {item.type} {item.type === "episode" && item.index}
        </Typography>

        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#FFFFFF",
            "@media (max-width: 2000px)": {
              fontSize: "1.2rem",
            },
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            maxLines: 1,
            maxInlineSize: "100%",
            mt: ["episode"].includes(item.type) ? "2px" : "0px",
          }}
        >
          {item.title}
        </Typography>

        {["episode"].includes(item.type) && item.grandparentTitle && (
          <Typography
            onClick={(e) => {
              e.stopPropagation();
              if (!item.grandparentKey?.toString()) return;
              setSearchParams({
                mid: (item.grandparentRatingKey as string).toString(),
              });
            }}
            sx={{
              fontSize: "1rem",
              fontWeight: "normal",
              color: "#FFFFFF",
              opacity: 0.7,
              mt: "4px",
              mb: 0.5,

              transition: "all 0.5s ease",
              "&:hover": {
                opacity: 1,
              },

              textOverflow: "ellipsis",
              overflow: "hidden",
              maxLines: 1,
              maxInlineSize: "100%",
            }}
          >
            {item.grandparentTitle}
          </Typography>
        )}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            mt: "4px",
            gap: 1,
          }}
        >
          {/* {item.rating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              {item.rating}
            </Typography>
          )}
          {item.contentRating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
                border: "1px dotted #AAAAAA",
                borderRadius: "5px",
                px: 1,
                py: -0.5,
              }}
            >
              {item.contentRating}
            </Typography>
          )} */}
          {/* {item.type === "episode" && item.index && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              S{item.parentIndex} E{item.index}
            </Typography>
          )} */}
          {item.duration && ["episode", "movie"].includes(item.type) && (
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "light",
                color: "#FFFFFF",
              }}
            >
              {durationToText(item.duration)}
            </Typography>
          )}
          {item.type === "show" && item.leafCount && item.childCount && (
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "light",
                color: "#FFFFFF",
              }}
            >
              {item.childCount > 1
                ? `${item.childCount} Seasons`
                : `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`}
            </Typography>
          )}

          {item.year && (
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "light",
                color: "#FFFFFF",
              }}
            >
              {item.year}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: "0px", // 32px
          overflow: "hidden",

          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            padding: "2px 10px",
          }}
        >
          <Button
            variant="contained"
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: "#CCCCCC",
              color: "#000000",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              "&:hover": {
                backgroundColor: "primary.main",
              },
              gap: 1,
              transition: "all 0.2s ease-in-out",
              padding: "0px 10px",
              fontSize: "12px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled={playButtonLoading}
            onClick={async (e) => {
              if(!item) return;
              e.stopPropagation();
              setPlayButtonLoading(true);

              let PlexTvSrcData: Plex.Metadata | null = null;
              if (PlexTvSource) {
                PlexTvSrcData = await getItemByGUID(item.guid);

                if (!PlexTvSrcData) {
                  useBigReader
                    .getState()
                    .setBigReader(
                      `"${item.title}" is not available on this Plex Server`
                    );
                  return;
                }
              }

              if(PlexTvSource && !PlexTvSrcData) return;

              let localItem = PlexTvSource ? PlexTvSrcData as Plex.Metadata : item;

              switch (item.type) {
                case "movie":
                case "episode":
                  navigate(
                    `/watch/${localItem.ratingKey}${
                      localItem.viewOffset ? `?t=${localItem.viewOffset}` : ""
                    }`
                  );

                  setPlayButtonLoading(false);
                  break;
                case "show":
                  {
                    const data = await getLibraryMeta(localItem.ratingKey);

                    if (!data) {
                      setPlayButtonLoading(false);
                      return;
                    }

                    if (data.OnDeck?.Metadata) {
                      navigate(
                        `/watch/${data.OnDeck.Metadata.ratingKey}${
                          data.OnDeck.Metadata.viewOffset
                            ? `?t=${data.OnDeck.Metadata.viewOffset}`
                            : ""
                        }`
                      );

                      setPlayButtonLoading(false);
                      return;
                    } else {
                      if (
                        data.Children?.size === 0 ||
                        !data.Children?.Metadata[0]
                      )
                        return setPlayButtonLoading(false);
                      // play first episode
                      const episodes = await getLibraryMetaChildren(
                        data.Children?.Metadata[0].ratingKey
                      );
                      if (episodes?.length === 0)
                        return setPlayButtonLoading(false);

                      navigate(`/watch/${episodes[0].ratingKey}`);
                    }
                  }
                  break;
              }
            }}
          >
            {playButtonLoading ? (
              <CircularProgress size="small" />
            ) : (
              <>
                <PlayArrow fontSize="small" /> Play
              </>
            )}
          </Button>

          <Button
            variant="contained"
            sx={{
              width: "fit-content",
              height: "100%",
              backgroundColor: "#555555",
              color: "#FFFFFF",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              "&:hover": {
                backgroundColor: "#333333",
              },
              gap: 1,
              transition: "all 0.2s ease-in-out",

              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={async (e) => {
              e.stopPropagation();
              if (PlexTvSource) {
                const data = await getItemByGUID(item.guid);
                if (!data) {
                  useBigReader
                    .getState()
                    .setBigReader(
                      `"${item.title}" is not available on this Plex Server`
                    );
                  return;
                }

                setSearchParams({ mid: data.ratingKey.toString() });
              } else {
                if (
                  item.grandparentRatingKey &&
                  ["episode"].includes(item.type)
                )
                  return setSearchParams({ mid: item.grandparentRatingKey });

                setSearchParams({ mid: item.ratingKey.toString() });
              }
            }}
          >
            <InfoOutlined fontSize="small" />
          </Button>

          <WatchListButton item={item} />
        </Box>
      </Box>
      {/* <Box sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          backgroundColor: "#00000055",
          backgroundImage: ["episode"].includes(item.type)
            ? `url(${getTranscodeImageURL(
                `${item.thumb}?X-Plex-Token=${localStorage.getItem(
                  "accessToken"
                )}`,
                300,
                170
              )})`
            : `url(${getTranscodeImageURL(
                `${item.art}?X-Plex-Token=${localStorage.getItem("accessToken")}`,
                300,
                170
              )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(10vw)",
  
          zIndex: -1,
          transform: "translateZ(-10px) scale(1)",
          opacity: 0,
          transition: "all 2s ease",
        }}></Box> */}
    </Box>
  );
}

export default MovieItem;

export function WatchListButton({ item }: { item: Plex.Metadata }) {
  const WatchList = useWatchListCache();

  return (
    <Button
      variant="contained"
      sx={{
        width: "fit-content",
        height: "100%",
        backgroundColor: "#555555",
        color: "#FFFFFF",
        fontSize: "12px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        "&:hover": {
          backgroundColor: "#333333",
        },
        gap: 1,
        transition: "all 0.2s ease-in-out",

        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

        padding: "0px 20px",
        minWidth: "20px",
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!item) return;
        if (WatchList.isOnWatchList(item.guid))
          return WatchList.removeItem(item.guid);

        WatchList.addItem(item);
      }}
    >
      {WatchList.isOnWatchList(item.guid) ? (
        <Bookmark fontSize="small" />
      ) : (
        <BookmarkBorder fontSize="small" />
      )}
    </Button>
  );
}
