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
                                            'data-bs-target="#controllers-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' : 'data-bs-target="#xs-controllers-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' :
                                            'id="xs-controllers-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' }>
                                            <li class="link">
                                                <a href="controllers/NotificationsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' : 'data-bs-target="#xs-injectables-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' :
                                        'id="xs-injectables-links-module-NotificationsApiModule-b2fb5d64aeeb2e19e4de34d085df268c62b920a647adcc05a05cc4b1b4164208c756a6356f6871955134bd7d35b6667a09a92b95234c5bed8bb4b23952e9bc50"' }>
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
                                        'data-bs-target="#injectables-links-module-NotificationsDbModule-c55f70c486fcb8d5564c53b02ed62888461d7d6d6a1d48710694740dfb5e471db9be1d96263a8935eca65750fcbba328ffecd370c62ef03a0ebb23fb1bf35b28"' : 'data-bs-target="#xs-injectables-links-module-NotificationsDbModule-c55f70c486fcb8d5564c53b02ed62888461d7d6d6a1d48710694740dfb5e471db9be1d96263a8935eca65750fcbba328ffecd370c62ef03a0ebb23fb1bf35b28"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NotificationsDbModule-c55f70c486fcb8d5564c53b02ed62888461d7d6d6a1d48710694740dfb5e471db9be1d96263a8935eca65750fcbba328ffecd370c62ef03a0ebb23fb1bf35b28"' :
                                        'id="xs-injectables-links-module-NotificationsDbModule-c55f70c486fcb8d5564c53b02ed62888461d7d6d6a1d48710694740dfb5e471db9be1d96263a8935eca65750fcbba328ffecd370c62ef03a0ebb23fb1bf35b28"' }>
                                        <li class="link">
                                            <a href="injectables/NotificationsDbService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationsDbService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NotificationsModule.html" data-type="entity-link" >NotificationsModule</a>
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
                                        'data-bs-target="#injectables-links-module-PaymentsDbModule-7f355ef4a8ec37e72041ccb50e20f247350add1403a316301e640827ff8ea1bbdc0feb77737d14e231acd6918d2a2803c672bd5c407e0c241c653f1c5bae35e9"' : 'data-bs-target="#xs-injectables-links-module-PaymentsDbModule-7f355ef4a8ec37e72041ccb50e20f247350add1403a316301e640827ff8ea1bbdc0feb77737d14e231acd6918d2a2803c672bd5c407e0c241c653f1c5bae35e9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PaymentsDbModule-7f355ef4a8ec37e72041ccb50e20f247350add1403a316301e640827ff8ea1bbdc0feb77737d14e231acd6918d2a2803c672bd5c407e0c241c653f1c5bae35e9"' :
                                        'id="xs-injectables-links-module-PaymentsDbModule-7f355ef4a8ec37e72041ccb50e20f247350add1403a316301e640827ff8ea1bbdc0feb77737d14e231acd6918d2a2803c672bd5c407e0c241c653f1c5bae35e9"' }>
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
                                            'data-bs-target="#controllers-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' : 'data-bs-target="#xs-controllers-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' :
                                            'id="xs-controllers-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' }>
                                            <li class="link">
                                                <a href="controllers/PaymentController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' : 'data-bs-target="#xs-injectables-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' :
                                        'id="xs-injectables-links-module-PaymentsModule-9f01e83be5aa59a3c61992f390b02209bddfc6a765d91f7a6b2805e120191a4350c9bd32c81bb9b33d3e9dc4ccd235fc152bc20869cb676f140e5b9c03f101af"' }>
                                        <li class="link">
                                            <a href="injectables/PaymentApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentApiService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfessionalsModule.html" data-type="entity-link" >ProfessionalsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' : 'data-bs-target="#xs-controllers-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' :
                                            'id="xs-controllers-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' }>
                                            <li class="link">
                                                <a href="controllers/ProfessionalsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfessionalsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' : 'data-bs-target="#xs-injectables-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' :
                                        'id="xs-injectables-links-module-ProfessionalsModule-68027223ad6d647de083f80cf21074060ce74b3c6fb7822bca63d00dd64c0873afd6c690dafde3239a007d578ff6d81f7002ec6601562735578ef7912cbcaa93"' }>
                                        <li class="link">
                                            <a href="injectables/ProfessionalsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfessionalsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PromotionsModule.html" data-type="entity-link" >PromotionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' : 'data-bs-target="#xs-controllers-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' :
                                            'id="xs-controllers-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' }>
                                            <li class="link">
                                                <a href="controllers/PromotionsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' : 'data-bs-target="#xs-injectables-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' :
                                        'id="xs-injectables-links-module-PromotionsModule-48eaec131025b0650aaf7dd464b1c0702ad753b10e6c5385b242f62f7a01b13e7a6f6fe850a6fb2d1df997ab3c793f0bf459dc612275a47bf777a2edfe3314c5"' }>
                                        <li class="link">
                                            <a href="injectables/PromotionsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RatingsModule.html" data-type="entity-link" >RatingsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' : 'data-bs-target="#xs-controllers-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' :
                                            'id="xs-controllers-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' }>
                                            <li class="link">
                                                <a href="controllers/RatingsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RatingsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' : 'data-bs-target="#xs-injectables-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' :
                                        'id="xs-injectables-links-module-RatingsModule-41ef2ca8b578fcae2b708b9656a40655b103b07a89fbf78e79f3b941ef4ed8446e56ca71e96e5572ec4078060032e8154e51cfc37be8efff649388bacb2ef2a9"' }>
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
                                <a href="modules/ServicesModule.html" data-type="entity-link" >ServicesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' : 'data-bs-target="#xs-controllers-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' :
                                            'id="xs-controllers-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' }>
                                            <li class="link">
                                                <a href="controllers/ServicesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServicesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' : 'data-bs-target="#xs-injectables-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' :
                                        'id="xs-injectables-links-module-ServicesModule-9b59693bf0609a2313b582cc4664a73aa716ad93f07c5af2321c8477a65e42d5b51f310133efff69bcd7be906a9276d9fa97561aa119aca4ac68d094ff2f5bec"' }>
                                        <li class="link">
                                            <a href="injectables/ServicesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServicesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StorageApiModule.html" data-type="entity-link" >StorageApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' : 'data-bs-target="#xs-controllers-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' :
                                            'id="xs-controllers-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' }>
                                            <li class="link">
                                                <a href="controllers/StorageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' : 'data-bs-target="#xs-injectables-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' :
                                        'id="xs-injectables-links-module-StorageApiModule-0d82ab99577a5caa99a642e15af00efae6ffa060581d04b2d91adb392c36d2c50e35f4f7489a4d4fa506fbd470e1434c628d275ee01557beb1c82093ff0f5728"' }>
                                        <li class="link">
                                            <a href="injectables/StorageApiService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageApiService</a>
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
                                <a href="modules/TrackingDbModule.html" data-type="entity-link" >TrackingDbModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TrackingDbModule-fd396d7f81ef5d7e1bc0b8d08675aa3232b7a24e7d01866f12046ecec2506f0c7a89c16b93a47bea7883119f18dbd55d25d6f24cecb45b910c125f24e556a651"' : 'data-bs-target="#xs-injectables-links-module-TrackingDbModule-fd396d7f81ef5d7e1bc0b8d08675aa3232b7a24e7d01866f12046ecec2506f0c7a89c16b93a47bea7883119f18dbd55d25d6f24cecb45b910c125f24e556a651"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TrackingDbModule-fd396d7f81ef5d7e1bc0b8d08675aa3232b7a24e7d01866f12046ecec2506f0c7a89c16b93a47bea7883119f18dbd55d25d6f24cecb45b910c125f24e556a651"' :
                                        'id="xs-injectables-links-module-TrackingDbModule-fd396d7f81ef5d7e1bc0b8d08675aa3232b7a24e7d01866f12046ecec2506f0c7a89c16b93a47bea7883119f18dbd55d25d6f24cecb45b910c125f24e556a651"' }>
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
                                            'data-bs-target="#controllers-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' : 'data-bs-target="#xs-controllers-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' :
                                            'id="xs-controllers-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' }>
                                            <li class="link">
                                                <a href="controllers/TrackingController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TrackingController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' : 'data-bs-target="#xs-injectables-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' :
                                        'id="xs-injectables-links-module-TrackingModule-0172c5b6ad28688e6789493cff1558b8c3ca2bcaa60f906fdac1ed170dce44edc7d30814560a38895860035d4efbd7d5a859a152ab1424964668cc09e9f056e6"' }>
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
                                            'data-bs-target="#controllers-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' : 'data-bs-target="#xs-controllers-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' :
                                            'id="xs-controllers-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' }>
                                            <li class="link">
                                                <a href="controllers/UploadsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' : 'data-bs-target="#xs-injectables-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' :
                                        'id="xs-injectables-links-module-UploadsModule-fc4e743f2d6d9730017f0bfe595c70022aac9c489e2aacf71505643ed593c4a1b37664b7531b771580df0256f261e5af576e34ff415b950a7e070143aaffa58b"' }>
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
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' : 'data-bs-target="#xs-controllers-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' :
                                            'id="xs-controllers-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' : 'data-bs-target="#xs-injectables-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' :
                                        'id="xs-injectables-links-module-UsersModule-0cbe60d88d0e8d5b00219f7e64fd22e3ee01313fab6520cad1fdf990f4a55b23e37a2e5caf9b075c9a7b2f03f783871a27ddb2d338f93d870acc9df10df0370c"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
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
                                    <a href="controllers/StorageController.html" data-type="entity-link" >StorageController</a>
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
                                    <a href="controllers/UsersController-1.html" data-type="entity-link" >UsersController</a>
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
                                <a href="classes/ApplyPromotionDto.html" data-type="entity-link" >ApplyPromotionDto</a>
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
                                <a href="classes/AverageCriteriaDto.html" data-type="entity-link" >AverageCriteriaDto</a>
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
                                <a href="classes/CardHelper.html" data-type="entity-link" >CardHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryPerformanceItemDTO.html" data-type="entity-link" >CategoryPerformanceItemDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryPerformanceResponseDTO.html" data-type="entity-link" >CategoryPerformanceResponseDTO</a>
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
                                <a href="classes/CreatePermissionRequestDTO.html" data-type="entity-link" >CreatePermissionRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePromotionDto.html" data-type="entity-link" >CreatePromotionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRatingDto.html" data-type="entity-link" >CreateRatingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateResponseDataDTO.html" data-type="entity-link" >CreateResponseDataDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleRequestDTO.html" data-type="entity-link" >CreateRoleRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateServiceDto.html" data-type="entity-link" >CreateServiceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateServiceRequestDto.html" data-type="entity-link" >CreateServiceRequestDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link" >CreateUserDto</a>
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
                                <a href="classes/DeleteStorageRequestDTO.html" data-type="entity-link" >DeleteStorageRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DistanceResponseDTO.html" data-type="entity-link" >DistanceResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DocumentValidationDTO.html" data-type="entity-link" >DocumentValidationDTO</a>
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
                                <a href="classes/GetNearbyProfessionalsMetaDTO.html" data-type="entity-link" >GetNearbyProfessionalsMetaDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsRequestDTO.html" data-type="entity-link" >GetNearbyProfessionalsRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetNearbyProfessionalsResponseDTO.html" data-type="entity-link" >GetNearbyProfessionalsResponseDTO</a>
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
                                <a href="classes/GetProfessionalsAreaQueryDTO.html" data-type="entity-link" >GetProfessionalsAreaQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetRoleListQueryDTO.html" data-type="entity-link" >GetRoleListQueryDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetRoleParamDTO.html" data-type="entity-link" >GetRoleParamDTO</a>
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
                                <a href="classes/PaymentDetailsDto.html" data-type="entity-link" >PaymentDetailsDto</a>
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
                                <a href="classes/PaymentTrendsDto.html" data-type="entity-link" >PaymentTrendsDto</a>
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
                                <a href="classes/ProfessionalLocationResponseDTO.html" data-type="entity-link" >ProfessionalLocationResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalPaymentStatsDto.html" data-type="entity-link" >ProfessionalPaymentStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalRatingStatsDto.html" data-type="entity-link" >ProfessionalRatingStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProfessionalStatsDTO.html" data-type="entity-link" >ProfessionalStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RateLimitConfig.html" data-type="entity-link" >RateLimitConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/RateServiceDto.html" data-type="entity-link" >RateServiceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingCriteriaDto.html" data-type="entity-link" >RatingCriteriaDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RatingDistributionDto.html" data-type="entity-link" >RatingDistributionDto</a>
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
                                <a href="classes/ReportRatingDto.html" data-type="entity-link" >ReportRatingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RespondServiceRequestDto.html" data-type="entity-link" >RespondServiceRequestDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RevenueStatsDTO.html" data-type="entity-link" >RevenueStatsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReversePaymentDto.html" data-type="entity-link" >ReversePaymentDto</a>
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
                                <a href="classes/ServiceStatsDetailsDTO.html" data-type="entity-link" >ServiceStatsDetailsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/StorageHelper.html" data-type="entity-link" >StorageHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SwaggerConfig.html" data-type="entity-link" >SwaggerConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestingConfig.html" data-type="entity-link" >TestingConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/TopRatedProfessionalDto.html" data-type="entity-link" >TopRatedProfessionalDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnblockUserRequestDTO.html" data-type="entity-link" >UnblockUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnreadCountResponseDTO.html" data-type="entity-link" >UnreadCountResponseDTO</a>
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
                                <a href="classes/UpdateRatingDto.html" data-type="entity-link" >UpdateRatingDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleRequestDTO.html" data-type="entity-link" >UpdateRoleRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateServiceDto.html" data-type="entity-link" >UpdateServiceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserPasswordDTO.html" data-type="entity-link" >UpdateUserPasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserRequestDTO.html" data-type="entity-link" >UpdateUserRequestDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDetailResponseDTO.html" data-type="entity-link" >UserDetailResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserHelper.html" data-type="entity-link" >UserHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserPaymentStatsDto.html" data-type="entity-link" >UserPaymentStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserPermissionAssignmentResponseDTO.html" data-type="entity-link" >UserPermissionAssignmentResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserRatingStatsDto.html" data-type="entity-link" >UserRatingStatsDto</a>
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
                                <a href="classes/UserWithRolesResponseDTO.html" data-type="entity-link" >UserWithRolesResponseDTO</a>
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
                                    <a href="injectables/FileDownloadInterceptor.html" data-type="entity-link" >FileDownloadInterceptor</a>
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
                                    <a href="injectables/ProfessionalsService.html" data-type="entity-link" >ProfessionalsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PromotionsService.html" data-type="entity-link" >PromotionsService</a>
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
                                    <a href="injectables/ServicesService.html" data-type="entity-link" >ServicesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageApiService.html" data-type="entity-link" >StorageApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
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
                                    <a href="injectables/UsersService.html" data-type="entity-link" >UsersService</a>
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
                                <a href="interfaces/DateRangeDTO.html" data-type="entity-link" >DateRangeDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileInfo.html" data-type="entity-link" >FileInfo</a>
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
                                <a href="interfaces/IUploadedFileUrls.html" data-type="entity-link" >IUploadedFileUrls</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUploadFileParams.html" data-type="entity-link" >IUploadFileParams</a>
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
                                <a href="interfaces/ServiceFilters.html" data-type="entity-link" >ServiceFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ServiceStats.html" data-type="entity-link" >ServiceStats</a>
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