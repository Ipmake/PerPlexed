import React from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getLibrary } from "../plex";
import { Box, CircularProgress } from "@mui/material";
import Movie from "./browse/Movie";
import Show from "./browse/Show";

function Library() {
  const { libraryID } = useParams<{ libraryID: string }>();
  const library = useQuery(["library", libraryID], async () =>
    getLibrary(libraryID as string)
  );

  if (library.isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  switch (library.data?.Type[0].type) {
    case "movie":
      return <Movie Library={library.data} />;
    case "show":
      return <Show Library={library.data} />;
    default:
      return <div>Unknown</div>;
  }
}

export default Library;
