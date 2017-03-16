import router from 'modules/router';
import ajax from 'modules/ajax';
import api from 'modules/api';
import { animate } from 'modules/animate';
import { getDimensions, initMouseHandler } from 'modules/helpers';

import featuredVideos from 'modules/featured-videos';
import animateCase from 'modules/animate-case';
import overlay from 'modules/overlay';
import scrollCase from 'modules/scroll-case';

const _overlay = new overlay();

const _animateCase = new animateCase({
	showCase: () => {},
	hideLanding: () => {},
	showLanding: () => {},
	hideCase: () => {},
	getCaseFromCMS: () => {}
});

initMouseHandler();

const routes = {
    about: {
        route: '/about',
        name: 'ABOUT',
        wrapper: document.querySelector('.o-section--about'),
        data: {},
        init() {

        },
        animateIn(next, prevRoute) {
            _overlay.animateInOverlay(this.name, prevRoute, next);
        },
        animateOut(next, nextRoute) {
            // next();
            _overlay.animateOutOverlay(this.name, nextRoute, next);
        },
        disable(req, next) {
            next();
        },
        enable(req, next) {
            next();
        }
    },
    contact: {
        route: '/contact',
        name: 'CONTACT',
        wrapper: document.querySelector('.o-section--contact'),
        data: {},
        init() {

        },
        animateIn(next, prevRoute) {
            _overlay.animateInOverlay(this.name, prevRoute, () => {
                animate(document.querySelector('.c-contact'), {
                    translateY: [null, -Math.abs(document.querySelector('.c-contact').clientHeight / 2), 1, 0],
                    opacity: [0, 1, 0.8, 0]
                }, {
                    duration: 600,
                    easing: 'easeOutQuart',
                    onComplete: next
                });
            });
        },
        animateOut(next, nextRoute) {
            animate(document.querySelector('.c-contact'), {
                translateY: [-Math.abs(document.querySelector('.c-contact').clientHeight / 2), 0, 1, 0],
                opacity: [1, 0, 0.8, 0.2]
            }, {
                duration: 600,
                easing: 'easeInQuart',
                onComplete: () => {
                    _overlay.animateOutOverlay(this.name, nextRoute, next);
                }
            });
        },
        disable(req, next) {
            next();
        },
        enable(req, next) {
            next();
        }
    },
    cases: {
        route: '/cases',
        name: 'CASES',
        wrapper: document.querySelector('.o-section--cases'),
        data: {},
        dataFetched: false,
        modules: {
            scrollCase: null
        },
        init() {
        },
        animateIn(next, prevRoute) {
            if (!this.modules.scrollCase) {
                this.modules.scrollCase = new scrollCase({
                     imageData: this.data.relatedImages
                });
            }

            _overlay.animateInOverlay(this.name, prevRoute, () => {
                animate(document.querySelector('.c-cases__nav'), {
                    opacity: [0, 1, 1, 0]
                }, {
                    delay: 0,
                    duration: 400,
                    easing: 'easeOutQuad',
                    onComplete: next
                });
            });
        },
        animateOut(next, nextRoute) {
            animate(document.querySelector('.c-cases__nav'), {
                opacity: [1, 0, 1, 0]
            }, {
                delay: 0,
                duration: 400,
                easing: 'easeOutQuad',
                onComplete: () => {
                    _overlay.animateOutOverlay(this.name, nextRoute, next);        
                }
            });
        },
        disable(req, next) {
            next();
        },
        enable(req, next) {
            if (!this.dataFetched) {
                api.get('/case', (data) => {
                    let mappedCases = data.map((_case) => {
                         return {
                             title: _case.acf.case_title,
                             id: _case.id,
                             url: 'http://localhost:1234/case/' + _case.id
                         }
                     });

                     let relatedImages = data.map((_case) => {
                         if (typeof _case.acf.extras_related_images !== 'undefined') {
                             let images = _case.acf.extras_related_images.map((image) => {
                                 return {
                                     url: image.related_image_field.url,
                                     height: image.related_image_field.height,
                                     width: image.related_image_field.width,
                                 } 
                             });

                             return {
                                 images: images,
                                 id: _case.id,
                             }
                         }
                     });

                     this.data = {
                        mappedCases: mappedCases,
                        relatedImages: relatedImages
                     }

                     this.initView();                        

                    this.dataFetched = true;
                    
                    next();
                });
            } else {
                next();
            }
        },
        initView() {
            new Vue ({
                el: '.c-cases',
                data: {
                    cases: this.data.mappedCases
                }
            });            
        }
    },
    case: {
        route: '/case/:id',
        name: 'CASE',
        wrapper: document.querySelector('.o-section--case'),
        id: 0,
        data: {
        	videoUrl: '',
        	title: '',
        	about: ''
        },
        init() {
        	this.initView();
        },
        animateIn(next, prevRoute) {
            _overlay.animateOutOverlay(this.name, prevRoute, () => {
                api.get(`/case/${this.id}`, (data) => {
                    this.data.videoUrl = data.acf.case_video.url;
                    this.data.title = data.acf.case_title;
                    this.data.about = data.acf.case_about;
                    
                    document.querySelector('.c-case__video').load();

                    animate(document.querySelector('.c-case__mask'), {
                        translateX: [0, 1024, 1, 0]
                    }, {
                        duration: 800,
                        easing: 'easeInQuart',
                        onComplete: () => {
                            document.querySelector('.c-case__video').play();
                            next();
                        }
                    });
                });
            });
        },
        animateOut(next, nextRoute) {
            _overlay.animateOutOverlay(this.name, nextRoute, () => {
                if (nextRoute === routes.landing.name) {
                    animate(document.querySelector('.c-case__mask'), {
                        translateX: [1024, 0, 1, 0]
                    }, {
                        duration: 800,
                        easing: 'easeOutQuart',
                        onComplete: () => {
                            document.querySelector('.c-case__video').pause();
                            next();
                        }
                    });
                } else {
                    next();
                }          
            });
        },
        disable(req, next, nextRoute) {
        	next();
        },
        enable(req, next, prevRoute) {
        	this.id = req.params.id;
        	_animateCase.caseId = this.id;
        	next();
        },
        initView() {
			new Vue ({
				el: '.c-case',
				data: {
					fields: this.data
				}
			});
        }
    },
    landing: {
        route: '/',
        name: 'LANDING',
        wrapper: document.querySelector('.o-section--landing'),
        modules: {
        	featuredVideos: null
        },
        dataFetched: false,
        data: {},
        init() {

        },
        animateIn(next, prevRoute) {
            _overlay.animateInOverlay(this.name, prevRoute, () => {
                if (prevRoute === routes.case.name) {
                    this.modules.featuredVideos.enabled = true;
                    _animateCase.direction = 'backward';
                    _animateCase.init(next);
                } else {
                    next();
                }
            });
        },
        animateOut(next, nextRoute) {
            _overlay.animateOutOverlay(this.name, nextRoute, () => {
                if (nextRoute === routes.case.name) {
                    _animateCase.direction = 'forward';
                    _animateCase.init(next);
                } else {
                    next();
                }
            });
        },
        disable(req, next, nextRoute) {
        	this.modules.featuredVideos.enabled = false;
        	next();
        },
        enable(req, next, prevRoute) {
        	if (!this.dataFetched) {
        		api.get('/case', (data) => {
        			this.data = getSortedLandingData(data);
        			this.initView();
					
					this.modules.featuredVideos = new featuredVideos({
						featuredVideos: this.data.featured
					});

					this.dataFetched = true;
        			
        			next();
        		});
        	} else {
                this.modules.featuredVideos.enabled = true;
        		next();
        	}
        },
        initView() {
			new Vue ({
				el: '.c-featured',
				data: {
					featured: this.data.featured,
					featured_first: this.data.featured_first
				}
			});
        }
    }
};

new router({
	routes: routes
});

function getSortedLandingData(data) {
	let reducedCases = data.filter(filterFeaturedCases);
	let sortedCases = reducedCases.map(sortFeaturedCases);

	return {
		featured: sortedCases,
		featured_first: sortedCases[0]
	}
}

function filterFeaturedCases(featured) {
	if (featured.acf.settings_is_featured) {
		return featured;
	}
}

function sortFeaturedCases(featured) {
	if (featured.acf.settings_is_featured) {
		return {
			fields: featured.acf,
			id: featured.id,
			url: 'http://localhost:1234/case/' + featured.id
		}
	}
}

// let navigations = [].slice.call(document.querySelectorAll('.js-navigate'));

// navigations.forEach((navigation) => {
//     navigation.addEventListener('click', (e) => {
//         e.preventDefault();
//         grapnel.navigate(navigation.getAttribute('href'));
//     });
// });

// import Grapnel from 'grapnel';

// var router = new Grapnel({ pushState : true });

// import featuredVideos from 'modules/featured-videos';
// import Grapnel from 'grapnel';

// import { animate } from 'modules/animate';
// import animateCase from 'modules/animate-case';
// import scrollCase from 'modules/scroll-case';
// import { getDimensions, initMouseHandler } from 'modules/helpers';

// initMouseHandler();

// var router = new Grapnel({ pushState : true });

// let _featuredVideos = null;

// var currentRoute = {
// 	name: null,
// 	wrapper: null
// };

// var caseData = {
// 	videoUrl: '',
// 	title: '',
// 	about: ''
// };

// const _animateCase = new animateCase({
// 	showCase: () => {
// 		setCurrentRoute(routes.case);
// 	},
// 	hideLanding: () => {
// 		hideOtherRoutes();
// 	},
// 	showLanding: () => {
// 		setCurrentRoute(routes.landing);
// 		_featuredVideos.enabled = true;
// 	},
// 	hideCase: () => {
// 		hideOtherRoutes();
// 	},
// 	getCaseFromCMS: getCaseFromCMS
// });

// new Vue ({
// 	el: '.c-case',
// 	data: {
// 		fields: caseData
// 	} 
// });

// function getCaseFromCMS(id, onCaseReceived) {
// 	ajax.get(`http://localhost:1234/wp/wp-json/wp/v2/case/${id}`, {}, (data) => {
// 		let parsedData = JSON.parse(data).acf;

// 		caseData.videoUrl = parsedData.case_video.url;
// 		caseData.title = parsedData.case_title;
// 		caseData.about = parsedData.case_about;

// 		onCaseReceived();
// 	});
// }

// var routes = {
// 	about: {
// 		route: '/about',
// 		name: 'ABOUT',
// 		wrapper: document.querySelector('.o-section--about'),
// 		outAnimation: () => {
// 			console.log('cases');
// 		}
// 	},
// 	contact: {
// 		route: '/contact',
// 		name: 'CONTACT',
// 		wrapper: document.querySelector('.o-section--contact'),
// 		outAnimation: () => {
// 			console.log('cases');
// 		}
// 	},
// 	cases: {
// 		route: '/cases',
// 		name: 'CASES',
// 		wrapper: document.querySelector('.o-section--cases'),
// 		outAnimation: () => {
// 			console.log('cases');
// 		}
// 	},
// 	case: {
// 		route: '/case/:id',
// 		name: 'CASE',
// 		wrapper: document.querySelector('.o-section--case'),
// 		outAnimation: () => {
// 			console.log('cases');
// 		}
// 	},
// 	landing: {
// 		route: '/',
// 		name: 'LANDING',
// 		wrapper: document.querySelector('.o-section--landing'),
// 		outAnimation: () => {
// 			console.log('cases');
// 		}
// 	}
// }

// router.get(routes.about.route, function(req){
//     setCurrentRoute(routes.about);
// });

// router.get(routes.contact.route, function(req){
//     setCurrentRoute(routes.contact);
// });

// router.get(routes.cases.route, function(req) {
// 	document.querySelector('.c-overlay-mask').style.display = 'block';
// 	document.querySelector('.c-overlay-mask').style.opacity = 1;

// 	animate(document.querySelector('.c-overlay-mask'), {
// 		translateX: [0, getDimensions().width, 1, 0]
// 	}, {
// 		duration: 800,
// 		easing: 'easeOutQuart',
// 		onComplete: () => {
// 			ajax.get('http://localhost:1234/wp/wp-json/wp/v2/case', {}, (cases) => {
// 				let parsedCases = JSON.parse(cases);

// 				let mappedCases = parsedCases.map((_case) => {
// 					return {
// 						title: _case.acf.case_title,
// 						id: _case.id,
// 						url: 'http://localhost:1234/case/' + _case.id
// 					}
// 				});

// 				let relatedImages = parsedCases.map((_case) => {
// 					if (typeof _case.acf.extras_related_images !== 'undefined') {
// 						let images = _case.acf.extras_related_images.map((image) => {
// 							return {
// 								url: image.related_image_field.url,
// 								height: image.related_image_field.height,
// 								width: image.related_image_field.width,
// 							} 
// 						});

// 						return {
// 							images: images,
// 							id: _case.id,
// 						}
// 					}
// 				});

// 				new Vue ({
// 					el: '.c-cases',
// 					data: {
// 						cases: mappedCases
// 					}
// 				});

// 				setCurrentRoute(routes.cases);
// 				hideOtherRoutes();

// 				new scrollCase({
// 					imageData: relatedImages
// 				});

// 				document.querySelector('.c-overlay-mask').style.display = 'none';
				

// 				animate(document.querySelector('.c-cases__nav'), {
// 					opacity: [0, 1, 1, 0]
// 				}, {
// 					delay: 0,
// 					duration: 400,
// 					easing: 'easeOutQuad'
// 				})
// 			});
// 		}
// 	});    
// });

// router.get(routes.case.route, function(req) {
//     var id = req.params.id;

//     if (currentRoute.name == routes.landing.name) {
//     	_featuredVideos.enabled = false;
//     	_animateCase.caseId = id;
//     	_animateCase.direction = 'forward';
//     	_animateCase.init();
//     }
// });

// router.get(routes.landing.route, function(req) {
// 	if (currentRoute.name == routes.case.name) {
//     	_animateCase.direction = 'backward';
//     	_animateCase.init();
// 	} else {
// 		setCurrentRoute(routes.landing);
// 		hideOtherRoutes();
// 		getFeaturedCases();

// 		if (_featuredVideos) {
// 			_featuredVideos.enabled = true;
// 		}
// 	}
// });

// router.on('navigate', function() {
// 	Object.keys(routes).forEach((key) => {
// 		var val = routes[key];
// 		if (val.route == this.state.previousState.route) {
// 			val.outAnimation();
// 		}
// 	});
// });

// function setCurrentRoute(route) {
// 	currentRoute.name = route.name;
// 	currentRoute.wrapper = route.wrapper;
// 	currentRoute.wrapper.style.display = 'block';
// }

// function hideOtherRoutes() {
// 	for (var key in routes) {
// 		if (routes[key].name !== currentRoute.name) {
// 			if (routes[key].wrapper) {
// 				routes[key].wrapper.style.display = 'none';	
// 			}
// 		}
// 	}
// }

// function getFeaturedCases() {
// 	ajax.get('http://localhost:1234/wp/wp-json/wp/v2/case', {}, sortFeaturedCases);	


// 	animate(document.querySelector('.c-overlay-mask'), {
// 			opacity: [1, 0, 1, 0]
// 		}, {
// 			delay: 1500,
// 			duration: 800,
// 			easing: 'easeInQuart',
// 			onComplete: () => {
// 				document.querySelector('.c-overlay-mask').style.display = 'none';
// 				document.querySelector('.c-overlay-mask').style.left = '-100%';
// 			}
// 		}
// 	);
// }

// var landingInit = false;

// function sortFeaturedCases(cases) {
// 	if (landingInit) return;

// 	let parsedCases = JSON.parse(cases);
	
// 	let reducedCases = parsedCases.filter((featured) => {
// 		if (featured.acf.settings_is_featured) {
// 			return featured;
// 		}
// 	});
	
// 	let sortedCases = reducedCases.map((featured) => {
// 		return {
// 			fields: featured.acf,
// 			id: featured.id,
// 			url: 'http://localhost:1234/case/' + featured.id
// 		}
// 	});
	
// 	new Vue ({
// 		el: '.c-featured',
// 		data: {
// 			featured: sortedCases,
// 			featured_first: sortedCases[0]
// 		}
// 	});

// 	_featuredVideos = new featuredVideos({
// 		featuredVideos: sortedCases
// 	});

// 	let navigations = [].slice.call(document.querySelectorAll('.js-navigate'));

// 	navigations.forEach((navigation) => {
// 		navigation.addEventListener('click', (e) => {
// 			e.preventDefault();
// 			router.navigate(navigation.getAttribute('href'));
// 		});
// 	});

// 	landingInit = true;
// }