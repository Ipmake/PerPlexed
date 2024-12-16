import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getLibraryMeta, getSearch } from "../plex";
import { MovieItem } from "../components/MetaScreen";

export default function Search() {
  const { query } = useParams();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<Plex.Metadata[] | null>(null);
  const [directories, setDirectories] = useState<Plex.Directory[] | null>(null);

  useEffect(() => {
    setResults(null);
    setDirectories(null);

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
          .filter(
            (metadata): metadata is Plex.Metadata => metadata !== undefined
          )
      );

      setDirectories(
        res
          .filter((item) => item.Directory)
          .map((item) => item.Directory)
          .filter(
            (directory): directory is Plex.Directory => directory !== undefined
          )
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
        {directories && directories.length > 0 && (
          <>
            <Grid item key={"dir"} xs={12}>
              <Typography variant="h4">Categories</Typography>
            </Grid>

            {directories.map((item) => (
              <Grid item key={item.key} xs={2}>
                <DirectoryItem
                  item={item}
                  onClick={() => {
                    navigate(`/library/${item.librarySectionID}/dir/genre/${item.id}`);
                  }}
                />
              </Grid>
            ))}

            <Grid item key={"dir"} xs={12}></Grid>
          </>
        )}

        {results &&
          results.map((item) => (
            <Grid item key={item.ratingKey} xs={3}>
              <MovieItem
                item={item}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}


export function DirectoryItem({ item, onClick }: { item: Plex.Directory, onClick: () => void }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        bgcolor: "rgba(0,0,0,0.1)",
        borderRadius: "8px",
        p: 2,
        background: "#333333",
        cursor: "pointer",

        "&:hover": {
          background: "#444444",
        },
        userSelect: "none",
      }}
      onClick={onClick}
    >
      <Typography variant="h5">{item.librarySectionTitle} - {item.tag}</Typography>
    </Box>
  );
}