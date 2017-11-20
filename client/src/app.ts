require("expose-loader?Chart!../node_modules/chart.js/dist/Chart.bundle.min.js");
import { ISensorData } from "../../src/interfaces";

class Main {
    private chart: Chart;
    public initialize() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        document.body.appendChild(canvas);
        this.chart = new window.Chart(ctx, this.getChartConfig());
        this.updateChart();
        setInterval(() => this.updateChart(), 5 * 60 * 1000);
    }

    private async updateChart() {
        const data = await xhrRequest<ISensorData[]>("/api/temperature", "json");
        const dataForTempChart = convertDataForChart(data, "tempreture");
        const dataForHumidityChart = convertDataForChart(data, "humidity");
        this.chart.data.datasets![0].data = dataForTempChart;
        this.chart.data.datasets![1].data = dataForHumidityChart;
        const innerTemperatureValueElement = <HTMLDivElement> document.querySelector(".temperature-inner-value")!;
        const outerTemperatureValueElement = <HTMLDivElement> document.querySelector(".temperature-outer-value")!;
        const humidityValueElement = <HTMLDivElement> document.querySelector(".humidity-value")!;
        const clockElement = <HTMLDivElement> document.querySelector(".clock-value")!;
        const lastItem = getLastItem(data);
        innerTemperatureValueElement.innerText = `${roundNumber(lastItem.innerTemperature)}℃`;
        outerTemperatureValueElement.innerText = `${lastItem.outerTemperature}℃`;
        humidityValueElement.innerText = `${lastItem.outerHumidity}％`;
        clockElement.innerText = new Date(lastItem.updated).toLocaleString();
        this.chart.update();
    }

    private getChartConfig(): Chart.ChartConfiguration {
        return {
            type: "line",
            data: {
                datasets: [
                    {
                        label: "温度🌡️",
                        backgroundColor: "#ff6385",
                        borderColor: "#ff6385",
                        data: [],
                        fill: false,
                        pointRadius: 0,
                        yAxisID: "y-axis-1"
                    },
                    {
                        label: "湿度💧",
                        backgroundColor: "#33a3ec",
                        borderColor: "#33a3ec",
                        data: [],
                        fill: false,
                        pointRadius: 0,
                        yAxisID: "y-axis-2"
                    },
                ]
            },
            options: {
                responsive: false,
                tooltips: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        title: (tooltipItems, yData: Chart.ChartData) => {
                            const chartPoint = <Chart.ChartPoint> yData.datasets![tooltipItems![0].datasetIndex!].data![tooltipItems![0].index!];
                            return chartPoint.x!.toLocaleString();
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        display: true,
                        type: "time",
                        time: {
                            unit: "hour",
                            unitStepSize: 2
                        },
                    }],
                    yAxes: [
                        {
                            id: "y-axis-1",
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "温度[℃]"
                            },
                            position: "left"
                        },
                        {
                            id: "y-axis-2",
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "湿度[％]"
                            },
                            position: "right",
                        },
                    ]
                }
            }
        };
    }
}

new Main().initialize();

function getLastItem<T>(array: Array<T>) {
    return array[array.length - 1];
}

function convertDataForChart(data: ISensorData[], type: "tempreture" | "humidity") {
    return data.map(item => {
        return {
            x: new Date(item.updated),
            y: type === "tempreture" ? roundNumber(item.innerTemperature) : item.outerHumidity
        };
    }).filter(item => 0 < item.y && item.y < 100); // たまに1000を超える不具合対策
}

function roundNumber(num: number) {
    return Math.floor(num * 10) / 10;
}

function xhrRequest<T>(url: string, responseType: "json" | "") {
    const xhr = new XMLHttpRequest();
    return new Promise<T>((resolve, reject) => {
        xhr.open("GET", url, true);
        xhr.responseType = responseType;
        xhr.addEventListener("load", () => {
            resolve(<T> xhr.response);
        });
        xhr.send();
    });
}
