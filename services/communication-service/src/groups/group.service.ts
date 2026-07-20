import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from './group.entity';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) {}

  async createGroup(name: string, members: string[], creatorId: string, avatar?: string, description?: string): Promise<Group> {
    const group = new this.groupModel({ 
      name, 
      members: [...members, creatorId], // Thêm creator vào members
      creatorId,
      avatar,
      description,
      admins: [] // Mặc định chỉ có creator là admin
    });
    return group.save();
  }

  async getGroupById(groupId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return this.groupModel.find({ members: userId }).exec();
  }

  async addMember(groupId: string, userId: string) {
    const group = await this.getGroupById(groupId);
    if (group.members.includes(userId)) {
      return group; // Đã là thành viên
    }
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  async addMembers(groupId: string, userIds: string[]) {
    const group = await this.getGroupById(groupId);
    const newMembers = userIds.filter(id => !group.members.includes(id));
    if (newMembers.length === 0) {
      return group;
    }
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: newMembers } }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  async removeMember(groupId: string, userId: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    // Kiểm tra quyền: chỉ creator, admin, hoặc chính user đó mới có thể xóa
    const isCreator = group.creatorId.toString() === requesterId;
    const isAdmin = group.admins.some(adminId => adminId.toString() === requesterId);
    const isSelf = userId === requesterId;
    
    if (!isCreator && !isAdmin && !isSelf) {
      throw new ForbiddenException('Bạn không có quyền xóa thành viên này');
    }

    // Không cho phép xóa creator
    if (group.creatorId.toString() === userId) {
      throw new ForbiddenException('Không thể xóa người tạo nhóm');
    }

    // Xóa khỏi members và admins nếu có
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { 
        $pull: { members: userId, admins: userId },
        $set: { updatedAt: new Date() }
      },
      { new: true },
    );
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.getGroupById(groupId);
    
    // Không cho phép creator rời nhóm (phải xóa nhóm hoặc chuyển quyền)
    if (group.creatorId.toString() === userId) {
      throw new ForbiddenException('Người tạo nhóm không thể rời nhóm. Vui lòng xóa nhóm hoặc chuyển quyền.');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { 
        $pull: { members: userId, admins: userId },
        $set: { updatedAt: new Date() }
      },
      { new: true },
    );
  }

  async updateGroupName(groupId: string, newName: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    // Chỉ creator hoặc admin mới có thể đổi tên
    const isCreator = group.creatorId.toString() === requesterId;
    const isAdmin = group.admins.some(adminId => adminId.toString() === requesterId);
    
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền đổi tên nhóm');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { name: newName, updatedAt: new Date() },
      { new: true },
    );
  }

  async updateGroupAvatar(groupId: string, avatar: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    const isCreator = group.creatorId.toString() === requesterId;
    const isAdmin = group.admins.some(adminId => adminId.toString() === requesterId);
    
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền đổi avatar nhóm');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { avatar, updatedAt: new Date() },
      { new: true },
    );
  }

  async updateGroupDescription(groupId: string, description: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    const isCreator = group.creatorId.toString() === requesterId;
    const isAdmin = group.admins.some(adminId => adminId.toString() === requesterId);
    
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền đổi mô tả nhóm');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { description, updatedAt: new Date() },
      { new: true },
    );
  }

  async addAdmin(groupId: string, userId: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    // Chỉ creator mới có thể thêm admin
    if (group.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có thể thêm admin');
    }

    // Kiểm tra user có phải thành viên không
    if (!group.members.some(memberId => memberId.toString() === userId)) {
      throw new NotFoundException('User không phải thành viên của nhóm');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $addToSet: { admins: userId }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  async removeAdmin(groupId: string, userId: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    // Chỉ creator mới có thể xóa admin
    if (group.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có thể xóa admin');
    }

    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $pull: { admins: userId }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  async deleteGroup(groupId: string, requesterId: string) {
    const group = await this.getGroupById(groupId);
    
    // Chỉ creator mới có thể xóa nhóm
    if (group.creatorId.toString() !== requesterId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có thể xóa nhóm');
    }

    return this.groupModel.findByIdAndDelete(groupId);
  }

  async getGroupMembers(groupId: string) {
    const group = await this.getGroupById(groupId);
    return {
      members: group.members,
      creatorId: group.creatorId,
      admins: group.admins,
    };
  }

  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    const group = await this.getGroupById(groupId);
    const isCreator = group.creatorId.toString() === userId;
    const isAdmin = group.admins.some(adminId => adminId.toString() === userId);
    return isCreator || isAdmin;
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const group = await this.getGroupById(groupId);
    return group.members.some(memberId => memberId.toString() === userId);
  }

  /**
   * Tắt thông báo nhóm (mute)
   */
  async muteGroup(groupId: string, userId: string): Promise<Group> {
    await this.getGroupById(groupId); // Kiểm tra group tồn tại
    
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $addToSet: { mutedBy: userId }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  /**
   * Bật thông báo nhóm (unmute)
   */
  async unmuteGroup(groupId: string, userId: string): Promise<Group> {
    await this.getGroupById(groupId); // Kiểm tra group tồn tại
    
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $pull: { mutedBy: userId }, $set: { updatedAt: new Date() } },
      { new: true },
    );
  }

  /**
   * Đặt tin nhắn được ghim trong nhóm
   */
  async setPinnedMessage(groupId: string, messageId: string | null): Promise<Group> {
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { pinnedMessageId: messageId || null, updatedAt: new Date() },
      { new: true },
    );
  }
}
