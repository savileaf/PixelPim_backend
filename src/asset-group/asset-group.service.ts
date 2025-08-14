import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetGroupDto, UpdateAssetGroupDto } from './dto';
import { PaginatedResponse, PaginationUtils } from '../common';

@Injectable()
export class AssetGroupService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetGroupDto: CreateAssetGroupDto, userId: number) {
    // Check if asset group with same name already exists for this user
    const existingGroup = await this.prisma.assetGroup.findFirst({
      where: {
        groupName: createAssetGroupDto.groupName,
        userId,
      },
    });

    if (existingGroup) {
      throw new ConflictException('Asset group with this name already exists');
    }

    const assetGroup = await this.prisma.assetGroup.create({
      data: {
        groupName: createAssetGroupDto.groupName,
        userId,
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    // Convert BigInt to Number for JSON serialization
    return {
      ...assetGroup,
      totalSize: Number(assetGroup.totalSize),
    };
  }

  async findAll(userId: number, page: number = 1, limit: number = 10) {
    const whereCondition = { userId };
    const paginationOptions = PaginationUtils.createPrismaOptions(page, limit);

    const [assetGroups, total] = await Promise.all([
      this.prisma.assetGroup.findMany({
        where: whereCondition,
        ...paginationOptions,
        include: {
          _count: {
            select: {
              assets: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.assetGroup.count({ where: whereCondition }),
    ]);

    // Convert BigInt to Number for JSON serialization
    const transformedAssetGroups = assetGroups.map(group => ({
      ...group,
      totalSize: Number(group.totalSize),
    }));

    return PaginationUtils.createPaginatedResponse(transformedAssetGroups, total, page, limit);
  }

  async findOne(id: number, userId: number) {
    const assetGroup = await this.prisma.assetGroup.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!assetGroup) {
      throw new NotFoundException('Asset group not found');
    }

    // Convert BigInt to Number for JSON serialization
    return {
      ...assetGroup,
      totalSize: Number(assetGroup.totalSize),
    };
  }

  async getAssetsInGroup(id: number, userId: number, page: number = 1, limit: number = 10) {
    const assetGroup = await this.findOne(id, userId);

    const whereCondition = {
      assetGroupId: id,
      userId,
    };

    const paginationOptions = PaginationUtils.createPrismaOptions(page, limit);

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where: whereCondition,
        ...paginationOptions,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.asset.count({ where: whereCondition }),
    ]);

    // Convert BigInt to Number for JSON serialization
    const transformedAssets = assets.map(asset => ({
      ...asset,
      size: Number(asset.size),
    }));

    return PaginationUtils.createPaginatedResponse(transformedAssets, total, page, limit);
  }

  async update(id: number, updateAssetGroupDto: UpdateAssetGroupDto, userId: number) {
    const assetGroup = await this.findOne(id, userId);

    // Check if new name conflicts with existing group
    if (updateAssetGroupDto.groupName && updateAssetGroupDto.groupName !== assetGroup.groupName) {
      const existingGroup = await this.prisma.assetGroup.findFirst({
        where: {
          groupName: updateAssetGroupDto.groupName,
          userId,
          id: { not: id },
        },
      });

      if (existingGroup) {
        throw new ConflictException('Asset group with this name already exists');
      }
    }

    const updatedAssetGroup = await this.prisma.assetGroup.update({
      where: { id },
      data: updateAssetGroupDto,
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    // Convert BigInt to Number for JSON serialization
    return {
      ...updatedAssetGroup,
      totalSize: Number(updatedAssetGroup.totalSize),
    };
  }

  async remove(id: number, userId: number) {
    const assetGroup = await this.findOne(id, userId);

    // Set all assets in this group to have no group
    await this.prisma.asset.updateMany({
      where: { assetGroupId: id },
      data: { assetGroupId: null },
    });

    await this.prisma.assetGroup.delete({
      where: { id },
    });

    return { message: 'Asset group deleted successfully' };
  }
}
