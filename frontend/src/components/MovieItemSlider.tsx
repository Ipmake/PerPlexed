import { Box, Typography } from "@mui/material";
import React from "react";
import { getLibraryMedia, getTranscodeImageURL } from "../plex";
import {
  ArrowBackIos,
  ArrowForwardIos,
  CheckCircle,
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
    if(width < 400) return 1;
    if (width < 600) return 2;
    if (width < 1200) return 3;
    if (width < 1500) return 4;
    if (width < 2000) return 5;
    if (width < 3000) return 6;
    if (width < 4000) return 7;
    return 6;
  }

  const [itemsPerPage, setItemsPerPage] = React.useState(calculateItemsPerPage(window.innerWidth));
  
  React.useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(calculateItemsPerPage(window.innerWidth));
    }
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
              mb: "7px",
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
              mt: "5px",
              opacity: 0,
              gap: "0px",
              transition: "all 0.5s ease",
              color: "primary.main",
            }}
          >
            <Typography sx={{ fontSize: "1rem", mb: "3px" }}>Browse</Typography>
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

          overflow: "hidden",
          whiteSpace: "nowrap",
          clipPath: "inset(0px 0px -10px 0px)",
        }}
      >
        <Box
          sx={{
            width: "calc(2.5vw)",
            height: "16vh",
            position: "absolute",
            left: "0px",
            backgroundColor: "#00000055",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            visibility: items.length > itemsPerPage ? "visible" : "hidden",
          }}
          onClick={() => {
            setCurrPage((currPage) =>
              currPage - 1 < 0 ? Math.ceil(items.length / itemsPerPage) - 1 : currPage - 1
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
            backgroundColor: "#00000055",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            visibility: items.length > itemsPerPage ? "visible" : "hidden",
          }}
          onClick={() => {
            setCurrPage(
              currPage + 1 > Math.ceil(items.length / itemsPerPage) - 1 ? 0 : currPage + 1
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

function MovieItem({ item, itemsPerPage }: { item: Plex.Metadata, itemsPerPage: number }): JSX.Element {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();


  // 300 x 170
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`,
        minWidth: `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`,
        aspectRatio: "16/9",
        backgroundColor: "#00000055",
        backgroundImage: ["episode"].includes(item.type)
          ? `url(${getTranscodeImageURL(`${item.thumb}?X-Plex-Token=${localStorage.getItem("accessToken")}`, 300, 170)})`
          : `url(${getTranscodeImageURL(`${item.art}?X-Plex-Token=${localStorage.getItem("accessToken")}`, 300, 170)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "darken",
        overflow: "hidden",
        whiteSpace: "nowrap",
        clipPath: "inset(0px 0px -10px 0px)",

        "&:hover": {
          backgroundColor: "#000000AA",
          backgroundBlendMode: "darken",
          backgroundSize: "cover",
          backgroundPosition: "center",
        },

        "&:hover > :nth-child(1)": {
          transform: "translateX(0%)",
        },

        transition: "all 0.5s ease",
        cursor: "pointer",
      }}
      onClick={() => {
        if(["episode"].includes(item.type)) return navigate(`/watch/${item.ratingKey}${item.viewOffset ? `?t=${item.viewOffset}` : ""}`)
        setSearchParams({ mid: item.ratingKey.toString() });
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "10px",
          userSelect: "none",
          transition: "all 0.5s ease",
          transform: "translateX(0%)",
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
            height="25"
            style={{
              aspectRatio: 1,
              borderRadius: 8,
            }}
          />
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: "900",
              letterSpacing: "0.1em",
              textShadow: "3px 3px 1px #232529",
              ml: 1,
              color: "#e6a104",
              textTransform: "uppercase",
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
            }
          }}
        >
          {item.title}
        </Typography>
        {["episode"].includes(item.type) && item.grandparentTitle && (
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: "normal",
              color: "#FFFFFF",
              opacity: 0.7,
              mt: -0.5,
              mb: 0.5,

              textShadow: "0px 0px 10px #000000",
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
            <CheckCircle
              sx={{
                color: "#00FF00",
                fontSize: "large"
              }}
            />
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
                py: -0.5
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
