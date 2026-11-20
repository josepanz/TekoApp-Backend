import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { StorageAccessDbService } from './services/storage-access-db.service';

/** Resuelve, desde la DB, quién es el dueño de una key de S3 (autorización de archivos). */
@Module({
  imports: [DatabaseModule],
  providers: [StorageAccessDbService],
  exports: [StorageAccessDbService],
})
export class StorageAccessDbModule {}
