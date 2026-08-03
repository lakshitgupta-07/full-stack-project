import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { changePassword, getCurrentUser, updateCurrentUser, updateAvatar, searchUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const userRouter = Router()

userRouter.use(verifyJwt)

userRouter.get("/me", getCurrentUser)
userRouter.patch("/me", updateCurrentUser)
userRouter.patch("/change-password", changePassword);
userRouter.get("/search", searchUser);
userRouter.patch("/avatar", upload.single("avatar"), updateAvatar);

export default userRouter;