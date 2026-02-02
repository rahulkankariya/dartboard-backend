import { fetchActiveUsers, updateOnlineStatus } from "../repository/socketRepository";


export const updateUserStatus = async (id: string, status: number) => {
    return await updateOnlineStatus(id, status);
};

export const getActiveUsers = async (pageIndex: number, pageSize: number, id: string) => {
    // Logic: Ensure minimum values
    const pIndex = pageIndex > 0 ? pageIndex : 1;
    const pSize = pageSize > 0 ? pageSize : 10;

    const result = await fetchActiveUsers(pIndex, pSize, id);
    
    // centralized logic: if no users, return empty structure instead of null
    return {
        executed: result.userList.length > 0 ? 1 : 0,
        data: result
    };
};