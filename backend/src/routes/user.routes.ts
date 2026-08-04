import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { changePassword, getCurrentUser, updateCurrentUser, updateAvatar, searchUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadChatImage } from "../controllers/upload.controller.js";

const userRouter = Router()

userRouter.use(verifyJwt)

userRouter.get("/me", getCurrentUser)
userRouter.patch("/me", updateCurrentUser)
userRouter.patch("/change-password", changePassword);
userRouter.get("/search", searchUser);
userRouter.patch("/avatar", upload.single("avatar"), updateAvatar);
userRouter.post("/chat", upload.single("image"), uploadChatImage)

export default userRouter;