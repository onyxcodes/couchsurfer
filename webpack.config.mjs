import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { ProvidePlugin, EnvironmentPlugin } = webpack;
import * as dotenv from "dotenv";
dotenv.config({ path: './.env' })

const config = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    target: "node",
    plugins: [
        new EnvironmentPlugin({
            PORT: "8080"
        }),
        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
        fallback: {
            "path": "path-browserify",
            "url": "url/",
            "stream": "stream-browserify",
            "querystring": "querystring-es3",
            "http": "stream-http",
            "crypto": "crypto-browserify",
            "os": "os-browserify/browser",
            "zlib": "browserify-zlib",
            "assert": "assert/",
            "vm": "vm-browserify",
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-typescript"]
                    }
                }
            },
            {
                test: /\.(ts|tsx)$/i,
                use: {
                    loader: "ts-loader",
                    options: {
                        "allowTsInNodeModules": true,
                    }
                },
                exclude: /node_modules/,
            }
        ]
    }
};

const uiConfig = {
    mode: "production",
    entry: './src/ui/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
}

export default config;