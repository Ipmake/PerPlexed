import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLibrary } from "../plex";
import { Box, CircularProgress } from "@mui/material";
import Movie from "./browse/Movie";
import Show from "./browse/Show";

function Library() {
  const { libraryID } = useParams<{ libraryID: string }>();
  const [library, setLibrary] = React.useState<Plex.LibraryDetails | null>(null);

  useEffect(() => {
    if(!libraryID) return;
    getLibrary(libraryID).then((data) => {
      setLibrary(data);
    });
  }, [libraryID]);

  if (!library) {
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

  switch (library?.Type[0].type) {
    case "movie":
      return <Movie Library={library} />;
    case "show":
      return <Show Library={library} />;
    default:
      return <div>Unknown</div>;
  }
}

export default Library;
