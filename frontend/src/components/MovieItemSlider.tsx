import { Box, Typography } from "@mui/material";
import React from "react";
import { getLibraryDir } from "../plex";
import { ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import MovieItem from "./MovieItem";

function MovieItemSlider({
  title,
  dir,
  props,
  filter,
  link,
  shuffle,
  data,
  plexTvSource,
}: {
  title: string;
  dir?: string;
  props?: { [key: string]: any }
  filter?: (item: Plex.Metadata) => boolean;
  link?: string;
  shuffle?: boolean;
  data?: Plex.Metadata[];
  plexTvSource?: boolean;
}) {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<Plex.Metadata[] | null>(
    data ?? null
  );

  const [currPage, setCurrPage] = React.useState(0);

  const calculateItemsPerPage = (width: number) => {
    if (width < 400) return 1;
    if (width < 600) return 1;
    if (width < 1200) return 2;
    if (width < 1500) return 4;
    if (width < 2000) return 5;
    if (width < 3000) return 6;
    if (width < 4000) return 7;
    if (width < 5000) return 8;
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
    if (data) return setItems(data);
    if(!dir) return;

    getLibraryDir(dir, props).then((res) => {
      // cut the array down so its a multiple of itemsPerPage
      if(!res.Metadata) return;
      
      let media: Plex.Metadata[] = res.Metadata;
      if(filter) media = res.Metadata.filter(filter);

      if (!media) return;
      setItems(shuffle ? shuffleArray(media) : media);
    });
  }, [data, dir, filter, props, shuffle]);

  if (!items) return <></>;

  const itemCount = items.slice(0, itemsPerPage * 5).length;

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
            cursor: link ? "pointer" : "default",
            "&:hover": {
              gap: "20px",
            },
            "&:hover > :nth-child(2)": {
              opacity: 1,
              gap: "5px",
            },
            transition: "all 0.5s ease",
            userSelect: "none",
          }}
          onClick={() => {
            if (link) navigate(link);
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

            {link && (
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
              <Typography sx={{ fontSize: "1rem" }}>Browse</Typography>
              <ArrowForwardIos fontSize="small" />
            </Box>
            )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            visibility: itemCount > itemsPerPage ? "visible" : "hidden",
          }}
        >
          {Array(Math.ceil(itemCount / itemsPerPage))
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
            visibility: itemCount > itemsPerPage ? "visible" : "hidden",

            "&:hover": {
              backgroundColor: "#000000AA",
            },

            transition: "all 0.5s ease",
          }}
          onClick={() => {
            setCurrPage((currPage) =>
              currPage - 1 < 0
                ? Math.ceil(itemCount / itemsPerPage) - 1
                : currPage - 1
            );
          }}
        >
          <ArrowForwardIos
            sx={{
              transform: "rotate(180deg)",
            }}
            fontSize="large"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            transform: `translateX(calc((-${currPage} * (100vw - 5vw) + 2.5vw)))`,
            alignItems: "flex-start",
            justifyContent: "center",
            width: `auto`,
            gap: "10px",
            transition: "transform 1.5s ease",
          }}
        >
          {items?.slice(0, itemsPerPage * 5).map((item, i) => {
            return (
              <MovieItem item={item} itemsPerPage={itemsPerPage} index={i} PlexTvSource={plexTvSource} />
            );
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
            visibility: itemCount > itemsPerPage ? "visible" : "hidden",

            "&:hover": {
              backgroundColor: "#000000AA",
            },

            transition: "all 0.5s ease",
          }}
          onClick={() => {
            setCurrPage(
              currPage + 1 > Math.ceil(itemCount / itemsPerPage) - 1
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

export function durationToText(duration: number): string {
  const hours = Math.floor(duration / 1000 / 60 / 60);
  const minutes = (duration / 1000 / 60 / 60 - hours) * 60;

  return (
    (hours > 0 ? `${hours}h` : "") +
    (Math.floor(minutes) > 0 ? ` ${Math.floor(minutes)}m` : "")
  ).trim();
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
