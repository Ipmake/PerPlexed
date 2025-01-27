import React from "react";
import { getLibraryMedia, getLibraryMeta, getLibrarySecondary } from "../../plex";
import { Box, CircularProgress } from "@mui/material";
import MovieItemSlider, {
  shuffleArray,
} from "../../components/MovieItemSlider";
import HeroDisplay from "../../components/HeroDisplay";

function Movie({ Library }: { Library: Plex.MediaContainer }) {
  const [featuredItem, setFeaturedItem] = React.useState<Plex.Metadata | null>(
    null
  );

  const [genres, setGenres] = React.useState<Plex.Directory[]>([]);

  React.useEffect(() => {
    setFeaturedItem(null);
    setGenres([]);

    getLibraryMedia(`/sections/${Library.librarySectionID.toString()}/unwatched`).then(
      (media) => {
        const item = media[Math.floor(Math.random() * media.length)];

        getLibraryMeta(item.ratingKey).then(
          (meta) => {
            setFeaturedItem(meta);
          }
        );
      }
    );

    getLibrarySecondary(Library.librarySectionID.toString(), "genre").then(
      async (genres) => {
        if (!genres || !genres.length) return;
        const genreSelection: Plex.Directory[] = [];

        // Get 5 random genres
        while (genreSelection.length < Math.min(8, genres.length)) {
          const genre = genres[Math.floor(Math.random() * genres.length)];
          if (genreSelection.includes(genre)) continue;
          genreSelection.push(genre);
        }

        setGenres([...shuffleArray(genreSelection)]);
      }
    );
  }, [Library]);

  if (!featuredItem)
    return (
      <Box
        sx={{
          width: "100vw",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        pb: 8,
      }}
    >
      <HeroDisplay item={featuredItem} />
      <Box
        sx={{
          zIndex: 1,
          mt: "-20vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 8,
        }}
      >
        <MovieItemSlider
          title="Continue Watching"
          dir={`/sections/${Library.librarySectionID}/onDeck`}
          link={`/library/${Library.librarySectionID}/dir/onDeck`}
        />
        <MovieItemSlider
          title="New Releases"
          dir={`/sections/${Library.librarySectionID}/newest`}
          link={`/library/${Library.librarySectionID}/dir/newest`}
        />
        <MovieItemSlider
          title="Recently Added"
          dir={`/sections/${Library.librarySectionID}/recentlyAdded`}
          link={`/library/${Library.librarySectionID}/dir/recentlyAdded`}
        />
        {genres &&
          genres.map((genre, index) => (
            <MovieItemSlider
              key={index}
              title={genre.title}
              dir={`/sections/${Library.librarySectionID}/all?genre=${genre.key}`}
              link={`/library/${Library.librarySectionID}/dir/genre/${genre.key}`}
              shuffle={true}
            />
          ))}
      </Box>
    </Box>
  );
}

export default Movie;
