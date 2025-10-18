const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 图片存储配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/images');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳-随机数-原始名称
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ticket-${uniqueSuffix}${ext}`);
  }
});

// 图片文件过滤器
const imageFilter = (req, file, cb) => {
  // 只允许图片格式
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（JPEG、PNG、GIF）'));
  }
};

// 图片上传中间件（最多4张，单张5MB）
const uploadImages = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 4 // 最多4张图片
  },
  fileFilter: imageFilter
}).array('images', 4);

module.exports = {
  uploadImages,
};

