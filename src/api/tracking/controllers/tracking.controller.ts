// src/api/tracking/controllers/tracking.controller.ts
import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { TrackingApiService } from '../services/tracking.service';
import { UpdateLocationRequestDTO } from '../dtos/request/update-location.request.dto';
import { UpdateLocationResponseDTO } from '../dtos/response/update-location.response.dto';
import { GetNearbyProfessionalsRequestDTO } from '../dtos/request/get-nearby-professionals.request.dto';
import { GetNearbyProfessionalsResponseDTO } from '../dtos/response/get-nearby-professionals.response.dto';
import {
  ApplyTrackingControllerDocs,
  ApplyPingDocs,
  ApplyNearbyDocs,
} from '../docs/tracking.docs';

@Controller('tracking')
@ApplyTrackingControllerDocs()
export class TrackingController {
  constructor(private readonly trackingApiService: TrackingApiService) {}

  @Post('ping')
  @ApplyPingDocs()
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationRequestDTO,
  ): Promise<UpdateLocationResponseDTO> {
    return this.trackingApiService.processLocationPing(updateLocationDto);
  }

  @Get('nearby')
  @ApplyNearbyDocs()
  async getNearbyProfessionals(
    @Query() query: GetNearbyProfessionalsRequestDTO,
  ): Promise<GetNearbyProfessionalsResponseDTO> {
    return this.trackingApiService.getNearbyProviders(query);
  }
}
