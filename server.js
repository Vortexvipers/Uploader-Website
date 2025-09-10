const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Buat folder uploads jika belum ada
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Konfigurasi storage untuk multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate nama file unik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    }
});

// API Routes

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const fileData = {
        id: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadDate: new Date().toISOString(),
        downloadUrl: `/api/download/${req.file.filename}`
    };

    res.json({
        success: true,
        file: fileData
    });
});

// Download file
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
});

// List semua file
app.get('/api/files', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal membaca folder uploads' });
        }

        const fileList = files.map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                id: filename,
                filename: filename,
                size: stats.size,
                uploadDate: stats.mtime.toISOString(),
                downloadUrl: `/api/download/${filename}`,
                viewUrl: `/api/view/${filename}`
            };
        });

        res.json(fileList);
    });
});

// View file (untuk preview gambar, dll)
app.get('/api/view/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
});

// Hapus file
app.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File berhasil dihapus' });
    } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
});

// Get file info
app.get('/api/files/:filename/info', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        res.json({
            id: filename,
            filename: filename,
            size: stats.size,
            uploadDate: stats.mtime.toISOString(),
            downloadUrl: `/api/download/${filename}`,
            viewUrl: `/api/view/${filename}`
        });
    } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`📁 Folder uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`\n🌐 Akses dari browser: http://localhost:${PORT}`);
    console.log(`📱 Untuk akses dari HP lain di jaringan yang sama:`);
    console.log(`   http://YOUR_IP:${PORT}`);
    console.log(`\nTekan Ctrl+C untuk menghentikan server\n`);
});
