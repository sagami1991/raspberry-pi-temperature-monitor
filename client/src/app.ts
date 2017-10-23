require("expose-loader?Chart!../node_modules/chart.js/dist/Chart.bundle.min.js");
import { TemperatureData } from "../../src/interfaces";

(async () => {
    const config: Chart.ChartConfiguration = {
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
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    display: true,
                    type: "time",
                    time: {
                        unit: "minute"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "時間"
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: "温度"
                    }
                }]
            }
        }
    };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    document.body.appendChild(canvas);
    const chart = new window.Chart(ctx, config);
    const data = await xhrRequest<TemperatureData>("/api/temperature", "json");
    const dataForChart = convertData(data);
    chart.data.datasets![0].data = dataForChart;
    const valueElement = <HTMLDivElement> document.querySelector("div.temperature-outer-value")!;
    valueElement.innerText = `${getLastItem(data.data).value}℃`;
    chart.update();
})();

function getLastItem<T>(array: Array<T>) {
    return array[array.length - 1];
}

function convertData(data: TemperatureData) {
    return data.data.map(item => {
        return {
            x: item.date,
            y: item.value
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