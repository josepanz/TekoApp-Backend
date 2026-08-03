# Graph Report - .  (2026-07-21)

## Corpus Check
- Large corpus: 530 files · ~159,221 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3885 nodes · 7167 edges · 322 communities (194 shown, 128 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 251
- Community 252
- Community 253
- Community 254
- Community 255
- Community 256
- Community 257
- Community 258
- Community 259
- Community 260
- Community 261
- Community 262
- Community 263
- Community 264
- Community 265
- Community 266
- Community 267
- Community 268
- Community 269
- Community 270
- Community 271
- Community 272
- Community 273
- Community 274
- Community 275
- Community 276
- Community 277
- Community 278
- Community 279
- Community 280
- Community 281
- Community 282
- Community 283
- Community 284
- Community 285
- Community 286
- Community 287
- Community 288
- Community 289
- Community 290
- Community 291
- Community 292
- Community 293
- Community 294
- Community 295
- Community 296
- Community 297
- Community 298
- Community 299
- Community 300
- Community 301
- Community 302
- Community 303
- Community 304
- Community 305
- Community 306
- Community 307
- Community 308
- Community 309
- Community 310
- Community 311
- Community 312
- Community 313
- Community 314
- Community 315
- Community 316
- Community 317
- Community 319

## God Nodes (most connected - your core abstractions)
1. `@prisma/client` - 111 edges
2. `PrismaDatasource` - 75 edges
3. `UsersDBService` - 73 edges
4. `IUserDataOnJwt` - 63 edges
5. `RolesDBService` - 33 edges
6. `ProfessionalDetailResponseDTO` - 31 edges
7. `PermissionsDBService` - 31 edges
8. `JwtAuthGuard` - 29 edges
9. `RatingsDbService` - 27 edges
10. `ServicesDbService` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Rating entity (TypeORM)` --conceptually_related_to--> `Golden rule: api/* never accesses Prisma directly, always via *-db module`  [AMBIGUOUS]
  src/api/ratings/README.md → README.md
- `Session 8 — Migration to -db modules (ratings, services, promotions)` --semantically_similar_to--> `tdd-refactor agent`  [INFERRED] [semantically similar]
  .claude/memory/sessions/archive/session_8_migration_db_modules.md → .claude/agents/tdd-refactor.md
- `Semantic Release Step (npx semantic-release)` --references--> `TekoApp-Backend CHANGELOG`  [EXTRACTED]
  .github/workflows/pipeline.yml → CHANGELOG.md
- `Semantic Release Step (npx semantic-release)` --references--> `Deployment deploy-tekoapp-backend (develop)`  [INFERRED]
  .github/workflows/pipeline.yml → ci/develop/1_deployment.yml
- `Semantic Release Step (npx semantic-release)` --references--> `Deployment deploy-tekoapp-backend (master)`  [INFERRED]
  .github/workflows/pipeline.yml → ci/master/1_deployment.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **TDD/testing governance system (manual + agents + project rules)** — claude_documentation_manual_tdd_sdd, claude_agents_testing_agent, claude_agents_tdd_refactor, claude_claude [INFERRED 0.80]
- **Sessions archived per memory.md's >5-session protocol** — claude_memory_memory, claude_memory_sessions_archive_session_1_fix_build_startup, claude_memory_sessions_archive_session_2_eslint_any_cleanup, claude_memory_sessions_archive_session_3_dtos_payments_refactor, claude_memory_sessions_archive_session_4_professionals_db_response_dtos, claude_memory_sessions_archive_session_5_dto_restructure_fee_calculator_tests, claude_memory_sessions_archive_session_6_tests_forceexit_users_cleanup, claude_memory_sessions_archive_session_7_controller_tests, claude_memory_sessions_archive_session_8_migration_db_modules [EXTRACTED 1.00]
- **api/* → *-db module migration pattern (golden architecture rule)** — claude_memory_sessions_archive_session_4_professionals_db_response_dtos, claude_memory_sessions_archive_session_8_migration_db_modules, claude_claude [INFERRED 0.85]
- **Zero-warnings lint cleanup effort** — claude_memory_sessions_session_11_lint_clean_zero_warnings, claude_rules_test, claude_rules_typescript, claude_memory_sessions_session_11_lint_clean_zero_warnings_zero_warnings_rule [EXTRACTED 1.00]
- **CI/CD reconstruction and git history rewrite saga** — claude_memory_sessions_session_12_cicd_pipeline_reconstruido, claude_memory_sessions_session_13_git_history_cleanup_ci_notes_fix, claude_memory_sessions_session_13_git_history_cleanup_ci_notes_fix_semantic_release_notes_bug [EXTRACTED 1.00]
- **Graphify skill reference documentation set** — claude_skills_graphify_skill, claude_skills_graphify_references_extraction_spec, claude_skills_graphify_references_query, claude_skills_graphify_references_exports, claude_skills_graphify_references_github_and_merge, claude_skills_graphify_references_hooks, claude_skills_graphify_references_add_watch [EXTRACTED 1.00]
- **CI/CD Pipeline Flow: lint -> test -> docker-validate -> release -> deploy** — github_workflows_pipeline_lint, github_workflows_pipeline_test, github_workflows_pipeline_dockervalidate, github_workflows_pipeline_release, github_workflows_pipeline_deploy [EXTRACTED 0.95]
- **Develop Environment Kubernetes Stack (Deployment+Service+Ingress+HPA)** — ci_develop_1_deployment_deploy_tekoapp_backend, ci_develop_2_service_service_tekoapp_backend, ci_develop_3_ingress_ingress_tekoapp_backend, ci_develop_4_hpa_autoscale_tekoapp_backend [EXTRACTED 0.90]
- **Semantic-release Versioning: release PR checklist -> pipeline release job -> CHANGELOG** — github_pull_request_template_release, github_workflows_pipeline_semanticrelease, changelog [EXTRACTED 0.85]

## Communities (322 total, 128 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (41): prisma, @prisma/client, PaymentQueryDto, FlatMerchantAssignment, GroupedAssignments, auditTxActive, convertDecimals(), isDecimalLike() (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (22): IJwtPayload, CryptoHelper, APP_CONFIG, AppConfigType, pkg, configOptions, configSchema, PackageJson (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (26): IsISO8601, BlockUserRequestDTO, ApiProperty, IsNotEmpty, IsString, ApiProperty, IsNotEmpty, IsString (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (43): author, commitlint, extends, description, license, name, pnpm, onlyBuiltDependencies (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (32): GetProfessionalServicesQueryDTO, ApiPropertyOptional, IsEnum, IsOptional, ProfessionalReferenceIdParamDTO, ApiProperty, IsUUID, SuspendProfessionalRequestDTO (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (25): @nestjs/core, mockCreatePasswordWithToken, mockForgotPassword, mockHandleLogin, mockRefreshAccessToken, mockScope, mockSendPasswordCreationEmail, mockSendPasswordResetEmail (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (22): GetPermissionListQueryDTO, GetPermissionParamDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsNotEmpty, IsNumber, IsOptional (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (40): config, jest, multer, node, nodemailer, src/api/*, src/common/*, src/core/* (+32 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (26): mockCreate, mockFindByUserId, mockUpdate, mockUpdateAttempts, mockUpdateStatus, mockChangeEncryptedPassword, mockCreateOrUpdateEncryptedPassword, mockCreateOrUpdatePassword (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (28): AcceptServiceDocs, CancelServiceDocs, CompleteServiceDocs, CreateServiceDocs, CreateServiceRequestDocs, GetDashboardStatsDocs, GetMyServicesDocs, GetNearbyServicesDocs (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (41): TekoApp-Backend CHANGELOG, Deployment deploy-tekoapp-backend (develop), Service service-tekoapp-backend (develop), Ingress ingress-tekoapp-backend (develop, dev-tekoapp.com.py), HPA autoscale-tekoapp-backend (develop), Deployment deploy-tekoapp-backend (master), Service service-tekoapp-backend (master), Ingress ingress-tekoapp-backend (master, prod-tekoapp.com.py) (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (29): PaginationQueryDTO, ApiPropertyOptional, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (4): RatingsService, Injectable, RatingsDbService, Injectable

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (31): mockCancelPayment, mockCreatePayment, mockCreatePaymentMethod, mockDeletePaymentMethod, mockGetMetricsSummary, mockGetMetricsTrends, mockGetPaymentById, mockGetPayments (+23 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (23): GetProfessionalReviewsQueryDTO, SearchBySkillsQueryDTO, ApiProperty, IsNotEmpty, IsString, CategorySummaryResponseDTO, ApiProperty, ApiPropertyOptional (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (26): ApiCancelPayment, ApiCreatePayment, ApiCreatePaymentMethod, ApiDeletePaymentMethod, ApiGetPaymentById, ApiHandleWebhook, ApiRefundPayment, ApiUpdatePayment (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (7): CredentialsRepository, Injectable, AuthPasswordService, Injectable, AuthService, Injectable, UserWithSecurities

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (3): PrismaBaseRepository, PrismaBaseService, PrismaModelDelegate

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (27): ApiChangeCategoryStatus, ApiCreateCategory, ApiDeleteCategory, ApiGetAllCategoriesWithRelations, ApiGetCategoryById, ApiGetCategoryBySlug, ApiGetCategoryStats, ApiToggleCategoryVisibility (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (24): FindAllRatingsDocs, FindByProfessionalDocs, FindByServiceRequestDocs, FindByUserDocs, FindOneRatingDocs, GetAverageRatingDocs, GetClientRatingsDocs, GetUserRatingStatsDocs (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (19): ProfessionalsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (8): ProfessionalDetailResponseDTO, ProfessionalStatsResponseDTO, ApiProperty, ProfessionalsService, Injectable, ProfessionalsDbService, Injectable, ProfessionalWithRelations

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (4): RolePermissionsDBService, Injectable, RolesDBService, Injectable

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (23): mockCalculateDistance, mockFindNearbyProfessionals, mockGetOnlineProfessionalsCount, mockGetProfessionalLocation, mockGetProfessionalsByArea, mockReq, mockUpdateLocation, CalculateDistanceQueryDTO (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (18): OnboardingController, mockOnboarding, ApiTags, Controller, OnboardingUserRequestDTO, ApiProperty, IsBoolean, IsEmail (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (32): mockGetMyProfessionalProfile, mockGetNearbyProfessionals, mockGetProfessionalById, mockGetProfessionalByReference, mockGetProfessionalReviews, mockGetProfessionals, mockGetProfessionalServices, mockGetProfessionalStats (+24 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (19): handlebars, handlebars, IReportService, IExcelColumn, IPdfEngine, IReportDataMetadata, IReportFormat, IReportOptions (+11 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (17): redis, redis, HttpExceptionFilter, Catch, Catch, ValidationExceptionFilter, MiddlewareConfig, RateLimitConfig (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (22): CancelServiceRequestDTO, ApiProperty, IsNotEmpty, IsString, RespondServiceRequestRequestDTO, ApiProperty, ApiPropertyOptional, IsEnum (+14 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (14): ProcessBatchManager, STORAGE_MODULE_OPTIONS, StorageDeleteInput, StorageExecutionOptions, StorageModuleOptions, StoragePresignedUrlInput, StoragePresignedUrlOptions, StoragePresignedUrlResult (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.10
Nodes (4): PermissionDTO, RoleDTO, Injectable, UsersDBService

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (13): PrismaErrorCodes, EmailTypeEnum, EmailHelper, ISendEmailOptions, EmailService, mockAppConfig, Inject, Injectable (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (25): mockApplyPromotion, mockCreate, mockFindActive, mockFindAll, mockFindOne, mockGetPromotionStats, mockRemove, mockUpdate (+17 more)

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (24): CreatePasswordDTO, ApiProperty, IsEmail, IsNotEmpty, IsString, EmailSendRequestDTO, ApiProperty, IsEmail (+16 more)

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (20): mockBlock, mockDeleteByReference, mockFindAll, mockFindOne, mockFindOneByReference, mockGetEditContext, mockJwtUser, mockMerchantCtx (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (6): ServicesService, Injectable, ServicesDbModule, Module, ServicesDbService, Injectable

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (16): AuthDocs, Req, Res, AuthApiController, ApiBasicAuth, ApiBearerAuth, ApiTags, Body (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (26): ApiModule, Module, AuthApiModule, Module, NotificationsApiModule, Module, OnboardingApiModule, Module (+18 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (4): PaymentApiService, Injectable, PaymentDbService, Injectable

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (15): Global, DatabaseModule, Module, AuthModule, Module, EmailModule, Module, OnboardingModule (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.08
Nodes (22): mockAuthRefreshAccessToken, mockChangePassword, mockCheckVerificationStatus, mockCreatePassword, mockFindUserById, mockGetUserScope, mockJwtUser, mockLogin (+14 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (12): ServiceRequestIdParamDTO, ApiProperty, IsUUID, UpdateRatingRequestDTO, AverageCriteriaResponseDTO, ProfessionalRatingStatsResponseDTO, RatingDistributionResponseDTO, ApiProperty (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.12
Nodes (15): ServiceTypesController, ApiOperation, ApiResponse, ApiTags, Controller, Get, ServiceTypeResponseDTO, ApiProperty (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (19): ApiQuery, DeleteFileDocs, GetPresignedUrlDocs, ApiBearerAuth, ApiTags, Controller, Delete, Get (+11 more)

### Community 44 - "Community 44"
Cohesion: 0.25
Nodes (16): ApiBearerAuth, ApiTags, Body, Controller, Delete, Get, Param, Patch (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.08
Nodes (19): Injectable, UserRolesDBService, fakeUser, mockEmailService, mockPrisma, mockReplaceUserRoles, mockRolePermissionsFindMany, mockSendEmailByType (+11 more)

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (6): AppConfig, Injectable, cacheModuleAsyncOptions, getCacheModuleConfig(), getBullConfig(), getMongooseConfig()

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (23): IsIn, mockAcceptService, mockCancelService, mockCompleteService, mockCreateService, mockCreateServiceRequest, mockGetDashboardStats, mockGetMyServices (+15 more)

### Community 48 - "Community 48"
Cohesion: 0.12
Nodes (14): mockCreateRole, mockGetAllRoles, mockGetRoleById, mockUpdateRole, mockAssignPermissionsToUser, mockAssignRolesToUser, mockGetUserWithRoles, RolesApiService (+6 more)

### Community 49 - "Community 49"
Cohesion: 0.12
Nodes (15): PermissionListResponseDTO, ApiProperty, PermissionResponseDTO, ApiProperty, RoleListResponseDTO, ApiProperty, RoleResponseDTO, ApiProperty (+7 more)

### Community 50 - "Community 50"
Cohesion: 0.13
Nodes (15): nestjs-pino, AppModule, Module, ObservabilityInterceptor, Injectable, TraceIdMiddleware, Injectable, HealthModule (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (16): NotificationJobPayload, mockDbCountUnreadByUserId, mockDbCreate, mockDbDeleteOne, mockDbFindByUserId, mockDbFindUnreadByUserId, mockDbInsertMany, mockDbMarkAllAsRead (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.14
Nodes (4): PromotionsService, Injectable, PromotionsDbService, Injectable

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (17): ApiGetPayments, ApiGetPaymentSummary, Get, Query, PaymentListQueryDTO, ApiPropertyOptional, IsEnum, IsInt (+9 more)

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (4): CategoriesService, Injectable, CategoriesDbService, Injectable

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (14): LocationsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (16): NotificationsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+8 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (22): mockAcceptRequestTransaction, mockAggregateEarnings, mockCategory, mockCountServices, mockCreateService, mockCreateServiceRequest, mockFindCategoryById, mockFindDuplicateRequest (+14 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (22): fakePayment, fakePaymentMethod, fakeTransaction, mockPaymentMethodCount, mockPaymentMethodCreate, mockPaymentMethodFindFirst, mockPaymentMethodFindMany, mockPaymentMethodUpdate (+14 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (15): IsHexColor, CreateCategoryDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsEnum, IsInt, IsNumber (+7 more)

### Community 60 - "Community 60"
Cohesion: 0.09
Nodes (18): mockCalculatePlatformFee, mockCalculateProviderFee, mockClearDefaultPaymentMethods, mockCountActivePaymentMethods, mockCreatePaymentMethod, mockCreatePaymentWithTransaction, mockExecuteRefund, mockFindAllPaymentMethods (+10 more)

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (8): ServiceCategorySummaryResponseDTO, ServiceDetailResponseDTO, ServiceProfessionalSummaryResponseDTO, ServiceUserSummaryResponseDTO, ApiProperty, ApiPropertyOptional, CANCELLABLE, StartServiceDocs

### Community 62 - "Community 62"
Cohesion: 0.15
Nodes (14): ApiApplyPromotion, ApiCreatePromotion, ApiGetActivePromotions, ApiGetPromotions, ApiGetPromotionStats, ApiValidatePromotion, PromotionsController, ApiTags (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.10
Nodes (17): GetRecentRatingsDocs, GetTopRatedProfessionalsDocs, Query, GetRecentRatingsQueryDTO, ApiPropertyOptional, IsInt, IsOptional, Max (+9 more)

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (17): LoginUserResponseDTO, ApiProperty, PasswordOnlyMessageResponseDTO, PasswordResponseDTO, RefreshTokenResponseDTO, ApiProperty, IsBoolean, IsString (+9 more)

### Community 65 - "Community 65"
Cohesion: 0.10
Nodes (20): mockCreate, mockCreateProfessionalToClientRating, mockFindAll, mockFindByProfessional, mockFindByServiceRequest, mockFindByUser, mockFindClientRatings, mockFindOne (+12 more)

### Community 66 - "Community 66"
Cohesion: 0.10
Nodes (20): mockAggregateUserStats, mockCreate, mockDeactivate, mockFindAll, mockFindById, mockFindByProfessional, mockFindByServiceId, mockFindByUser (+12 more)

### Community 67 - "Community 67"
Cohesion: 0.16
Nodes (10): ALLOWED_MIME_TYPES, IMAGE_PROCESSING, MERCHANT_DOC_ALLOWED_MIME_TYPES, MERCHANT_DOC_FIELDS, IUploadedDocUrls, IUploadMerchantDocsParams, mockDeleteFilesQueue, mockGetPresignedUrlQueue (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.11
Nodes (9): ConnectedSocket, MessageBody, SubscribeMessage, UseGuards, WebSocketGateway, WebSocketServer, WebSocketConfig, Injectable (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.14
Nodes (14): CreateProfessionalToClientRatingDocs, CreateRatingDocs, RemoveRatingDocs, ReportRatingDocs, Body, Delete, HttpCode, Patch (+6 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (5): StorageHelper, StorageUploadInput, StorageUploadResult, StorageService, Injectable

### Community 71 - "Community 71"
Cohesion: 0.11
Nodes (16): CreateUserRequestDTO, ApiProperty, IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, IsString (+8 more)

### Community 72 - "Community 72"
Cohesion: 0.14
Nodes (15): MongoCollections, GeoTrackingLog, GeoTrackingLogSchema, Prop, Schema, GeoTrackingLogLean, baseLogLean, basePing (+7 more)

### Community 73 - "Community 73"
Cohesion: 0.12
Nodes (14): CreatePaymentMethodRequestDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString (+6 more)

### Community 74 - "Community 74"
Cohesion: 0.16
Nodes (16): APP_CONFIG token, DatabaseModule (@Global), PrismaDatasource, context.md — Project State, Rationale: APP_CONFIG registered via ConfigModule.forRoot load, Rationale: always use prisma.extended.*, Rationale: Sharp as native win32-x64 dependency, Rationale: api/storage removed as dead code (+8 more)

### Community 75 - "Community 75"
Cohesion: 0.17
Nodes (13): RolesDocs, RolesApiController, ApiBearerAuth, ApiTags, Body, Controller, Get, Param (+5 more)

### Community 76 - "Community 76"
Cohesion: 0.11
Nodes (14): mockGetPermissionsByRoleIds, mockPrisma, mockRolesDBService, mockRolesFindById, mockTransaction, mockTx, mockTxAuditLogsCreate, mockTxUserRolesCreateMany (+6 more)

### Community 77 - "Community 77"
Cohesion: 0.11
Nodes (17): mockCategoryFindUnique, mockPrisma, mockProfessionalsFindUnique, mockServiceRequestsCreate, mockServiceRequestsFindFirst, mockServiceRequestsFindMany, mockServiceRequestsFindUnique, mockServiceRequestsUpdate (+9 more)

### Community 78 - "Community 78"
Cohesion: 0.12
Nodes (17): @aws-sdk/client-s3, bull, compression, html-pdf-node, jwks-rsa, @nestjs/platform-socket.io, @nestjs/websockets, nodemailer (+9 more)

### Community 79 - "Community 79"
Cohesion: 0.21
Nodes (11): PromotionApplyResponseDTO, ApiProperty, ApiPropertyOptional, PromotionDetailResponseDTO, ApiProperty, ApiPropertyOptional, PromotionStatsResponseDTO, ApiProperty (+3 more)

### Community 80 - "Community 80"
Cohesion: 0.12
Nodes (13): mockPermissionsDBService, mockPermissionsFindByIds, mockPrisma, mockTransaction, mockTx, mockTxAuditLogsCreate, mockTxUserPermissionsCreateMany, mockTxUserPermissionsDeleteMany (+5 more)

### Community 81 - "Community 81"
Cohesion: 0.16
Nodes (9): ApiDeletePromotion, ApiGetPromotionById, ApiUpdatePromotion, Delete, Param, Put, PromotionIdParamDTO, ApiProperty (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.17
Nodes (3): Cron, ScheduleConfig, Injectable

### Community 83 - "Community 83"
Cohesion: 0.12
Nodes (13): HealthCheck, InjectConnection, HealthController, mockCheckHeap, mockCheckStorage, mockHealthCheck, mockMongoosePingCheck, mockPrismaPingCheck (+5 more)

### Community 84 - "Community 84"
Cohesion: 0.12
Nodes (15): console, dist, docs, **/*.e2e-spec.ts, jest.config.d.ts, jest.config.js, jest.config.js.map, jest.config.ts (+7 more)

### Community 85 - "Community 85"
Cohesion: 0.12
Nodes (15): ahora, ayer, manana, mockAggregateUsage, mockApplyTransaction, mockCountPromotions, mockCountUsageByUser, mockCreate (+7 more)

### Community 86 - "Community 86"
Cohesion: 0.19
Nodes (11): ApiBearerAuth, ApiTags, Body, Controller, Get, Param, Post, UseGuards (+3 more)

### Community 87 - "Community 87"
Cohesion: 0.28
Nodes (9): mockGetNearbyProviders, mockProcessLocationPing, GeoLocationCoordinatesDTO, GetNearbyProfessionalsMetaDTO, GetNearbyProfessionalsResponseDTO, NearbyProfessionalDataDTO, ApiProperty, ApiProperty (+1 more)

### Community 88 - "Community 88"
Cohesion: 0.20
Nodes (9): IsMongoId, NotificationIdParamDTO, ApiProperty, NotificationResponseDTO, ApiProperty, ApiPropertyOptional, ApiProperty, UnreadCountResponseDTO (+1 more)

### Community 89 - "Community 89"
Cohesion: 0.15
Nodes (10): ApiProperty, ApiPropertyOptional, IsNumber, IsOptional, Max, Min, Type, UpdateLocationRequestDTO (+2 more)

### Community 90 - "Community 90"
Cohesion: 0.19
Nodes (13): CreatePaymentDto, PaymentDetailsDto, ApiProperty, IsBoolean, IsEnum, IsNumber, IsOptional, IsString (+5 more)

### Community 91 - "Community 91"
Cohesion: 0.18
Nodes (14): CreateRatingRequestDTO, RatingCriteriaRequestDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsEnum, IsNumber, IsOptional (+6 more)

### Community 93 - "Community 93"
Cohesion: 0.13
Nodes (14): mockAssignPermissionsToUserWithValidation, mockAssignRolesToUserWithValidation, mockCreateRole, mockFindById, mockGetAllRoles, mockGetRoleById, mockGetRolePermissions, mockGetRolesStats (+6 more)

### Community 94 - "Community 94"
Cohesion: 0.30
Nodes (4): FileInfoResponseDTO, ApiProperty, Injectable, UploadsService

### Community 95 - "Community 95"
Cohesion: 0.13
Nodes (14): mockFindAllUsers, mockFindUserByIdWithDetail, mockFindUserByReferenceId, mockFindUserByReferenceIdWithDetail, mockGetAllAvailableRoles, mockGetUserRoleIds, mockInactivateUser, mockJwtUser (+6 more)

### Community 96 - "Community 96"
Cohesion: 0.13
Nodes (13): mockAssignPermissionsToRole, mockGetPermissionsByRoleId, mockPrisma, mockRemovePermissionFromRole, mockRolePermissionsDBService, mockRolePermissionsFindMany, mockRolesCount, mockRolesCreate (+5 more)

### Community 97 - "Community 97"
Cohesion: 0.15
Nodes (11): ApplyNearbyDocs, Get, Query, GetNearbyProfessionalsRequestDTO, ApiProperty, ApiPropertyOptional, IsNumber, IsOptional (+3 more)

### Community 98 - "Community 98"
Cohesion: 0.15
Nodes (11): GetServicesDocs, Query, GetServicesListQueryDTO, ApiPropertyOptional, IsEnum, IsInt, IsNumber, IsOptional (+3 more)

### Community 99 - "Community 99"
Cohesion: 0.14
Nodes (13): mockChangeStatus, mockCreate, mockFindAll, mockFindAllWithRelations, mockFindBySlug, mockFindMainCategories, mockFindOne, mockFindSubcategories (+5 more)

### Community 100 - "Community 100"
Cohesion: 0.20
Nodes (4): LocationsService, Injectable, LocationsDbService, Injectable

### Community 101 - "Community 101"
Cohesion: 0.14
Nodes (13): mockCreate, mockFindById, mockFindByUserId, mockFindMany, mockFindNearby, mockFindProfessionalByReferenceId, mockFindReviews, mockFindServices (+5 more)

### Community 102 - "Community 102"
Cohesion: 0.20
Nodes (13): EditContextAccessDTO, EditContextUserDTO, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsEnum, IsNumber (+5 more)

### Community 104 - "Community 104"
Cohesion: 0.17
Nodes (10): ApplyPingDocs, Body, Post, ApiProperty, IsNumber, IsOptional, IsUUID, Max (+2 more)

### Community 105 - "Community 105"
Cohesion: 0.21
Nodes (13): tdd-refactor agent, AuthApiController (worked example), AuthApiService (worked example), AuthCookieService (worked example), AuthTokenService (worked example), testing-agent, Manual de TDD para NestJS+TypeScript, AAA pattern (Arrange/Act/Assert) (+5 more)

### Community 106 - "Community 106"
Cohesion: 0.15
Nodes (13): @commitlint/cli, @eslint/js, jest-mock-extended, lint-staged, devDependencies, @commitlint/cli, @eslint/js, jest-mock-extended (+5 more)

### Community 107 - "Community 107"
Cohesion: 0.31
Nodes (8): mockGetCategoriesPerformanceMetrics, mockGetDashboardMetrics, AnalyticsType, TimeRange, CategoryPerformanceItemDTO, CategoryPerformanceResponseDTO, ApiProperty, DashboardStatsResponseDTO

### Community 108 - "Community 108"
Cohesion: 0.15
Nodes (8): ChangeCategoryStatusQueryDTO, ApiProperty, IsEnum, GetSubcategoriesParamDTO, ApiProperty, IsInt, Min, Type

### Community 109 - "Community 109"
Cohesion: 0.17
Nodes (11): FindNearbyQueryDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsNumber, IsOptional, IsUUID, Max (+3 more)

### Community 110 - "Community 110"
Cohesion: 0.23
Nodes (7): LocationsGateway, ConnectedSocket, MessageBody, SubscribeMessage, UseGuards, WebSocketGateway, WebSocketServer

### Community 111 - "Community 111"
Cohesion: 0.21
Nodes (4): NotificationDocument, Prop, Schema, InjectModel

### Community 112 - "Community 112"
Cohesion: 0.15
Nodes (13): CreateServiceRequestDTO, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty (+5 more)

### Community 113 - "Community 113"
Cohesion: 0.19
Nodes (7): Body, FileUploader(), UploadedFilesValidated(), FileUploaderOptions, ParseFilesPipe, Injectable, UploadMerchantDocsDocs

### Community 114 - "Community 114"
Cohesion: 0.15
Nodes (10): ApiProperty, IsNotEmpty, IsString, UploadFileParamDTO, MerchantDocTypeEnum, ApiPropertyOptional, IsEnum, IsOptional (+2 more)

### Community 115 - "Community 115"
Cohesion: 0.20
Nodes (4): ApiGetAllCategories, ApiGetMainCategories, ApiGetSubcategories, Get

### Community 116 - "Community 116"
Cohesion: 0.17
Nodes (8): ApiGetPaymentTrends, PaymentTrendsQueryDTO, ApiPropertyOptional, IsInt, IsOptional, Max, Min, Type

### Community 117 - "Community 117"
Cohesion: 0.18
Nodes (12): tekoapp-backend Project Overview (CLAUDE.md), api/ HTTP Layer, AWS S3, Firebase, Google Maps API, modules/ Business Logic Layer, MongoDB, Redis (+4 more)

### Community 118 - "Community 118"
Cohesion: 0.24
Nodes (12): Golden rule: api/* never accesses Prisma directly, Session 3 — DTOs @Param/@Query + payments refactor + env setup, Session 4 — professionals-db module + response DTOs, ProfessionalsDbService, Session 5 — DTO restructure (5 APIs) + fee calculator + tests, FeeCalculatorService, Session 6 — Full API tests + --forceExit + modules/users cleanup, Session 7 — Controller tests (+4 more)

### Community 119 - "Community 119"
Cohesion: 0.18
Nodes (12): Sesión 10 — specs roles-permission + report + restructura uploads, report.service.spec.ts (xlsx/csv/pdf, html/native), Sesión 11 — Lint limpio: 0 errors, 0 warnings, expect.objectContaining()/expect.any() as unknown fix, Tipado correcto de mocks de $transaction, unbound-method solo con métodos estáticos mockeados, Regla: 0 WARNINGS y 0 ERRORES siempre, Sesión 9 — Cobertura masiva de tests (+4 more)

### Community 120 - "Community 120"
Cohesion: 0.17
Nodes (11): mockGetCategoryPerformance, mockGetProfessionalsMetrics, mockGetRatingsMetrics, mockGetRevenueMetrics, mockGetServicesMetrics, mockGetUsersMetrics, mockProfStats, mockRatingStats (+3 more)

### Community 122 - "Community 122"
Cohesion: 0.17
Nodes (11): CreateProfessionalRequestDTO, ApiProperty, ApiPropertyOptional, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional (+3 more)

### Community 123 - "Community 123"
Cohesion: 0.17
Nodes (12): CreatePromotionRequestDTO, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty (+4 more)

### Community 124 - "Community 124"
Cohesion: 0.17
Nodes (12): CreateProfessionalToClientRatingRequestDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsNumber, IsOptional, IsString, IsUUID (+4 more)

### Community 125 - "Community 125"
Cohesion: 0.15
Nodes (10): CreatePermissionRequestDTO, ApiProperty, IsOptional, IsString, MaxLength, CreateRoleRequestDTO, ApiProperty, IsOptional (+2 more)

### Community 126 - "Community 126"
Cohesion: 0.17
Nodes (9): baseNotification, mockCountDocuments, mockDeleteOne, mockFind, mockFindByIdAndUpdate, mockFindOneAndUpdate, mockInsertMany, mockSave (+1 more)

### Community 127 - "Community 127"
Cohesion: 0.18
Nodes (3): InjectQueue, NotificationsService, Injectable

### Community 128 - "Community 128"
Cohesion: 0.18
Nodes (9): apiDir, compodocJson, formattedDate, fs, path, readme, readmePath, { readPackageUpSync } (+1 more)

### Community 129 - "Community 129"
Cohesion: 0.22
Nodes (7): AnalyticsQueryRequestDTO, ApiPropertyOptional, IsEnum, IsOptional, IsString, AnalyticsApiService, Injectable

### Community 130 - "Community 130"
Cohesion: 0.18
Nodes (9): CreateNotificationRequestDTO, ApiProperty, ApiPropertyOptional, IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional (+1 more)

### Community 131 - "Community 131"
Cohesion: 0.18
Nodes (10): GetProfessionalsListQueryDTO, ApiPropertyOptional, IsBoolean, IsInt, IsNumber, IsOptional, Max, Min (+2 more)

### Community 132 - "Community 132"
Cohesion: 0.18
Nodes (11): GetRoleListQueryDTO, GetRoleParamDTO, ApiProperty, ApiPropertyOptional, IsBoolean, IsNotEmpty, IsNumber, IsOptional (+3 more)

### Community 133 - "Community 133"
Cohesion: 0.20
Nodes (8): mockConfigGet, mockFindInRadius, mockSaveLocationPing, TrackingApiService, Injectable, TrackingDbService, Injectable, InjectModel

### Community 134 - "Community 134"
Cohesion: 0.18
Nodes (8): mockDeleteFile, mockFileInfo, mockGetPresignedUrl, mockUploadAvatar, mockUploadDocument, mockUploadImage, mockUploadMerchantDocs, mockValidateFile

### Community 135 - "Community 135"
Cohesion: 0.18
Nodes (10): mockPrisma, mockPromotionCount, mockPromotionCreate, mockPromotionFindMany, mockPromotionFindUnique, mockPromotionUpdate, mockPromotionUsageAggregate, mockPromotionUsageCount (+2 more)

### Community 136 - "Community 136"
Cohesion: 0.18
Nodes (9): mockCount, mockFindMany, mockPrisma, mockTransaction, mockTx, mockTxAuditLogsCreate, mockTxRolePermissionsCreateMany, mockTxRolePermissionsDeleteMany (+1 more)

### Community 137 - "Community 137"
Cohesion: 0.24
Nodes (7): ApplyAnalyticsControllerDocs, ApplyCategoryPerformanceDocs, ApplyDashboardStatsDocs, AnalyticsController, Controller, Get, Query

### Community 138 - "Community 138"
Cohesion: 0.20
Nodes (10): build_from_json() (graphify.build), build_merge() (graphify.build), --cluster-only Mode, detect_incremental() (graphify.detect), build_merge reads graph.json directly to preserve edge direction, avoiding NetworkX round-trip (#801), graph_diff() (graphify.analyze), Combine hyperedges from existing graph.json and new extraction to avoid silently dropping prior-run hyperedges (#801), Incremental Update (--update) (+2 more)

### Community 139 - "Community 139"
Cohesion: 0.20
Nodes (9): categoriaBase, mockCountSubcategories, mockCreate, mockDelete, mockFindFirst, mockFindMany, mockFindUnique, mockSearch (+1 more)

### Community 140 - "Community 140"
Cohesion: 0.20
Nodes (9): GetNearbyProfessionalsQueryDTO, ApiProperty, ApiPropertyOptional, IsInt, IsNumber, IsOptional, Max, Min (+1 more)

### Community 141 - "Community 141"
Cohesion: 0.20
Nodes (9): ApiPropertyOptional, IsArray, IsInt, IsNumber, IsOptional, IsString, Min, Type (+1 more)

### Community 142 - "Community 142"
Cohesion: 0.20
Nodes (9): GetNearbyServicesQueryDTO, ApiProperty, ApiPropertyOptional, IsInt, IsNumber, IsOptional, Max, Min (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.31
Nodes (7): EditContextRoleDTO, EditContextRolesResponseDTO, EditContextUserResponseDTO, GetEditContextResponseDTO, ApiProperty, ApiPropertyOptional, UpdateEditContextResponseDTO

### Community 144 - "Community 144"
Cohesion: 0.20
Nodes (9): END, mockCategoryFindMany, mockPaymentsAggregate, mockPrisma, mockProfessionalsCount, mockRatingAggregate, mockServicesCount, mockUsersCount (+1 more)

### Community 145 - "Community 145"
Cohesion: 0.22
Nodes (7): ApplyTrackingControllerDocs, TrackingController, Controller, TrackingModule, Module, TrackingDbModule, Module

### Community 146 - "Community 146"
Cohesion: 0.28
Nodes (8): Restructura de módulo uploads (controllers/services/dtos), Pepper de audit trigger vía GUC de sesión, nunca hardcodeado, Lecciones fn_audit_generic_trigger (COALESCE NEW/OLD, no pisar created_at), Grepear todo el repo antes de confirmar que un campo está muerto, fn_attach_audit_triggers() — función SQL reusable e idempotente, Estructura de carpetas obligatoria (api/* y modules/*), Bug: permissionToResponse() reusado para Roles en roles-permission, Prisma Decimal serializa como {s,e,d} — normalizado en $extends por duck-typing

### Community 147 - "Community 147"
Cohesion: 0.22
Nodes (8): collection, compilerOptions, assets, deleteOutDir, watchAssets, webpack, $schema, sourceRoot

### Community 148 - "Community 148"
Cohesion: 0.22
Nodes (8): AnalyticsQueryDto, AnalyticsType, TimeRange, ApiPropertyOptional, IsDateString, IsEnum, IsOptional, IsString

### Community 150 - "Community 150"
Cohesion: 0.22
Nodes (8): makeReq(), mockCreate, mockDelete, mockFindAll, mockFindUnread, mockGetUnreadCount, mockMarkAllAsRead, mockMarkAsRead

### Community 151 - "Community 151"
Cohesion: 0.22
Nodes (8): CreatePaymentDto, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min

### Community 152 - "Community 152"
Cohesion: 0.39
Nodes (8): PaymentMethodStatsDto, PaymentProviderStatsDto, PaymentStatusStatsDto, PaymentSummaryDto, PaymentTrendsDto, ProfessionalPaymentStatsDto, ApiProperty, UserPaymentStatsDto

### Community 153 - "Community 153"
Cohesion: 0.22
Nodes (8): PollingStatus, ProcessPaymentPollingDto, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID

### Community 154 - "Community 154"
Cohesion: 0.22
Nodes (8): RateServiceRequestDTO, ApiProperty, ApiPropertyOptional, IsNumber, IsOptional, IsString, Max, Min

### Community 155 - "Community 155"
Cohesion: 0.22
Nodes (4): ExportFormat, FileDownloadInterceptor, IDownloadResponse, Injectable

### Community 156 - "Community 156"
Cohesion: 0.25
Nodes (4): DateRangeDTO, IsDateRangeWithinSixMonths, IsEndDateAfterStartDate, ValidatorConstraint

### Community 158 - "Community 158"
Cohesion: 0.36
Nodes (6): code-reviewer agent, db-advisor agent, Suite de specs roles-permission (api + db), Patrón AAA obligatorio (Arrange/Act/Assert), Regla de scope: mocks como const a nivel de módulo, Regla: 0 WARNINGS y 0 ERRORES en test/format/lint

### Community 159 - "Community 159"
Cohesion: 0.43
Nodes (7): PeriodDTO, ProfessionalStatsDTO, RatingStatsDTO, RevenueStatsDTO, ServiceStatsDetailsDTO, ApiProperty, UserStatsDTO

### Community 160 - "Community 160"
Cohesion: 0.25
Nodes (7): mockConfigGet, mockCountOnline, mockFindById, mockFindMany, mockFindNearby, mockProfessional, mockUpdateLocation

### Community 161 - "Community 161"
Cohesion: 0.25
Nodes (7): FindAllNotificationsQueryDTO, ApiPropertyOptional, IsNumber, IsOptional, Max, Min, Type

### Community 162 - "Community 162"
Cohesion: 0.25
Nodes (7): ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString, Transform, VerifyProfessionalRequestDTO

### Community 163 - "Community 163"
Cohesion: 0.29
Nodes (7): AssignPermissionsToUserRequestDTO, PermissionItemDTO, ApiProperty, IsArray, IsInt, Type, ValidateNested

### Community 165 - "Community 165"
Cohesion: 0.25
Nodes (7): baseProfessional, mockCount, mockFindMany, mockFindUnique, mockPrisma, mockQueryRawUnsafe, mockUpdate

### Community 166 - "Community 166"
Cohesion: 0.29
Nodes (6): ApiSearchCategories, Query, SearchCategoriesQueryDTO, ApiProperty, IsNotEmpty, IsString

### Community 167 - "Community 167"
Cohesion: 0.38
Nodes (7): Sesión 12 — CI/CD pipeline y arquitectura inicial (reconstruido), pipeline.yml — GitHub Actions (lint→test→build→docker→deploy), semantic-release multi-rama (master/qa/develop), Session 13 — git history cleanup / CI notes fix, git-filter-repo rewrite (55 commits, 8 ramas, 11 tags), Bug: refs/notes/semantic-release-vX huérfanas tras rewrite de SHA, Regla: stages pipeline lint→test→build→scan→deploy

### Community 168 - "Community 168"
Cohesion: 0.29
Nodes (7): graphify reference: add-watch, graphify reference: exports and benchmark, graphify reference: extraction subagent prompt, graphify reference: GitHub clone and cross-repo merge, graphify reference: commit hook and CLAUDE.md integration, graphify reference: query, path, explain, /graphify skill

### Community 169 - "Community 169"
Cohesion: 0.29
Nodes (6): OnboardingDocs, ApiBasicAuth, Body, Post, UseGuards, Version

### Community 170 - "Community 170"
Cohesion: 0.33
Nodes (3): Process, Processor, NotificationsProcessor

### Community 171 - "Community 171"
Cohesion: 0.29
Nodes (6): ApiProperty, IsNumber, Max, Min, Type, UpdateProfessionalLocationRequestDTO

### Community 172 - "Community 172"
Cohesion: 0.29
Nodes (6): ReportRatingRequestDTO, ApiProperty, IsNotEmpty, IsString, MaxLength, MinLength

### Community 173 - "Community 173"
Cohesion: 0.29
Nodes (6): ApiProperty, IsBoolean, IsOptional, IsString, MaxLength, UpdatePermissionRequestDTO

### Community 174 - "Community 174"
Cohesion: 0.29
Nodes (6): ApiProperty, IsBoolean, IsOptional, IsString, MaxLength, UpdateRoleRequestDTO

### Community 175 - "Community 175"
Cohesion: 0.29
Nodes (7): CreateServiceRequestRequestDTO, ApiPropertyOptional, IsNumber, IsOptional, IsString, Max, Min

### Community 176 - "Community 176"
Cohesion: 0.38
Nodes (3): IsMaxCommaSeparated(), MaxCommaSeparatedConstraint, ValidatorConstraint

### Community 177 - "Community 177"
Cohesion: 0.48
Nodes (3): CustomHttpResponseHelper, ApiErrorResponse, handleHttpErrors()

### Community 178 - "Community 178"
Cohesion: 0.29
Nodes (3): IsOrderByFormat, SortDirection, ValidatorConstraint

### Community 180 - "Community 180"
Cohesion: 0.40
Nodes (4): AnalyticsModule, Module, AnalyticsDbModule, Module

### Community 181 - "Community 181"
Cohesion: 0.40
Nodes (4): CategoriesModule, Module, CategoriesDbModule, Module

### Community 182 - "Community 182"
Cohesion: 0.33
Nodes (6): GetProfessionalsAreaQueryDTO, ApiProperty, IsNumber, Max, Min, Type

### Community 183 - "Community 183"
Cohesion: 0.40
Nodes (4): LocationsModule, Module, LocationsDbModule, Module

### Community 184 - "Community 184"
Cohesion: 0.40
Nodes (4): PaymentsModule, Module, PaymentsDbModule, Module

### Community 185 - "Community 185"
Cohesion: 0.33
Nodes (5): ApiProperty, IsInt, Min, Type, UserIdParamDTO

### Community 187 - "Community 187"
Cohesion: 0.40
Nodes (3): NotExpired(), NotExpiredConstraint, ValidatorConstraint

### Community 188 - "Community 188"
Cohesion: 0.40
Nodes (4): engram, ENGRAM_DB_PATH, npx, @llmindset/mcp-engram

### Community 189 - "Community 189"
Cohesion: 0.40
Nodes (4): ReversePaymentDto, IsNotEmpty, IsString, MinLength

### Community 190 - "Community 190"
Cohesion: 0.40
Nodes (4): badRequestResponseExample, forbiddenResponseExample, internalServerErrorExample, unauthorizedResponseExample

### Community 193 - "Community 193"
Cohesion: 0.40
Nodes (4): AppConnectionOptions, DatabaseModuleOptions, Db2ConnectionOptions, PostgresConnectionOptions

### Community 195 - "Community 195"
Cohesion: 0.67
Nodes (3): AssignedPermissionDTO, RolePermissionAssignmentResponseDTO, ApiProperty

### Community 196 - "Community 196"
Cohesion: 0.67
Nodes (3): PermissionSummaryDTO, RoleWithPermissionsResponseDTO, ApiProperty

### Community 197 - "Community 197"
Cohesion: 0.67
Nodes (3): AssignedPermissionDTO, ApiProperty, UserPermissionAssignmentResponseDTO

### Community 198 - "Community 198"
Cohesion: 0.67
Nodes (3): AssignedRoleDTO, ApiProperty, UserRoleAssignmentResponseDTO

### Community 202 - "Community 202"
Cohesion: 0.67
Nodes (3): Transcribe Video/Audio Files Step (Graphify), transcribe_all() (graphify.transcribe), Whisper Transcription Model

## Ambiguous Edges - Review These
- `Golden rule: api/* never accesses Prisma directly, always via *-db module` → `Rating entity (TypeORM)`  [AMBIGUOUS]
  src/api/ratings/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **896 isolated node(s):** `npx`, `@llmindset/mcp-engram`, `ENGRAM_DB_PATH`, `config`, `$schema` (+891 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **128 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Golden rule: api/* never accesses Prisma directly, always via *-db module` and `Rating entity (TypeORM)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `@prisma/client` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 135`, `Community 8`, `Community 136`, `Community 139`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 143`, `Community 144`, `Community 11`, `Community 19`, `Community 23`, `Community 24`, `Community 151`, `Community 28`, `Community 31`, `Community 32`, `Community 34`, `Community 40`, `Community 41`, `Community 45`, `Community 47`, `Community 53`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 191`, `Community 66`, `Community 71`, `Community 73`, `Community 76`, `Community 77`, `Community 79`, `Community 80`, `Community 85`, `Community 90`, `Community 95`, `Community 96`, `Community 99`, `Community 102`, `Community 108`?**
  _High betweenness centrality (0.378) - this node is a cross-community bridge._
- **Why does `onlyBuiltDependencies` connect `Community 3` to `Community 0`, `Community 50`, `Community 5`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `npx`, `@llmindset/mcp-engram`, `ENGRAM_DB_PATH` to the rest of the system?**
  _896 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04909456740442656 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05928614640048397 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07346938775510205 - nodes in this community are weakly interconnected._