/**
 * Node-RED Settings for SolarFactsNW Production Powerhouse v3.0
 * This configuration file provides secure, production-ready settings
 * with environment-based configuration and enhanced security.
 */

const path = require("path");
const os = require("os");
const fs = require("fs");

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

// Use LocalAppData for user-specific data (non-roaming)
const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.APPDATA || os.homedir(), "SolarFactsNW");

module.exports = {
    // The file containing the flows. If not set, it defaults to flows_<hostname>.json
    flowFile: 'flows.json',

    // User directory - moved to LocalAppData to avoid Program Files permissions
    userDir: userDataDir,

    // Node-RED scoped npm packages - stored in user directory
    nodesDir: path.join(userDataDir, 'nodes'),

    // The tcp port that the Node-RED web server is listening on
    uiPort: process.env.APP_PORT || process.env.PORT || 1880,

    // Bind to specific host for security (use 0.0.0.0 for external access)
    uiHost: process.env.APP_HOST || "127.0.0.1",

    // The maximum length, in characters, of any message sent to the debug sidebar tab
    debugMaxLength: 1000,

    // The maximum number of messages nodes will buffer internally as part of their
    // operation. This applies across a range of nodes that operate on message sequences.
    nodeMessageBufferMaxLength: 0,

    // To disable the option for using local files for storing keys and certificates in the TLS configuration
    // node, set this to true
    tlsConfigDisableLocalFiles: false,

    // Colourise the console output of the debug node
    debugUseColors: true,

    // The file containing the flows. If not set, it defaults to flows_<hostname>.json
    flowFilePretty: true,

    // Secure credential encryption using environment variable
    // This ensures credentials are encrypted with a strong, configurable secret
    // that is not stored in version control
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || 'SolarFactsNW_Default_Change_Me_In_Production',

    // By default, all user data is stored in a directory called `.node-red` under
    // the user's home directory. To use a different location, the following
    // property can be used
    //userDir: '/home/nol/.node-red/',

    // Node-RED will, by default, honour the 'trust-proxy' header set by upstream
    // proxy servers. If you need to disable this, set the following property to false
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE"
    },

    // The following property can be used to enable HTTPS
    // See http://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
    // for details on its contents.
    // See the comment at the top of this file on how to load the `fs` module used by
    // this setting.
    //
    //https: {
    //    key: fs.readFileSync('privatekey.pem'),
    //    cert: fs.readFileSync('certificate.pem')
    //},

    // The following property can be used to cause insecure HTTP connections to
    // be redirected to HTTPS.
    //requireHttps: true,

    // The following property can be used to disable the editor. The admin API
    // is not affected by this option. To disable both the editor and the admin
    // API, use either the httpRoot or httpAdminRoot properties
    //disableEditor: false,

    // The following property can be used to configure cross-origin resource sharing
    // in the HTTP nodes.
    // See https://github.com/troygoode/node-cors#configuration-options for
    // details on its contents. The following is a basic permissive set of options:
    //httpNodeCors: {
    //    origin: "*",
    //    methods: "GET,PUT,POST,DELETE"
    //},

    // If you need to set an http proxy please set an environment variable
    // called http_proxy (or HTTP_PROXY) outside of Node-RED in the operating system.
    // For example - http_proxy=http://myproxy.com:8080
    // (Setting it here will have no effect)
    // You may also specify no_proxy (or NO_PROXY) to supply a comma separated
    // list of domains to not proxy, eg - no_proxy=.acme.co,.acme.co.uk

    // The following property can be used to add a custom middleware function
    // in front of the HTTP In node. This allows custom authentication to be
    // applied to all HTTP In nodes, or any other sort of common request processing.
    //httpNodeMiddleware: function(req,res,next) {
    //    // Handle/reject the request, or pass it on to the HTTP In node by calling next();
    //    // Optionally skip our rawBodyParser by setting this to true;
    //    //req.skipRawBodyParser = true;
    //    next();
    //},

    // The following property can be used to verify websocket connection attempts.
    // This allows, for example, the HTTP request headers to be checked to ensure
    // they include valid authentication information.
    //webSocketNodeVerifyClient: function(info) {
    //    return true;
    //},

    // The following property can be used to seed Global Context with predefined
    // values. This allows extra node modules to be made available with the
    // Function node.
    // For example,
    //    functionGlobalContext: { os:require('os') }
    // can be accessed in a function block as:
    //    global.get("os")
    functionGlobalContext: {
        // SolarFactsNW Production Powerhouse v3.0 - Modular Architecture
        
        // Core System
        Core: require('./core'),
        HealthChecker: require('./core/health/health-checker'),
        StartupMonitor: require('./core/health/startup-monitor'),
        HealthDashboard: require('./core/health/health-dashboard'),
        ConfigManager: require('./core/utils/config-manager'),
        Logger: require('./core/utils/logger'),
        
        // Shared Utilities
        Shared: require('./shared'),
        AuthMiddleware: require('./shared/middleware/auth'),
        RateLimitMiddleware: require('./shared/middleware/rate-limit'),
        SystemDashboard: require('./shared/dashboards/system-dashboard'),
        
        // Solar Vertical
        Solar: require('./verticals/solar'),
        
        // Standard Node.js modules
        os: require('os'),
        fs: require('fs'),
        path: require('path'),
        crypto: require('crypto')
    },

    // Context Storage with enhanced configuration
    contextStorage: {
        default: {
            module:"localfilesystem",
            config: {
                dir: path.join(userDataDir, "context"),
                cache: true,
                flushInterval: 30
            }
        },
        memory: {
            module: "memory"
        }
    },

    // The following property can be used to order the categories in the editor
    // palette. If a node's category is not in the list, the category will get
    // added to the end of the palette.
    // If not set, the following default order is used:
    //paletteCategories: ['subflows', 'common', 'function', 'network', 'sequence', 'parser', 'storage'],

    // Configure the logging output
    logging: {
        // Only console logging is currently supported
        console: {
            // Level of logging to be recorded. Options are:
            // fatal - only those errors which make the application unusable should be recorded
            // error - record errors which are deemed fatal for a particular request + fatal errors
            // warn - record problems which are non fatal + errors + fatal errors
            // info - record information about the general running of the application + warn + error + fatal errors
            // debug - record information which is more verbose than info + info + warn + error + fatal errors
            // trace - record very detailed logging + debug + info + warn + error + fatal errors
            // off - turn off all logging (doesn't affect metrics or audit)
            level: "info",
            // Whether or not to include metric events in the log output
            metrics: false,
            // Whether or not to include audit events in the log output
            audit: false
        },
        // Configure file-based logging
        file: {
            level: "info",
            filename: path.join(userDataDir, "logs", "node-red.log"),
            maxFiles: 5,
            maxSize: "10MB"
        }
    },

    // Customising the editor with SolarFactsNW branding
    editorTheme: {
        page: {
            title: "SolarFactsNW Production Powerhouse v3.0",
            favicon: "/favicon.ico",
            css: [
                "/static/css/solarfactsnw-theme.css"
            ],
            scripts: [
                "/static/js/solarfactsnw-ui.js"
            ]
        },
        header: {
            title: "SolarFactsNW",
            image: "/static/images/logo.png",
            url: "https://solarfactsnw.com"
        },
        deployButton: {
            type: "simple",
            label: "Deploy",
            icon: "fa fa-rocket"
        },
        menu: {
            "menu-item-help": {
                label: "SolarFactsNW Help",
                url: "/help"
            },
            "menu-item-health": {
                label: "System Health",
                url: "/health/dashboard"
            },
            "menu-item-dashboard": {
                label: "System Dashboard", 
                url: "/dashboard"
            }
        },
        userMenu: process.env.NODE_ENV === 'production',
        login: {
            image: "/static/images/login-logo.png"
        },
        palette: {
            catalogues: ['https://catalogue.nodered.org/catalogue.json'],
            theme: [
                {
                    category: "SolarFactsNW",
                    type: "solar-*",
                    color: "#ff6b35"
                }
            ]
        },
        projects: {
            enabled: false
        },
        codeEditor: {
            lib: "monaco",
            options: {
                theme: "vs-dark",
                fontSize: 14,
                wordWrap: "on"
            }
        }
    },

    // Production security and authentication
    adminAuth: process.env.NODE_ENV === 'production' ? {
        type: "credentials",
        users: [{
            username: process.env.ADMIN_USERNAME || "admin",
            password: "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN.", // Default: solarfacts2025
            permissions: "*"
        }],
        default: {
            permissions: "read"
        }
    } : undefined,

    // HTTP middleware for security and custom routes
    httpAdminMiddleware: function(req, res, next) {
        // Apply production security if enabled
        if (process.env.NODE_ENV === 'production') {
            const ProductionSecurity = require('./shared/middleware/production-security');
            const security = new ProductionSecurity();
            return security.applyToApp(req.app);
        }
        next();
    },

    // Static file serving for custom assets
    httpStatic: [
        {
            path: path.join(__dirname, 'shared', 'static'),
            root: '/static/'
        }
    ]
}
