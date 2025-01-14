import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { getLibraryDir, LibraryDir } from "../plex";
import MovieItem from "../components/MovieItem";

export default function Library() {
  const { libraryKey, dir, subdir } = useParams() as {
    libraryKey: string;
    dir: string;
    subdir?: string;
  };

  const [results, setResults] = React.useState<LibraryDir | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLibraryDir(Number(libraryKey), dir, subdir);
        setResults(data);
      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [libraryKey, dir, subdir]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
        height: "fit-content",
        mt: "64px",
        px: 6,

        pt: 4,
        pb: 2,
      }}
    >
      {isLoading && <CircularProgress />}
      {isError && <Typography>Error</Typography>}

      {results && (
        <>
          <Typography variant="h3" sx={{ mt: 2 }}>
            {results.library} - {results.title}
          </Typography>
          {!results && <CircularProgress sx={{ mt: 4 }} />}
          <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
            {results &&
              results.Metadata.map((item) => (
                <Grid
                  item
                  key={item.ratingKey}
                  xl={3}
                  lg={4}
                  md={6}
                  sm={12}
                  xs={12}
                >
                  <MovieItem item={item} />
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
