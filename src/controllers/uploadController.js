import multer from 'multer';
import cloudinary from '../cloudinary.js';

// Store files in memory for Cloudinary upload


    // Endpoint to upload one or multiple images

    const uploadController = async (req, res) => {
        try {
          if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
          }
      
          const folder = req.body.folder || 'uploads'; 
      
          const uploadResults = await Promise.all(
            req.files.map(async (file) => {
                const base64Data = file.buffer.toString('base64');
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64Data}`, {
                    folder: folder, 
                });
              return result.secure_url; 
            })
          );
      
          return res.status(200).json({
            message: 'Files uploaded successfully',
            folder: folder,
            urls: uploadResults,
          });
        
        } catch (error) {
          console.error('Error uploading images:', error); 
          return res.status(500).json({ error: 'Failed to upload images', details: error.message });
        }
    };

export {
    uploadController,
}

