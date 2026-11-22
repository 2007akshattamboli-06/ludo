import { AvatarId } from './auth';

export interface FriendRequestRecord {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromAvatar: AvatarId;
  toUid: string;
  toUsername: string;
  toAvatar: AvatarId;
  status: 'pending' | 'accepted';
  createdAt: number;
}

export interface FriendProfile {
  uid: string;
  username: string;
  avatar: AvatarId;
  friendshipId: string;
}

export interface DirectMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface GameInvitePayload {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromAvatar: AvatarId;
  roomCode: string;
  createdAt: number;
}