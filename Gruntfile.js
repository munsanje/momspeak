module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        paths: {
            src: {
                app: {
                    witbot: 'src/witbot.js'
                },
                witbot: [
                    'src/index.js',
                    'src/utils.js',
                    '<%= paths.src.app.witbot %>',
                    'src/init.js'
                ],
                all: [
                    'src/**/*.js'
                ]
            },
            dest: {
                witbot: 'go-app-witbot.js'
            },
            // test: {
            //     witbot: [
            //         'test/setup.js',
            //         'src/utils.js',
            //         '<%= paths.src.app.witbot %>',
            //         'test/witbot.test.js'
            //     ]
            // }
        },
        jshint: {
            options: {jshintrc: '.jshintrc'},
            all: [
                'Gruntfile.js',
                '<%= paths.src.all %>'
            ]
        },

        watch: {
            src: {
                files: ['<%= paths.src.all %>'],
                tasks: ['build']
            }
        },

        concat: {
            witbot: {
                src: ['<%= paths.src.witbot %>'],
                dest: '<%= paths.dest.witbot %>'
            }
        },
        // mochaTest: {
        //     options: {
        //         reporter: 'spec'
        //     },
        //     test_browser: {
        //         src: ['<%= paths.test.witbot %>']
        //     }
        // }
    });

    // grunt.registerTask('test', [
    //     'jshint',
    //     'build',
    //     'mochaTest'
    // ]);

    grunt.registerTask('build', [
        'concat'
    ]);

    grunt.registerTask('default', [
        'build',
        'test'
    ]);
};
