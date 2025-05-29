import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

const Header = () => {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <WaterDropIcon sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Watermark Cleaner
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
          >
            Home
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 