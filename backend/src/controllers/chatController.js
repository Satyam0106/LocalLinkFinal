import mongoose from "mongoose";
import { Chat } from "../models/Chat.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";
import { serializeChat } from "../utils/serializers.js";

async function populateChat(chat) {
  await chat.populate("customerId");
  await chat.populate("vendorId");
  await chat.populate("messages.senderId");
  return chat;
}

async function resolveParticipants(currentUser, otherUserId) {
  if (!mongoose.isValidObjectId(otherUserId)) {
    return { error: { status: 400, message: "Invalid user id" } };
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    return { error: { status: 404, message: "User not found" } };
  }

  if (String(otherUser._id) === String(currentUser._id)) {
    return { error: { status: 400, message: "Cannot start a chat with yourself" } };
  }

  if (otherUser.role === currentUser.role) {
    return { error: { status: 400, message: "Chats are only available between customers and vendors." } };
  }

  const customerId = currentUser.role === "customer" ? currentUser._id : otherUser._id;
  const vendorId = currentUser.role === "vendor" ? currentUser._id : otherUser._id;

  return { customerId, vendorId };
}

async function getOrCreateChat(currentUser, otherUserId) {
  const participants = await resolveParticipants(currentUser, otherUserId);
  if (participants.error) return participants;

  let chat = await Chat.findOne({
    customerId: participants.customerId,
    vendorId: participants.vendorId,
  });

  if (!chat) {
    chat = await Chat.create({
      customerId: participants.customerId,
      vendorId: participants.vendorId,
      messages: [],
      lastMessageAt: new Date(),
    });
  }

  await populateChat(chat);
  return { chat };
}

export async function listChats(req, res) {
  const filter = req.user.role === "vendor" ? { vendorId: req.user._id } : { customerId: req.user._id };
  const chats = await Chat.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("customerId")
    .populate("vendorId")
    .populate("messages.senderId");

  return res.json({
    chats: chats.map((chat) => serializeChat(chat, req.user._id)),
  });
}

export async function getChat(req, res) {
  const { otherUserId } = req.params;
  const result = await getOrCreateChat(req.user, otherUserId);
  if (result.error) return sendError(res, result.error.status, result.error.message);

  return res.json({
    chat: serializeChat(result.chat, req.user._id),
  });
}

export async function sendChatMessage(req, res) {
  const { otherUserId } = req.params;
  const text = String(req.body?.text ?? "").trim();
  if (!text) return sendError(res, 400, "Message text is required");

  const result = await getOrCreateChat(req.user, otherUserId);
  if (result.error) return sendError(res, result.error.status, result.error.message);

  const { chat } = result;
  chat.messages.push({
    senderId: req.user._id,
    text,
    createdAt: new Date(),
  });
  chat.lastMessageAt = new Date();
  await chat.save();
  await populateChat(chat);

  return res.status(201).json({
    chat: serializeChat(chat, req.user._id),
  });
}
