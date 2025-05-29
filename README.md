# Watermark Cleaner

A web application that allows you to remove watermarks from videos using blur and add custom watermarks with various positioning and scaling options.

## Features

- **Watermark Removal**: Select an area of the video containing a watermark and apply blur to remove it
- **Custom Watermark Addition**: Upload your own watermark image and add it to videos
- **Watermark Customization**: Adjust scale, opacity, and position of custom watermarks
- **Video Processing**: Powered by FFmpeg for high-quality video processing
- **Modern UI**: Built with React and Material UI for a responsive, user-friendly interface

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)
- [FFmpeg](https://ffmpeg.org/download.html) (must be installed and available in your system PATH)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd watermark-cleaner
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Create a `.env` file in the server directory:
   ```
   PORT=5000
   NODE_ENV=development
   ```

## Usage

1. Start the development server:
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Upload a video using the drag-and-drop interface or file selector

4. Choose between removing a watermark or adding a custom watermark:
   - **Remove Watermark**: Drag the selection box to cover the watermark area, adjust blur amount, and click "Apply Blur"
   - **Add Watermark**: Upload a watermark image, adjust scale, opacity, and position, then click "Add Watermark"

5. Download the processed video when complete

## Deployment

This application can be deployed to any hosting service that supports Node.js applications. Make sure FFmpeg is installed on the hosting server.

### Hosting Requirements

- Node.js runtime environment
- FFmpeg installed and accessible
- Sufficient storage for video processing
- Adequate memory for video processing operations

## Technical Details

### Frontend
- React.js
- Material UI
- Axios for API requests
- React Dropzone for file uploads

### Backend
- Node.js with Express
- FFmpeg for video processing via fluent-ffmpeg
- Multer for file uploads

## License

This project is licensed under the MIT License. 