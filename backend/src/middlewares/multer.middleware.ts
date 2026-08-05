import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter(req, file, cb) {

    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/") && !file.mimetype.startsWith("audio/")) {

      return cb(new Error("Only image, video, and audio files are allowed"));

    }

    cb(null, true);

  },

});