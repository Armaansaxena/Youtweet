import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getUserVideos,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// router.use(verifyJWT); // Protect all routes under /videos

router.route("/").get(getAllVideos)
router.post("/",verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
  );

router.route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

// Single toggle publish route (consistent path)
router.patch("/toggle-publish/:videoId",verifyJWT, togglePublishStatus);

// Get videos by user
router.get("/user/:userId", getUserVideos);

export default router;
