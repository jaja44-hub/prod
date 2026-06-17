import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  Paper,
} from "@mui/material";
import KeyIcon from "@mui/icons-material/VpnKey";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const navigate=useNavigate();
    const handleLogin=()=>{  
          try { localStorage.setItem('sidebar-expanded', 'false') } catch (e) {}
        navigate('/Dashboard')
  }
  
  
  
    return (
    <Box
      sx={{
        backgroundColor: "#222D32",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            backgroundColor: "#1A2226",
            padding: 4,
            textAlign: "center",
            boxShadow:
              "0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)",
          }}
        >
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
            color: "#27EF9F",
          }}>
            <KeyIcon sx={{ fontSize: 80 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ color: "#ECF0F5", fontWeight: "bold", mb: 3 }}
          >
            ADMIN PANEL
          </Typography>
          <Box component="form">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="standard"
                  label="USERNAME"
                  InputLabelProps={{
                    style: { color: "#6C6C6C", fontWeight: "bold" },
                  }}
                  InputProps={{
                    style: {
                      color: "#ECF0F5",
                      borderBottom: "2px solid #0DB8DE",
                    },
                  }}
                  sx={{ input: { backgroundColor: "#1A2226" } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="standard"
                  label="PASSWORD"
                  type="password"
                  InputLabelProps={{
                    style: { color: "#6C6C6C", fontWeight: "bold" },
                  }}
                  InputProps={{
                    style: {
                      color: "#ECF0F5",
                      borderBottom: "2px solid #0DB8DE",
                    },
                  }}
                  sx={{ input: { backgroundColor: "#1A2226" } }}
                />
              </Grid>
            </Grid>
            <Grid container justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                sx={{
                  color: "#0DB8DE",
                  borderColor: "#0DB8DE",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#0DB8DE",
                    color: "#fff",
                  },
                }}
                
              onClick={handleLogin}>
                LOGIN
              </Button>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
