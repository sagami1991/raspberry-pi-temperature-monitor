import { ISensorData } from "./interfaces";
import { createServer } from "http";
import * as express from "express";
import { Express, Request, Response } from "express";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import { exec } from "child_process";

const PROFILE = process.env.NODE_ENV === "develop" ? "DEVELOP" : "PRODUCTION";
const Settings = {
    TEMPRETURE_DEVICE_FILE: PROFILE === "DEVELOP" ? __dirname + "/../resources/w1_slave" : "/sys/bus/w1/devices/28-0000086e78fc/w1_slave",
    TEMPRETURE_JSON_FILE: __dirname + "/../resources/sensor-24h.json",
};

interface Am2320SensorData {
    temperature: number;
    humidity: number;
}

class Application {
    private sensorsDataArray: ISensorData[];
    private am2320SensorData: Am2320SensorData;
    public async initilize() {
        try {
            const file = await FileUtil.readFile(Settings.TEMPRETURE_JSON_FILE);
            this.sensorsDataArray = JSON.parse(file);
        } catch (error) {
            this.sensorsDataArray = [];
            await this.readAm2320Sensor();
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
        }, 5 * 60 * 1000);

        // 常に読み取ってないと正確な値がとれないので10秒ごとに行う
        setInterval(() => {
            this.readAm2320Sensor();
        }, 10 * 1000);
    }

    private async readAm2320Sensor() {
        if (PROFILE === "DEVELOP") {
            this.am2320SensorData = {
                temperature: 23.5,
                humidity: 31.4
            };
            return;
        }
        return new Promise(resolve => {
            exec("python /home/pi/Programs/raspberry-pi-temperature-monitor/python/humid-i2c.py", (err, stdout) => {
                if (err === null) {
                    this.am2320SensorData = JSON.parse(stdout);
                } else {
                    console.error(err.message);
                }
                resolve();
            });
        });
    }
    private async saveTemperatureData() {
        const tempreture = await this.readDeviceData();
        this.sensorsDataArray.push({
            updated: new Date(),
            innerTemperature: tempreture,
            outerTemperature: this.am2320SensorData.temperature,
            outerHumidity: this.am2320SensorData.humidity
        });
        const length = this.sensorsDataArray.length;
        if (length > 12 * 24) {
            this.sensorsDataArray = this.sensorsDataArray.slice(length - (12 * 24));
        }
        await FileUtil.writeFile(Settings.TEMPRETURE_JSON_FILE, JSON.stringify(this.sensorsDataArray, null, 2));
    }

    private async readDeviceData(): Promise<number> {
        try {
            const file = await FileUtil.readFile(Settings.TEMPRETURE_DEVICE_FILE);
            const match = file.match(/t=([0-9]+)$/m);
            if (match && match[1]) {
                return Number(match[1]) / 1000;
            }
            throw new Error("温度値が正規表現にヒットしませんでした");
        } catch (error) {
            console.error(error);
            return -1;
        }
    }

    private initializeRestApi(app: Express) {
        app.get("/api/temperature", async (request, response) => {
            const fileBody = await FileUtil.readFile(Settings.TEMPRETURE_JSON_FILE);
            const data: ISensorData[] = JSON.parse(fileBody);
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
