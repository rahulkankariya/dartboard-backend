import { Server, Socket } from "socket.io";

import { UserListRequest } from "../../types/socket";
import { getActiveUsers, updateUserStatus } from "../services";

const socketController = (io: Server, socket: Socket): void => {
    const user = socket.user;
    if (!user) return;

    // 1. Set Online
    updateUserStatus(user.id, 1);

    // 2. Event: Request User List
    socket.on("request-user-list", async (data: UserListRequest) => {
        try {
            const result = await getActiveUsers(data.pageIndex, data.pageSize, user.id);
            
            socket.emit("response-user-list", { 
                status: 200, 
                message: "Success", 
                data: result.data 
            });
        } catch (error) {
            socket.emit("response-user-list", { 
                status: 500, 
                message: "Error fetching user list", 
                data: [] 
            });
        }
    });

    // 3. Disconnect
    socket.on("disconnect", async () => {
        await updateUserStatus(user.id, 0);
        console.log(`User ${user.id} is now offline.`);
    });
};

export default socketController;