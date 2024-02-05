import React from "react";
import { getLibraryMedia, getLibraryMeta, getLibrarySecondary } from "../../plex";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { InfoOutlined, PlayArrow } from "@mui/icons-material";
import MovieItemSlider from "../../components/MovieItemSlider";
import { useNavigate, useSearchParams } from "react-router-dom";

function Show({ Library }: { Library: Plex.LibraryDetails }) {
  const [featuredItem, setFeaturedItem] =
    React.useState<Plex.Metadata | null>(null);

  const [genres, setGenres] = React.useState<Plex.Directory[]>([]);

  React.useEffect(() => {
    console.log(shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

    getLibraryMedia(Library.librarySectionID.toString(), "unwatched").then(
      (media) => {
        setFeaturedItem(media[Math.floor(Math.random() * media.length)]);
      }
    );

    getLibrarySecondary(Library.librarySectionID.toString(), "genre").then(
      async (genres) => {
        if (!genres || !genres.length) return;
        const genreSelection: Plex.Directory[] = [];

        // Get 5 random genres
        while (genreSelection.length < Math.min(5, genres.length)) {
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
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
          libraryID={Library.librarySectionID.toString()}
          dir="onDeck"
          link={`/library/${Library.librarySectionID}/dir/onDeck`}
        />
        {genres &&
          genres.map((genre, index) => (
            <MovieItemSlider
              key={index}
              title={genre.title}
              libraryID={Library.librarySectionID.toString()}
              dir={`all?genre=${genre.key}`}
              link={`/library/${Library.librarySectionID}/dir/genre/${genre.key}`}
              shuffle={true}
            />
          ))}
      </Box>
    </Box>
  );
}

export default Show;

function HeroDisplay({ item }: { item: Plex.Metadata }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: `linear-gradient(90deg, #000000AA, #000000AA), url(${localStorage.getItem("server")}${item.art}?X-Plex-Token=${localStorage.getItem("accessToken")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      >
        <Box
          sx={{
            ml: 10,
            mb: "40vh",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              mb: 1,
            }}
          >
            <img
              src="/plexIcon.png"
              alt=""
              height="40"
              style={{
                aspectRatio: 1,
                borderRadius: 8,
              }}
            />
            <Typography
              sx={{
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "0.1em",
                textShadow: "3px 3px 1px #232529",
                ml: 1,
                color: "#e6a104",
                textTransform: "uppercase",
                mt: 1,
              }}
            >
              {item.type}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "3rem",
              fontWeight: "bold",
            }}
          >
            {item.title}
          </Typography>
          <Typography
            sx={{
              fontSize: "medium",
              fontWeight: "light",
              maxWidth: "35vw",
            }}
          >
            {item.summary}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              mt: 4,
              gap: 2,
              ml: 0,
            }}
          >
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#CCCCCC",
                color: "#000000",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                "&:hover": {
                  backgroundColor: "primary.main",
                  gap: 1.5,
                },
                gap: 1,
                transition: "all 0.2s ease-in-out",
              }}
              onClick={async () => {
                if(!item) return;
                if(item.OnDeck?.Metadata.ratingKey) navigate(`/watch/${item.OnDeck?.Metadata.ratingKey}`)
                else {
                  const meta = await getLibraryMeta(item.ratingKey);

                  navigate(`/watch/${meta.OnDeck?.Metadata.ratingKey}`)
                }
              }}
            >
              <PlayArrow fontSize="medium" /> Play
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#555555",
                color: "#FFFFFF",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                "&:hover": {
                  opacity: 0.7,
                  backgroundColor: "#555555",
                  gap: 1.5,
                },
                gap: 1,
                transition: "all 0.2s ease-in-out",
              }}
              onClick={() => {
                if(!item) return;
                setSearchParams({ ...searchParams, mid: item.ratingKey.toString() });
              }}
            >
              <InfoOutlined fontSize="medium" /> More Info
            </Button>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: "40vh",
          position: "absolute",
          top: "65vh",

          backgroundImage: "linear-gradient(180deg, #00000000, #000000FF)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
          zIndex: 0,
        }}
      />
    </Box>
  );
}

const shuffleArray = (array: any[]) => {
    const oldArray = [...array];
    const newArray = [];
  
    while (oldArray.length) {
      const index = Math.floor(Math.random() * oldArray.length);
      newArray.push(oldArray.splice(index, 1)[0]);
    }
  
    return newArray;
  };
  