require.config({
    baseUrl: 'js/',
    paths: {
        'Class': 'vendor/jsOOP/Class',
        'baseClass': 'vendor/jsOOP/baseClass',
        //'handlebars': 'bower_components/handlebars',
        'jquery': 'bower_components/jquery/dist/jquery.min',
        'jquery.fitVids': 'lib/jquery.fitvids',
        'jquery.hammer': 'lib/jquery.hammer.v2',
        'hammerjs': 'lib/hammer.min',
        'jquery.hoverdir': 'lib/jquery.hoverdir',
        'jquery.mousewheel': 'lib/jquery.mousewheel',
        'jquery.mCustomScrollbar': 'lib/jquery.mCustomScrollbar.concat.min',
        'libjs': 'lib/LibJS',
        'Modernizr': 'lib/modernizr.custom.min.2.6.2',
        'pace': 'bower_components/pace/pace.min',
        'swipe': 'lib/swipe.new',
        'Tablesort': 'lib/tablesort',
        'TimelineLite': 'bower_components/greensock/src/minified/TimelineLite.min',
        'TweenLite': 'bower_components/greensock/src/minified/TweenLite.min',
        'AttrPlugin': 'bower_components/greensock/src/minified/plugins/AttrPlugin.min',
        'CSSPlugin': 'bower_components/greensock/src/minified/plugins/CSSPlugin.min',
        'ScrollToPlugin': 'bower_components/greensock/src/minified/plugins/ScrollToPlugin.min',
        'Ease': 'bower_components/greensock/src/minified/easing/EasePack.min',
        'ColorPropsPlugin': 'vendor/greensock-js/src/uncompressed/plugins/ColorPropsPlugin',
        //'Views': 'views/Views',
        'Particle': 'Particle',
        'particle_release': 'particle_release',
        'underscore': 'lib/lodash.min',
        'text': 'vendor/require/text',
        'detector': 'vendor/Detector',
        'stats': 'vendor/stats.min',
        'three': 'vendor/three.r60',
        'Signal': 'vendor/js-signals/signals.min',
        'KeyboardState': 'vendor/THREEx.KeyboardState',
        'RendererStats': 'vendor/THREEx.RendererStats',
        'GUI': 'vendor/datCustom.gui',
        // 'GUI2': 'vendor/dat.gui.v2', //THIS NEEDS TO GET REMOVED...
        'goog': '/_ah/channel/jsapi?',
        'TextManager': 'vendor/textfx'
    },
    shim: {
        TweenLite: {
            deps: ['AttrPlugin','CSSPlugin', 'Ease', 'ScrollToPlugin'],
            exports: "TweenLite"
        },
        TimelineLite: {
            deps: ['TweenLite'],
            exports: "TimelineLite"
        },
        'Modernizr': {
            exports: 'Modernizr'
        },
        'swipe': {
            exports: 'Swipe'
        },
        'jquery.hammer': ['jquery'],
        'hammerjs': {
            exports: 'Hammer'
        },
        'jquery.hoverdir': {
            deps: ['jquery'],
            exports: 'HoverDir'
        },
        'jquery.fitVids': { deps: ['jquery'], exports: '$' },
        'jquery.mCustomScrollbar': {
            deps: ['jquery'],
            exports: 'mCustomScrollbar'
        },
        'jquery.mousewheel': ['jquery', 'jquery.mCustomScrollbar'],
        'pace': {
            exports: 'Pace'
        },
        'detector': {
            exports: 'Detector'
        },
        'stats': {
            exports: 'Stats'
        },
        'fonts/helvetiker_bold.typeface': {
            deps: ['three']
        },
        'three': {
            exports: 'THREE'
        },
        'OBJLoader': {
            exports: 'OBJLoader'
        },
        'ColorPropsPlugin': {
            deps: ['TweenLite'],
            exports: 'ColorPropsPlugin'
        },
        // 'GUI2': {
        //     exports: 'dat'
        // },
        'GUI': {
            exports: 'datCustom'
        },
        'goog': {
            exports: 'goog'
        },
        'TextManager': {
            exports: 'TextManager'
        }
    },
    // urlArgs: "cache=bust"+(new Date()),
    waitSeconds: 10 // Wait before timing out a script
});

require([   'jquery',
            'underscore',
            'TweenLite',
            'TimelineLite',
            'Global',
            'Awards',
            'Map',
            'Mobile',
            'Nav',
            'News',
            'About',
            'Process',
            'Careers',
            'CareersPost',
            'Approach',
            'Reel',
            'Work/Router',
            'Work/Project',
            'Work/Grid',
            'Post',
            'ui/BorderButtons',
            'ui/FadeIn',
            'jquery.fitVids',
            'jquery.hammer',
            'jquery.hoverdir',
            'jquery.mousewheel',
            'libjs/utils/Util',
            'ui/RotateHandler',
            'lib/fastclick.min',
            'utils/GA'
          ],function(
            $,
            _,
            TweenLite,
            TimelineLite,
            Global,
            Awards,
            Map,
            Mobile,
            Nav,
            News,
            About,
            Process,
            Careers,
            CareersPost,
            Approach,
            Reel,
            Router,
            Project,
            Grid,
            Post,
            BorderButtons,
            FadeIn,
            fitVids, //doesn't actually export anything..
            hammer,
            HoverDir,
            jqMouseWheel,
            Util,
            RotateHandler,
            FastClick,
            GA) {

    $(function(){

       FastClick.attach(document.body);


        TweenLite.to($('main[role="main"]'), 0.9, {autoAlpha: 1, ease: Expo.easeIn});

        // if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
            // if (window.location.href.indexOf("explorer") === -1)
            //     window.location.replace("/explorer");
        // }

        console.log('Global.firstLevelLocation', Global.firstLevelLocation);

        var nav = new Nav();

        GA.init();

        if (Util.support.isHandheld) {
            RotateHandler.setup();

            //debug
            // RotateHandler.setRotateScreenEnabled(true);
        }

        if (Global.firstLevelLocation === '' || Global.firstLevelLocation === 'homepage' ){
            if (Util.support.isHandheld) {
                window.history.replaceState({}, 'Work | Jam3', '/work');
                new Router();
            } else {
                GA.setPageID('home');
                require(['particle_release']);
                //require(['Particle']);
            }

        }

	    // if (Global.firstLevelLocation === 'jam3'){
		 //    GA.setPageID('home');
		 //    require(['particle_release']);
	    // }

	    GA.setPageID('home');
        require(['particle_release']);

        if (Global.firstLevelLocation === 'work'){
            new Router();
        }

        if(Global.firstLevelLocation == 'achievements'){
            new Awards();
        }

        if (Global.firstLevelLocation == 'about'){
            new About();
        }

        if(Global.firstLevelLocation === 'approach'){
            new Approach();
        }

        if (Global.firstLevelLocation === 'news' || Global.firstLevelLocation === 'search' ) {
            var news = new News();
        }

        if (Global.firstLevelLocation === 'contact') {
            var map = new Map();

        }

        if (Global.firstLevelLocation === 'process') {
            var process = new Process();
        }

        // News post
        if (Global.firstLevelLocation === 'post') {
            var post = new Post();
        }

        // Careers Page
        if (Global.firstLevelLocation === 'careers' && !Global.secondLevelLocation) {
            new Careers();
        }

        // Careers Single Post
        if (Global.firstLevelLocation === 'careers' && Global.secondLevelLocation) {
            new CareersPost();
        }

        if (Global.isMobile){
            new Mobile();
        }

        if (Global.firstLevelLocation === 'reel'){
            new Reel();
        }

        if (Global.firstLevelLocation === 'culture'){
            GA.setPageID('culture');
        }

        if (Global.firstLevelLocation === 'accessibility'){
            GA.setPageID('accessibility');
        }

        // Check if pageID has been set

        if (!GA.pageID){
            console.error('pageID has not been set in utils/GA');
        }

    });

});
