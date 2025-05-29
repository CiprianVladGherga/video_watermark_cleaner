import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress,
  Grid
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MovieIcon from '@mui/icons-material/Movie';
import axios from 'axios';

const Home = () => {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }
    
    // Check file size (limit to 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size exceeds 500MB limit');
      return;
    }
    
    setUploading(true);
    
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('video', file);
      
      // Log the FormData contents (for debugging)
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
      }
      
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        toast.success('Video uploaded successfully!');
        navigate(`/editor/${response.data.videoId}`);
      } else {
        toast.error('Upload failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error(error.response?.data?.error || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': []
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Watermark Cleaner
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Remove watermarks from your videos with blur or add your own custom watermark
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MovieIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Remove Watermarks
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Select the area with watermark and apply blur to remove it from your video
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MovieIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Add Custom Watermarks
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Upload your own watermark image and place it anywhere on your video
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Paper
          {...getRootProps()}
          elevation={3}
          sx={{
            mt: 4,
            p: 4,
            backgroundColor: isDragActive ? 'rgba(63, 81, 181, 0.08)' : 'white',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          {uploading ? (
            <>
              <CircularProgress size={24} sx={{ mb: 2 }} />
              <Typography>Uploading video...</Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to select a file
              </Typography>
              <Button variant="contained" component="span" disabled={uploading}>
                Select Video
              </Button>
            </>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Supported formats: MP4, AVI, MOV, WMV • Max size: 500MB
        </Typography>
      </Box>
    </Container>
  );
};

export default Home; 