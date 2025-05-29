import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  TextField
} from '@mui/material';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import DownloadIcon from '@mui/icons-material/Download';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const VideoEditor = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectionArea, setSelectionArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [blurAmount, setBlurAmount] = useState(20);
  const [watermarkScale, setWatermarkScale] = useState(0.2);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkPosition, setWatermarkPosition] = useState('custom');
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkPreview, setWatermarkPreview] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({ width: 0, height: 0 });
  const [watermarkCoords, setWatermarkCoords] = useState({ x: 50, y: 50 });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const watermarkCanvasRef = useRef(null);
  const watermarkImgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isWatermarkDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Load video on component mount
  useEffect(() => {
    if (!videoId) {
      navigate('/');
      return;
    }
    
    // Create video URL - Fix the path to correctly point to the uploaded video
    const videoPath = `/api/videos/${videoId}`;
    setVideoUrl(videoPath);
    
    // Reset processed video when changing tabs
    setProcessedVideoUrl(null);
  }, [videoId, navigate, tabValue]);
  
  // Setup canvas and selection area when video is loaded
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleVideoLoad = () => {
      const { videoWidth, videoHeight } = video;
      setVideoMetadata({ width: videoWidth, height: videoHeight });
      
      // Set initial selection area
      setSelectionArea({
        x: Math.floor(videoWidth * 0.1),
        y: Math.floor(videoHeight * 0.1),
        width: Math.floor(videoWidth * 0.2),
        height: Math.floor(videoHeight * 0.2)
      });
      
      // Set initial watermark position to center
      setWatermarkCoords({
        x: Math.floor(videoWidth * 0.5),
        y: Math.floor(videoHeight * 0.5)
      });
      
      // Setup canvas
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      }
      
      // Setup watermark canvas
      const watermarkCanvas = watermarkCanvasRef.current;
      if (watermarkCanvas && tabValue === 1) {
        watermarkCanvas.width = videoWidth;
        watermarkCanvas.height = videoHeight;
        drawWatermarkOnCanvas();
      }
    };
    
    video.addEventListener('loadedmetadata', handleVideoLoad);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleVideoLoad);
    };
  }, [videoUrl, tabValue]);
  
  // Draw selection area on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !video.videoWidth) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    // Draw selection rectangle
    if (tabValue === 0) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectionArea.x,
        selectionArea.y,
        selectionArea.width,
        selectionArea.height
      );
    }
  }, [selectionArea, tabValue]);
  
  // Draw watermark on canvas when watermark preview changes
  useEffect(() => {
    if (tabValue === 1 && watermarkPreview) {
      drawWatermarkOnCanvas();
    }
  }, [watermarkPreview, watermarkCoords, watermarkScale, watermarkOpacity, tabValue]);
  
  // Draw watermark on canvas
  const drawWatermarkOnCanvas = () => {
    const watermarkCanvas = watermarkCanvasRef.current;
    const video = videoRef.current;
    const watermarkImg = watermarkImgRef.current;
    
    if (!watermarkCanvas || !video || !video.videoWidth || !watermarkPreview) return;
    
    const ctx = watermarkCanvas.getContext('2d');
    ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
    
    if (watermarkImg && watermarkImg.complete) {
      const scaledWidth = watermarkImg.width * watermarkScale;
      const scaledHeight = watermarkImg.height * watermarkScale;
      
      // Save context state
      ctx.globalAlpha = watermarkOpacity;
      
      // Draw watermark at custom position
      ctx.drawImage(
        watermarkImg,
        watermarkCoords.x - (scaledWidth / 2),
        watermarkCoords.y - (scaledHeight / 2),
        scaledWidth,
        scaledHeight
      );
      
      // Restore context state
      ctx.globalAlpha = 1.0;
      
      // Draw border around watermark for better visibility
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        watermarkCoords.x - (scaledWidth / 2),
        watermarkCoords.y - (scaledHeight / 2),
        scaledWidth,
        scaledHeight
      );
    }
  };
  
  // Handle mouse events for selection area
  const handleMouseDown = (e) => {
    if (tabValue !== 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // Check if mouse is inside selection area
    if (
      mouseX >= selectionArea.x &&
      mouseX <= selectionArea.x + selectionArea.width &&
      mouseY >= selectionArea.y &&
      mouseY <= selectionArea.y + selectionArea.height
    ) {
      isDraggingRef.current = true;
      startPosRef.current = {
        x: mouseX - selectionArea.x,
        y: mouseY - selectionArea.y
      };
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || tabValue !== 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    let newX = mouseX - startPosRef.current.x;
    let newY = mouseY - startPosRef.current.y;
    
    // Keep selection within canvas bounds
    newX = Math.max(0, Math.min(newX, canvas.width - selectionArea.width));
    newY = Math.max(0, Math.min(newY, canvas.height - selectionArea.height));
    
    setSelectionArea(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };
  
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isWatermarkDraggingRef.current = false;
  };
  
  // Handle watermark dragging
  const handleWatermarkMouseDown = (e) => {
    if (tabValue !== 1 || !watermarkPreview) return;
    
    const canvas = watermarkCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    const watermarkImg = watermarkImgRef.current;
    if (watermarkImg) {
      const scaledWidth = watermarkImg.width * watermarkScale;
      const scaledHeight = watermarkImg.height * watermarkScale;
      
      // Check if mouse is inside watermark area
      if (
        mouseX >= watermarkCoords.x - (scaledWidth / 2) &&
        mouseX <= watermarkCoords.x + (scaledWidth / 2) &&
        mouseY >= watermarkCoords.y - (scaledHeight / 2) &&
        mouseY <= watermarkCoords.y + (scaledHeight / 2)
      ) {
        isWatermarkDraggingRef.current = true;
        startPosRef.current = {
          x: mouseX - watermarkCoords.x,
          y: mouseY - watermarkCoords.y
        };
      }
    }
  };
  
  const handleWatermarkMouseMove = (e) => {
    if (!isWatermarkDraggingRef.current || tabValue !== 1) return;
    
    const canvas = watermarkCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    let newX = mouseX - startPosRef.current.x;
    let newY = mouseY - startPosRef.current.y;
    
    // Keep watermark within canvas bounds
    const watermarkImg = watermarkImgRef.current;
    if (watermarkImg) {
      const scaledWidth = watermarkImg.width * watermarkScale;
      const scaledHeight = watermarkImg.height * watermarkScale;
      
      newX = Math.max(scaledWidth / 2, Math.min(newX, canvas.width - (scaledWidth / 2)));
      newY = Math.max(scaledHeight / 2, Math.min(newY, canvas.height - (scaledHeight / 2)));
    }
    
    setWatermarkCoords({
      x: newX,
      y: newY
    });
  };
  
  // Handle watermark file drop
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file for the watermark');
      return;
    }
    
    setWatermarkFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setWatermarkPreview(reader.result);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        watermarkImgRef.current = img;
        drawWatermarkOnCanvas();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    
    // Set watermark position to custom
    setWatermarkPosition('custom');
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    multiple: false
  });
  
  // Apply blur to remove watermark
  const handleRemoveWatermark = async () => {
    if (!videoId) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/videos/remove-watermark', {
        videoId,
        x: Math.round(selectionArea.x),
        y: Math.round(selectionArea.y),
        width: Math.round(selectionArea.width),
        height: Math.round(selectionArea.height),
        blurAmount
      });
      
      if (response.data.success) {
        setProcessedVideoUrl(response.data.processedVideo);
        toast.success('Watermark removed successfully!');
      }
    } catch (error) {
      console.error('Error removing watermark:', error);
      toast.error(error.response?.data?.error || 'Error processing video');
    } finally {
      setLoading(false);
    }
  };
  
  // Add custom watermark
  const handleAddWatermark = async () => {
    if (!videoId || !watermarkFile) {
      toast.error('Please upload a watermark image');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Adding watermark with position:', watermarkPosition);
      console.log('Watermark coordinates:', watermarkCoords);
      console.log('Scale:', watermarkScale, 'Opacity:', watermarkOpacity);
      
      const formData = new FormData();
      formData.append('watermarkImage', watermarkFile);
      formData.append('videoId', videoId);
      formData.append('scale', watermarkScale);
      formData.append('opacity', watermarkOpacity);
      
      // If using custom position, calculate the position parameters
      if (watermarkPosition === 'custom' && watermarkImgRef.current) {
        const video = videoRef.current;
        if (video) {
          const { videoWidth, videoHeight } = video;
          const watermarkImg = watermarkImgRef.current;
          const scaledWidth = watermarkImg.width * watermarkScale;
          
          // Convert coordinates to FFmpeg format (top-left corner)
          const x = watermarkCoords.x - (scaledWidth / 2);
          const y = watermarkCoords.y - (watermarkImg.height * watermarkScale / 2);
          
          // Convert to relative position (0-1)
          const relativeX = x / videoWidth;
          const relativeY = y / videoHeight;
          
          console.log('Custom position:', { x, y, relativeX, relativeY, videoWidth, videoHeight });
          
          formData.append('position', 'custom');
          formData.append('customX', relativeX);
          formData.append('customY', relativeY);
        }
      } else {
        formData.append('position', watermarkPosition);
      }
      
      // Log the FormData contents (for debugging)
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
      }
      
      const response = await axios.post('/api/videos/add-watermark', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Watermark response:', response.data);
      
      if (response.data.success) {
        setProcessedVideoUrl(response.data.processedVideo);
        toast.success('Watermark added successfully!');
      } else {
        toast.error('Failed to add watermark: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding watermark:', error);
      toast.error(error.response?.data?.error || 'Error processing video');
    } finally {
      setLoading(false);
    }
  };
  
  // Download processed video
  const handleDownload = () => {
    if (!processedVideoUrl) return;
    
    // Create the full URL for the processed video
    const baseUrl = window.location.origin;
    const filename = processedVideoUrl.split('/').pop();
    // Use the same URL format as returned by the server
    const downloadUrl = `${baseUrl}${processedVideoUrl}`;
    
    console.log('Downloading video from:', downloadUrl);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `processed_video${processedVideoUrl.includes('watermarked') ? '_watermarked' : ''}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Video Editor
        </Typography>
        
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<DeleteIcon />} label="Remove Watermark" />
            <Tab icon={<AddIcon />} label="Add Watermark" />
          </Tabs>
          
          {/* Remove Watermark Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  {!processedVideoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        style={{ display: 'none' }}
                      />
                      <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Drag the red box to select the watermark area
                      </Typography>
                    </>
                  ) : (
                    <video
                      src={processedVideoUrl}
                      controls
                      style={{ width: '100%', height: 'auto' }}
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Watermark Removal Settings
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Blur Amount</Typography>
                    <Slider
                      value={blurAmount}
                      onChange={(e, newValue) => setBlurAmount(newValue)}
                      min={5}
                      max={50}
                      valueLabelDisplay="auto"
                      disabled={loading}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Selection Area</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="X"
                          type="number"
                          size="small"
                          value={Math.round(selectionArea.x)}
                          onChange={(e) => setSelectionArea(prev => ({ ...prev, x: Number(e.target.value) }))}
                          disabled={loading}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Y"
                          type="number"
                          size="small"
                          value={Math.round(selectionArea.y)}
                          onChange={(e) => setSelectionArea(prev => ({ ...prev, y: Number(e.target.value) }))}
                          disabled={loading}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Width"
                          type="number"
                          size="small"
                          value={Math.round(selectionArea.width)}
                          onChange={(e) => setSelectionArea(prev => ({ ...prev, width: Number(e.target.value) }))}
                          disabled={loading}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Height"
                          type="number"
                          size="small"
                          value={Math.round(selectionArea.height)}
                          onChange={(e) => setSelectionArea(prev => ({ ...prev, height: Number(e.target.value) }))}
                          disabled={loading}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<BlurOnIcon />}
                      onClick={handleRemoveWatermark}
                      disabled={loading || !videoUrl}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Apply Blur'}
                    </Button>
                    
                    {processedVideoUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                      >
                        Download
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Add Watermark Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  {!processedVideoUrl ? (
                    <div style={{ position: 'relative' }}>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        style={{ width: '100%', height: 'auto' }}
                      />
                      {watermarkPreview && (
                        <>
                          <canvas
                            ref={watermarkCanvasRef}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              cursor: 'move',
                              zIndex: 20
                            }}
                            onMouseDown={handleWatermarkMouseDown}
                            onMouseMove={handleWatermarkMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Drag the watermark to position it on the video
                          </Typography>
                        </>
                      )}
                    </div>
                  ) : (
                    <video
                      src={processedVideoUrl}
                      controls
                      style={{ width: '100%', height: 'auto' }}
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Watermark Settings
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Paper
                      {...getRootProps()}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 2,
                        cursor: 'pointer',
                        mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      <input {...getInputProps()} />
                      {watermarkPreview ? (
                        <img
                          src={watermarkPreview}
                          alt="Watermark preview"
                          style={{ maxWidth: '100%', maxHeight: '100px' }}
                        />
                      ) : (
                        <Typography>
                          Drag & drop a watermark image or click to select
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Watermark Scale</Typography>
                    <Slider
                      value={watermarkScale}
                      onChange={(e, newValue) => setWatermarkScale(newValue)}
                      min={0.05}
                      max={0.5}
                      step={0.01}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      disabled={loading}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Opacity</Typography>
                    <Slider
                      value={watermarkOpacity}
                      onChange={(e, newValue) => setWatermarkOpacity(newValue)}
                      min={0.1}
                      max={1}
                      step={0.1}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      disabled={loading}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Position</InputLabel>
                      <Select
                        value={watermarkPosition}
                        onChange={(e) => setWatermarkPosition(e.target.value)}
                        label="Position"
                        disabled={loading}
                      >
                        <MenuItem value="custom">Custom (Drag on Video)</MenuItem>
                        <MenuItem value="topLeft">Top Left</MenuItem>
                        <MenuItem value="topRight">Top Right</MenuItem>
                        <MenuItem value="bottomLeft">Bottom Left</MenuItem>
                        <MenuItem value="bottomRight">Bottom Right</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddWatermark}
                      disabled={loading || !watermarkFile || !videoUrl}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Add Watermark'}
                    </Button>
                    
                    {processedVideoUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                      >
                        Download
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default VideoEditor; 