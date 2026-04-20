import { Router } from "express";
import { getChat, listChats, sendChatMessage } from "../controllers/chatController.js";
import { authRequired } from "../middleware/auth.js";

export const chatRoutes = Router();

chatRoutes.get("/chats", authRequired, listChats);
chatRoutes.get("/chat/:otherUserId", authRequired, getChat);
chatRoutes.post("/chat/:otherUserId/messages", authRequired, sendChatMessage);
