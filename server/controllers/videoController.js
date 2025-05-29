const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

// Upload video
exports.uploadVideo = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoPath = req.file.path;
    const videoId = path.basename(videoPath);

    // Get video information
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error getting video metadata:', err);
        return res.status(500).json({ error: 'Error processing video' });
      }

      const { width, height, duration } = metadata.streams[0];

      res.status(200).json({
        success: true,
        videoId,
        metadata: {
          width,
          height,
          duration,
          format: path.extname(videoPath).substring(1)
        }
      });
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove watermark with blur
exports.removeWatermark = (req, res) => {
  try {
    const { videoId, x, y, width, height, blurAmount = 20 } = req.body;

    if (!videoId || x === undefined || y === undefined || !width || !height) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const videoPath = path.join(__dirname, '../uploads', videoId);
    const outputFilename = `processed_${uuidv4()}${path.extname(videoId)}`;
    const outputPath = path.join(__dirname, '../processed', outputFilename);

    // Apply blur filter to the specified region
    ffmpeg(videoPath)
      .videoFilters([
        {
          filter: 'boxblur',
          options: `${blurAmount}:${blurAmount}:${blurAmount}`,
          inputs: '[0:v]',
          outputs: '[blurred]'
        },
        {
          filter: 'crop',
          options: `${width}:${height}:${x}:${y}`,
          inputs: '[blurred]',
          outputs: '[cropped]'
        },
        {
          filter: 'overlay',
          options: `${x}:${y}`,
          inputs: ['[0:v]', '[cropped]'],
          outputs: '[out]'
        }
      ])
      .outputOptions(['-map [out]', '-map 0:a?'])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('end', () => {
        res.status(200).json({
          success: true,
          processedVideo: `/processed/${outputFilename}`
        });
      })
      .on('error', (err) => {
        console.error('Error removing watermark:', err);
        res.status(500).json({ error: 'Error processing video' });
      })
      .run();
  } catch (error) {
    console.error('Error removing watermark:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add custom watermark
exports.addWatermark = (req, res) => {
  try {
    console.log('Add watermark request body:', req.body);
    console.log('Add watermark file:', req.file);
    
    const { 
      videoId, 
      scale = 0.2, 
      position = 'bottomRight', 
      opacity = 0.7,
      customX,
      customY
    } = req.body;
    
    if (!videoId || !req.file) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const videoPath = path.join(__dirname, '../uploads', videoId);
    const watermarkPath = req.file.path;
    const outputFilename = `watermarked_${uuidv4()}${path.extname(videoId)}`;
    const outputPath = path.join(__dirname, '../processed', outputFilename);

    console.log('Video path:', videoPath);
    console.log('Watermark path:', watermarkPath);
    console.log('Output path:', outputPath);

    // Check if files exist
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    if (!fs.existsSync(watermarkPath)) {
      return res.status(404).json({ error: 'Watermark file not found' });
    }

    // Get video dimensions
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error getting video metadata:', err);
        return res.status(500).json({ error: 'Error processing video' });
      }

      console.log('Video metadata:', metadata.streams[0]);
      const { width: videoWidth, height: videoHeight } = metadata.streams[0];
      
      // Calculate watermark position
      let x, y;
      
      if (position === 'custom' && customX !== undefined && customY !== undefined) {
        // Use custom position (convert from relative to absolute)
        x = Math.round(parseFloat(customX) * videoWidth);
        y = Math.round(parseFloat(customY) * videoHeight);
        console.log('Using custom position:', { x, y, customX, customY, videoWidth, videoHeight });
      } else {
        // Use predefined positions
        switch (position) {
          case 'topLeft':
            x = 10;
            y = 10;
            break;
          case 'topRight':
            x = `W-w*${scale}-10`;
            y = 10;
            break;
          case 'bottomLeft':
            x = 10;
            y = `H-h*${scale}-10`;
            break;
          case 'bottomRight':
          default:
            x = `W-w*${scale}-10`;
            y = `H-h*${scale}-10`;
            break;
          case 'center':
            x = `(W-w*${scale})/2`;
            y = `(H-h*${scale})/2`;
            break;
        }
        console.log('Using predefined position:', { position, x, y });
      }

      // Apply watermark - Use the most basic approach that works with all FFmpeg versions
      // Simply scale the watermark and overlay it with the specified opacity
      const complexFilter = `overlay=${x}:${y}:format=auto:alpha=${opacity}`;
      
      console.log('FFmpeg complex filter:', complexFilter);
      
      ffmpeg(videoPath)
        .input(watermarkPath)
        .complexFilter([
          // Scale the watermark first
          {
            filter: 'scale',
            options: `iw*${scale}:-1`,
            inputs: '1:v',
            outputs: 'scaled'
          },
          // Then overlay it on the video with opacity
          {
            filter: 'overlay',
            options: `${x}:${y}:format=auto:alpha=${opacity}`,
            inputs: ['0:v', 'scaled'],
            outputs: 'out'
          }
        ])
        .outputOptions(['-map [out]', '-map 0:a?'])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Watermark processing complete');
          res.status(200).json({
            success: true,
            processedVideo: `/processed/${outputFilename}`
          });
        })
        .on('error', (err) => {
          console.error('Error adding watermark:', err);
          res.status(500).json({ error: 'Error processing video: ' + err.message });
        })
        .run();
    });
  } catch (error) {
    console.error('Error adding watermark:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get video
exports.getVideo = (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the video exists in the processed directory
    const processedPath = path.join(__dirname, '../processed', id);
    
    if (fs.existsSync(processedPath)) {
      return res.sendFile(processedPath);
    }
    
    // If not in processed, check the uploads directory
    const uploadPath = path.join(__dirname, '../uploads', id);
    
    if (fs.existsSync(uploadPath)) {
      return res.sendFile(uploadPath);
    }
    
    // If not found in either directory
    return res.status(404).json({ error: 'Video not found' });
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 