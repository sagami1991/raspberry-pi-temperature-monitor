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
        setInterval(() => this.updateChart(), 10 * 60 * 1000);
    }

    private async updateChart() {
        const data = await xhrRequest<ISensorData[]>("/api/temperature", "json");
        const dataForTempChart = convertDataForChart(data, "tempreture");
        const dataForHumidityChart = convertDataForChart(data, "humidity");
        this.chart.data.datasets![0].data = dataForTempChart;
        this.chart.data.datasets![1].data = dataForHumidityChart;
        const temperatureValueElement = <HTMLDivElement> document.querySelector(".temperature-outer-value")!;
        const humidityValueElement = <HTMLDivElement> document.querySelector(".humidity-value")!;
        const clockElement = <HTMLDivElement> document.querySelector(".clock-value")!;
        const lastItem = getLastItem(dataForTempChart);
        temperatureValueElement.innerText = `${lastItem.y}℃`;
        humidityValueElement.innerText = `${getLastItem(dataForHumidityChart).y}％`;
        clockElement.innerText = lastItem.x.toLocaleString();
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
                                labelString: "温度"
                            },
                            position: "left"
                        },
                        {
                            id: "y-axis-2",
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: "湿度"
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
            y: type === "tempreture" ? Math.floor(item.innerTemperature * 10) / 10 : item.outerHumidity
        };
    });
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
