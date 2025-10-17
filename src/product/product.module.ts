import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MarketplaceTemplateService } from './services/marketplace-template.service';
import { MarketplaceExportService } from './services/marketplace-export.service';
import { CsvImportService } from './services/csv-import.service';
import { ImportSchedulerService } from './services/import-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, NotificationModule, ScheduleModule.forRoot()],
  controllers: [ProductController],
  providers: [
    ProductService, 
    MarketplaceTemplateService, 
    MarketplaceExportService,
    CsvImportService,
    ImportSchedulerService,
  ],
  exports: [ProductService],
})
export class ProductModule {}
