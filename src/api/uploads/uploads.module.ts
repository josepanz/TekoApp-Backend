import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageModule } from '@modules/storage/storage.module';
import { UsersDBModule } from '@modules/users-db/users-db.module';
import { UploadsController } from './controllers/uploads.controller';
import { UploadsService } from './services/uploads.service';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './const/uploads.const';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(`Tipo de archivo no permitido: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
    StorageModule,
    UsersDBModule,
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
