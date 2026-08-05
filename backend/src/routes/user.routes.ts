import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { changePassword, getCurrentUser, updateCurrentUser, updateAvatar, searchUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { uploadChatAudio, uploadChatImage, uploadChatVideo } from "../controllers/upload.controller.js";

const userRouter = Router()

userRouter.use(verifyJwt)

userRouter.get("/me", getCurrentUser)
userRouter.patch("/me", updateCurrentUser)
userRouter.patch("/change-password", changePassword);
userRouter.get("/search", searchUser);
userRouter.patch("/avatar", upload.single("avatar"), updateAvatar);
userRouter.post("/image", upload.single("image"), uploadChatImage);
userRouter.post("/video", upload.single("video"), uploadChatVideo);
userRouter.post("/audio", upload.single("audio"), uploadChatAudio);

export default userRouter;