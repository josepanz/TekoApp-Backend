import { Module } from '@nestjs/common';
import { LanguagesController } from './controllers/languages.controller';
import { LanguagesService } from './services/languages.service';
import { LanguagesDbModule } from '@modules/languages-db/languages-db.module';

@Module({
  imports: [LanguagesDbModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
