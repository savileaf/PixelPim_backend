import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AttributeModule } from './attribute/attribute.module';
import { AttributeGroupModule } from './attribute-group/attribute-group.module';
import { FamilyModule } from './family/family.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { AssetModule } from './asset/asset.module';
import { AssetGroupModule } from './asset-group/asset-group.module';
import { NotificationModule } from './notification/notification.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available globally
      envFilePath: '.env', // Specify the .env file path
    }),
    PrismaModule, 
    AuthModule, 
    AttributeModule, 
    AttributeGroupModule, 
    FamilyModule, 
    CategoryModule, 
    ProductModule,
    AssetModule,
    AssetGroupModule,
    NotificationModule,
    SupportModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
