import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './group.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller'; // ✅ thêm dòng này

@Module({
  imports: [MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }])],
  controllers: [GroupController], // ✅ thêm dòng này
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
