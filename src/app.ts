import { TemperatureData } from "./interfaces";
import { createServer } from "http";
import * as express from "express";
import { Express, Request, Response } from "express";
import * as bodyParser from "body-parser";
import * as fs from "fs";
const Settings = {
    TEMPRETURE_DEVICE_FILE: process.env.NODE_ENV === "develop" ? __dirname + "/../resources/w1_slave" : "/sys/bus/w1/devices/28-0000086eea81/w1_slave",
    TEMPRETURE_JSON_FILE: __dirname + "/../resources/temperature-24h.json",
};

class Application {
    private temperatureData: TemperatureData;
    public async initilize() {
        try {
            const file = await FileUtil.readFile(Settings.TEMPRETURE_JSON_FILE);
            this.temperatureData = JSON.parse(file);
        } catch (error) {
            this.temperatureData = { data: [] };
            await this.saveTemperatureData();
        }
        this.registerIntervalTask();

        const server = createServer();
        const app = express();
        // json形式のリクエストボディ設定
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        // REST API設定
        this.initializeRestApi(app);
        // 静的ファイル設定
        app.use(express.static(__dirname + "/../client/build"));
        server.on("request", app);
        server.listen(3000, () => {
            console.log("Server listening on port %s", server.address().port);
        });
    }

    private registerIntervalTask() {
        setInterval(async () => {
            await this.saveTemperatureData();
        }, 10 * 60 * 1000);
    }

    private async saveTemperatureData() {
        const readData = await this.readDeviceData();
        this.temperatureData.data.push(readData);
        const length = this.temperatureData.data.length;
        if (length > 6 * 24) {
            this.temperatureData.data = this.temperatureData.data.slice(length - 144);
        }
        await FileUtil.writeFile(Settings.TEMPRETURE_JSON_FILE, JSON.stringify(this.temperatureData, null, 2));
    }
    private async readDeviceData() {
        const file = await FileUtil.readFile(Settings.TEMPRETURE_DEVICE_FILE);
        const match = file.match(/t=([0-9]+)$/m);
        if (match && match[1]) {
            const value = Number(match[1]) / 1000;
            return {
                date: new Date(),
                value: value
            };
        }
        throw new Error("温度値が正規表現にヒットしませんでした");
    }

    private initializeRestApi(app: Express) {
        app.get("/api/temperature", async (request, response) => {
            const fileStr = await FileUtil.readFile(Settings.TEMPRETURE_JSON_FILE);
            const data: TemperatureData = JSON.parse(fileStr);
            response.json(data);
        });

    }
}

class FileUtil {
    public static readFile(path: string) {
        return new Promise<string>((reslove, reject) => {
            fs.readFile(path, { encoding: "UTF-8" }, (err, str) => {
                if (err) {
                    reject(err);
                    return;
                }
                reslove(str);
            });
        });
    }

    public static writeFile(path: string, str: string) {
        return new Promise<void>((reslove, reject) => {
            fs.writeFile(path, str, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                reslove();
            });
        });
    }
}

new Application().initilize();
