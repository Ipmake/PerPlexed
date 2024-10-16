import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import {
  getLibraryMedia,
  getLibraryMeta,
  getLibraryMetaChildren,
  getTranscodeImageURL,
} from "../plex";
import {
  Add,
  ArrowBackIos,
  ArrowForwardIos,
  Bookmark,
  BookmarkBorder,
  CheckCircle,
  InfoOutlined,
  PlayArrow,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";

function MovieItemSlider({
  title,
  libraryID,
  dir,
  link,
  shuffle,
}: {
  title: string;
  libraryID: string;
  dir: string;
  link: string;
  shuffle?: boolean;
}) {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<Plex.Metadata[] | null>(null);

  const [currPage, setCurrPage] = React.useState(0);

  const calculateItemsPerPage = (width: number) => {
    if (width < 400) return 1;
    if (width < 600) return 2;
    if (width < 1200) return 3;
    if (width < 1500) return 4;
    if (width < 2000) return 5;
    if (width < 3000) return 6;
    if (width < 4000) return 7;
    return 6;
  };

  const [itemsPerPage, setItemsPerPage] = React.useState(
    calculateItemsPerPage(window.innerWidth)
  );

  React.useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(calculateItemsPerPage(window.innerWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    getLibraryMedia(libraryID, dir).then((media) => {
      // cut the array down so its a multiple of itemsPerPage
      if (!media) return;
      const roundedMedia = media.slice(0, itemsPerPage * 5);
      console.log(roundedMedia.length);

      setItems(shuffle ? shuffleArray(roundedMedia) : roundedMedia);
    });
  }, []);

  if (!items) return <></>;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "auto",
        gap: "10px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          px: "2.5vw",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            mb: "-10px",
            cursor: "pointer",
            "&:hover": {
              gap: "20px",
            },
            "&:hover > :nth-child(2)": {
              opacity: 1,
              gap: "5px",
            },
            transition: "all 0.5s ease",
          }}
          onClick={() => {
            navigate(link);
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: "2rem",
              fontWeight: "bold",
              mb: "0px",
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              mt: "0px",
              opacity: 0,
              gap: "0px",
              transition: "all 0.5s ease",
              color: "primary.main",
            }}
          >
            <Typography sx={{ fontSize: "1rem", mt: "2px" }}>Browse</Typography>
            <ArrowForwardIos fontSize="small" />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            visibility: items.length > itemsPerPage ? "visible" : "hidden",
          }}
        >
          {Array(Math.ceil(items.length / itemsPerPage))
            .fill(0)
            .map((_, i) => {
              return (
                <Box
                  sx={{
                    width: "10px",
                    height: "4px",
                    backgroundColor: i === currPage ? "#FFFFFF" : "#FFFFFF55",
                    transition: "all 0.5s ease",
                    mx: "2px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setCurrPage(i);
                  }}
                />
              );
            })}
        </Box>
      </Box>
      <Box
        sx={{
          width: "100vw",
          height: "auto",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",

          py: "10px",
          whiteSpace: "nowrap",
          // clipPath: "inset(0px 0px -10px 0px)",
          overflowX: "clip",
          overflowY: "visible",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "calc(2.5vw)",
            height: "16vh",
            position: "absolute",
            left: "0px",
            backgroundColor: "#00000022",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            visibility: items.length > itemsPerPage ? "visible" : "hidden",

            "&:hover": {
              backgroundColor: "#000000AA",
            },

            transition: "all 0.5s ease",
          }}
          onClick={() => {
            setCurrPage((currPage) =>
              currPage - 1 < 0
                ? Math.ceil(items.length / itemsPerPage) - 1
                : currPage - 1
            );
          }}
        >
          <ArrowBackIos fontSize="large" />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            transform: `translateX(calc((-${currPage} * (100vw - 5vw) + 2.5vw)))`,
            alignItems: "center",
            justifyContent: "center",
            width: `auto`,
            gap: "10px",
            transition: "transform 2s ease",
          }}
        >
          {items?.map((item) => {
            return <MovieItem item={item} itemsPerPage={itemsPerPage} />;
          })}
        </Box>
        <Box
          sx={{
            width: "calc(2.5vw)",
            height: "16vh",
            position: "absolute",
            right: "0px",
            backgroundColor: "#00000022",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            visibility: items.length > itemsPerPage ? "visible" : "hidden",

            "&:hover": {
              backgroundColor: "#000000AA",
            },

            transition: "all 0.5s ease",
          }}
          onClick={() => {
            setCurrPage(
              currPage + 1 > Math.ceil(items.length / itemsPerPage) - 1
                ? 0
                : currPage + 1
            );
          }}
        >
          <ArrowForwardIos fontSize="large" />
        </Box>
      </Box>
    </Box>
  );
}

export default MovieItemSlider;

function MovieItem({
  item,
  itemsPerPage,
}: {
  item: Plex.Metadata;
  itemsPerPage: number;
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
        width: `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`,
        minWidth: `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`,
        aspectRatio: "16/9",
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
        backgroundBlendMode: "darken",
        // clipPath: "inset(0px 0px -10px 0px)",
        position: "relative",

        borderRadius: "5px",

        "&:hover": {
          // backgroundColor: "#000000AA",
          // backgroundBlendMode: "darken",
          // backgroundSize: "cover",
          // backgroundPosition: "center",

          transform: "scale(1.15)",
          transition: "all 0.5s ease",
          zIndex: 1000,
          borderRadius: "10px",
          boxShadow: "0px 0px 20px #000000",

          pb: "5px",
        },

        "&:hover > :nth-child(2)": {
          height: "32px",
        },

        "&:hover > :nth-child(3)": {
          opacity: 1,
          transition: "all 0.25s ease-in",
        },

        transition: "all 0.1s ease",
        cursor: "pointer",
      }}
      // onClick={() => {
      //   if (["episode"].includes(item.type))
      //     return navigate(
      //       `/watch/${item.ratingKey}${
      //         item.viewOffset ? `?t=${item.viewOffset}` : ""
      //       }`
      //     );
      //   setSearchParams({ mid: item.ratingKey.toString() });
      // }}
    >
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            transition: "all 0.5s ease",
          }}
        >
          <img
            src="/plexIcon.png"
            alt=""
            height="23"
            style={{
              aspectRatio: 1,
              borderRadius: 8,
            }}
          />
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: "900",
              letterSpacing: "0.1em",
              textShadow: "2px 2px 0px #232529",
              ml: 1,
              color: "#e6a104",
              textTransform: "uppercase",
              mt: "4px",
            }}
          >
            {item.type}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#FFFFFF",
            textShadow: "0px 0px 10px #000000",
            "@media (max-width: 2000px)": {
              fontSize: "1.2rem",
            },
            textOverflow: "ellipsis",
            overflow: "hidden",
            maxLines: 1,
            maxInlineSize: "100%",
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
              mt: -0.5,
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
        <Typography
          sx={{
            fontSize: "medium",
            fontWeight: "light",
            color: "#FFFFFF",
            textShadow: "0px 0px 10px #000000",
            mt: -0.5,

            textOverflow: "ellipsis",
            overflow: "hidden",
            maxLines: 1,
            maxInlineSize: "100%",
          }}
        >
          {item.tagline}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: 0,
            gap: 1,
          }}
        >
          {item.type === "show" && item.leafCount === item.viewedLeafCount && (
            <Tooltip title="Watched" arrow>
              <CheckCircle
                sx={{
                  color: "#00FF00",
                  fontSize: "large",
                  mb: "2px",
                }}
              />
            </Tooltip>
          )}
          {item.year && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                textShadow: "0px 0px 10px #000000",
              }}
            >
              {item.year}
            </Typography>
          )}
          {item.rating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                textShadow: "0px 0px 10px #000000",
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
                textShadow: "0px 0px 10px #000000",
                ml: 1,
                border: "1px dotted #AAAAAA",
                borderRadius: "5px",
                px: 1,
                py: -0.5,
              }}
            >
              {item.contentRating}
            </Typography>
          )}
          {item.type === "episode" && item.index && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                textShadow: "0px 0px 10px #000000",
                ml: 1,
              }}
            >
              S{item.parentIndex} E{item.index}
            </Typography>
          )}
          {item.duration && ["episode", "movie"].includes(item.type) && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                textShadow: "0px 0px 10px #000000",
                ml: 1,
              }}
            >
              {durationToText(item.duration)}
            </Typography>
          )}
          {item.type === "show" && item.leafCount && item.childCount && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                textShadow: "0px 0px 10px #000000",
                ml: 1,
              }}
            >
              {item.childCount > 1
                ? `${item.childCount} Seasons`
                : `${item.leafCount} Episode${item.leafCount > 1 ? "s" : ""}`}
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
          transition: "all 0.25s ease-in",
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
            onClick={async () => {
              setPlayButtonLoading(true);

              switch (item.type) {
                case "episode":
                  navigate(
                    `/watch/${item.ratingKey}${
                      item.viewOffset ? `?t=${item.viewOffset}` : ""
                    }`
                  );

                  setPlayButtonLoading(false);
                  break;
                case "show":
                  {
                    const data = await getLibraryMeta(item.ratingKey);

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
                case "movie":
                  navigate(`/watch/${item.ratingKey}`);
                  setPlayButtonLoading(false);
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
              width: "100%",
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
            onClick={() => {
              if (item.grandparentRatingKey && ["episode"].includes(item.type))
                return setSearchParams({ mid: item.grandparentRatingKey });

              setSearchParams({ mid: item.ratingKey.toString() });
            }}
          >
            <InfoOutlined fontSize="small" /> More Info
          </Button>

          {/* <Button
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
            onClick={() => {}}
          >
            <BookmarkBorder fontSize="small" />
          </Button> */}
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

export function durationToText(duration: number): string {
  const hours = Math.floor(duration / 1000 / 60 / 60);
  const minutes = (duration / 1000 / 60 / 60 - hours) * 60;

  return (
    `${hours}h` + (Math.floor(minutes) > 0 ? ` ${Math.floor(minutes)}m` : "")
  );
}

export const shuffleArray = (array: any[]) => {
  const oldArray = [...array];
  const newArray = [];

  while (oldArray.length) {
    const index = Math.floor(Math.random() * oldArray.length);
    newArray.push(oldArray.splice(index, 1)[0]);
  }

  return newArray;
};
