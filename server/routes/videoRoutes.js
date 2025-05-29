const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const videoController = require('../controllers/videoController');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4', 
    'video/avi', 
    'video/quicktime', 
    'video/x-msvideo', 
    'video/x-ms-wmv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// File filter for images (watermarks)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for watermarks!'), false);
  }
};

// Configure upload middleware for videos
const uploadVideo = multer({ 
  storage, 
  fileFilter: videoFileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Configure upload middleware for images
const uploadImage = multer({ 
  storage, 
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', uploadVideo.single('video'), videoController.uploadVideo);
router.post('/remove-watermark', videoController.removeWatermark);
router.post('/add-watermark', uploadImage.single('watermarkImage'), videoController.addWatermark);
router.get('/:id', videoController.getVideo);

module.exports = router; 