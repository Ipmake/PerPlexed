import { PlayArrow, InfoOutlined } from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';
import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom';

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
                mb: 0,
              }}
            >
              <img
                src="/plexIcon.png"
                alt=""
                height="35"
                style={{
                  aspectRatio: 1,
                  borderRadius: 8,
                }}
              />
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: "900",
                  letterSpacing: "0.1em",
                  textShadow: "3px 3px 1px #232529",
                  ml: 1,
                  color: "#e6a104",
                  textTransform: "uppercase",
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
  
                // make the text max 4 lines long and add ellipsis
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
                onClick={() => {
                  if(!item) return;
                  navigate(`/watch/${item.ratingKey}`)
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

export default HeroDisplay