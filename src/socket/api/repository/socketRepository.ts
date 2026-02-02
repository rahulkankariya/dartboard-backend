import { UserModel } from "../../../models/users";
import { ISocketPayload } from "../../types/socket";

export const validateSocketToken = async (payload: ISocketPayload): Promise<boolean> => {
    try {
        const user = await UserModel.findOne({
            uniqueId: payload.uniqueId,
            _id: payload.id
        }).lean();

        // Returns true if user exists, false otherwise
        return !!user;
    } catch (error) {
        console.error("Database validation error:", error);
        return false;
    }
};


export const updateOnlineStatus = async (id: string, isOnline: number): Promise<boolean> => {
    try {
        const result = await UserModel.findByIdAndUpdate(id, { 
            isOnline: isOnline 
        });
        return !!result;
    } catch (error) {
        console.error("DB: Update Status Error:", error);
        return false;
    }
};

export const fetchActiveUsers = async (pageIndex: number, pageSize: number, currentUserId: string) => {
    try {
        const skip = (pageIndex - 1) * pageSize;
        
        // Parallel execution for performance
        const [users, totalCount] = await Promise.all([
            UserModel.find({ _id: { $ne: currentUserId }, isOnline: 1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            UserModel.countDocuments({ _id: { $ne: currentUserId }, isOnline: 1 })
        ]);

        return {
            userList: users,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            pageIndex,
            pageSize
        };
    } catch (error) {
        console.error("DB: Fetch Users Error:", error);
        throw error; // Let the service handle the error response
    }
};