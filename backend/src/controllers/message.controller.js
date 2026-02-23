import * as messageService from '../services/message.service.js';
import { ok } from '../utils/respond.js';

export async function getUsers(req, res) {
  const contacts = await messageService.getContacts(req.user._id);
  ok(res, { users: contacts });
}

export async function getMessages(req, res) {
  const result = await messageService.getConversation(req.user._id, req.valid.params.id, req.valid.query);
  ok(res, result);
}

export async function sendMessage(req, res) {
  const { message, created } = await messageService.sendMessage(req.user._id, req.valid.params.id, req.valid.body);
  // 201 for a new message, 200 when a retry returned the already-saved one
  ok(res, { message }, created ? 201 : 200);
}
