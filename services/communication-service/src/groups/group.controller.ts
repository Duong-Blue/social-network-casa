import { Controller, Post, Get, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { GroupService } from './group.service';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 🆕 Tạo nhóm mới
   * Body: { name: string; members: string[]; avatar?: string; description?: string }
   */
  @Post()
  async createGroup(
    @Body() body: { name: string; members: string[]; avatar?: string; description?: string; creatorId: string },
  ) {
    return this.groupService.createGroup(body.name, body.members, body.creatorId, body.avatar, body.description);
  }

  /**
   * 👤 Lấy danh sách nhóm mà user tham gia
   * GET /groups/user/:userId
   */
  @Get('user/:userId')
  async getUserGroups(@Param('userId') userId: string) {
    return this.groupService.getUserGroups(userId);
  }

  /**
   * 🔍 Lấy thông tin chi tiết của nhóm
   * GET /groups/:groupId
   */
  @Get(':groupId')
  async getGroupById(@Param('groupId') groupId: string) {
    return this.groupService.getGroupById(groupId);
  }

  /**
   * 👥 Lấy danh sách thành viên của nhóm
   * GET /groups/:groupId/members
   */
  @Get(':groupId/members')
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupService.getGroupMembers(groupId);
  }

  /**
   * ➕ Thêm thành viên vào nhóm
   * POST /groups/:groupId/members
   * Body: { userId: string }
   */
  @Post(':groupId/members')
  async addMember(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    return this.groupService.addMember(groupId, body.userId);
  }

  /**
   * ➕➕ Thêm nhiều thành viên vào nhóm
   * POST /groups/:groupId/members/bulk
   * Body: { userIds: string[] }
   */
  @Post(':groupId/members/bulk')
  async addMembers(
    @Param('groupId') groupId: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.groupService.addMembers(groupId, body.userIds);
  }

  /**
   * ➖ Xóa thành viên khỏi nhóm
   * DELETE /groups/:groupId/members
   * Query: userId, requesterId
   */
  @Delete(':groupId/members')
  async removeMember(
    @Param('groupId') groupId: string,
    @Query('userId') userId: string,
    @Query('requesterId') requesterId: string,
  ) {
    return this.groupService.removeMember(groupId, userId, requesterId);
  }

  /**
   * 🚪 Rời nhóm
   * DELETE /groups/:groupId/leave
   * Query: userId
   */
  @Delete(':groupId/leave')
  async leaveGroup(
    @Param('groupId') groupId: string,
    @Query('userId') userId: string,
  ) {
    return this.groupService.leaveGroup(groupId, userId);
  }

  /**
   * ✏️ Đổi tên nhóm
   * PUT /groups/:groupId/name
   * Body: { newName: string; requesterId: string }
   */
  @Put(':groupId/name')
  async updateGroupName(
    @Param('groupId') groupId: string,
    @Body() body: { newName: string; requesterId: string },
  ) {
    return this.groupService.updateGroupName(groupId, body.newName, body.requesterId);
  }

  /**
   * 🖼️ Đổi avatar nhóm
   * PUT /groups/:groupId/avatar
   * Body: { avatar: string; requesterId: string }
   */
  @Put(':groupId/avatar')
  async updateGroupAvatar(
    @Param('groupId') groupId: string,
    @Body() body: { avatar: string; requesterId: string },
  ) {
    return this.groupService.updateGroupAvatar(groupId, body.avatar, body.requesterId);
  }

  /**
   * 📝 Đổi mô tả nhóm
   * PUT /groups/:groupId/description
   * Body: { description: string; requesterId: string }
   */
  @Put(':groupId/description')
  async updateGroupDescription(
    @Param('groupId') groupId: string,
    @Body() body: { description: string; requesterId: string },
  ) {
    return this.groupService.updateGroupDescription(groupId, body.description, body.requesterId);
  }

  /**
   * 👑 Thêm admin
   * POST /groups/:groupId/admins
   * Body: { userId: string; requesterId: string }
   */
  @Post(':groupId/admins')
  async addAdmin(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string; requesterId: string },
  ) {
    return this.groupService.addAdmin(groupId, body.userId, body.requesterId);
  }

  /**
   * 👑 Xóa admin
   * DELETE /groups/:groupId/admins
   * Query: userId, requesterId
   */
  @Delete(':groupId/admins')
  async removeAdmin(
    @Param('groupId') groupId: string,
    @Query('userId') userId: string,
    @Query('requesterId') requesterId: string,
  ) {
    return this.groupService.removeAdmin(groupId, userId, requesterId);
  }

  /**
   * 🗑️ Xóa nhóm
   * DELETE /groups/:groupId
   * Query: requesterId
   */
  @Delete(':groupId')
  async deleteGroup(
    @Param('groupId') groupId: string,
    @Query('requesterId') requesterId: string,
  ) {
    return this.groupService.deleteGroup(groupId, requesterId);
  }

  /**
   * ✅ Kiểm tra user có phải admin không
   * GET /groups/:groupId/is-admin
   * Query: userId
   */
  @Get(':groupId/is-admin')
  async isGroupAdmin(
    @Param('groupId') groupId: string,
    @Query('userId') userId: string,
  ) {
    const isAdmin = await this.groupService.isGroupAdmin(groupId, userId);
    return { isAdmin };
  }

  /**
   * 🔕 Tắt thông báo nhóm (mute)
   * POST /groups/:groupId/mute
   * Body: { userId: string }
   */
  @Post(':groupId/mute')
  async muteGroup(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    return this.groupService.muteGroup(groupId, body.userId);
  }

  /**
   * 🔔 Bật thông báo nhóm (unmute)
   * POST /groups/:groupId/unmute
   * Body: { userId: string }
   */
  @Post(':groupId/unmute')
  async unmuteGroup(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    return this.groupService.unmuteGroup(groupId, body.userId);
  }
}
