import { Socket } from "socket.io";

export interface ISocketPayload {
    uniqueId: string;
    id: string;
}

// JwtUserPayload inherits from ISocketPayload
export interface JwtUserPayload extends ISocketPayload {
    email: string;
    username?: string;
}

// User List Event interfaces
export interface UserListRequest {
    pageIndex: number;
    pageSize: number;
}

export interface UserListResponse {
    status: number;
    message: string;
    data: any;
}

// Global Module Augmentation
declare module "socket.io" {
    interface Socket {
        user?: JwtUserPayload;
    }
}