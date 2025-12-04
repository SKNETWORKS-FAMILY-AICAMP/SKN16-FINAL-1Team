import axios from "axios";
import { CHATBOT_API_BASE_URL } from "../utils/config";

export const chatbotClient = axios.create({
  baseURL: CHATBOT_API_BASE_URL,
  withCredentials: false,
});
