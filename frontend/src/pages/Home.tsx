import { Avatar, Box, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect } from "react";
import {
  getAllLibraries,
  getLibraryMedia,
  getLibraryMeta,
  getLibrarySecondary,
} from "../plex";
import { useNavigate } from "react-router-dom";
import { shuffleArray } from "../common/ArrayExtra";
import MovieItemSlider from "../components/MovieItemSlider";
import HeroDisplay from "../components/HeroDisplay";
import { useWatchListCache } from "../states/WatchListCache";

export default function Home() {
  const [libraries, setLibraries] = React.useState<Plex.LibarySection[]>([]);
  const [featured, setFeatured] = React.useState<
    PerPlexed.RecommendationShelf[]
  >([]);
  const [randomItem, setRandomItem] = React.useState<Plex.Metadata | null>(
    null
  );
  const { watchListCache } = useWatchListCache();

  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const librariesData = await getAllLibraries();
        setLibraries(librariesData);

        const filteredLibraries = librariesData.filter((lib) =>
          ["movie", "show"].includes(lib.type)
        );

        const featuredData = await getRecommendations(filteredLibraries);
        setFeatured(featuredData);

        let randomItemData = await getRandomItem(filteredLibraries);
        let attempts = 0;
        while (!randomItemData && attempts < 15) {
          randomItemData = await getRandomItem(filteredLibraries);
          attempts++;
        }

        if (!randomItemData) return;

        const data = await getLibraryMeta(randomItemData?.ratingKey as string);
        setRandomItem(data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  const navigate = useNavigate();

  if (loading)
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
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",

        pt: "-64px",
      }}
    >
      {randomItem && <HeroDisplay item={randomItem} />}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          gap: 6,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          pb: 8,
          mt: randomItem ? "-20vh" : "80px",
          zIndex: 1,
        }}
      >
        <Grid container spacing={2} sx={{ px: "2.5vw", mt: 2, width: "100%" }}>
          {libraries
            ?.filter((e) => ["movie", "show"].includes(e.type || ""))
            .map((library) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={library.key}>
                <Box
                  sx={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "21/9",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    p: 2,
                    transition: "all 0.2s ease-in-out",
                    background: `
                    linear-gradient(90deg, #000000AA, #000000AA),
                    url(${localStorage.getItem("server")}${
                      library.art
                    }?X-Plex-Token=${localStorage.getItem("accessToken")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",

                    userSelect: "none",
                    cursor: "pointer",
                    zIndex: 1000,

                    "&:hover": {
                      transform: "scale(1.05)",
                      transition: "all 0.1s linear",
                    },
                  }}
                  onClick={() => navigate(`/browse/${library.key}`)}
                >
                  <Avatar
                    variant="rounded"
                    src={`${localStorage.getItem("server")}${
                      library.thumb
                    }?X-Plex-Token=${localStorage.getItem("accessToken")}`}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Typography
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "white",
                      mt: 1,
                    }}
                  >
                    {library.title}
                  </Typography>
                </Box>
              </Grid>
            ))}
        </Grid>

        <Box
          sx={{
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 8,
          }}
        >
          <MovieItemSlider
            title="Continue Watching"
            dir="/library/onDeck"
            link="/library/onDeck"
          />

          {watchListCache && watchListCache.length > 0 && (
            <MovieItemSlider title="Watchlist" data={watchListCache} plexTvSource={true} />
          )}

          {featured &&
            featured.map((item, index) => (
              <MovieItemSlider
                key={index}
                title={item.title}
                dir={item.dir}
                shuffle={true}
                link={item.link}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
}

async function getRecommendations(libraries: Plex.Directory[]) {
  const genreSelection: PerPlexed.RecommendationShelf[] = [];

  for (const library of libraries) {
    const genres = await getLibrarySecondary(library.key, "genre");

    if (!genres || !genres.length) continue;

    const selectGenres: Plex.Directory[] = [];

    // Get 5 random genres
    while (selectGenres.length < Math.min(5, genres.length)) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      if (selectGenres.includes(genre)) continue;
      selectGenres.push(genre);
    }

    for (const genre of selectGenres) {
      genreSelection.push({
        title: `${library.title} - ${genre.title}`,
        libraryID: library.key,
        dir: `/library/sections/${library.key}/genre/${genre.key}`,
        link: `/library/sections/${library.key}/genre/${genre.key}`,
      });
    }
  }

  return shuffleArray(genreSelection);
}

// get one completely random item from any library
async function getRandomItem(libraries: Plex.Directory[]) {
  try {
    const library = libraries[Math.floor(Math.random() * libraries.length)];
    const dirs = await getLibrarySecondary(library.key, "genre");

    const items = await getLibraryMedia(
      `/sections/${library.key}/all?genre=${
        dirs[Math.floor(Math.random() * dirs.length)].key
      }`
    );

    return items[Math.floor(Math.random() * items.length)];
  } catch (error) {
    console.log("Error fetching random item", error);
    return null;
  }
}
