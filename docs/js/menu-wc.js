'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">tekoapp-backend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AnalyticsDbModule.html" data-type="entity-link" >AnalyticsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AnalyticsDbModule-4169f6e3bf27b063fb8f16a331adef19404c40b1626373bace1b41108b943e5a0485421e991503e53340b327bd79c0a9ec4ebd3278da29bbb02476db4cf4579b"' : 'data-bs-target="#xs-injectables-links-module-AnalyticsDbModule-4169f6e3bf27b063fb8f16a331adef19404c40b1626373bace1b41108b943e5a0485421e991503e53340b327bd79c0a9ec4ebd3278da29bbb02476db4cf4579b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AnalyticsDbModule-4169f6e3bf27b063fb8f16a331adef19404c40b1626373bace1b41108b943e5a0485421e991503e53340b327bd79c0a9ec4ebd3278da29bbb02476db4cf4579b"' :
                                        'id="xs-injectables-links-module-AnalyticsDbModule-4169f6e3bf27b063fb8f16a331adef19404c40b1626373bace1b41108b943e5a0485421e991503e53340b327bd79c0a9ec4ebd3278da29bbb02476db4cf4579b"' }>
                                        <li class="link">
                                            <a href="injectables/AnalyticsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AnalyticsModule.html" data-type="entity-link" >AnalyticsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' : 'data-bs-target="#xs-controllers-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' :
                                            'id="xs-controllers-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' }>
                                            <li class="link">
                                                <a href="controllers/AnalyticsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' : 'data-bs-target="#xs-injectables-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' :
                                        'id="xs-injectables-links-module-AnalyticsModule-6fae0370c0d60cc535b7f6f7839f5029ac99e8574754ae6a1879a75be77bfb3174263d8281ae5300f9342ffe728c233823a5abea8d5807d79311b4e8daf78d80"' }>
                                        <li class="link">
                                            <a href="injectables/AnalyticsApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnalyticsApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ApiModule.html" data-type="entity-link" >ApiModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-633144c60e22a4d2c9113d5b585050f57bc99e563d81beb8264472e9a79c5de11960e81083bee00695d7917a2fa1805fd14afecf6605704ce7452288aaca3c10"' : 'data-bs-target="#xs-injectables-links-module-AppModule-633144c60e22a4d2c9113d5b585050f57bc99e563d81beb8264472e9a79c5de11960e81083bee00695d7917a2fa1805fd14afecf6605704ce7452288aaca3c10"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-633144c60e22a4d2c9113d5b585050f57bc99e563d81beb8264472e9a79c5de11960e81083bee00695d7917a2fa1805fd14afecf6605704ce7452288aaca3c10"' :
                                        'id="xs-injectables-links-module-AppModule-633144c60e22a4d2c9113d5b585050f57bc99e563d81beb8264472e9a79c5de11960e81083bee00695d7917a2fa1805fd14afecf6605704ce7452288aaca3c10"' }>
                                        <li class="link">
                                            <a href="injectables/ObservabilityInterceptor.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ObservabilityInterceptor</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthApiModule.html" data-type="entity-link" >AuthApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' : 'data-bs-target="#xs-controllers-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' :
                                            'id="xs-controllers-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' }>
                                            <li class="link">
                                                <a href="controllers/AuthApiController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthApiController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' : 'data-bs-target="#xs-injectables-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' :
                                        'id="xs-injectables-links-module-AuthApiModule-5b0ea43e7d36810fa75bc95b6611d18a9eb4f435cc6c79170a7baa1434d8452fb14fd2932b8b1a8436cc4c58b482f6d475321189ab43ff95bd4c9883617661d5"' }>
                                        <li class="link">
                                            <a href="injectables/AuthApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthApiService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthCookieService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthCookieService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthMigrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthMigrationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtRefreshStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtRefreshStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-cc137da98450894d85f42cb49e2f9a16dd2b6d183459282e062e7d1b4fbff6d34ca6e87d70b203c45f27e12a455961c4e2a3113584aab823320b77f895063d63"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-cc137da98450894d85f42cb49e2f9a16dd2b6d183459282e062e7d1b4fbff6d34ca6e87d70b203c45f27e12a455961c4e2a3113584aab823320b77f895063d63"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-cc137da98450894d85f42cb49e2f9a16dd2b6d183459282e062e7d1b4fbff6d34ca6e87d70b203c45f27e12a455961c4e2a3113584aab823320b77f895063d63"' :
                                        'id="xs-injectables-links-module-AuthModule-cc137da98450894d85f42cb49e2f9a16dd2b6d183459282e062e7d1b4fbff6d34ca6e87d70b203c45f27e12a455961c4e2a3113584aab823320b77f895063d63"' }>
                                        <li class="link">
                                            <a href="injectables/AuthPasswordService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthPasswordService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthTokenService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthTokenService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CredentialsRepository.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CredentialsRepository</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CategoriesDbModule.html" data-type="entity-link" >CategoriesDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CategoriesDbModule-965b16d19e60e0263011770c678f48a23f94652f76ab130395b48c16a306f38dcfeca4ac023d13f5dcbf240a40e538a43f7cfd3d9067a52d32f2755b028ea5d9"' : 'data-bs-target="#xs-injectables-links-module-CategoriesDbModule-965b16d19e60e0263011770c678f48a23f94652f76ab130395b48c16a306f38dcfeca4ac023d13f5dcbf240a40e538a43f7cfd3d9067a52d32f2755b028ea5d9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CategoriesDbModule-965b16d19e60e0263011770c678f48a23f94652f76ab130395b48c16a306f38dcfeca4ac023d13f5dcbf240a40e538a43f7cfd3d9067a52d32f2755b028ea5d9"' :
                                        'id="xs-injectables-links-module-CategoriesDbModule-965b16d19e60e0263011770c678f48a23f94652f76ab130395b48c16a306f38dcfeca4ac023d13f5dcbf240a40e538a43f7cfd3d9067a52d32f2755b028ea5d9"' }>
                                        <li class="link">
                                            <a href="injectables/CategoriesDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoriesDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CategoriesModule.html" data-type="entity-link" >CategoriesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' : 'data-bs-target="#xs-controllers-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' :
                                            'id="xs-controllers-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' }>
                                            <li class="link">
                                                <a href="controllers/CategoriesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoriesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' : 'data-bs-target="#xs-injectables-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' :
                                        'id="xs-injectables-links-module-CategoriesModule-22afe791a60e17296676f02d017b45bc70c3e7be58052d21aa08428336b521a21dbc33b05977155e01a8ce6ca135fd03a07f1c28e65a15c40b2fed3ed6dda939"' }>
                                        <li class="link">
                                            <a href="injectables/CategoriesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoriesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseModule.html" data-type="entity-link" >DatabaseModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DatabaseModule-64d33baba45fee014b1df8c850e2ef62c385029f7fe12462bb42c5f898ba4ba0e2d2a104250112965836e84fe619d332b14243b4c62e0f7fa42583a0659d9719"' : 'data-bs-target="#xs-injectables-links-module-DatabaseModule-64d33baba45fee014b1df8c850e2ef62c385029f7fe12462bb42c5f898ba4ba0e2d2a104250112965836e84fe619d332b14243b4c62e0f7fa42583a0659d9719"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DatabaseModule-64d33baba45fee014b1df8c850e2ef62c385029f7fe12462bb42c5f898ba4ba0e2d2a104250112965836e84fe619d332b14243b4c62e0f7fa42583a0659d9719"' :
                                        'id="xs-injectables-links-module-DatabaseModule-64d33baba45fee014b1df8c850e2ef62c385029f7fe12462bb42c5f898ba4ba0e2d2a104250112965836e84fe619d332b14243b4c62e0f7fa42583a0659d9719"' }>
                                        <li class="link">
                                            <a href="injectables/PrismaDatasource.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaDatasource</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EmailModule.html" data-type="entity-link" >EmailModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-EmailModule-554bf3df44489b5c67a783cd1b600614c1ef7ac176e2b9a7bb2d39d2dd91345a9a59df3fb196caadda83ea153ecb9735608778ed25fba1553b6a2b1d737f6219"' : 'data-bs-target="#xs-injectables-links-module-EmailModule-554bf3df44489b5c67a783cd1b600614c1ef7ac176e2b9a7bb2d39d2dd91345a9a59df3fb196caadda83ea153ecb9735608778ed25fba1553b6a2b1d737f6219"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EmailModule-554bf3df44489b5c67a783cd1b600614c1ef7ac176e2b9a7bb2d39d2dd91345a9a59df3fb196caadda83ea153ecb9735608778ed25fba1553b6a2b1d737f6219"' :
                                        'id="xs-injectables-links-module-EmailModule-554bf3df44489b5c67a783cd1b600614c1ef7ac176e2b9a7bb2d39d2dd91345a9a59df3fb196caadda83ea153ecb9735608778ed25fba1553b6a2b1d737f6219"' }>
                                        <li class="link">
                                            <a href="injectables/EmailService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/HealthModule.html" data-type="entity-link" >HealthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-HealthModule-c72571283421d3249bdb0264bf2e5078c9d321d6f76b69f0154e833b5bdacd7e9395942e0844a58bafe30b2a56dbd82f95a3563f8125834bf19b5a57f3a5f064"' : 'data-bs-target="#xs-controllers-links-module-HealthModule-c72571283421d3249bdb0264bf2e5078c9d321d6f76b69f0154e833b5bdacd7e9395942e0844a58bafe30b2a56dbd82f95a3563f8125834bf19b5a57f3a5f064"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-HealthModule-c72571283421d3249bdb0264bf2e5078c9d321d6f76b69f0154e833b5bdacd7e9395942e0844a58bafe30b2a56dbd82f95a3563f8125834bf19b5a57f3a5f064"' :
                                            'id="xs-controllers-links-module-HealthModule-c72571283421d3249bdb0264bf2e5078c9d321d6f76b69f0154e833b5bdacd7e9395942e0844a58bafe30b2a56dbd82f95a3563f8125834bf19b5a57f3a5f064"' }>
                                            <li class="link">
                                                <a href="controllers/HealthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HealthController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LocationsDbModule.html" data-type="entity-link" >LocationsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LocationsDbModule-19e28ed7ebdb090c070f1af941492d19daf1c3fd1eef94da6aef65421da4fe076eaf5fa6901691f79caacff501f6959556c8932ad9a6f4ec75e6d8ac6b38a6a9"' : 'data-bs-target="#xs-injectables-links-module-LocationsDbModule-19e28ed7ebdb090c070f1af941492d19daf1c3fd1eef94da6aef65421da4fe076eaf5fa6901691f79caacff501f6959556c8932ad9a6f4ec75e6d8ac6b38a6a9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LocationsDbModule-19e28ed7ebdb090c070f1af941492d19daf1c3fd1eef94da6aef65421da4fe076eaf5fa6901691f79caacff501f6959556c8932ad9a6f4ec75e6d8ac6b38a6a9"' :
                                        'id="xs-injectables-links-module-LocationsDbModule-19e28ed7ebdb090c070f1af941492d19daf1c3fd1eef94da6aef65421da4fe076eaf5fa6901691f79caacff501f6959556c8932ad9a6f4ec75e6d8ac6b38a6a9"' }>
                                        <li class="link">
                                            <a href="injectables/LocationsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocationsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LocationsModule.html" data-type="entity-link" >LocationsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' : 'data-bs-target="#xs-controllers-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' :
                                            'id="xs-controllers-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' }>
                                            <li class="link">
                                                <a href="controllers/LocationsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocationsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' : 'data-bs-target="#xs-injectables-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' :
                                        'id="xs-injectables-links-module-LocationsModule-9f0cfffc245a6127b63a991cedc4c78576c8fa465cced4769b7b996559e82952620df5378283c8bd421d2cb75e8359baa50e0115524edcb8287fcc38331a3faa"' }>
                                        <li class="link">
                                            <a href="injectables/LocationsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocationsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationsApiModule.html" data-type="entity-link" >NotificationsApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' : 'data-bs-target="#xs-controllers-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' :
                                            'id="xs-controllers-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' }>
                                            <li class="link">
                                                <a href="controllers/NotificationsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' : 'data-bs-target="#xs-injectables-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' :
                                        'id="xs-injectables-links-module-NotificationsApiModule-c05183ede90f46ef64a0c01c64ee7f5ee37112dd93c6fad0a7008895c1faec1bef3dec202b66a40cd2675581483a8ebd54d09010d3b6e055a93cd2edf79b7006"' }>
                                        <li class="link">
                                            <a href="injectables/NotificationsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationsDbModule.html" data-type="entity-link" >NotificationsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationsDbModule-f37532a7586cf607a2ce1c161126331f32252e70579fa4de7be491a2e6f94bdfc255e01c791f2fc4bb856710a8cf644aa2a3bf3d948db4732835f5ea37d8de45"' : 'data-bs-target="#xs-injectables-links-module-NotificationsDbModule-f37532a7586cf607a2ce1c161126331f32252e70579fa4de7be491a2e6f94bdfc255e01c791f2fc4bb856710a8cf644aa2a3bf3d948db4732835f5ea37d8de45"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsDbModule-f37532a7586cf607a2ce1c161126331f32252e70579fa4de7be491a2e6f94bdfc255e01c791f2fc4bb856710a8cf644aa2a3bf3d948db4732835f5ea37d8de45"' :
                                        'id="xs-injectables-links-module-NotificationsDbModule-f37532a7586cf607a2ce1c161126331f32252e70579fa4de7be491a2e6f94bdfc255e01c791f2fc4bb856710a8cf644aa2a3bf3d948db4732835f5ea37d8de45"' }>
                                        <li class="link">
                                            <a href="injectables/NotificationsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ObservabilityModule.html" data-type="entity-link" >ObservabilityModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/OnboardingApiModule.html" data-type="entity-link" >OnboardingApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' : 'data-bs-target="#xs-controllers-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' :
                                            'id="xs-controllers-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' }>
                                            <li class="link">
                                                <a href="controllers/OnboardingController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnboardingController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' : 'data-bs-target="#xs-injectables-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' :
                                        'id="xs-injectables-links-module-OnboardingApiModule-4d6dde80797ec9644877bd3977be54a932f2eb350ab07194f637eaf908443799688e03b8e76e3807ed0c6a23630084c25f1aefccf3d137ecc8bc10a94e372d15"' }>
                                        <li class="link">
                                            <a href="injectables/OnboardingApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnboardingApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OnboardingModule.html" data-type="entity-link" >OnboardingModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OnboardingModule-1af305bd3ff6836839f40c7fd7e506f23cfdeb054b818395d38af92de49b3290c89e1d05c3252a14b5b4527a5196c23c99a686bc09eb1c6f161b8325e180e98a"' : 'data-bs-target="#xs-injectables-links-module-OnboardingModule-1af305bd3ff6836839f40c7fd7e506f23cfdeb054b818395d38af92de49b3290c89e1d05c3252a14b5b4527a5196c23c99a686bc09eb1c6f161b8325e180e98a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OnboardingModule-1af305bd3ff6836839f40c7fd7e506f23cfdeb054b818395d38af92de49b3290c89e1d05c3252a14b5b4527a5196c23c99a686bc09eb1c6f161b8325e180e98a"' :
                                        'id="xs-injectables-links-module-OnboardingModule-1af305bd3ff6836839f40c7fd7e506f23cfdeb054b818395d38af92de49b3290c89e1d05c3252a14b5b4527a5196c23c99a686bc09eb1c6f161b8325e180e98a"' }>
                                        <li class="link">
                                            <a href="injectables/OnboardingService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnboardingService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PaymentsDbModule.html" data-type="entity-link" >PaymentsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PaymentsDbModule-6f984b836ef22ae67444026d983640c7d4fb346fbdb521bf38ce8863677c7f873aeea34f91ce71cb6ec7e5d76c780ddb3db402507999ed74ac307d60c038e0b4"' : 'data-bs-target="#xs-injectables-links-module-PaymentsDbModule-6f984b836ef22ae67444026d983640c7d4fb346fbdb521bf38ce8863677c7f873aeea34f91ce71cb6ec7e5d76c780ddb3db402507999ed74ac307d60c038e0b4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PaymentsDbModule-6f984b836ef22ae67444026d983640c7d4fb346fbdb521bf38ce8863677c7f873aeea34f91ce71cb6ec7e5d76c780ddb3db402507999ed74ac307d60c038e0b4"' :
                                        'id="xs-injectables-links-module-PaymentsDbModule-6f984b836ef22ae67444026d983640c7d4fb346fbdb521bf38ce8863677c7f873aeea34f91ce71cb6ec7e5d76c780ddb3db402507999ed74ac307d60c038e0b4"' }>
                                        <li class="link">
                                            <a href="injectables/FeeCalculatorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeCalculatorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PaymentDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PaymentsModule.html" data-type="entity-link" >PaymentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' : 'data-bs-target="#xs-controllers-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' :
                                            'id="xs-controllers-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' }>
                                            <li class="link">
                                                <a href="controllers/PaymentController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' : 'data-bs-target="#xs-injectables-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' :
                                        'id="xs-injectables-links-module-PaymentsModule-a3239a07e643b61057e87ae8dc624d3522480dea5ee214d071eeb1e57932786d4ec2b0df5144a3dd1a433933d4bacb3817565bd89c0f085d63b3aa29c20312aa"' }>
                                        <li class="link">
                                            <a href="injectables/PaymentApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfessionalsDbModule.html" data-type="entity-link" >ProfessionalsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProfessionalsDbModule-c4279131fc11cff02acfc8a51283535d6667edc076b0194143fdad601ac651b6aad4e17c810b07bc23f307071356aa967e39496afcdadf0af1bc3f997d18b7fa"' : 'data-bs-target="#xs-injectables-links-module-ProfessionalsDbModule-c4279131fc11cff02acfc8a51283535d6667edc076b0194143fdad601ac651b6aad4e17c810b07bc23f307071356aa967e39496afcdadf0af1bc3f997d18b7fa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProfessionalsDbModule-c4279131fc11cff02acfc8a51283535d6667edc076b0194143fdad601ac651b6aad4e17c810b07bc23f307071356aa967e39496afcdadf0af1bc3f997d18b7fa"' :
                                        'id="xs-injectables-links-module-ProfessionalsDbModule-c4279131fc11cff02acfc8a51283535d6667edc076b0194143fdad601ac651b6aad4e17c810b07bc23f307071356aa967e39496afcdadf0af1bc3f997d18b7fa"' }>
                                        <li class="link">
                                            <a href="injectables/ProfessionalsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfessionalsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfessionalsModule.html" data-type="entity-link" >ProfessionalsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' : 'data-bs-target="#xs-controllers-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' :
                                            'id="xs-controllers-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' }>
                                            <li class="link">
                                                <a href="controllers/ProfessionalsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfessionalsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' : 'data-bs-target="#xs-injectables-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' :
                                        'id="xs-injectables-links-module-ProfessionalsModule-b5c698e62c222ff950a4217945feee5b4bfe835d5f73ae8bbf9af875590261f187b4683bfc0597a7b66cd7e855666059ad950e9869d408fc055d8c0a54768dcf"' }>
                                        <li class="link">
                                            <a href="injectables/ProfessionalsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfessionalsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PromotionsDbModule.html" data-type="entity-link" >PromotionsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PromotionsDbModule-a95180c002529850d508bbc148191470a0ea29907144f8dc54126c19b8caddcd383e6d11f566eb2390a41318a9a9ce3e32b99d2ffb13f1a3ae80c953ea46ec4a"' : 'data-bs-target="#xs-injectables-links-module-PromotionsDbModule-a95180c002529850d508bbc148191470a0ea29907144f8dc54126c19b8caddcd383e6d11f566eb2390a41318a9a9ce3e32b99d2ffb13f1a3ae80c953ea46ec4a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PromotionsDbModule-a95180c002529850d508bbc148191470a0ea29907144f8dc54126c19b8caddcd383e6d11f566eb2390a41318a9a9ce3e32b99d2ffb13f1a3ae80c953ea46ec4a"' :
                                        'id="xs-injectables-links-module-PromotionsDbModule-a95180c002529850d508bbc148191470a0ea29907144f8dc54126c19b8caddcd383e6d11f566eb2390a41318a9a9ce3e32b99d2ffb13f1a3ae80c953ea46ec4a"' }>
                                        <li class="link">
                                            <a href="injectables/PromotionsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PromotionsModule.html" data-type="entity-link" >PromotionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' : 'data-bs-target="#xs-controllers-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' :
                                            'id="xs-controllers-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' }>
                                            <li class="link">
                                                <a href="controllers/PromotionsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' : 'data-bs-target="#xs-injectables-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' :
                                        'id="xs-injectables-links-module-PromotionsModule-09152a84aeee88c9411a922cf7b798e39d2fea5b934f9e53c7b688c8e9d43aa1d731ffd96310977c5b84e4e4f1d41ef540658d0f96c3a72199c097890e703e68"' }>
                                        <li class="link">
                                            <a href="injectables/PromotionsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RatingsDbModule.html" data-type="entity-link" >RatingsDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RatingsDbModule-f24bc5c9d76aa66862d6c99ca41d782ea167c2bb853e1630f615190fdd1bee2b1095e2480d00a5d420e20e0b94dd51bdc807650d95a837f3e861cf2434cf8869"' : 'data-bs-target="#xs-injectables-links-module-RatingsDbModule-f24bc5c9d76aa66862d6c99ca41d782ea167c2bb853e1630f615190fdd1bee2b1095e2480d00a5d420e20e0b94dd51bdc807650d95a837f3e861cf2434cf8869"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RatingsDbModule-f24bc5c9d76aa66862d6c99ca41d782ea167c2bb853e1630f615190fdd1bee2b1095e2480d00a5d420e20e0b94dd51bdc807650d95a837f3e861cf2434cf8869"' :
                                        'id="xs-injectables-links-module-RatingsDbModule-f24bc5c9d76aa66862d6c99ca41d782ea167c2bb853e1630f615190fdd1bee2b1095e2480d00a5d420e20e0b94dd51bdc807650d95a837f3e861cf2434cf8869"' }>
                                        <li class="link">
                                            <a href="injectables/RatingsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RatingsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RatingsModule.html" data-type="entity-link" >RatingsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' : 'data-bs-target="#xs-controllers-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' :
                                            'id="xs-controllers-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' }>
                                            <li class="link">
                                                <a href="controllers/RatingsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RatingsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' : 'data-bs-target="#xs-injectables-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' :
                                        'id="xs-injectables-links-module-RatingsModule-48ac6657825a088e47473ebd3734285121b9cb0f8210f7facc5d9f9629888f8179a139a661fc44ab64f71823d708693c12f58e0968351ae1b8dde21100830997"' }>
                                        <li class="link">
                                            <a href="injectables/RatingsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RatingsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReportModule.html" data-type="entity-link" >ReportModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReportModule-d9afb360222ea3fc25350ba34aec88904e4c439c1551eb3d2c153aaf3ab450a2456af1c4638a57879fdcccf96ed46b46cfbd03cbd1d29cc68cdc43e386eed606"' : 'data-bs-target="#xs-injectables-links-module-ReportModule-d9afb360222ea3fc25350ba34aec88904e4c439c1551eb3d2c153aaf3ab450a2456af1c4638a57879fdcccf96ed46b46cfbd03cbd1d29cc68cdc43e386eed606"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReportModule-d9afb360222ea3fc25350ba34aec88904e4c439c1551eb3d2c153aaf3ab450a2456af1c4638a57879fdcccf96ed46b46cfbd03cbd1d29cc68cdc43e386eed606"' :
                                        'id="xs-injectables-links-module-ReportModule-d9afb360222ea3fc25350ba34aec88904e4c439c1551eb3d2c153aaf3ab450a2456af1c4638a57879fdcccf96ed46b46cfbd03cbd1d29cc68cdc43e386eed606"' }>
                                        <li class="link">
                                            <a href="injectables/ReportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RolesApiModule.html" data-type="entity-link" >RolesApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' : 'data-bs-target="#xs-controllers-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' :
                                            'id="xs-controllers-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' }>
                                            <li class="link">
                                                <a href="controllers/RolesApiController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolesApiController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/UsersRolesApiController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersRolesApiController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' : 'data-bs-target="#xs-injectables-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' :
                                        'id="xs-injectables-links-module-RolesApiModule-ca7bf983245177a649af4574f8175f93ab20238ecbd26caafdfdbf05b310874ce7fb7662536466a223087c45de42249ae332d4dbbcc7db448eaf5ea916d52690"' }>
                                        <li class="link">
                                            <a href="injectables/RolesApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolesApiService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RolesPermissionsMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolesPermissionsMapper</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RolesPermissionDBModule.html" data-type="entity-link" >RolesPermissionDBModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RolesPermissionDBModule-706bb25454bfd0eb5f278af7e194ff2b4f4f1f9c9f8509121e615acfe90ac1c9509d47b958217688ba9081ba8818c4c4f90eddcb91a8185683d02c830de6ea83"' : 'data-bs-target="#xs-injectables-links-module-RolesPermissionDBModule-706bb25454bfd0eb5f278af7e194ff2b4f4f1f9c9f8509121e615acfe90ac1c9509d47b958217688ba9081ba8818c4c4f90eddcb91a8185683d02c830de6ea83"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RolesPermissionDBModule-706bb25454bfd0eb5f278af7e194ff2b4f4f1f9c9f8509121e615acfe90ac1c9509d47b958217688ba9081ba8818c4c4f90eddcb91a8185683d02c830de6ea83"' :
                                        'id="xs-injectables-links-module-RolesPermissionDBModule-706bb25454bfd0eb5f278af7e194ff2b4f4f1f9c9f8509121e615acfe90ac1c9509d47b958217688ba9081ba8818c4c4f90eddcb91a8185683d02c830de6ea83"' }>
                                        <li class="link">
                                            <a href="injectables/PermissionsDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionsDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RolePermissionsDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolePermissionsDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RolesDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolesDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserPermissionsDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserPermissionsDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRolesDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRolesDBService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ServicesDbModule.html" data-type="entity-link" >ServicesDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ServicesDbModule-c9d3df8f0064159898ad457c79119a65d10f632b697186b769e5b0bc0f14f005324e57e46930cc153075fd493139c14b8d309e139b71672d8041c50173c7afa1"' : 'data-bs-target="#xs-injectables-links-module-ServicesDbModule-c9d3df8f0064159898ad457c79119a65d10f632b697186b769e5b0bc0f14f005324e57e46930cc153075fd493139c14b8d309e139b71672d8041c50173c7afa1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ServicesDbModule-c9d3df8f0064159898ad457c79119a65d10f632b697186b769e5b0bc0f14f005324e57e46930cc153075fd493139c14b8d309e139b71672d8041c50173c7afa1"' :
                                        'id="xs-injectables-links-module-ServicesDbModule-c9d3df8f0064159898ad457c79119a65d10f632b697186b769e5b0bc0f14f005324e57e46930cc153075fd493139c14b8d309e139b71672d8041c50173c7afa1"' }>
                                        <li class="link">
                                            <a href="injectables/ServicesDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServicesDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ServicesModule.html" data-type="entity-link" >ServicesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' : 'data-bs-target="#xs-controllers-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' :
                                            'id="xs-controllers-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' }>
                                            <li class="link">
                                                <a href="controllers/ServicesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServicesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' : 'data-bs-target="#xs-injectables-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' :
                                        'id="xs-injectables-links-module-ServicesModule-24cb04d767750c01f96d95e2c1fd7b019114187a7c7356c4a530359f14e4c8b73c40346ce1428489dda9512d4c16e9c171f3affa82d94c37d801aa8920489bc9"' }>
                                        <li class="link">
                                            <a href="injectables/ServicesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServicesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StorageModule.html" data-type="entity-link" >StorageModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StorageModule-93c28e11c1096f7494edd2b9fe55571264431ad67ecc2d906b1e76550f777c4dc62f78a60d5c7723d637c083543c5c9a3c692c2576baf711701eac2324a03cb0"' : 'data-bs-target="#xs-injectables-links-module-StorageModule-93c28e11c1096f7494edd2b9fe55571264431ad67ecc2d906b1e76550f777c4dc62f78a60d5c7723d637c083543c5c9a3c692c2576baf711701eac2324a03cb0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StorageModule-93c28e11c1096f7494edd2b9fe55571264431ad67ecc2d906b1e76550f777c4dc62f78a60d5c7723d637c083543c5c9a3c692c2576baf711701eac2324a03cb0"' :
                                        'id="xs-injectables-links-module-StorageModule-93c28e11c1096f7494edd2b9fe55571264431ad67ecc2d906b1e76550f777c4dc62f78a60d5c7723d637c083543c5c9a3c692c2576baf711701eac2324a03cb0"' }>
                                        <li class="link">
                                            <a href="injectables/StorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TemplatePlaygroundModule.html" data-type="entity-link" >TemplatePlaygroundModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                            'id="xs-components-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                            <li class="link">
                                                <a href="components/TemplatePlaygroundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplatePlaygroundComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                        'id="xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <li class="link">
                                            <a href="injectables/HbsRenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HbsRenderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemplateEditorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplateEditorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ZipExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZipExportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TrackingDbModule.html" data-type="entity-link" >TrackingDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TrackingDbModule-c9b9fb30bcb748ec21e3f9428a1aed9fe66cb7b5315dbea954bacb6284bbeed2b074821aa840f8a4688f794baf16c3dcbf2401b1845a46da36fd2375df8cd652"' : 'data-bs-target="#xs-injectables-links-module-TrackingDbModule-c9b9fb30bcb748ec21e3f9428a1aed9fe66cb7b5315dbea954bacb6284bbeed2b074821aa840f8a4688f794baf16c3dcbf2401b1845a46da36fd2375df8cd652"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TrackingDbModule-c9b9fb30bcb748ec21e3f9428a1aed9fe66cb7b5315dbea954bacb6284bbeed2b074821aa840f8a4688f794baf16c3dcbf2401b1845a46da36fd2375df8cd652"' :
                                        'id="xs-injectables-links-module-TrackingDbModule-c9b9fb30bcb748ec21e3f9428a1aed9fe66cb7b5315dbea954bacb6284bbeed2b074821aa840f8a4688f794baf16c3dcbf2401b1845a46da36fd2375df8cd652"' }>
                                        <li class="link">
                                            <a href="injectables/TrackingDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TrackingDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TrackingModule.html" data-type="entity-link" >TrackingModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' : 'data-bs-target="#xs-controllers-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' :
                                            'id="xs-controllers-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' }>
                                            <li class="link">
                                                <a href="controllers/TrackingController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TrackingController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' : 'data-bs-target="#xs-injectables-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' :
                                        'id="xs-injectables-links-module-TrackingModule-dc7c3223fd361cfb03bfe21f5ca427dbe86e26d7417b3e35931a025eae5abae326b47830c1b7e705f2aa00b3f3fb9f3ba325de06df648933f4df62a380c9cb72"' }>
                                        <li class="link">
                                            <a href="injectables/TrackingApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TrackingApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UploadsModule.html" data-type="entity-link" >UploadsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' : 'data-bs-target="#xs-controllers-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' :
                                            'id="xs-controllers-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' }>
                                            <li class="link">
                                                <a href="controllers/UploadsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' : 'data-bs-target="#xs-injectables-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' :
                                        'id="xs-injectables-links-module-UploadsModule-93f713830e941d172890a075ac4dbe70b618f66f66417ecc3de428302da979a4f73de5bb3231f1ad6fc4834129348c367a17b7aae99877d0c514572d0e27140b"' }>
                                        <li class="link">
                                            <a href="injectables/UploadsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersApiModule.html" data-type="entity-link" >UsersApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' : 'data-bs-target="#xs-controllers-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' :
                                            'id="xs-controllers-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' : 'data-bs-target="#xs-injectables-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' :
                                        'id="xs-injectables-links-module-UsersApiModule-47544caad4bb880f5dbc0837c03793f6fc9ff7366b5f556242f2a70d897e7ddf43fc5f7f93bd02cf280adc1a63bfc993d6ca0acb0fa9e5c4f5decd831a8b9eab"' }>
                                        <li class="link">
                                            <a href="injectables/UserRolesDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRolesDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersDBModule.html" data-type="entity-link" >UsersDBModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersDBModule-728343a2575b906a7be605bdfb1ff96127b686c6d518e6639f523d5bfca7df3163d0938c577660b234be2923d3459b15db46a113d3f259af0914e62ff42b058d"' : 'data-bs-target="#xs-injectables-links-module-UsersDBModule-728343a2575b906a7be605bdfb1ff96127b686c6d518e6639f523d5bfca7df3163d0938c577660b234be2923d3459b15db46a113d3f259af0914e62ff42b058d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersDBModule-728343a2575b906a7be605bdfb1ff96127b686c6d518e6639f523d5bfca7df3163d0938c577660b234be2923d3459b15db46a113d3f259af0914e62ff42b058d"' :
                                        'id="xs-injectables-links-module-UsersDBModule-728343a2575b906a7be605bdfb1ff96127b686c6d518e6639f523d5bfca7df3163d0938c577660b234be2923d3459b15db46a113d3f259af0914e62ff42b058d"' }>
                                        <li class="link">
                                            <a href="injectables/UserRolesDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRolesDBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersDBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersDBService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AnalyticsController.html" data-type="entity-link" >AnalyticsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AuthApiController.html" data-type="entity-link" >AuthApiController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/CategoriesController.html" data-type="entity-link" >CategoriesController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/HealthController.html" data-type="entity-link" >HealthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/LocationsController.html" data-type="entity-link" >LocationsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/NotificationsController.html" data-type="entity-link" >NotificationsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/OnboardingController.html" data-type="entity-link" >OnboardingController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/PaymentController.html" data-type="entity-link" >PaymentController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ProfessionalsController.html" data-type="entity-link" >ProfessionalsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/PromotionsController.html" data-type="entity-link" >PromotionsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/RatingsController.html" data-type="entity-link" >RatingsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/RolesApiController.html" data-type="entity-link" >RolesApiController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ServicesController.html" data-type="entity-link" >ServicesController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/TrackingController.html" data-type="entity-link" >TrackingController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UploadsController.html" data-type="entity-link" >UploadsController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UsersController.html" data-type="entity-link" >UsersController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UsersRolesApiController.html" data-type="entity-link" >UsersRolesApiController</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AllExceptionsFilter.html" data-type="entity-link" >AllExceptionsFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnalyticsQueryDto.html" data-type="entity-link" >AnalyticsQueryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnalyticsQueryRequestDTO.html" data-type="entity-link" >AnalyticsQueryRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApplyPromotionRequestDTO.html" data-type="entity-link" >ApplyPromotionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignedPermissionDTO.html" data-type="entity-link" >AssignedPermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignedPermissionDTO-1.html" data-type="entity-link" >AssignedPermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignedRoleDTO.html" data-type="entity-link" >AssignedRoleDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignPermissionsToRoleRequestDTO.html" data-type="entity-link" >AssignPermissionsToRoleRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignPermissionsToUserRequestDTO.html" data-type="entity-link" >AssignPermissionsToUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignRolesToUserRequestDTO.html" data-type="entity-link" >AssignRolesToUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AsyncManager.html" data-type="entity-link" >AsyncManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/AverageCriteriaResponseDTO.html" data-type="entity-link" >AverageCriteriaResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/BlockUserRequestDTO.html" data-type="entity-link" >BlockUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CacheKeyHelper.html" data-type="entity-link" >CacheKeyHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CalculateDistanceQueryDTO.html" data-type="entity-link" >CalculateDistanceQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CancelServiceRequestDTO.html" data-type="entity-link" >CancelServiceRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardHelper.html" data-type="entity-link" >CardHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryDetailResponseDTO.html" data-type="entity-link" >CategoryDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryIdParamDTO.html" data-type="entity-link" >CategoryIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryPerformanceItemDTO.html" data-type="entity-link" >CategoryPerformanceItemDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryPerformanceResponseDTO.html" data-type="entity-link" >CategoryPerformanceResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryStatsResponseDTO.html" data-type="entity-link" >CategoryStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategorySummaryResponseDTO.html" data-type="entity-link" >CategorySummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChangeCategoryStatusQueryDTO.html" data-type="entity-link" >ChangeCategoryStatusQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCategoryDto.html" data-type="entity-link" >CreateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateNotificationRequestDTO.html" data-type="entity-link" >CreateNotificationRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePasswordDTO.html" data-type="entity-link" >CreatePasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePaymentDto.html" data-type="entity-link" >CreatePaymentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePaymentDto-1.html" data-type="entity-link" >CreatePaymentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePaymentMethodRequestDTO.html" data-type="entity-link" >CreatePaymentMethodRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePermissionRequestDTO.html" data-type="entity-link" >CreatePermissionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateProfessionalRequestDTO.html" data-type="entity-link" >CreateProfessionalRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePromotionRequestDTO.html" data-type="entity-link" >CreatePromotionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRatingRequestDTO.html" data-type="entity-link" >CreateRatingRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateResponseDataDTO.html" data-type="entity-link" >CreateResponseDataDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleRequestDTO.html" data-type="entity-link" >CreateRoleRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateServiceRequestDTO.html" data-type="entity-link" >CreateServiceRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateServiceRequestRequestDTO.html" data-type="entity-link" >CreateServiceRequestRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserRequestDTO.html" data-type="entity-link" >CreateUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CryptoHelper.html" data-type="entity-link" >CryptoHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomHttpResponseHelper.html" data-type="entity-link" >CustomHttpResponseHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardStatsResponseDTO.html" data-type="entity-link" >DashboardStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DistanceResponseDTO.html" data-type="entity-link" >DistanceResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EditContextAccessDTO.html" data-type="entity-link" >EditContextAccessDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EditContextRoleDTO.html" data-type="entity-link" >EditContextRoleDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EditContextRolesResponseDTO.html" data-type="entity-link" >EditContextRolesResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EditContextUserDTO.html" data-type="entity-link" >EditContextUserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EditContextUserResponseDTO.html" data-type="entity-link" >EditContextUserResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EmailHelper.html" data-type="entity-link" >EmailHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/EmailSendRequestDTO.html" data-type="entity-link" >EmailSendRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorHelper.html" data-type="entity-link" >ErrorHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExcelGenerator.html" data-type="entity-link" >ExcelGenerator</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileInfoResponseDTO.html" data-type="entity-link" >FileInfoResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/FindAllNotificationsQueryDTO.html" data-type="entity-link" >FindAllNotificationsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/FindNearbyQueryDTO.html" data-type="entity-link" >FindNearbyQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForgotUserPasswordDTO.html" data-type="entity-link" >ForgotUserPasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/FormatHelper.html" data-type="entity-link" >FormatHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/GeoLocationCoordinatesDTO.html" data-type="entity-link" >GeoLocationCoordinatesDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GeoTrackingLog.html" data-type="entity-link" >GeoTrackingLog</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetEditContextResponseDTO.html" data-type="entity-link" >GetEditContextResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetMyServicesQueryDTO.html" data-type="entity-link" >GetMyServicesQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsMetaDTO.html" data-type="entity-link" >GetNearbyProfessionalsMetaDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsQueryDTO.html" data-type="entity-link" >GetNearbyProfessionalsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsRequestDTO.html" data-type="entity-link" >GetNearbyProfessionalsRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsResponseDTO.html" data-type="entity-link" >GetNearbyProfessionalsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyServicesQueryDTO.html" data-type="entity-link" >GetNearbyServicesQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetPermissionListQueryDTO.html" data-type="entity-link" >GetPermissionListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetPermissionParamDTO.html" data-type="entity-link" >GetPermissionParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetProfessionalLocationParamDTO.html" data-type="entity-link" >GetProfessionalLocationParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetProfessionalReviewsQueryDTO.html" data-type="entity-link" >GetProfessionalReviewsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetProfessionalsAreaQueryDTO.html" data-type="entity-link" >GetProfessionalsAreaQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetProfessionalServicesQueryDTO.html" data-type="entity-link" >GetProfessionalServicesQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetProfessionalsListQueryDTO.html" data-type="entity-link" >GetProfessionalsListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetRecentRatingsQueryDTO.html" data-type="entity-link" >GetRecentRatingsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetRoleListQueryDTO.html" data-type="entity-link" >GetRoleListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetRoleParamDTO.html" data-type="entity-link" >GetRoleParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetServicesListQueryDTO.html" data-type="entity-link" >GetServicesListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetSubcategoriesParamDTO.html" data-type="entity-link" >GetSubcategoriesParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetTopRatedProfessionalsQueryDTO.html" data-type="entity-link" >GetTopRatedProfessionalsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetTopRatedQueryDTO.html" data-type="entity-link" >GetTopRatedQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetUserRoleListQueryDTO.html" data-type="entity-link" >GetUserRoleListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetUserRoleParamDTO.html" data-type="entity-link" >GetUserRoleParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/HttpExceptionFilter.html" data-type="entity-link" >HttpExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/IsDateRangeWithinSixMonths.html" data-type="entity-link" >IsDateRangeWithinSixMonths</a>
                            </li>
                            <li class="link">
                                <a href="classes/IsEndDateAfterStartDate.html" data-type="entity-link" >IsEndDateAfterStartDate</a>
                            </li>
                            <li class="link">
                                <a href="classes/IsOrderByFormat.html" data-type="entity-link" >IsOrderByFormat</a>
                            </li>
                            <li class="link">
                                <a href="classes/ListUsersRequestDTO.html" data-type="entity-link" >ListUsersRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LocationsGateway.html" data-type="entity-link" >LocationsGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginUserDTO.html" data-type="entity-link" >LoginUserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginUserResponseDTO.html" data-type="entity-link" >LoginUserResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/MaxCommaSeparatedConstraint.html" data-type="entity-link" >MaxCommaSeparatedConstraint</a>
                            </li>
                            <li class="link">
                                <a href="classes/MiddlewareConfig.html" data-type="entity-link" >MiddlewareConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/NearbyProfessionalDataDTO.html" data-type="entity-link" >NearbyProfessionalDataDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotExpiredConstraint.html" data-type="entity-link" >NotExpiredConstraint</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationDocument.html" data-type="entity-link" >NotificationDocument</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationIdParamDTO.html" data-type="entity-link" >NotificationIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationResponseDTO.html" data-type="entity-link" >NotificationResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotificationsProcessor.html" data-type="entity-link" >NotificationsProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/OnboardingUserRequestDTO.html" data-type="entity-link" >OnboardingUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/OnboardingUserResponseDTO.html" data-type="entity-link" >OnboardingUserResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/OnlineCountResponseDTO.html" data-type="entity-link" >OnlineCountResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginatedRequest.html" data-type="entity-link" >PaginatedRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginatedResponse.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationHelper.html" data-type="entity-link" >PaginationHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationMetaDTO.html" data-type="entity-link" >PaginationMetaDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationQueryDTO.html" data-type="entity-link" >PaginationQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationResponseDTO.html" data-type="entity-link" >PaginationResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PasswordOnlyMessageResponseDTO.html" data-type="entity-link" >PasswordOnlyMessageResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PasswordResponseDTO.html" data-type="entity-link" >PasswordResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentDetailResponseDTO.html" data-type="entity-link" >PaymentDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentDetailsDto.html" data-type="entity-link" >PaymentDetailsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentIdParamDTO.html" data-type="entity-link" >PaymentIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentListQueryDTO.html" data-type="entity-link" >PaymentListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentMethodDetailResponseDTO.html" data-type="entity-link" >PaymentMethodDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentMethodIdParamDTO.html" data-type="entity-link" >PaymentMethodIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentMethodStatsDto.html" data-type="entity-link" >PaymentMethodStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentProviderStatsDto.html" data-type="entity-link" >PaymentProviderStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentQueryDto.html" data-type="entity-link" >PaymentQueryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentStatusStatsDto.html" data-type="entity-link" >PaymentStatusStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentSummaryDto.html" data-type="entity-link" >PaymentSummaryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentSummaryQueryDTO.html" data-type="entity-link" >PaymentSummaryQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentSummaryResponseDTO.html" data-type="entity-link" >PaymentSummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentTrendItemResponseDTO.html" data-type="entity-link" >PaymentTrendItemResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentTrendsDto.html" data-type="entity-link" >PaymentTrendsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentTrendsQueryDTO.html" data-type="entity-link" >PaymentTrendsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentTrendsResponseDTO.html" data-type="entity-link" >PaymentTrendsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentWebhookParamDTO.html" data-type="entity-link" >PaymentWebhookParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PdfHtmlGenerator.html" data-type="entity-link" >PdfHtmlGenerator</a>
                            </li>
                            <li class="link">
                                <a href="classes/PdfNativeGenerator.html" data-type="entity-link" >PdfNativeGenerator</a>
                            </li>
                            <li class="link">
                                <a href="classes/PeriodDTO.html" data-type="entity-link" >PeriodDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionItemDTO.html" data-type="entity-link" >PermissionItemDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionListResponseDTO.html" data-type="entity-link" >PermissionListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionResponseDTO.html" data-type="entity-link" >PermissionResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionResponseDTO-1.html" data-type="entity-link" >PermissionResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionScopeDTO.html" data-type="entity-link" >PermissionScopeDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionSummaryDTO.html" data-type="entity-link" >PermissionSummaryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionSummaryDTO-1.html" data-type="entity-link" >PermissionSummaryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrismaBaseRepository.html" data-type="entity-link" >PrismaBaseRepository</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrismaBaseService.html" data-type="entity-link" >PrismaBaseService</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrismaClientExceptionFilter.html" data-type="entity-link" >PrismaClientExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrismaPaginationUtil.html" data-type="entity-link" >PrismaPaginationUtil</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProcessBatchManager.html" data-type="entity-link" >ProcessBatchManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProcessPaymentPollingDto.html" data-type="entity-link" >ProcessPaymentPollingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalDetailResponseDTO.html" data-type="entity-link" >ProfessionalDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalIdParamDTO.html" data-type="entity-link" >ProfessionalIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalIdRatingParamDTO.html" data-type="entity-link" >ProfessionalIdRatingParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalLocationResponseDTO.html" data-type="entity-link" >ProfessionalLocationResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalPaymentStatsDto.html" data-type="entity-link" >ProfessionalPaymentStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalRatingStatsResponseDTO.html" data-type="entity-link" >ProfessionalRatingStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalReviewsListResponseDTO.html" data-type="entity-link" >ProfessionalReviewsListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalServicesListResponseDTO.html" data-type="entity-link" >ProfessionalServicesListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalsListResponseDTO.html" data-type="entity-link" >ProfessionalsListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalStatsDTO.html" data-type="entity-link" >ProfessionalStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalStatsResponseDTO.html" data-type="entity-link" >ProfessionalStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PromotionApplyResponseDTO.html" data-type="entity-link" >PromotionApplyResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PromotionDetailResponseDTO.html" data-type="entity-link" >PromotionDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PromotionIdParamDTO.html" data-type="entity-link" >PromotionIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PromotionStatsResponseDTO.html" data-type="entity-link" >PromotionStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PromotionValidateResponseDTO.html" data-type="entity-link" >PromotionValidateResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RateLimitConfig.html" data-type="entity-link" >RateLimitConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/RateServiceRequestDTO.html" data-type="entity-link" >RateServiceRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingCriteriaRequestDTO.html" data-type="entity-link" >RatingCriteriaRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingDetailResponseDTO.html" data-type="entity-link" >RatingDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingDistributionResponseDTO.html" data-type="entity-link" >RatingDistributionResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingIdParamDTO.html" data-type="entity-link" >RatingIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingsListResponseDTO.html" data-type="entity-link" >RatingsListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingStatsDTO.html" data-type="entity-link" >RatingStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefreshTokenResponseDTO.html" data-type="entity-link" >RefreshTokenResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefundPaymentDto.html" data-type="entity-link" >RefundPaymentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportRatingRequestDTO.html" data-type="entity-link" >ReportRatingRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RespondServiceRequestRequestDTO.html" data-type="entity-link" >RespondServiceRequestRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RevenueStatsDTO.html" data-type="entity-link" >RevenueStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReversePaymentDto.html" data-type="entity-link" >ReversePaymentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReviewSummaryResponseDTO.html" data-type="entity-link" >ReviewSummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleItemDTO.html" data-type="entity-link" >RoleItemDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleListResponseDTO.html" data-type="entity-link" >RoleListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RolePermissionAssignmentResponseDTO.html" data-type="entity-link" >RolePermissionAssignmentResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleResponseDTO.html" data-type="entity-link" >RoleResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleResponseDTO-1.html" data-type="entity-link" >RoleResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleScopeDTO.html" data-type="entity-link" >RoleScopeDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleSummaryDTO.html" data-type="entity-link" >RoleSummaryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleWithPermissionsResponseDTO.html" data-type="entity-link" >RoleWithPermissionsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchBySkillsQueryDTO.html" data-type="entity-link" >SearchBySkillsQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchCategoriesQueryDTO.html" data-type="entity-link" >SearchCategoriesQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceCategorySummaryResponseDTO.html" data-type="entity-link" >ServiceCategorySummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceDetailResponseDTO.html" data-type="entity-link" >ServiceDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceIdParamDTO.html" data-type="entity-link" >ServiceIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceRequestDetailResponseDTO.html" data-type="entity-link" >ServiceRequestDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceRequestIdParamDTO.html" data-type="entity-link" >ServiceRequestIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceRequestParamsDTO.html" data-type="entity-link" >ServiceRequestParamsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceRequestsListResponseDTO.html" data-type="entity-link" >ServiceRequestsListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServicesListResponseDTO.html" data-type="entity-link" >ServicesListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceStatsDetailsDTO.html" data-type="entity-link" >ServiceStatsDetailsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceStatsResponseDTO.html" data-type="entity-link" >ServiceStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceSummaryResponseDTO.html" data-type="entity-link" >ServiceSummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceUserSummaryResponseDTO.html" data-type="entity-link" >ServiceUserSummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/StorageHelper.html" data-type="entity-link" >StorageHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SuspendProfessionalRequestDTO.html" data-type="entity-link" >SuspendProfessionalRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SwaggerConfig.html" data-type="entity-link" >SwaggerConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestingConfig.html" data-type="entity-link" >TestingConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/TopRatedProfessionalResponseDTO.html" data-type="entity-link" >TopRatedProfessionalResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnblockUserRequestDTO.html" data-type="entity-link" >UnblockUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnreadCountResponseDTO.html" data-type="entity-link" >UnreadCountResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAvailabilityRequestDTO.html" data-type="entity-link" >UpdateAvailabilityRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateCategoryDto.html" data-type="entity-link" >UpdateCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateEditContextRequestDTO.html" data-type="entity-link" >UpdateEditContextRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateEditContextResponseDTO.html" data-type="entity-link" >UpdateEditContextResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateLocationRequestDTO.html" data-type="entity-link" >UpdateLocationRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateLocationRequestDTO-1.html" data-type="entity-link" >UpdateLocationRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateLocationResponseDTO.html" data-type="entity-link" >UpdateLocationResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePaymentDto.html" data-type="entity-link" >UpdatePaymentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePaymentMethodDto.html" data-type="entity-link" >UpdatePaymentMethodDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePermissionRequestDTO.html" data-type="entity-link" >UpdatePermissionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProfessionalLocationRequestDTO.html" data-type="entity-link" >UpdateProfessionalLocationRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProfessionalRequestDTO.html" data-type="entity-link" >UpdateProfessionalRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRatingRequestDTO.html" data-type="entity-link" >UpdateRatingRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleRequestDTO.html" data-type="entity-link" >UpdateRoleRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateServiceRequestDTO.html" data-type="entity-link" >UpdateServiceRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserPasswordDTO.html" data-type="entity-link" >UpdateUserPasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserRequestDTO.html" data-type="entity-link" >UpdateUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadFileParamDTO.html" data-type="entity-link" >UploadFileParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadMerchantDocsRequestDTO.html" data-type="entity-link" >UploadMerchantDocsRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDetailResponseDTO.html" data-type="entity-link" >UserDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserHelper.html" data-type="entity-link" >UserHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserIdParamDTO.html" data-type="entity-link" >UserIdParamDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserPaymentStatsDto.html" data-type="entity-link" >UserPaymentStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserPermissionAssignmentResponseDTO.html" data-type="entity-link" >UserPermissionAssignmentResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserRatingStatsResponseDTO.html" data-type="entity-link" >UserRatingStatsResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserResponseDTO.html" data-type="entity-link" >UserResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserRoleAssignmentResponseDTO.html" data-type="entity-link" >UserRoleAssignmentResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserScopeResponseDTO.html" data-type="entity-link" >UserScopeResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UsersListResponseDTO.html" data-type="entity-link" >UsersListResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserStatsDTO.html" data-type="entity-link" >UserStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserSummaryResponseDTO.html" data-type="entity-link" >UserSummaryResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserWithRolesResponseDTO.html" data-type="entity-link" >UserWithRolesResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidatePromotionRequestDTO.html" data-type="entity-link" >ValidatePromotionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationConfig.html" data-type="entity-link" >ValidationConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationExceptionFilter.html" data-type="entity-link" >ValidationExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerificationStatusQueryDTO.html" data-type="entity-link" >VerificationStatusQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerificationStatusResponseDTO.html" data-type="entity-link" >VerificationStatusResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerifyProfessionalRequestDTO.html" data-type="entity-link" >VerifyProfessionalRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebSocketConfig.html" data-type="entity-link" >WebSocketConfig</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnalyticsApiService.html" data-type="entity-link" >AnalyticsApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AnalyticsDbService.html" data-type="entity-link" >AnalyticsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppConfig.html" data-type="entity-link" >AppConfig</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuditInterceptor.html" data-type="entity-link" >AuditInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthApiService.html" data-type="entity-link" >AuthApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthCookieService.html" data-type="entity-link" >AuthCookieService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthMigrationService.html" data-type="entity-link" >AuthMigrationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthPasswordService.html" data-type="entity-link" >AuthPasswordService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthTokenService.html" data-type="entity-link" >AuthTokenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoriesDbService.html" data-type="entity-link" >CategoriesDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoriesService.html" data-type="entity-link" >CategoriesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CredentialsRepository.html" data-type="entity-link" >CredentialsRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatabaseHelper.html" data-type="entity-link" >DatabaseHelper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmailService.html" data-type="entity-link" >EmailService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeeCalculatorService.html" data-type="entity-link" >FeeCalculatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileDownloadInterceptor.html" data-type="entity-link" >FileDownloadInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HbsRenderService.html" data-type="entity-link" >HbsRenderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtRefreshStrategy.html" data-type="entity-link" >JwtRefreshStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtStrategy.html" data-type="entity-link" >JwtStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalAuthGuard.html" data-type="entity-link" >LocalAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalStrategy.html" data-type="entity-link" >LocalStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocationsDbService.html" data-type="entity-link" >LocationsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocationsService.html" data-type="entity-link" >LocationsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationsDbService.html" data-type="entity-link" >NotificationsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationsService.html" data-type="entity-link" >NotificationsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ObservabilityInterceptor.html" data-type="entity-link" >ObservabilityInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OnboardingApiService.html" data-type="entity-link" >OnboardingApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OnboardingService.html" data-type="entity-link" >OnboardingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParseFilesPipe.html" data-type="entity-link" >ParseFilesPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PaymentApiService.html" data-type="entity-link" >PaymentApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PaymentDbService.html" data-type="entity-link" >PaymentDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PermissionsDBService.html" data-type="entity-link" >PermissionsDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PrismaDatasource.html" data-type="entity-link" >PrismaDatasource</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfessionalsDbService.html" data-type="entity-link" >ProfessionalsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfessionalsService.html" data-type="entity-link" >ProfessionalsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PromotionsDbService.html" data-type="entity-link" >PromotionsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PromotionsService.html" data-type="entity-link" >PromotionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RatingsDbService.html" data-type="entity-link" >RatingsDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RatingsService.html" data-type="entity-link" >RatingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportService.html" data-type="entity-link" >ReportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RolePermissionsDBService.html" data-type="entity-link" >RolePermissionsDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RolesApiService.html" data-type="entity-link" >RolesApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RolesDBService.html" data-type="entity-link" >RolesDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RolesPermissionsMapper.html" data-type="entity-link" >RolesPermissionsMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ScheduleConfig.html" data-type="entity-link" >ScheduleConfig</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServicesDbService.html" data-type="entity-link" >ServicesDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServicesService.html" data-type="entity-link" >ServicesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateEditorService.html" data-type="entity-link" >TemplateEditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TraceIdMiddleware.html" data-type="entity-link" >TraceIdMiddleware</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TrackingApiService.html" data-type="entity-link" >TrackingApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TrackingDbService.html" data-type="entity-link" >TrackingDbService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TransformInterceptor.html" data-type="entity-link" >TransformInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UploadsService.html" data-type="entity-link" >UploadsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserPermissionsDBService.html" data-type="entity-link" >UserPermissionsDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserRolesDBService.html" data-type="entity-link" >UserRolesDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserRolesDBService-1.html" data-type="entity-link" >UserRolesDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UsersApiService.html" data-type="entity-link" >UsersApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UsersDBService.html" data-type="entity-link" >UsersDBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZipExportService.html" data-type="entity-link" >ZipExportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/BasicAuthGuard.html" data-type="entity-link" >BasicAuthGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/MerchantContextGuard.html" data-type="entity-link" >MerchantContextGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/PermissionsGuard.html" data-type="entity-link" >PermissionsGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/UserByEmailLoaderGuard.html" data-type="entity-link" >UserByEmailLoaderGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/WsAuthGuard.html" data-type="entity-link" >WsAuthGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/WsJwtGuard.html" data-type="entity-link" >WsJwtGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ApiErrorResponse.html" data-type="entity-link" >ApiErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompoDocConfig.html" data-type="entity-link" >CompoDocConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DateRangeDTO.html" data-type="entity-link" >DateRangeDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploaderOptions.html" data-type="entity-link" >FileUploaderOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FlatMerchantAssignment.html" data-type="entity-link" >FlatMerchantAssignment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupedAssignments.html" data-type="entity-link" >GroupedAssignments</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IAuthenticatedRequest.html" data-type="entity-link" >IAuthenticatedRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICookies.html" data-type="entity-link" >ICookies</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDownloadResponse.html" data-type="entity-link" >IDownloadResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IExcelColumn.html" data-type="entity-link" >IExcelColumn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IJwtPayload.html" data-type="entity-link" >IJwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IMerchantContext.html" data-type="entity-link" >IMerchantContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportDataMetadata.html" data-type="entity-link" >IReportDataMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportOptions.html" data-type="entity-link" >IReportOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportOptions-1.html" data-type="entity-link" >IReportOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportPayload.html" data-type="entity-link" >IReportPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportService.html" data-type="entity-link" >IReportService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IRolePermission.html" data-type="entity-link" >IRolePermission</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISendEmailOptions.html" data-type="entity-link" >ISendEmailOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUploadedDocUrls.html" data-type="entity-link" >IUploadedDocUrls</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUploadMerchantDocsParams.html" data-type="entity-link" >IUploadMerchantDocsParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserDataOnJwt.html" data-type="entity-link" >IUserDataOnJwt</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationJobPayload.html" data-type="entity-link" >NotificationJobPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PackageJson.html" data-type="entity-link" >PackageJson</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PackageJson-1.html" data-type="entity-link" >PackageJson</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationOptions.html" data-type="entity-link" >PaginationOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PermissionDTO.html" data-type="entity-link" >PermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrismaModelDelegate.html" data-type="entity-link" >PrismaModelDelegate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProfessionalFilters.html" data-type="entity-link" >ProfessionalFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProfessionalStats.html" data-type="entity-link" >ProfessionalStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RateLimitConfigReturn.html" data-type="entity-link" >RateLimitConfigReturn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Response.html" data-type="entity-link" >Response</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RetryOptions.html" data-type="entity-link" >RetryOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoleDTO.html" data-type="entity-link" >RoleDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageDeleteInput.html" data-type="entity-link" >StorageDeleteInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageExecutionOptions.html" data-type="entity-link" >StorageExecutionOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageModuleOptions.html" data-type="entity-link" >StorageModuleOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoragePresignedUrlInput.html" data-type="entity-link" >StoragePresignedUrlInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoragePresignedUrlOptions.html" data-type="entity-link" >StoragePresignedUrlOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoragePresignedUrlResult.html" data-type="entity-link" >StoragePresignedUrlResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageUploadInput.html" data-type="entity-link" >StorageUploadInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageUploadResult.html" data-type="entity-link" >StorageUploadResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Template.html" data-type="entity-link" >Template</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationPipeOptionsExtended.html" data-type="entity-link" >ValidationPipeOptionsExtended</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationRuleItem.html" data-type="entity-link" >ValidationRuleItem</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});