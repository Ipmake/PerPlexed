import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLibraryMeta, getSearch } from "../plex";
import { MovieItem } from "../components/MetaScreen";
import { queryBuilder } from "../plex/QuickFunctions";

export default function Search() {
  const { query } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<Plex.Metadata[] | null>(null);

  useEffect(() => {
    setResults(null);

    if (!query) return setResults([]);

    getSearch(query).then((res) => {
      if (!res) return setResults([]);
      setResults(
        res
          .filter(
            (item) =>
              item.Metadata && ["movie", "show"].includes(item.Metadata.type)
          )
          .map((item) => item.Metadata)
      );
    });
  }, [query]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        height: "100%",
        width: "100%",
        mt: "64px",
        px: 6,
        py: 2,

        pt: 4,
      }}
    >
      <Typography variant="h3" sx={{ mt: 2 }}>
        {query ? (
          <>
            Results for <strong>{query}</strong>
          </>
        ) : (
          "Use Search Bar to Search"
        )}
      </Typography>

      {!results && <CircularProgress sx={{ mt: 4 }} />}

      <Grid container spacing={2} sx={{ mt: 2, width: "100%" }}>
        {results &&
          results.map((item) => (
            <Grid item key={item.ratingKey} xs={3}>
                <MovieItem item={item} onClick={async () => { 
                    const res = await getLibraryMeta(item.ratingKey);
                    navigate(`/browse/${res.librarySectionID}?${queryBuilder({
                        mid: res.ratingKey,
                    })}`)
                }} />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
