const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const promptController = require('../../controllers/admin/promptController');
const isAdmin = require('../../middleware/authMiddleware');
const fs=require('fs')
const Prompt = require('../../models/Prompt');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../uploads/prompts');

        // Create folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // ✅ 20MB limit
});


router.get('/', isAdmin, promptController.getPrompts);
router.get('/promptlist', promptController.getPromptslist);

// In your admin routes file, e.g., routes/admin.js
router.get('/prompts/promptlist', async (req, res) => {
  try {
    const prompts = await Prompt.find().sort({ createdAt: -1 });
    res.render('admin/promptlist', { prompts });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load prompt list');
  }
});



router.post('/upload-prompt', upload.single('file'), promptController.uploadPrompt);
router.post('/upload-prompt', upload.single('file'), promptController.uploadPrompt);

router.post('/delete/:id', isAdmin, async (req, res) => {
    const promptId = req.params.id;

    try {
        const prompt = await Prompt.findById(promptId);

        // Delete associated file if exists
        if (prompt?.file) {
            const fs = require('fs');
            const filePath = path.join(__dirname, '../../uploads/prompts', prompt.file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Prompt.findByIdAndDelete(promptId);
        res.redirect('/admin/prompts');
    } catch (err) {
        console.error('❌ Delete error:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
