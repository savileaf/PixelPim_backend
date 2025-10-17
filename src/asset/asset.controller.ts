import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetService } from './asset.service';
import { CreateAssetDto, UpdateAssetDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../common';
import { FileUploadUtil } from '../utils/file-upload.util';
import type { Response } from 'express';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAssetDto: CreateAssetDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.assetService.create(createAssetDto, file, userId);
  }

  @Post('zip')
  async downloadZip(@Body('files') files: string[], @Res() res: Response) {
    await FileUploadUtil.downloadFilesAsZip(files, res, 'my-assets.zip');
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('assetGroupId') assetGroupId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('mimeType') mimeType?: string,
    @Query('minSize') minSize?: string,
    @Query('maxSize') maxSize?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('hasGroup') hasGroup?: string,
    @Query('dateFilter') dateFilter?: 'latest' | 'oldest',
  ) {
    const userId = req.user.id;
    const groupId = assetGroupId ? parseInt(assetGroupId, 10) : undefined;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const sortOrderValidated = sortOrder === 'asc' ? 'asc' : 'desc';
    
    const filters = {
      search,
      mimeType,
      minSize: minSize ? parseInt(minSize) : undefined,
      maxSize: maxSize ? parseInt(maxSize) : undefined,
      createdAfter,
      createdBefore,
      sortBy,
      sortOrder: sortOrderValidated,
      hasGroup: hasGroup === 'true' ? true : hasGroup === 'false' ? false : undefined,
      dateFilter,
    };
    
    return this.assetService.findAll(userId, groupId, pageNum, limitNum, filters);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.assetService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetDto: UpdateAssetDto,
    @Req() req: any,
  ) {
      const userId = req.user.id;
      try {
        return await this.assetService.update(id, updateAssetDto, userId);
      } catch (error) {
        // Handle known HTTP exceptions
        if (error instanceof Error && error.name === 'NotFoundException') {
          return { statusCode: 404, message: error.message };
        }
        if (error instanceof Error && error.name === 'BadRequestException') {
          return { statusCode: 400, message: error.message };
        }
        // Prisma error codes (optional, if needed)
        if (error.code) {
          const prismaErrorMessages: Record<string, string> = {
            'P2000': 'The provided value is too long for the database field',
            'P2001': 'Record not found',
            'P2002': 'A record with this unique constraint already exists',
            'P2003': 'Foreign key constraint failed',
            'P2004': 'A constraint failed on the database',
            'P2005': 'The value stored in the database is invalid for the field type',
            'P2006': 'The provided value is not valid for this field',
            'P2007': 'Data validation error',
          };
          const message = prismaErrorMessages[error.code];
          if (message) {
            return { statusCode: 400, message };
          }
        }
        // Fallback for unknown errors
        return { statusCode: 500, message: 'Internal server error' };
      }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.assetService.remove(id, userId);
  }
}
