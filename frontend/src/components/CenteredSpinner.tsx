import { Box, CircularProgress } from '@mui/material'
import React from 'react'

export default function CenteredSpinner() {
  return (
    <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%'
    }}>
        <CircularProgress />
    </Box>
  )
}
