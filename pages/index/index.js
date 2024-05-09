import * as echarts from "../../ec-canvas/echarts";

// 寻找温差最大索引
function findMaxTemperatureDifferenceIndex(a, b) {
  let maxDifference = 0;
  let maxDifferenceIndex = -1;

  for (let i = 0; i < a.length; i++) {
    let difference = Math.abs(a[i] - b[i]);
    if (difference > maxDifference) {
      maxDifference = difference;
      maxDifferenceIndex = i;
    }
  }

  return maxDifferenceIndex;
}

// 生成连续的日期数组
function generateDateArray(startIndex, endIndex) {
  let dates = [];
  for (let i = startIndex; i <= endIndex; i++) {
    dates.push(getNextSixDays(i));
  }
  return dates;
}

// 计算平均气温
function calculateAverage(array) {
  if (array.length === 0) {
    return 0;
  }
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

// 判断类型
function getDataType(value) {
  return typeof value;
}

function getNextSixDays(num) {
  // 获取今天的日期
  let today = new Date();
  // 将日期加上6天
  today.setDate(today.getDate() + num);

  // 获取年、月、日
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 月份是从 0 开始计数的，所以要加 1
  let day = today.getDate();

  // 删除月份和日期的前导零
  month = month.toString().padStart(2, "0");
  day = day.toString().padStart(2, "0");

  // 返回结果
  return `${parseInt(month)}月${parseInt(day)}日`;
}

Page({
  data: {
    ecHigh: {
      onInit: null,
    },
    ecLowAndHigh: {
      onInit: null,
    },
    ecWeatherArea: {
      onInit: null,
    },
    address: "北京",
    weatherHighArr: [],
    weatherLowArr: [],
    DifferenceBetweenHighAndLow: 0, //计算未来五天最高和最低的差值
    TemperatureIndex: 0, //最高低温差值最大的索引
    weatherState: {
      key: [],
      value: [],
    },
  },

  // 请求天气
  requestData(address) {
    return new Promise((resolve, reject) => {
      wx.request({
        url:
          "https://weatherquery.api.bdymkt.com/weather/query/15d?area=" +
          address,
        method: "POST",
        header: {
          "content-type": "application/json",
          "X-Bce-Signature": "AppCode/3d04ca6a64864cb09cd3d1126ef8c183",
        },
        success: (res) => {
          console.log("请求成功", res.data);
          if (res.data.msg == "未找到该地区") {
            resolve("no");
          } else {
            let dayWeathers = res.data.data.dayWeathers;
            let arrHigh = [];
            let arrLow = [];
            for (let i = 0; i < 14; i++) {
              arrHigh.push(
                parseInt(dayWeathers[i].day_high_temperature.replace("℃", ""))
              );
              arrLow.push(parseInt(dayWeathers[i].night_low_temperature));
            }
            resolve({ arrHigh, arrLow });
          }
        },
        fail: (err) => {
          console.error("请求失败", err);
          reject(err);
        },
      });
    });
  },

  onLoad() {
    this.requestData(this.data.address)
      .then((data) => {
        console.log("获取到的数据", data);
        this.setData({
          weatherHighArr: data.arrHigh,
          weatherLowArr: data.arrLow,
        });
        this.again();
      })
      .catch((err) => {
        console.error("请求失败", err);
        wx.showModal({
          title: "提示",
          content: "请求失败，请联系开发者",
          showCancel: false,
        });
      });

    // this.requestData("北京")
    //   .then((data) => {
    //     console.log("获取到的数据", data);
    //     this.setData({ weatherHighArr: data });
    //     this.again();
    //   })
    //   .catch((err) => {
    //     console.error("请求失败", err);
    //   });
    // -------
    // this.setData({
    //   weatherHighArr: [2, 90, 78, 45, 23, 80, 67, 78, 90, 23, 56, 78, 34, 9],
    //   weatherLowArr: [4, 5, 3, 9, 1, 0, 6, 2, 6, 9, 3, 2, 5, 7],
    // });
    // this.again();
  },

  // 渲染
  again() {
    // 最高温段渲染
    const ecComponentHigh = this.selectComponent("#mychart-weather-high");
    ecComponentHigh.init(this.initChartHigh);
    this.setData({ "ecHigh.onInit": this.initChartHigh });

    // 最高和低温度折线图
    const ecComponentLow = this.selectComponent(
      "#mychart-weather-high_and_low"
    );
    ecComponentLow.init(this.initChartLowAndHigh);
    this.setData({ "ecLowAndHigh.onInit": this.initChartLowAndHigh });

    // 天气图饼
    const ecComponentWeatherArea = this.selectComponent(
      "#mychart-weather-area"
    );
    ecComponentWeatherArea.init(this.initChartWeatherArea);
    this.setData({ "ecWeatherArea.onInit": this.initChartWeatherArea });
  },

  // 监听输入框
  inputChange(e) {
    this.setData({
      address: e.detail.value,
    });
    console.log("输入框的内容为：", this.data.address);
    // e.detail.value 是输入框中的内容
  },

  // search
  search() {
    this.requestData(this.data.address)
      .then((data) => {
        if (getDataType(data) == "string") {
          wx.showModal({
            title: "提示，未找到该地区",
            content:
              "地名不能带有“市”、“县”，比如查杭州，输入“杭州”，而不是传入“杭州市”",
            showCancel: false,
          });
        } else {
          console.log("获取到的数据", data);
          this.setData({
            weatherHighArr: data.arrHigh,
            weatherLowArr: data.arrLow,
          });
          this.again();
        }
      })
      .catch((err) => {
        console.error("请求失败", err);
        wx.showModal({
          title: "提示",
          content: "请求失败，请联系开发者",
          showCancel: false,
        });
      });
  },

  initChartHigh(canvas, width, height) {
    console.log("canvas:", canvas, "width:", width, "height:", height);
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
    });
    canvas.setChart(chart);

    var option = {
      xAxis: {
        type: "category",
        data: generateDateArray(1, 14),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: this.data.weatherHighArr,
          type: "line",
          label: {
            show: true,
            position: "top",
            textStyle: {
              fontSize: 20,
            },
          },
          lineStyle: {
            normal: {
              width: 3,
              // color: "blue",
            },
          },
          itemStyle: {
            normal: {
              color: (params) => {
                // 根据数据值动态返回颜色
                let averageValue = calculateAverage(this.data.weatherHighArr);
                console.log("平均气温", averageValue);
                var value = params.value;
                if (value > averageValue) {
                  return "red";
                } else if (value < averageValue) {
                  return "green";
                } else {
                  return "blue";
                }
              },
            },
          },
        },
      ],
    };
    chart.setOption(option);
    return chart;
  },

  initChartLowAndHigh(canvas, width, height) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
    });
    canvas.setChart(chart);

    let weatherHighArr = this.data.weatherHighArr.slice(0, 5);
    let weatherLowArr = this.data.weatherLowArr.slice(0, 5);
    //find 后五天的 白&夜 温差最大的 索引
    let TemperatureIndex = findMaxTemperatureDifferenceIndex(
      weatherHighArr,
      weatherLowArr
    );

    // 计算差值
    let DifferenceBetweenHighAndLow =
      weatherHighArr[TemperatureIndex] - weatherLowArr[TemperatureIndex];

    if (DifferenceBetweenHighAndLow < 0) {
      DifferenceBetweenHighAndLow =
        weatherLowArr[TemperatureIndex] - weatherHighArr[TemperatureIndex];
    }

    this.setData({
      DifferenceBetweenHighAndLow: DifferenceBetweenHighAndLow,
      TemperatureIndex: TemperatureIndex,
    });

    var option = {
      xAxis: {
        type: "category",
        data: generateDateArray(1, 5),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: weatherLowArr,
          type: "line",
          label: {
            show: true,
            position: "buttom",
            textStyle: {
              fontSize: 15,
            },
          },
          stack: "x",
          areaStyle: {},
          lineStyle: {
            normal: {
              width: 3,
              color: "#BFFAA1",
            },
          },
          itemStyle: {
            normal: {
              color: (params) => {
                console.log(params);
                if (params.dataIndex == TemperatureIndex) {
                  return "#BC00FF";
                } else {
                  return "#EBFAA1";
                }
              },
            },
          },
        },
        {
          data: weatherHighArr,
          type: "line",
          label: {
            show: true,
            position: "top",
            textStyle: {
              fontSize: 15,
            },
          },
          stack: "x",
          areaStyle: {
            color: "#FF3100",
          },
          lineStyle: {
            normal: {
              width: 3,
              color: "#FAB0A1",
            },
          },
          itemStyle: {
            normal: {
              color: (params) => {
                if (params.dataIndex == TemperatureIndex) {
                  return "#BC00FF";
                } else {
                  return "#E77A64";
                }
              },
            },
          },
        },
      ],
    };
    chart.setOption(option);
    return chart;
  },

  initChartWeatherArea(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr,
    });
    canvas.setChart(chart);

    let option = {
      series: [
        {
          type: "pie",
          data: [
            {
              value: 100,
              name: "阴天",
            },
            {
              value: 200,
              name: "雨天",
            },
            {
              value: 300,
              name: "暴雨",
            },
            {
              value: 400,
              name: "雷雨",
            },
            {
              value: 500,
              name: "晴天",
            },
          ],
          roseType: "area",
        },
      ],
    };
    chart.setOption(option);
    return chart;
  },
});
