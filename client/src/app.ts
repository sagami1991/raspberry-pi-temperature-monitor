require("expose-loader?Chart!../node_modules/chart.js/dist/Chart.bundle.min.js");
import { TemperatureData } from "../../src/interfaces";

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
        const data = await xhrRequest<TemperatureData>("/api/temperature", "json");
        const dataForChart = convertData(data);
        this.chart.data.datasets![0].data = dataForChart;
        const valueElement = <HTMLDivElement> document.querySelector(".temperature-outer-value")!;
        const clockElement = <HTMLDivElement> document.querySelector(".clock-value")!;
        const lastItem = getLastItem(dataForChart);
        valueElement.innerText = `${lastItem.y}℃`;
        clockElement.innerText = lastItem.x.toLocaleString();
        this.chart.update();
    }

    private getChartConfig(): Chart.ChartConfiguration {
        return {
            type: "line",
            data: {
                datasets: [
                    //     {
                    //     label: "ケージ内温度",
                    //     backgroundColor: "#ff6385",
                    //     borderColor: "#ff6385",
                    //     data: [65, 59, 80, 81, 56, 55, 40],
                    //     fill: false,
                    // },
                    {
                        label: "ケージ外温度",
                        backgroundColor: "#33a3ec",
                        borderColor: "#33a3ec",
                        data: [],
                        fill: false,
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                responsive: true,
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
                            unit: "minute",
                            unitStepSize: 120,
                            min: <any> this.getYesterday()
                        },
                        scaleLabel: {
                            display: true,
                        },
                        ticks: {
                            display: true,
                        },
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: "温度"
                        },
                        // ticks: {
                        //     display: true,
                        //     max: 40,
                        //     min: 10,
                        // }
                    }]
                }
            }
        };
    }

    private getYesterday() {
        const date = new Date();
        date.setMinutes(0);
        date.setDate(date.getDate() - 1);
        return date;
    }
}

new Main().initialize();

function getLastItem<T>(array: Array<T>) {
    return array[array.length - 1];
}

function convertData(data: TemperatureData) {
    return data.data.map(item => {
        return {
            x: new Date(item.date),
            y: Math.floor(item.value * 10) / 10
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
