import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getLibraryDir } from "../plex";
import MovieItem from "../components/MovieItem";

export default function Library() {
  const { dir } = useParams() as {
    dir: string;
  };
  // get the query strings from react router
  const [searchParams, setSearchParams] = useSearchParams();

  const [results, setResults] = React.useState<Plex.MediaContainer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(searchParams);
        if (params.has("mid")) params.delete("mid");

        const data = await getLibraryDir(dir, searchParams);
        setResults(data);
      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dir, searchParams]);

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
            {results.title1} - {results.title2}
          </Typography>
          {!results && <CircularProgress sx={{ mt: 4 }} />}
          <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
            {results &&
              results.Metadata?.map((item) => (
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
